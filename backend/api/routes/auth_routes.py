from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.session import get_db
from api.controllers.auth_controller import admin_login, company_login, LoginRequest, reset_admin_password
from services.auth_service import decode_token
from fastapi.security import OAuth2PasswordBearer

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

@router.post("/admin/login")
def platform_admin_login(req: LoginRequest, db: Session = Depends(get_db)):
    return admin_login(db, req)

@router.post("/login")
def company_user_login(req: LoginRequest, db: Session = Depends(get_db)):
    return company_login(db, req)

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

def get_admin_user(token: str = Depends(oauth2_scheme)):
    payload = get_current_user(token)
    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges",
        )
    return payload
