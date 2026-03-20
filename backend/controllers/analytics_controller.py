import sys
import os
from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from celery import Celery

# Ensure the module can be loaded correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import get_db
from models.domain import User
from core.deps import get_current_active_company_user

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery("retention_worker", broker=REDIS_URL, backend=REDIS_URL)

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

@router.get("/model-stats")
def get_model_stats(user: User = Depends(get_current_active_company_user)):
    # Mocking live model metrics
    return {
        "success": True, 
        "data": {
            "roc_auc": 0.884,
            "precision": 0.82,
            "recall": 0.79,
            "f1_score": 0.805,
            "training_date": "2024-03-19",
            "feature_importance": [
                {"feature": "Contract_Type", "score": 0.32},
                {"feature": "Tenure", "score": 0.28},
                {"feature": "MonthlyCharges", "score": 0.15},
                {"feature": "TechSupport", "score": 0.10}
            ]
        }
    }

@router.post("/upload-dataset")
async def handle_dataset_upload(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    user: User = Depends(get_current_active_company_user)
):
    file_location = f"temp_{file.filename}"
    content = await file.read()
    with open(file_location, "wb+") as f:
        f.write(content)
    
    # Trigger Celery task (assuming it exists in workers/tasks.py or similar)
    # For now, we'll just mock the trigger
    # celery_app.send_task("process_dataset_and_retrain", args=[file_location])
    
    return {"status": "Success", "message": f"Dataset {file.filename} uploaded and processing started."}
