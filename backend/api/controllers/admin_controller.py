from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.domain import Company, User, AppLog
from api.controllers.auth_controller import get_password_hash
from pydantic import BaseModel

from typing import Optional

class CompanyCreate(BaseModel):
    name: str
    domain: Optional[str] = None

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
    
    # Log action
    log = AppLog(action="CREATE_COMPANY", details=f"Created company: {req.name}")
    db.add(log)
    db.commit()
    
    return company

def update_company(db: Session, company_id: int, req: CompanyCreate):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    old_name = company.name
    company.name = req.name
    company.domain = req.domain
    db.commit()
    
    # Log action
    log = AppLog(action="UPDATE_COMPANY", details=f"Updated company {company_id}: {old_name} -> {req.name}")
    db.add(log)
    db.commit()
    
    return company

def get_users(db: Session, current_user: dict):
    # Match the keys used in auth_controller.py (cid, uid, role)
    role = current_user.get("role")
    company_id = current_user.get("cid")
    
    if role == "super_admin":
        return db.query(User).all()
        
    if role == "admin":
        if not company_id:
            return db.query(User).filter(User.role == "admin").all()
        return db.query(User).filter(User.company_id == company_id).all()
        
    return []

def create_user(db: Session, req: UserCreate, current_user: dict):
    # Enforce hierarchy
    role = current_user.get("role")
    company_id = current_user.get("cid")
    
    # Check if user already exists
    existing_user = db.query(User).filter((User.username == req.username) | (User.email == req.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Identity Conflict: Username or Email already registered in Neural Grid.")

    target_role = req.role
    c_id = req.company_id

    # Security check: Admins can only create users for their own company
    if role == "admin":
        if company_id:
            c_id = company_id
            target_role = "user" # Admins cannot create other admins usually, but let's allow them to manage their own users
        else:
            # Platform admin (role admin but no cid) can create other admins? 
            # Let's keep it restricted for now
            if target_role == "super_admin":
                target_role = "admin"
        
    hashed = get_password_hash(req.password)
    if c_id == 0 or c_id == "" or c_id == "null":
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
    
    # Log action
    log = AppLog(action="CREATE_USER", details=f"Created user: {req.username} ({target_role})", user_id=user.id)
    db.add(log)
    db.commit()
    
    return user

def update_user(db: Session, user_id: int, req: UserCreate):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.username = req.username
    user.email = req.email
    if req.password:
        user.password_hash = get_password_hash(req.password)
    user.role = req.role
    user.company_id = req.company_id if req.company_id != "null" else None
    
    db.commit()
    
    # Log action
    log = AppLog(action="UPDATE_USER", details=f"Updated user {user_id}: {req.username}")
    db.add(log)
    db.commit()
    
    return user

def delete_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.role == "super_admin":
        raise HTTPException(status_code=403, detail="Super Admin accounts cannot be deleted for system security.")
        
    username = user.username
    db.delete(user)
    db.commit()
    
    # Log action
    log = AppLog(action="DELETE_USER", details=f"Deleted user {user_id}: {username}")
    db.add(log)
    db.commit()
    
    return {"success": True}

def reset_user_password(db: Session, user_id: int, new_password: str):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = get_password_hash(new_password)
    db.commit()
    
    # Log action
    log = AppLog(action="RESET_PASSWORD", details=f"Reset password for user {user_id}: {user.username}", user_id=user.id)
    db.add(log)
    db.commit()
    
    return {"success": True, "message": "Password reset successfully"}

def get_system_logs(db: Session):
    return db.query(AppLog).order_by(AppLog.created_at.desc()).limit(100).all()

def get_admin_stats(db: Session):
    from models.domain import Customer, AccessRequest
    from sqlalchemy import func
    
    tenant_count = db.query(Company).count()
    user_count = db.query(User).count()
    customer_count = db.query(Customer).count()
    pending_requests = db.query(AccessRequest).filter(AccessRequest.status == "pending").count()
    
    return {
        "tenants": tenant_count,
        "users": user_count,
        "customers": customer_count,
        "pending_requests": pending_requests
    }

def get_access_requests(db: Session):
    from models.domain import AccessRequest
    return db.query(AccessRequest).order_by(AccessRequest.created_at.desc()).all()

def create_access_request(db: Session, name: str, email: str, company: str, reason: str):
    from models.domain import AccessRequest
    req = AccessRequest(name=name, email=email, company_name=company, reason=reason)
    db.add(req)
    db.commit()
    db.refresh(req)
    return req

def update_request_status(db: Session, request_id: int, status: str):
    from models.domain import AccessRequest
    req = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = status
    db.commit()
    return req
