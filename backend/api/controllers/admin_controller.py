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
    # Match the keys used in auth_controller.py (cid, uid, role)
    role = current_user.get("role")
    company_id = current_user.get("cid")
    
    if role in ["super_admin", "admin"] and not company_id:
        return db.query(User).all()
        
    # Regular admins only see client users within their own company
    if not company_id:
        return []
        
    return db.query(User).filter(User.role == "user", User.company_id == company_id).all()

def create_user(db: Session, req: UserCreate, current_user: dict):
    # Enforce hierarchy: Only super_admin or platform admin (no cid) can create other admins
    role = current_user.get("role")
    company_id = current_user.get("cid")
    
    target_role = req.role
    if role == "admin" and company_id:
        target_role = "user"
        
    hashed = get_password_hash(req.password)
    c_id = req.company_id
    if c_id == 0:
        c_id = None
        
    user = User(
        username=req.username, 
        email=req.email, 
        password_hash=hashed, 
        company_id=c_id,
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

def get_admin_stats(db: Session):
    from models.domain import Customer
    from sqlalchemy import func
    
    tenant_count = db.query(Company).count()
    user_count = db.query(User).count()
    customer_count = db.query(Customer).count()
    
    return {
        "tenants": tenant_count,
        "users": user_count,
        "customers": customer_count
    }
