import pandas as pd
from celery import Celery
import os
from database.session import SessionLocal
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
        
        essential = ['customer_id', 'revenue', 'usage', 'transactions']
        missing = [key for key in essential if key not in mapping]
        if missing:
            dataset.status = "failed"
            db.commit()
            return {"error": f"Missing columns: {missing}"}

        # Step 3: ML Scoring
        df_scored, metrics = MLService.train_and_score(df)

        processed_count = 0
        for _, row in df_scored.iterrows():
            ext_id = str(row[mapping['customer_id']])
            cust_name = str(row[mapping.get('name', mapping['customer_id'])])
            cust_email = str(row[mapping.get('email', mapping['customer_id'])])
            
            customer = db.query(Customer).filter(
                Customer.external_customer_id == ext_id,
                Customer.company_id == company_id
            ).first()

            if not customer:
                customer = Customer(
                    company_id=company_id,
                    external_customer_id=ext_id,
                    dataset_id=dataset.id,
                    name=cust_name,
                    email=cust_email
                )
                db.add(customer)
                db.flush() 
            else:
                customer.dataset_id = dataset.id # Update to latest dataset

            # Update base stats
            customer.revenue = Decimal(str(row[mapping['revenue']]))
            customer.usage_score = float(row[mapping['usage']])
            customer.transactions_count = int(row[mapping['transactions']])
            customer.churn_risk = float(row['churn_probability'])
            customer.uplift_score = float(row['uplift_score'])

            # Multi-table Persistence
            # Churn
            churn = db.query(ChurnScore).filter(ChurnScore.customer_id == customer.id).first()
            if not churn:
                churn = ChurnScore(customer_id=customer.id)
                db.add(churn)
            churn.probability = float(row['churn_probability'])
            churn.factors = {"usage": float(row[mapping['usage']]), "transactions": int(row[mapping['transactions']]), "accuracy": metrics.get("accuracy", 0)}
            
            # Uplift
            uplift = db.query(UpliftScore).filter(UpliftScore.customer_id == customer.id).first()
            if not uplift:
                uplift = UpliftScore(customer_id=customer.id)
                db.add(uplift)
            uplift.score = float(row['uplift_score'])
            uplift.strategy = "AI Optimized" if row['uplift_score'] > 0.15 else "Standard"
            
            # Revenue
            rev_node = db.query(RevenueData).filter(RevenueData.customer_id == customer.id).first()
            if not rev_node:
                rev_node = RevenueData(customer_id=customer.id)
                db.add(rev_node)
            rev_node.total_revenue = Decimal(str(row[mapping['revenue']]))
            rev_node.risk_amount = Decimal(str(row['revenue_at_risk']))

            processed_count += 1

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
        return {"status": "Complete", "processed_count": processed_count, "dataset_id": dataset.id}

    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()
        if os.path.exists(file_path):
            os.remove(file_path)
