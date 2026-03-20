import pandas as pd
from celery import Celery
import os
from database.session import SessionLocal
from models.domain import Customer, ChurnScore, UpliftScore, RevenueData, Company
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
    2. Store Raw Data
    3. ML Scoring
    4. Persist Results
    """
    db = SessionLocal()
    try:
        if not os.path.exists(file_path):
            return {"error": f"File {file_path} not found"}

        # Step 1: Validate CSV
        df = pd.read_csv(file_path)
        required_cols = ['customer_id', 'name', 'email', 'revenue', 'usage', 'transactions']
        
        # Normalize column names for validation (handle case sensitivity)
        col_map = {c.lower(): c for c in df.columns}
        missing = [c for c in required_cols if c not in col_map]
        if missing:
            return {"error": f"Missing required columns: {missing}"}

        # Step 2: Store/Update Raw Data & Scoring
        # We rename columns to internal names
        df_scored = MLService.train_and_score(df.rename(columns={col_map[c]: c for c in required_cols if c in col_map}))

        processed_count = 0
        for _, row in df_scored.iterrows():
            # Find or Create Customer
            customer = db.query(Customer).filter(
                Customer.external_customer_id == str(row['customer_id']),
                Customer.company_id == company_id
            ).first()

            if not customer:
                customer = Customer(
                    company_id=company_id,
                    external_customer_id=str(row['customer_id']),
                    name=row['name'],
                    email=row['email'],
                    revenue=Decimal(str(row['revenue'])),
                    usage_score=float(row['usage']),
                    transactions_count=int(row['transactions'])
                )
                db.add(customer)
                db.flush() # Get the new customer ID

            # Update scores on customer object (shorthand for quick lookup)
            customer.churn_risk = float(row['churn_probability'])
            customer.uplift_score = float(row['uplift_score'])

            # Step 5: Store results in detailed tables
            churn = ChurnScore(
                customer_id=customer.id,
                probability=float(row['churn_probability']),
                factors={"usage": row['usage'], "transactions": row['transactions']}
            )
            
            uplift = UpliftScore(
                customer_id=customer.id,
                score=float(row['uplift_score']),
                strategy="Targeted Outreach" if row['uplift_score'] > 0 else "Ignore"
            )
            
            revenue = RevenueData(
                customer_id=customer.id,
                total_revenue=Decimal(str(row['revenue'])),
                risk_amount=Decimal(str(row['revenue_at_risk']))
            )

            db.add(churn)
            db.add(uplift)
            db.add(revenue)
            processed_count += 1

        db.commit()
        return {
            "status": "Complete", 
            "processed_count": processed_count,
            "company_id": company_id
        }

    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()
        if os.path.exists(file_path):
            os.remove(file_path)
