from sqlalchemy.orm import Session
from models.domain import Campaign, AppLog
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class CampaignCreate(BaseModel):
    name: str
    color: Optional[str] = "bg-blue-500"

def get_campaigns(db: Session, company_id: int):
    return db.query(Campaign).filter(Campaign.company_id == company_id).order_by(Campaign.created_at.desc()).all()

def create_campaign(db: Session, company_id: int, req: CampaignCreate):
    campaign = Campaign(
        company_id=company_id,
        name=req.name,
        status="Analyzing",
        progress=10,
        color=req.color
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    
    # Log the action
    log = AppLog(
        company_id=company_id,
        action="CAMPAIGN_INITIALIZED",
        details=f"New strategy '{req.name}' initialized for neural deployment."
    )
    db.add(log)
    db.commit()
    
    # Trigger AI Strategy Simulation in background
    try:
        from workers.tasks import simulate_campaign_progress
        simulate_campaign_progress.delay(campaign.id, company_id)
    except Exception as e:
        print(f"Failed to trigger campaign simulation: {e}")
    
    return campaign

def update_campaign_status(db: Session, company_id: int, campaign_id: int, status: str, progress: int):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.company_id == company_id).first()
    if campaign:
        campaign.status = status
        campaign.progress = progress
        db.commit()
        db.refresh(campaign)
    return campaign
