from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.domain import Company, User, AppLog
from api.controllers.auth_controller import get_password_hash
from pydantic import BaseModel

from typing import Optional

class CompanyCreate(BaseModel):
    name: str
    domain: str = None

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    company_id: Optional[int] = None
    role: str = "user"

def get_companies(db: Session):
    return db.query(Company).all()

def create_company(db: Session, req: CompanyCreate):
    company = Company(name=req.name, domain=req.domain)
    db.add(company)
    db.commit()
    db.refresh(company)
    return company

def get_users(db: Session, current_user: dict):
    if current_user.get("role") == "super_admin":
        return db.query(User).all()
        
    # Regular admins only see client users within their own company
    company_id = current_user.get("company_id")
    if not company_id:
        return []
        
    return db.query(User).filter(User.role == "user", User.company_id == company_id).all()

def create_user(db: Session, req: UserCreate, current_user: dict):
    # Enforce hierarchy: Only super_admin can create other admins
    target_role = req.role
    if current_user.get("role") == "admin":
        target_role = "user"
        
    hashed = get_password_hash(req.password)
    user = User(
        username=req.username, 
        email=req.email, 
        password_hash=hashed, 
        company_id=req.company_id,
        role=target_role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.role == "super_admin":
        raise HTTPException(status_code=403, detail="Super Admin accounts cannot be deleted for system security.")
        
    db.delete(user)
    db.commit()
    return {"success": True}

def reset_user_password(db: Session, user_id: int, new_password: str):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = get_password_hash(new_password)
    db.commit()
    return {"success": True, "message": "Password reset successfully"}

def get_system_logs(db: Session):
    return db.query(AppLog).order_by(AppLog.created_at.desc()).limit(100).all()
