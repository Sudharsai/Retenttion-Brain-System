import sys
import os
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

# Ensure the module can be loaded correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import get_db
from models.domain import User, Company, Log
from core.deps import get_current_admin_user
from core.security import get_password_hash

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

class CompanyCreate(BaseModel):
    company_name: str

class UserCreate(BaseModel):
    username: str
    password: str
    company_id: int

@router.get("/companies")
def list_companies(
    skip: int = Query(0), limit: int = Query(50),
    admin: User = Depends(get_current_admin_user), db: Session = Depends(get_db)
):
    comps = db.query(Company).offset(skip).limit(limit).all()
    res = [{"id": c.id, "name": c.company_name, "created": str(c.created_at)} for c in comps]
    return {"success": True, "data": res}

@router.post("/company")
def create_company(
    comp: CompanyCreate,
    admin: User = Depends(get_current_admin_user), db: Session = Depends(get_db)
):
    new_comp = Company(company_name=comp.company_name)
    db.add(new_comp)
    db.commit()
    db.refresh(new_comp)
    return {"success": True, "data": {"id": new_comp.id, "name": new_comp.company_name}}

@router.post("/user")
def create_user(
    u: UserCreate,
    admin: User = Depends(get_current_admin_user), db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.username == u.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    new_user = User(
        username=u.username,
        password_hash=get_password_hash(u.password),
        role="company_user",
        company_id=u.company_id
    )
    db.add(new_user)
    db.commit()
    return {"success": True, "data": {"username": u.username, "role": "company_user"}}

@router.get("/users")
def list_users(admin: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    users = db.query(User).all()
    res = [{"id": u.id, "username": u.username, "role": u.role, "company_id": u.company_id} for u in users]
    return {"success": True, "data": res}

@router.get("/logs")
def get_logs(admin: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    logs = db.query(Log).order_by(Log.timestamp.desc()).limit(100).all()
    res = [{"id": l.id, "type": l.type, "message": l.message, "timestamp": str(l.timestamp)} for l in logs]
    return {"success": True, "data": res}
