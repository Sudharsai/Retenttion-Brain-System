from models.domain import Customer, ChurnScore, UpliftScore, RevenueData, Company, AppLog, Dataset, Alert, RetentionAction, RetentionFeedback
from services.ml_service import MLService
from services.segmentation_engine import assign_segment
from services.retention_decision_engine import decide_retention_action
from services.ai_service import AIService
from typing import Dict
from decimal import Decimal
import os
import pandas as pd
from celery import Celery
from database.session import SessionLocal
from datetime import datetime, timedelta
from sqlalchemy import func, Integer

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery = Celery("retention_worker", broker=REDIS_URL)

@celery.task(name="send_sms_task")
def send_sms_task(customer_id: int, message: str):
    print(f"SMS: Sending to customer {customer_id}: {message}")
    return True

@celery.task(name="notify_sales_team_task")
def notify_sales_team_task(customer_id: int, campaign: str):
    print(f"SALES: Notifying team for customer {customer_id} (Campaign: {campaign})")
    return True

@celery.task(name="run_retention_engine_task")
def run_retention_engine_task(company_id: int):
    """
    Manual trigger for the full RDE workflow across all customers.
    """
    return execute_retention_actions(company_id)

@celery.task(name="process_neural_dataset")
def process_neural_dataset(file_path: str, company_id: int):
    """
    Production-ready pipeline:
    1. Load & Validate CSV
    2. Track Dataset Entry
    3. ML Scoring & Persistence
    """
    db = SessionLocal()
    try:
        if not os.path.exists(file_path):
            return {"error": f"File {file_path} not found"}

        # Step 1: Create Dataset Record
        dataset = Dataset(
            company_id=company_id,
            filename=os.path.basename(file_path),
            status="processing"
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)

        # Step 2: Load & Identify Columns
        df = pd.read_csv(file_path)
        mapping = MLService.identify_columns(df)
        
        print(f"DEBUG: Dataset Mapping identified: {mapping}")
        
        # Step 2.5: INDUSTRY-GRADE CLEANUP (Remove all legacy data for this company)
        print(f"DEBUG: Performing total legacy purge for Company {company_id} to ensure clean slate...")
        
        from models.campaign import Campaign
        from models.domain import Alert, RetentionFeedback
        
        # 1. Clear Customers (Cascades to ChurnScore, UpliftScore, RevenueData, RetentionAction, RetentionFeedback)
        db.query(Customer).filter(Customer.company_id == company_id).delete(synchronize_session=False)
        
        # 2. Clear Campaigns
        db.query(Campaign).filter(Campaign.company_id == company_id).delete(synchronize_session=False)
        
        # 3. Clear Alerts
        db.query(Alert).filter(Alert.company_id == company_id).delete(synchronize_session=False)
        
        # 4. Clear old Datasets (except the current one)
        db.query(Dataset).filter(Dataset.company_id == company_id, Dataset.id != dataset.id).delete(synchronize_session=False)
        
        db.commit() # Atomic purge
        print("DEBUG: Clean slate confirmed. Repository reset for new intelligence wave.")
        
        essential = ['customer_id', 'revenue']
        # Check for usage OR tenure
        if 'usage' not in mapping and 'tenure' not in mapping:
            print(f"DEBUG: Missing essential columns: ['usage' or 'tenure']")
            dataset.status = "failed"
            db.commit()
            return {"error": "Missing columns: ['usage' or 'tenure']"}
        
        # Map tenure to usage if usage is missing
        if 'usage' not in mapping and 'tenure' in mapping:
            mapping['usage'] = mapping['tenure']

        # Step 3: ML Scoring
        print("DEBUG: Starting ML Training & Scoring...")
        df_scored, metrics = MLService.train_and_score(df)
        print(f"DEBUG: ML Completed. Accuracy: {metrics.get('accuracy')}")

        # Batch Fetch Existing Customers - Optimize by only fetching IDs
        print("DEBUG: Fetching existing customer mappings from DB...")
        existing_customers = {ext_id: cid for ext_id, cid in db.query(Customer.external_customer_id, Customer.id).filter(Customer.company_id == company_id).all()}
        print(f"DEBUG: Found {len(existing_customers)} existing customer mappings.")
        
        processed_count = 0
        batch_size = 200 # Reduced batch size for better commit frequency
        
        # We'll use a local list to accumulate objects and commit them
        for index, (_, row) in enumerate(df_scored.iterrows()):
            ext_id = str(row[mapping.get('customer_id', df.columns[0])])
            
            # Name generation refinement
            raw_name = str(row.get(mapping.get('name'), ''))
            if not raw_name or raw_name == ext_id:
                # Use a human-readable placeholder if name is missing
                cust_prefix = "Member"
                last_segment = ext_id.split('-')[-1][:4] if '-' in ext_id else ext_id[:4]
                cust_name = f"{cust_prefix} {last_segment}"
            else:
                cust_name = raw_name
            
            customer_id = existing_customers.get(ext_id)
            if not customer_id:
                customer = Customer(
                    company_id=company_id,
                    external_customer_id=ext_id,
                    dataset_id=dataset.id,
                    name=cust_name,
                    email=f"{ext_id}@fallback.tech"
                )
                db.add(customer)
                db.flush() # Get the new ID
                customer_id = customer.id
                existing_customers[ext_id] = customer_id
            else:
                customer = db.query(Customer).get(customer_id)
            customer.name = cust_name
            customer.dataset_id = dataset.id
            customer.revenue = Decimal(str(row['revenue']))
            customer.usage_score = float(row['usage'])
            customer.transactions_count = int(float(row['transactions']))
            customer.churn_risk = float(row.get('churn_probability', 50.0))
            customer.uplift_score = float(row.get('uplift_score', 0.05))
            customer.persuadability_score = float(row.get('persuadability_score', 50.0))
            customer.geography_risk_score = float(row.get('geography_risk_score', 25.0))
            customer.retention_probability = float(row.get('retention_probability', 50.0))
            customer.gender = row.get('gender', 'Unknown')
            
            # Use email from dataset if mapped, else fallback
            if mapping.get('email') and mapping['email'] in row:
                customer.email = row[mapping['email']]
            elif not customer.email:
                customer.email = f"{ext_id}@fallback.tech"
            customer.expected_recovery = float(row['expected_recovery'])
            customer.subscription_type = str(row.get('subscription_type', 'Standard'))
            customer.last_active_days = int(float(row.get('last_active_days', 0)))
            
            customer.engagement_score = float(row.get('engagement_score', 0.5))
            
            # Step 4: Industry-Grade Segmentation
            customer.segment = assign_segment({
                "churn_probability": customer.churn_risk,
                "revenue": float(customer.revenue),
                "last_active_days": customer.last_active_days,
                "engagement_score": customer.engagement_score
            })
            
            db.flush()
            
            # Step 5: Persistence of Scores
            # Churn Score
            cs = ChurnScore(
                customer_id=customer.id,
                probability=customer.churn_risk,
                factors={
                    "engagement": customer.engagement_score,
                    "recency": customer.last_active_days,
                    "subscription": customer.subscription_type
                }
            )
            db.add(cs)

            # Revenue Data
            rd = RevenueData(
                customer_id=customer.id,
                total_revenue=customer.revenue,
                risk_amount=float(customer.revenue or 0) * (customer.churn_risk / 100.0)
            )
            db.add(rd)

            # Uplift Score
            if customer.uplift_score > 0:
                # Generate AI Strategy for high-risk or high-uplift customers
                ai_strategy = None
                if customer.churn_risk > 70 or customer.uplift_score > 0.15:
                    try:
                        ai_strategy = AIService.generate_retention_content({
                            "name": customer.name,
                            "churn_risk": customer.churn_risk,
                            "revenue": float(customer.revenue or 0),
                            "usage_score": customer.usage_score,
                            "segment": customer.segment,
                            "gender": customer.gender,
                            "last_active_days": customer.last_active_days
                        }, mode="strategy")
                    except Exception as ai_e:
                        print(f"AI Strategy generation failed for {customer.id}: {ai_e}")

                us = UpliftScore(
                    customer_id=customer.id,
                    score=customer.uplift_score,
                    strategy=ai_strategy
                )
                db.add(us)
            
            # Step 5: Decision Engine
            decision = decide_retention_action({
                "churn_probability": customer.churn_risk,
                "revenue": float(customer.revenue),
                "segment": customer.segment,
                "last_active_days": customer.last_active_days,
                "engagement_score": 0.5 # Default
            })
            
            # Upsert Retention Action
            ra = db.query(RetentionAction).filter(RetentionAction.customer_id == customer.id).first()
            if not ra:
                ra = RetentionAction(customer_id=customer.id)
                db.add(ra)
            
            ra.segment = customer.segment
            ra.action_type = decision["action_type"]
            ra.campaign_type = decision["campaign_type"]
            ra.priority_score = decision["priority_score"]
            ra.channel = decision["channel"]
            ra.status = "PENDING"
            
            processed_count += 1
            if processed_count % batch_size == 0:
                db.commit()
                print(f"DEBUG: Committed batch {processed_count}/{len(df_scored)}")

        dataset.row_count = processed_count
        dataset.status = "completed"
        db.commit()
        
        # Trigger Multi-Channel Execution
        execute_retention_actions.delay(company_id)
        return {"status": "Complete", "processed_count": processed_count, "dataset_id": dataset.id}

    except Exception as e:
        db.rollback()
        ds_id = dataset.id if 'dataset' in locals() else 'unknown'
        print(f"CRITICAL: Dataset Processing Failed for ID {ds_id}: {e}")
        if 'dataset' in locals():
            dataset.status = "failed"
            db.commit()
        return {"error": str(e)}
    finally:
        db.close()
        # Only remove if it's in the temp_uploads directory
        if os.path.exists(file_path) and "temp_uploads" in file_path:
            os.remove(file_path)

