from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.session import get_db
from api.routes.auth_routes import get_admin_user
from api.controllers import admin_controller

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
        "data": admin_controller.get_users(db)
    }

@router.post("/user")
def register_user(req: admin_controller.UserCreate, db: Session = Depends(get_db), admin: dict = Depends(get_admin_user)):
    return {
        "success": True,
        "data": admin_controller.create_user(db, req)
    }

@router.delete("/user/{user_id}")
def remove_user(user_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_admin_user)):
    return {
        "success": True,
        "data": admin_controller.delete_user(db, user_id)
    }

@router.get("/logs")
def system_logs(db: Session = Depends(get_db), admin: dict = Depends(get_admin_user)):
    return {
        "success": True,
        "data": admin_controller.get_system_logs(db)
    }
