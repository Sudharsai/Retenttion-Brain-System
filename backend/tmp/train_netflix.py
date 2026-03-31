import sys
import os
import pandas as pd

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Override DATABASE_URL for local execution if running outside Docker
if not os.getenv("DOCKER_CONTAINER") and not os.getenv("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "postgresql://rb_admin:rb_password@localhost:5432/retention_brain"

from services.ml_service import MLService
from database.session import SessionLocal
from models.domain import Customer, Company
import uuid

def run_training():
    file_path = "sample_data2.csv"
    if not os.path.exists(file_path):
        print(f"File {file_path} not found")
        return

    print(f"Loading {file_path}...")
    df = pd.read_csv(file_path)
    
    # Ensure we have a company to associate with
    db = SessionLocal()
    company = db.query(Company).first()
    if not company:
        print("Creating dummy company...")
        company = Company(name="Netflix Demo", industry="Streaming")
        db.add(company)
        db.commit()
    
    print(f"Training model on {len(df)} rows...")
    df_scored, metrics = MLService.train_and_score(df)
    print(f"Training complete. Metrics: {metrics}")
    
    # Save a larger sample to verify the full pipeline
    print("Seeding sample customers and triggering industry-grade pipeline...")
    sample_df = df_scored.head(500)
    customer_ids = []
    
    for index, row in sample_df.iterrows():
        cust_id = str(row['customer_id'])
        customer = db.query(Customer).filter(Customer.external_customer_id == cust_id).first()
        if not customer:
            customer = Customer(
                external_customer_id=cust_id,
                company_id=company.id,
                name=f"User {index}",
                email=f"user{index}@example.com",
                churn_risk=float(row['churn_probability']) / 100.0,
                revenue=float(row['monthly_fee']) if 'monthly_fee' in row else float(row.get('revenue', 0)),
                last_active_days=int(row.get('last_login_days', 5))
            )
            db.add(customer)
            db.flush()
            customer_ids.append(customer.id)
            
    db.commit()
    print(f"Database seeded with {len(customer_ids)} new customers.")

    # Trigger async pipeline for company
    from workers.tasks import execute_retention_actions
    print("Triggering asynchronous decision engine...")
    execute_retention_actions.delay(company.id)
    
    print("Pipeline initialized. check Celery logs for multi-channel dispatch details.")
    db.close()

if __name__ == "__main__":
    run_training()
