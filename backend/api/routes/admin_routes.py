from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.session import get_db
from api.routes.auth_routes import get_admin_user
from api.controllers import admin_controller
from pydantic import BaseModel

router = APIRouter()

@router.get("/companies")
def list_companies(db: Session = Depends(get_db), admin: dict = Depends(get_admin_user)):
    return {
        "success": True,
        "data": admin_controller.get_companies(db)
    }

@router.post("/company")
def register_company(req: admin_controller.CompanyCreate, db: Session = Depends(get_db), admin: dict = Depends(get_admin_user)):
    return {
        "success": True,
        "data": admin_controller.create_company(db, req)
    }

@router.get("/users")
def list_users(db: Session = Depends(get_db), admin: dict = Depends(get_admin_user)):
    return {
        "success": True,
        "data": admin_controller.get_users(db, admin)
    }

@router.post("/user")
def register_user(req: admin_controller.UserCreate, db: Session = Depends(get_db), admin: dict = Depends(get_admin_user)):
    return {
        "success": True,
        "data": admin_controller.create_user(db, req, admin)
    }

@router.delete("/user/{user_id}")
def remove_user(user_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_admin_user)):
    return {
        "success": True,
        "data": admin_controller.delete_user(db, user_id)
    }

class PasswordReset(BaseModel):
    new_password: str

@router.post("/user/{user_id}/reset-password")
def reset_password(user_id: int, req: PasswordReset, db: Session = Depends(get_db), admin: dict = Depends(get_admin_user)):
    return admin_controller.reset_user_password(db, user_id, req.new_password)

@router.get("/logs")
def system_logs(db: Session = Depends(get_db), admin: dict = Depends(get_admin_user)):
    return {
        "success": True,
        "data": admin_controller.get_system_logs(db)
    }
