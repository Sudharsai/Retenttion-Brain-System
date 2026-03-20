from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session
from database.session import get_db
from api.routes.auth_routes import get_current_user
from api.controllers import customer_controller
from workers.tasks import process_neural_dataset
import shutil
import os

router = APIRouter()

@router.get("/dashboard-kpis")
def get_kpis(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "data": customer_controller.get_dashboard_kpis(db, user["cid"])
    }

@router.get("/")
def get_customers(
    skip: int = Query(0), 
    limit: int = Query(20), 
    risk: str = Query(None),
    db: Session = Depends(get_db), 
    user: dict = Depends(get_current_user)
):
    return {
        "success": True,
        "data": customer_controller.get_customers(db, user["cid"], skip, limit, risk)
    }

@router.get("/uplift-insights")
def get_uplift(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "data": customer_controller.get_uplift_insights(db, user["cid"])
    }

@router.get("/revenue-at-risk")
def get_revenue_risk(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "data": customer_controller.get_revenue_risk_details(db, user["cid"])
    }

@router.post("/upload-csv")
async def upload_dataset(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """
    Step 1: Save file
    Step 2: Trigger Celery Task
    """
    if not file.filename.endswith(".csv"):
        return {"error": "Only CSV files are supported"}
        
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"{user['cid']}_{file.filename}")
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Trigger Task
    process_neural_dataset.delay(temp_path, user["cid"])
    
    return {"success": True, "message": "Dataset upload started successfully"}
