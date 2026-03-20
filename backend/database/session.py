import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.domain import Base
from dotenv import load_dotenv

# Load .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL or "mysql" not in DATABASE_URL:
    raise RuntimeError("DATABASE_URL must be set to a MySQL connection string. SQLite is not supported.")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
