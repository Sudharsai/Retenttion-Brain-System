from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.domain import User, Company
from services.auth_service import verify_password, create_access_token, get_password_hash
from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    id_field: str # for admin it's username, for user it's email
    password: str

class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str

class UserLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    company_id: int
    company_name: str

def admin_login(db: Session, req: LoginRequest):
    # Special case: check for default admin if not in DB
    user = db.query(User).filter(User.username == req.id_field, User.role == 'admin').first()
    
    if not user:
        # Check if we should seed it (for the very first run)
        if req.id_field == "admin" and req.password == "admin123":
            # Seed admin
            hashed = get_password_hash("admin123")
            seed_admin = User(username="admin", email="admin@retentionbrain.ai", password_hash=hashed, role="admin")
            db.add(seed_admin)
            db.commit()
            db.refresh(seed_admin)
            user = seed_admin
        else:
            raise HTTPException(status_code=401, detail="Invalid admin credentials")
            
    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
        
    token = create_access_token(data={"sub": user.username, "role": "admin", "uid": user.id})
    return {"access_token": token, "token_type": "bearer", "username": user.username}

def company_login(db: Session, req: LoginRequest):
    user = db.query(User).filter(User.email == req.id_field, User.role == 'user').first()
    
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid company credentials")
        
    if not user.company_id:
        raise HTTPException(status_code=400, detail="User is not associated with any company")
        
    company = db.query(Company).filter(Company.id == user.company_id).first()
    
    token = create_access_token(data={
        "sub": user.email, 
        "role": "user", 
        "cid": user.company_id,
        "uid": user.id
    })
    
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "company_id": user.company_id, 
        "company_name": company.name if company else "Unknown"
    }

def reset_admin_password(db: Session, admin_id: int, new_password: str):
    admin = db.query(User).filter(User.id == admin_id, User.role == 'admin').first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
        
    admin.password_hash = get_password_hash(new_password)
    db.commit()
    return {"message": "Admin password reset successfully"}
