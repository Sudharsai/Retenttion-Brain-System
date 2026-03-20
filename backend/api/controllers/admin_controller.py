from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.domain import Company, User, AppLog
from api.controllers.auth_controller import get_password_hash
from pydantic import BaseModel

class CompanyCreate(BaseModel):
    name: str
    domain: str = None

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    company_id: int
    role: str = "user"

def get_companies(db: Session):
    return db.query(Company).all()

def create_company(db: Session, req: CompanyCreate):
    company = Company(name=req.name, domain=req.domain)
    db.add(company)
    db.commit()
    db.refresh(company)
    return company

def get_users(db: Session):
    return db.query(User).all()

def create_user(db: Session, req: UserCreate):
    hashed = get_password_hash(req.password)
    user = User(
        username=req.username, 
        email=req.email, 
        password_hash=hashed, 
        company_id=req.company_id,
        role=req.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
    return {"success": True}

def get_system_logs(db: Session):
    return db.query(AppLog).order_by(AppLog.created_at.desc()).limit(100).all()
