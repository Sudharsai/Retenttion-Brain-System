from fastapi import APIRouter, Depends
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

@router.post("/retrain")
def retrain_model(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return analytics_controller.run_retraining(db, user["cid"])

@router.get("/deep-dive")
def get_deep_dive(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return analytics_controller.get_deep_dive_analysis(db, user["cid"])