@celery.task(name="execute_retention_actions")
def execute_retention_actions(company_id: int):
    """
    Multi-Channel Trigger System:
    1. Fetch PENDING actions for the company.
    2. Dispatch to specific channels.
    3. Update status and log feedback loop start.
    """
    db = SessionLocal()
    try:
        actions = db.query(RetentionAction).join(Customer).filter(
            Customer.company_id == company_id,
            RetentionAction.status == "PENDING"
        ).all()
        
        stats = {"CALL": 0, "EMAIL": 0, "SMS": 0, "NONE": 0}
        
        for action in actions:
            if action.action_type == "NONE":
                action.status = "SKIPPED"
                stats["NONE"] += 1
                continue
                
            # Dispatch based on Channel OR Action Type
            channel = action.channel if action.channel != "AUTO" else action.action_type
            
            if channel == "CALL":
                notify_sales_team_task.delay(action.customer_id, action.campaign_type)
                stats["CALL"] += 1
            elif channel == "EMAIL":
                send_retention_email_task.delay(action.customer_id, action.campaign_type)
                stats["EMAIL"] += 1
            elif channel == "SMS":
                send_sms_task.delay(action.customer_id, f"Priority offer: {action.campaign_type}")
                stats["SMS"] += 1
            
            action.status = "SENT"
            action.scheduled_at = datetime.utcnow()
            
            # Initialize Feedback Loop record
            feedback = RetentionFeedback(
                customer_id=action.customer_id,
                action_type=action.action_type,
                campaign_type=action.campaign_type,
                response="IGNORED" # Initial state
            )
            db.add(feedback)
            
        db.commit()
        return {"status": "success", "counts": stats}
    finally:
        db.close()

