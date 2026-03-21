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

from fastapi.responses import Response
from services.report_service import ReportGenerator
from services.smtp_service import SMTPService
from models.domain import Customer

def get_segment_report(db: Session, company_id: int, tier: str, format: str = "pdf"):
    """
    Generate a report (PDF/CSV) for a specific risk tier.
    """
    query = db.query(Customer).filter(Customer.company_id == company_id)
    if tier == "High": query = query.filter(Customer.churn_risk > 70)
    elif tier == "Medium": query = query.filter(Customer.churn_risk.between(40, 70))
    else: query = query.filter(Customer.churn_risk < 40)
    
    customers = query.all()
    data = []
    for c in customers:
        data.append({
            "customer_id": c.external_customer_id,
            "name": c.name,
            "email": c.email,
            "churn_risk": c.churn_risk,
            "revenue": float(c.revenue or 0),
            "action": "Neural Intervention" if tier == "High" else "Loyalty Boost"
        })

    if format == "csv":
        content = ReportGenerator.generate_csv(data)
        return Response(content=content, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={tier}_risk_report.csv"})
    
    content = ReportGenerator.generate_pdf(data, f"{tier} Risk Retention Segment")
    return Response(content=content, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={tier}_risk_report.pdf"})

def trigger_tier_emails(db: Session, company_id: int, tier: str):
    """
    Trigger bulk emails for a segment.
    """
    query = db.query(Customer).filter(Customer.company_id == company_id)
    if tier == "High": query = query.filter(Customer.churn_risk > 70)
    elif tier == "Medium": query = query.filter(Customer.churn_risk.between(40, 70))
    else: query = query.filter(Customer.churn_risk < 40)
    
    customers = query.all()
    if not customers:
        return {"success": False, "message": "No customers found in this tier."}

    # In a real app, we'd use .delay() for Celery, but we'll call service directly for now
    # or implement the task in workers/tasks.py
    result = SMTPService.send_bulk_emails(db, company_id, customers, tier)
    return result
