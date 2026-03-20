import pandas as pd
from celery import Celery
import os
from database.session import SessionLocal
from models.domain import Customer, ChurnScore, UpliftScore, RevenueData, Company, AppLog, Dataset
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

        # Batch Fetch Existing Customers to reduce roundtrips
        existing_customers = {c.external_customer_id: c for c in db.query(Customer).filter(Customer.company_id == company_id).all()}
        
        sync_queue = [] # List of tuples (Customer, row)
        
        processed_count = 0
        for _, row in df_scored.iterrows():
            ext_id = str(row[mapping.get('customer_id', df.columns[0])])
            cust_name = str(row[mapping.get('name', mapping.get('customer_id', df.columns[0]))])
            
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
            else:
                customer.dataset_id = dataset.id
                customer.name = cust_name
            
            # Update base stats on customer object
            customer.revenue = Decimal(str(row['revenue']))
            customer.usage_score = float(row['usage'])
            customer.transactions_count = int(row['transactions'])
            customer.churn_risk = float(row['churn_probability'])
            customer.uplift_score = float(row['uplift_score'])
            
            sync_queue.append((customer, row))
            processed_count += 1

        db.flush() # Ensure all customers have IDs

        # Second Pass: Sync Scores/Revenue (Batch updates)
        for customer, row in sync_queue:
            # Churn
            churn = db.query(ChurnScore).filter(ChurnScore.customer_id == customer.id).first() or ChurnScore(customer_id=customer.id)
            churn.probability = float(row['churn_probability'])
            churn.factors = {"usage": float(row['usage']), "acc": metrics.get("accuracy", 0)}
            db.add(churn)
            
            # Uplift
            uplift = db.query(UpliftScore).filter(UpliftScore.customer_id == customer.id).first() or UpliftScore(customer_id=customer.id)
            uplift.score = float(row['uplift_score'])
            uplift.strategy = "AI Optimized"
            db.add(uplift)
            
            # Revenue
            rev = db.query(RevenueData).filter(RevenueData.customer_id == customer.id).first() or RevenueData(customer_id=customer.id)
            rev.total_revenue = Decimal(str(row['revenue']))
            rev.risk_amount = Decimal(str(row['revenue_at_risk']))
            db.add(rev)

        # Step 4: Finalize Dataset & Audit Log
        dataset.row_count = processed_count
        dataset.status = "completed"

        metrics_summary = f"Accuracy: {metrics.get('accuracy')}, F1: {metrics.get('f1_score')}, AUC: {metrics.get('roc_auc')}"
        log = AppLog(
            company_id=company_id,
            action="MODEL_TRAINING_COMPLETE",
            details=f"Processed dataset '{dataset.filename}' ({processed_count} records). Metrics: {metrics_summary}"
        )
        db.add(log)
        
        db.commit()
        
        # Trigger automated retention emails for high-risk customers
        send_automated_retention_emails.delay(company_id)
        
        return {"status": "Complete", "processed_count": processed_count, "dataset_id": dataset.id}

    except Exception as e:
        db.rollback()
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
    from models.domain import Campaign
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
            if progress == 100:
                campaign.color = "bg-emerald-500" 
            db.commit()
            
    except Exception as e:
        print(f"Campaign simulation failed: {e}")
    finally:
        db.close()