@celery.task(name="send_retention_email_task")
def send_retention_email_task(customer_id: int, campaign: str):
    from services.mail_service import send_retention_email
    db = SessionLocal()
    try:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if customer and customer.email:
            customer_data = {
                "name": customer.name,
                "churn_risk": customer.churn_risk,
                "revenue": float(customer.revenue or 0),
                "usage_score": customer.usage_score,
                "segment": customer.segment,
                "gender": customer.gender,
                "last_active_days": customer.last_active_days
            }
            success = send_retention_email(customer.email, customer.name, customer_data)
            if success:
                customer.last_notified = datetime.utcnow()
                db.commit()
                return True
        return False
    finally:
        db.close()

@celery.task(name="analyze_feedback_loop")
def analyze_feedback_loop():
    """
    Periodic task to calculate success metrics for model optimization.
    """
    db = SessionLocal()
    try:
        # Calculate success rate per campaign
        from sqlalchemy import func
        results = db.query(
            RetentionFeedback.campaign_type,
            func.count(RetentionFeedback.id).label("total"),
            func.sum(func.cast(RetentionFeedback.success, Integer)).label("successes")
        ).group_by(RetentionFeedback.campaign_type).all()
        
        metrics = {}
        for row in results:
            rate = (row.successes / row.total) if row.total > 0 else 0
            metrics[row.campaign_type] = {"success_rate": rate, "total": row.total}
            
        print(f"Feedback Analysis: {metrics}")
        return metrics
    finally:
        db.close()

@celery.task(name="simulate_campaign_progress")
def simulate_campaign_progress(campaign_id: int, company_id: int):
    """
    Simulates a campaign moving through stages in the background.
    """
    from database.session import SessionLocal
    from models.campaign import Campaign
    import time
    
    db = SessionLocal()
    try:
        # Move through stages every few seconds
        stages = [
            ("Analyzing Sector", 20),
            ("Neural Mapping", 45),
            ("Targeting Vectors", 70),
            ("Deploying Wave", 95),
            ("Analysis Complete", 100)
        ]
        
        for status, progress in stages:
            time.sleep(4) 
            campaign = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.company_id == company_id).first()
            if not campaign: break
            
            campaign.status = status
            campaign.progress = progress
            
            # Simulate ROI and Uplift as the campaign progresses
            if progress >= 20:
                campaign.uplift = round(0.015 + (progress / 100.0) * 0.05, 4)
                campaign.roi = round((campaign.uplift * 100) / 0.8, 2) # Example ROI logic
                campaign.cost = 400 + (progress * 15)
                
            if progress == 100:
                campaign.color = "bg-emerald-500" 
            db.commit()
            
    except Exception as e:
        print(f"Campaign simulation failed: {e}")
    finally:
        db.close()
