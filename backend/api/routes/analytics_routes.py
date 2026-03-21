from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session
from database.session import get_db
from api.routes.auth_routes import get_current_user
from api.controllers import analytics_controller

router = APIRouter()

@router.get("/model-stats")
def get_stats(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "data": analytics_controller.get_model_stats(db, user["cid"])
    }

@router.get("/executive-metrics")
def get_exec_metrics(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return analytics_controller.get_executive_metrics(db, user["cid"])

@router.post("/retrain")
def retrain_model(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return analytics_controller.run_retraining(db, user["cid"])

@router.get("/deep-dive")
def get_deep_dive(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return analytics_controller.get_deep_dive_analysis(db, user["cid"])

@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "data": analytics_controller.get_active_alerts(db, user["cid"])
    }

@router.post("/intervene")
def bulk_intervene(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return analytics_controller.bulk_intervene_customers(db, user["cid"])

# Campaign Routes
from api.controllers import campaign_controller

@router.get("/campaigns")
def list_campaigns(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "data": campaign_controller.get_campaigns(db, user["cid"])
    }

@router.post("/campaigns")
def create_campaign(req: campaign_controller.CampaignCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "data": campaign_controller.create_campaign(db, user["cid"], req)
    }

@router.get("/campaigns/report")
def download_report(tier: str = Query("High"), format: str = Query("pdf"), db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return campaign_controller.get_segment_report(db, user["cid"], tier, format)

@router.post("/campaigns/send-emails")
def send_tier_emails(tier: str = Body(..., embed=True), db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return campaign_controller.trigger_tier_emails(db, user["cid"], tier)
