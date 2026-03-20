import os
import pandas as pd
import sys
from decimal import Decimal

# Add backend to path
sys.path.append('backend')

from database.session import SessionLocal, init_db
from models.domain import Customer, RevenueData, Dataset, Company
from workers.tasks import process_neural_dataset

def test_full_pipeline():
    print("Initializing DB...")
    init_db()
    db = SessionLocal()
    
    # Ensure a company exists
    company = db.query(Company).first()
    if not company:
        company = Company(name="Test Company")
        db.add(company)
        db.commit()
        db.refresh(company)
    
    company_id = company.id
    file_path = 'WA_Fn-UseC_-Telco-Customer-Churn.csv'
    
    print(f"Running process_neural_dataset for file: {file_path}")
    result = process_neural_dataset(file_path, company_id)
    print(f"Result: {result}")
    
    if "error" in result:
        print(f"FAILED: {result['error']}")
        return

    # Verify Database
    print("\n--- Verification ---")
    c_count = db.query(Customer).filter(Customer.company_id == company_id).count()
    print(f"Total Customers in DB: {c_count}")
    
    # Sample customer revenue
    sample_c = db.query(Customer).filter(Customer.company_id == company_id).first()
    if sample_c:
        print(f"Sample Customer '{sample_c.name}' Revenue: {sample_c.revenue}")
    
    # RevenueData check
    r_count = db.query(RevenueData).join(Customer).filter(Customer.company_id == company_id).count()
    print(f"RevenueData Rows: {r_count}")
    
    from sqlalchemy import func
    r_sum = db.query(func.sum(RevenueData.total_revenue)).join(Customer).filter(Customer.company_id == company_id).scalar()
    risk_sum = db.query(func.sum(RevenueData.risk_amount)).join(Customer).filter(Customer.company_id == company_id).scalar()
    
    print(f"Total Revenue Sum: {r_sum}")
    print(f"Total Revenue at Risk Sum: {risk_sum}")
    
    if r_sum and r_sum > 0:
        print("\nSUCCESS: Money is being calculated and stored!")
    else:
        print("\nFAILURE: Money is still zero in the DB.")

if __name__ == "__main__":
    test_full_pipeline()
