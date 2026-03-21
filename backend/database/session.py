import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.domain import Base
from models.campaign import Campaign, CampaignEmail
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Smart Database Resolution
# Prioritize explicit PostgreSQL (Docker/Prod) but fallback to SQLite for local ease
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./retention_brain.db")

# Handle SQLite specific arguments
connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
else:
    # Ensure PostgreSQL connections are robust
    # PostgreSQL 16+ works best with pool_pre_ping for container stability
    engine = create_engine(
        DATABASE_URL, 
        pool_pre_ping=True, 
        pool_recycle=3600,
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

from sqlalchemy import create_engine, text

def init_db():
    # 1. Standard SQLAlchemy Table Creation
    print("Initializating SQLAlchemy tables...")
    Base.metadata.create_all(bind=engine)
    
    # 2. Apply PostgreSQL Optimizations (GIN indexes, raw SQL constraints, Views)
    try:
        # In Docker, the app is in /app. database/session.py is in /app/database/session.py
        # schema.sql is in /app/database/schema.sql
        current_dir = os.path.dirname(os.path.abspath(__file__))
        schema_path = os.path.join(current_dir, "schema.sql")
        
        print(f"Checking for schema optimizations at: {schema_path}")
        if os.path.exists(schema_path):
            with engine.connect() as conn:
                with open(schema_path, "r") as f:
                    content = f.read()
                    print(f"Executing schema optimizations from {schema_path}...")
                    
                    # Split by semicolon and execute each in its own transaction
                    statements = [s.strip() for s in content.split(";") if s.strip()]
                    for statement in statements:
                        if not statement or statement.startswith("--"):
                            continue
                        
                        # Add 'IF NOT EXISTS' to indices dynamically for even more robustness if missing in SQL
                        final_sql = statement
                        if "CREATE INDEX" in statement.upper() and "IF NOT EXISTS" not in statement.upper():
                            final_sql = statement.replace("CREATE INDEX", "CREATE INDEX IF NOT EXISTS")
                            final_sql = final_sql.replace("create index", "create index if not exists")
                            
                        try:
                            with engine.begin() as conn:  # engine.begin() handles commit/rollback per statement
                                conn.execute(text(final_sql))
                        except Exception as inner_e:
                            # Silence "already exists" errors to keep logs clean, but log others
                            if "already exists" not in str(inner_e).lower():
                                print(f"Notice: Statement execution detail: {inner_e}")
            print("PostgreSQL Schema Optimizations (Views, Indexes) verified/applied.")
        else:
            print(f"Warning: schema.sql NOT FOUND at {schema_path}")
            
        # 3. Final Check: Ensure critical columns exist in 'customers'
        with engine.connect() as conn:
            try:
                # Add columns if for some reason create_all missed them and schema.sql didn't run
                # This is a fail-safe for the specific 'churn_risk' problem reported
                cols = ["churn_risk", "uplift_score", "persuadability_score", "geography_risk_score", "retention_probability", "expected_recovery"]
                for col in cols:
                    try:
                        conn.execute(text(f"ALTER TABLE customers ADD COLUMN IF NOT EXISTS {col} FLOAT DEFAULT 0.0;"))
                    except: pass
                conn.commit()
            except Exception as e:
                print(f"Fail-safe schema check failed: {e}")
                
    except Exception as e:
        print(f"CRITICAL Warning: Could not apply schema optimizations: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
