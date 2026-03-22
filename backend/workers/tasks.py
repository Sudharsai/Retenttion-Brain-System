import pandas as pd
from celery import Celery
import os
from database.session import SessionLocal
from models.domain import Customer, ChurnScore, UpliftScore, RevenueData, Company, AppLog, Dataset, Alert
from services.ml_service import MLService
from typing import Dict
from decimal import Decimal

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery = Celery("retention_worker", broker=REDIS_URL)

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
        
        essential = ['customer_id', 'revenue', 'usage']
        missing = [key for key in essential if key not in mapping]
        if missing:
            print(f"DEBUG: Missing essential columns: {missing}")
            dataset.status = "failed"
            db.commit()
            return {"error": f"Missing columns: {missing}"}

        # Step 3: ML Scoring
        df_scored, metrics = MLService.train_and_score(df)

        # Batch Fetch Existing Customers
        existing_customers = {c.external_customer_id: c for c in db.query(Customer).filter(Customer.company_id == company_id).all()}
        
        processed_count = 0
        batch_size = 500
        
        # We'll use a local list to accumulate objects and commit them
        for index, (_, row) in enumerate(df_scored.iterrows()):
            ext_id = str(row[mapping.get('customer_id', df.columns[0])])
            
            # If name is missing, use ID as identifier instead of a fallback that might be another field
            cust_name = str(row.get(mapping.get('name'), ext_id))
            
            customer = existing_customers.get(ext_id)
            if not customer:
                customer = Customer(
                    company_id=company_id,
                    external_customer_id=ext_id,
                    dataset_id=dataset.id,
                    name=cust_name,
                    email=f"{ext_id}@fallback.tech"
                )
                db.add(customer)
                existing_customers[ext_id] = customer
            
            # Update values
            customer.name = cust_name
            customer.dataset_id = dataset.id
            customer.revenue = Decimal(str(row['revenue']))
            customer.usage_score = float(row['usage'])
            customer.transactions_count = int(float(row['transactions']))
            customer.churn_risk = float(row['churn_probability'])
            customer.uplift_score = float(row['uplift_score'])
            customer.persuadability_score = float(row['persuadability_score'])
            customer.geography_risk_score = float(row['geography_risk_score'])
            customer.retention_probability = float(row['retention_probability'])
            customer.expected_recovery = float(row['expected_recovery'])
            customer.communication_channel = str(row.get('communication_channel' if 'communication_channel' in row else mapping.get('channel', 'Email'), 'Email'))
            
            # Improved gender assignment
            gender_val = row.get(mapping.get('gender'))
            if gender_val:
                customer.gender = str(gender_val)
            else:
                customer.gender = "Unknown"

            # We MUST flush every record to ensure Customer.id is populated for the dependent tables
            # SQLAlchemy handles this efficiently in a single transaction
            db.flush()
            
            # Upsert Churn Score
            churn = db.query(ChurnScore).filter(ChurnScore.customer_id == customer.id).first()
            if not churn:
                churn = ChurnScore(customer_id=customer.id)
                db.add(churn)
            
            churn.probability = float(row['churn_probability']) / 100.0
            churn.factors = {"usage": float(row['usage']), "geo_risk": float(row['geography_risk_score'])}
            
            # Upsert Revenue Data
            rev = db.query(RevenueData).filter(RevenueData.customer_id == customer.id).first()
            if not rev:
                rev = RevenueData(customer_id=customer.id)
                db.add(rev)
            
            rev.total_revenue = customer.revenue
            rev.risk_amount = Decimal(str(float(customer.revenue) * (float(row['churn_probability']) / 100.0)))
            
            processed_count += 1
            if processed_count % batch_size == 0:
                db.commit()
                print(f"DEBUG: Committed batch {processed_count}")

        dataset.row_count = processed_count
        dataset.status = "completed"
        db.commit()
        
        # Trigger automation
        send_automated_retention_emails.delay(company_id)
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
        if os.path.exists(file_path):
            os.remove(file_path)

@celery.task(name="send_automated_retention_emails")
def send_automated_retention_emails(company_id: int):
    """
    Identifies customers with churn_risk > 0.8 who haven't been notified recently.
    """
    from services.mail_service import send_retention_email
    from datetime import datetime, timedelta
    
    db = SessionLocal()
    try:
        # Get high-risk customers who haven't been notified in the last 7 days
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        at_risk = db.query(Customer).filter(
            Customer.company_id == company_id,
            Customer.churn_risk >= 0.8,
            (Customer.last_notified == None) | (Customer.last_notified < seven_days_ago)
        ).all()
        
        count = 0
        for customer in at_risk:
            if customer.email and send_retention_email(customer.email, customer.name):
                customer.last_notified = datetime.utcnow()
                count += 1
                
        db.commit()
        
        # Log the action (using the Alert model for visibility on dashboard)
        alert = Alert(
            company_id=company_id,
            type="SUCCESS",
            details=f"Automated Outreach: Sent {count} gain-back emails to high-risk customers."
        )
        db.add(alert)
        db.commit()
        
        return {"status": "success", "emails_sent": count}
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
