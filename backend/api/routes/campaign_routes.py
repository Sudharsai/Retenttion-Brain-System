from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from database.session import get_db
from models.campaign import Campaign, CampaignEmail, CampaignStatus, EmailStatus
from models.domain import Customer
from services.email_service import send_bulk_emails
from api.routes.auth_routes import get_current_user

router = APIRouter()

# --- Schemas ---

class CampaignCreate(BaseModel):
    name: str
    subject: str
    body: str
    segment: str = "all"   # all | high_risk | persuadable


class TestEmailRequest(BaseModel):
    to_email: str
    subject: str
    body: str


# --- Helpers ---

def get_recipients_for_segment(segment: str, db: Session, company_id: int) -> List[Customer]:
    """Fetch customers based on the selected segment."""
    q = db.query(Customer).filter(Customer.company_id == company_id)

    if segment == "high_risk":
        q = q.filter(Customer.churn_risk >= 0.6)
    elif segment == "persuadable":
        q = q.filter(
            Customer.uplift_score > 0.05,
            Customer.churn_risk >= 0.3,
            Customer.churn_risk < 0.8
        )
    # "all" returns everyone

    return q.filter(Customer.email.isnot(None), Customer.email != "").limit(500).all()


def run_send_campaign(campaign_id: int, db: Session):
    """Background task: send emails and update campaign status."""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        return

    # Collect all pending emails for this campaign
    pending = db.query(CampaignEmail).filter(
        CampaignEmail.campaign_id == campaign_id,
        CampaignEmail.status == EmailStatus.pending
    ).all()

    recipients = [{"email": e.recipient_email, "name": e.recipient_name} for e in pending]
    
    # Send bulk
    result = send_bulk_emails(recipients, campaign.subject, campaign.body)
    results_map = {r["email"]: r for r in result["results"]}

    # Update individual email records
    now = datetime.utcnow()
    for email_record in pending:
        r = results_map.get(email_record.recipient_email, {})
        if r.get("status") == "sent":
            email_record.status = EmailStatus.sent
            email_record.sent_at = now
        else:
            email_record.status = EmailStatus.failed
            email_record.error_message = r.get("error", "Unknown error")

    # Update campaign summary
    campaign.sent_count = result["sent"]
    campaign.failed_count = result["failed"]
    campaign.status = CampaignStatus.sent if result["sent"] > 0 else CampaignStatus.failed
    campaign.sent_at = now

    db.commit()


# --- Routes ---

@router.get("/")
async def list_campaigns(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    campaigns = db.query(Campaign)\
        .filter(Campaign.company_id == user["cid"])\
        .order_by(desc(Campaign.created_at))\
        .limit(50)\
        .all()

    return {
        "success": True,
        "data": [
            {
                "id": c.id,
                "name": c.name,
                "subject": c.subject,
                "segment": c.segment,
                "status": c.status,
                "total_recipients": c.total_recipients,
                "sent_count": c.sent_count,
                "failed_count": c.failed_count,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "sent_at": c.sent_at.isoformat() if c.sent_at else None,
            }
            for c in campaigns
        ]
    }


@router.post("/")
async def create_campaign(
    payload: CampaignCreate,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Resolve recipients
    recipients = get_recipients_for_segment(payload.segment, db, user["cid"])

    if not recipients:
        raise HTTPException(status_code=400, detail="No customers found for selected segment. Upload data first.")

    # Create campaign record
    campaign = Campaign(
        company_id=user["cid"],
        name=payload.name,
        subject=payload.subject,
        body=payload.body,
        segment=payload.segment,
        status=CampaignStatus.sending,
        total_recipients=len(recipients),
        created_by=user.get("uid"), # assuming uid is present in token payload
    )
    db.add(campaign)
    db.flush()  # get campaign.id

    # Create email records (one per recipient)
    for customer in recipients:
        db.add(CampaignEmail(
            campaign_id=campaign.id,
            customer_id=customer.id,
            recipient_email=customer.email,
            recipient_name=customer.name or customer.email.split("@")[0],
            status=EmailStatus.pending,
        ))

    db.commit()
    db.refresh(campaign)

    # Fire off sending in background
    background_tasks.add_task(run_send_campaign, campaign.id, db)

    return {
        "success": True,
        "data": {
            "id": campaign.id,
            "name": campaign.name,
            "status": campaign.status,
            "total_recipients": campaign.total_recipients,
        },
        "message": f"Campaign '{campaign.name}' is sending to {len(recipients)} recipients."
    }


@router.get("/{campaign_id}")
async def get_campaign(
    campaign_id: int,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.company_id == user["cid"]
    ).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    emails = db.query(CampaignEmail).filter(CampaignEmail.campaign_id == campaign_id).all()

    return {
        "success": True,
        "data": {
            "id": campaign.id,
            "name": campaign.name,
            "subject": campaign.subject,
            "body": campaign.body,
            "segment": campaign.segment,
            "status": campaign.status,
            "total_recipients": campaign.total_recipients,
            "sent_count": campaign.sent_count,
            "failed_count": campaign.failed_count,
            "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
            "sent_at": campaign.sent_at.isoformat() if campaign.sent_at else None,
            "emails": [
                {
                    "email": e.recipient_email,
                    "name": e.recipient_name,
                    "status": e.status,
                    "sent_at": e.sent_at.isoformat() if e.sent_at else None,
                    "error": e.error_message,
                }
                for e in emails
            ]
        }
    }


@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: int,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.company_id == user["cid"]
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    db.delete(campaign)
    db.commit()
    return {"success": True, "message": "Campaign deleted"}


@router.post("/test-email")
async def send_test_email(
    payload: TestEmailRequest,
    user: dict = Depends(get_current_user),
):
    """Send a test email to a single address to preview the campaign."""
    from services.email_service import send_single_email
    ok = send_single_email(
        to_email=payload.to_email,
        to_name=user.get("username", "Test User"),
        subject=f"[TEST] {payload.subject}",
        body=payload.body
    )
    if ok:
        return {"success": True, "message": f"Test email sent to {payload.to_email}"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send test email. Check SMTP credentials in .env")
