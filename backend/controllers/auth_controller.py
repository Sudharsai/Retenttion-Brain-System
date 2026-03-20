import sys
import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

# Ensure the module can be loaded correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import get_db
from models.domain import User
from core.security import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token = create_access_token(data={"sub": user.username, "role": user.role, "company_id": user.company_id})
    return {
        "success": True, 
        "data": {
            "access_token": access_token, 
            "token_type": "bearer", 
            "role": user.role
        }, 
        "message": "Login successful"
    }
