import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.domain import Base
from models.campaign import Campaign, CampaignEmail
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Smart Database Resolution
# Prioritize explicit MySQL (Docker/Prod) but fallback to SQLite for local ease
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./retention_brain.db")

# Handle SQLite specific arguments
connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
else:
    # Ensure MySQL connections are robust
    engine = create_engine(
        DATABASE_URL, 
        pool_pre_ping=True, 
        pool_recycle=3600
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
