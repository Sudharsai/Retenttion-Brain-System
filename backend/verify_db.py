from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set.")
    exit(1)

# Handle potential localhost mapping for manual runs
if DATABASE_URL and "postgres:5432" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgres:5432", "localhost:5432")

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        print(f"Connected to: {DATABASE_URL}")
        
        # Core checks
        tables = ["customers", "churn_scores", "uplift_scores", "companies", "users"]
        for table in tables:
            try:
                res = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                print(f"Table '{table}' count: {res}")
            except Exception as e:
                print(f"Table '{table}' error: {e}")
        
except Exception as e:
    print(f"CRITICAL: Verification Failed: {e}")
