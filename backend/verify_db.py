from sqlalchemy import create_engine, text
import os

DATABASE_URL = "mysql+pymysql://rb_admin:rb_secure_pass_2026@localhost:3307/retention_brain"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    res = conn.execute(text("SELECT COUNT(*) FROM customers")).scalar()
    print(f"Total customers: {res}")
    
    res = conn.execute(text("SELECT COUNT(*) FROM churn_scores")).scalar()
    print(f"Total churn scores: {res}")
    
    res = conn.execute(text("SELECT COUNT(*) FROM uplift_scores")).scalar()
    print(f"Total uplift scores: {res}")
    
    # Check for company_id 1
    res = conn.execute(text("SELECT COUNT(*) FROM customers WHERE company_id = 1")).scalar()
    print(f"Customers for company_id=1: {res}")
