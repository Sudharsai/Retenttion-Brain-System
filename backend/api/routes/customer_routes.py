from fastapi import APIRouter, Depends, Query, UploadFile, File, Body, HTTPException
from sqlalchemy.orm import Session
from database.session import get_db
from api.routes.auth_routes import get_current_user
from api.controllers import customer_controller
from workers.tasks import process_neural_dataset
import shutil
import os
from typing import List, Optional

router = APIRouter()

def get_cid(user: dict, company_id: Optional[int] = None):
    cid = user.get("cid")
    if user.get("role") in ["admin", "super_admin"] and company_id:
        cid = company_id
    if not cid:
        raise HTTPException(status_code=400, detail="Missing company_id context. Admins must specify company_id.")
    return cid

@router.get("/dashboard-kpis")
def get_kpis(
    company_id: Optional[int] = Query(None),
    db: Session = Depends(get_db), 
    user: dict = Depends(get_current_user)
):
    cid = get_cid(user, company_id)
    return {"success": True, "data": customer_controller.get_dashboard_kpis(db, cid)}

@router.get("/high-risk")
def get_high_risk_customers(
    company_id: Optional[int] = Query(None),
    db: Session = Depends(get_db), 
    user: dict = Depends(get_current_user)
):
    cid = get_cid(user, company_id)
    return {"success": True, "data": customer_controller.get_high_risk_drilldown(db, cid)}

@router.get("/")
def get_customers(
    skip: int = Query(0), 
    limit: int = Query(20), 
    risk: str = Query(None),
    company_id: Optional[int] = Query(None),
    db: Session = Depends(get_db), 
    user: dict = Depends(get_current_user)
):
    cid = get_cid(user, company_id)
    return {"success": True, "data": customer_controller.get_customers(db, cid, skip, limit, risk)}

@router.get("/uplift-insights")
def get_uplift(
    company_id: Optional[int] = Query(None),
    db: Session = Depends(get_db), 
    user: dict = Depends(get_current_user)
):
    cid = get_cid(user, company_id)
    return {"success": True, "data": customer_controller.get_uplift_insights(db, cid)}

@router.get("/revenue-at-risk")
def get_revenue_risk(
    company_id: Optional[int] = Query(None),
    db: Session = Depends(get_db), 
    user: dict = Depends(get_current_user)
):
    cid = get_cid(user, company_id)
    return {"success": True, "data": customer_controller.get_revenue_risk_details(db, cid)}

@router.get("/campaign-timeline")
def get_timeline(
    company_id: Optional[int] = Query(None),
    db: Session = Depends(get_db), 
    user: dict = Depends(get_current_user)
):
    cid = get_cid(user, company_id)
    return {"success": True, "data": customer_controller.get_campaign_timeline(db, cid)}

@router.post("/run-decision-engine")
def run_rde(
    company_id: Optional[int] = Query(None),
    user: dict = Depends(get_current_user)
):
    from workers.tasks import run_retention_engine_task
    cid = get_cid(user, company_id)
    run_retention_engine_task.delay(cid)
    return {"success": True, "message": "Retention Decision Engine started in the background"}

@router.post("/upload-csv")
async def upload_dataset(
    file: UploadFile = File(...), 
    company_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    cid = get_cid(user, company_id)
    if not file.filename.endswith(".csv"):
        return {"error": "Only CSV files are supported"}
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"{cid}_{file.filename}")
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    process_neural_dataset.delay(temp_path, cid)
    return {"success": True, "message": "Dataset upload started successfully"}

@router.get("/datasets")
def get_datasets(
    company_id: Optional[int] = Query(None),
    db: Session = Depends(get_db), 
    user: dict = Depends(get_current_user)
):
    cid = get_cid(user, company_id)
    return {"success": True, "data": customer_controller.get_datasets(db, cid)}

@router.delete("/datasets/{dataset_id}")
def delete_dataset(
    dataset_id: int, 
    company_id: Optional[int] = Query(None),
    db: Session = Depends(get_db), 
    user: dict = Depends(get_current_user)
):
    cid = get_cid(user, company_id)
    return customer_controller.delete_dataset(db, cid, dataset_id)

@router.post("/datasets/bulk-delete")
def bulk_delete_datasets(
    dataset_ids: List[int] = Body(...), 
    company_id: Optional[int] = Query(None),
    db: Session = Depends(get_db), 
    user: dict = Depends(get_current_user)
):
    cid = get_cid(user, company_id)
    return customer_controller.bulk_delete_datasets(db, cid, dataset_ids)

@router.post("/execute")
def execute_retention_pipeline(
    company_id: Optional[int] = Query(None),
    user: dict = Depends(get_current_user)
):
    from workers.tasks import execute_retention_actions
    cid = get_cid(user, company_id)
    execute_retention_actions.delay(cid)
    return {"success": True, "message": "Retention pipeline execution started"}

@router.get("/top-risk")
def get_top_risk(
    company_id: Optional[int] = Query(None),
    db: Session = Depends(get_db), 
    user: dict = Depends(get_current_user)
):
    cid = get_cid(user, company_id)
    return {"success": True, "data": customer_controller.get_top_priority_customers(db, cid)}

@router.get("/analytics")
def get_retention_analytics(
    company_id: Optional[int] = Query(None),
    db: Session = Depends(get_db), 
    user: dict = Depends(get_current_user)
):
    cid = get_cid(user, company_id)
    return {"success": True, "data": customer_controller.get_campaign_analytics(db, cid)}
