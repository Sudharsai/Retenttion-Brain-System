import os
import sys
from datetime import datetime, timedelta
import random

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.session import SessionLocal
from models.domain import Customer, RetentionFeedback
from models.campaign import Campaign

def seed_campaigns(company_id: int):
    db = SessionLocal()
    try:
        print(f"Seeding campaign data for company {company_id}...")
        
        # 1. Create Mock Campaigns
        campaign_defs = [
            {"name": "Neural Win-Back Q1", "subject": "We miss you!", "segment": "high_risk", "uplift": 12.5, "roi": 4.2, "cost": 1200, "color": "bg-rose-500"},
            {"name": "VIP Retention Alpha", "subject": "Exclusive Loyalty Reward", "segment": "persuadable", "uplift": 8.3, "roi": 5.1, "cost": 2500, "color": "bg-indigo-500"},
            {"name": "Engagement Boost 2024", "subject": "New Features Just for You", "segment": "all", "uplift": 4.1, "roi": 2.8, "cost": 800, "color": "bg-emerald-500"}
        ]
        
        for cdef in campaign_defs:
            existing = db.query(Campaign).filter(Campaign.company_id == company_id, Campaign.name == cdef["name"]).first()
            if not existing:
                campaign = Campaign(
                    company_id=company_id,
                    name=cdef["name"],
                    subject=cdef["subject"],
                    body="Hello [Customer Name], we have a special offer for you...",
                    segment=cdef["segment"],
                    status="sent",
                    total_recipients=1500,
                    sent_count=1500,
                    progress=100,
                    uplift=cdef["uplift"],
                    roi=cdef["roi"],
                    cost=cdef["cost"],
                    color=cdef["color"],
                    sent_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
                )
                db.add(campaign)
        
        db.commit()
        
        # 2. Create Retention Feedback Loop Data
        # This populates the Uplift & ROI Matrix
        customers = db.query(Customer).filter(Customer.company_id == company_id).limit(200).all()
        if not customers:
            print("No customers found to attach feedback. Run ingestion first.")
            return

        # Clear old feedback for clean state
        customer_ids = [c.id for c in db.query(Customer.id).filter(Customer.company_id == company_id).all()]
        db.query(RetentionFeedback).filter(RetentionFeedback.customer_id.in_(customer_ids)).delete(synchronize_session=False)

        campaign_types = ["PREMIUM_RETENTION", "DISCOUNT", "REENGAGEMENT", "REMINDER"]
        for customer in customers:
            # Create 1-2 feedback entries per customer
            for _ in range(random.randint(1, 2)):
                ctype = random.choice(campaign_types)
                success = random.random() > 0.4 # 60% success rate
                feedback = RetentionFeedback(
                    customer_id=customer.id,
                    action_type=random.choice(["EMAIL", "CALL", "SMS"]),
                    campaign_type=ctype,
                    success=success,
                    response=random.choice(["OPENED", "CLICKED", "CONVERTED"]) if success else "IGNORED",
                    timestamp=datetime.utcnow() - timedelta(days=random.randint(0, 15))
                )
                db.add(feedback)
        
        db.commit()
        print("Successfully seeded campaigns and feedback data.")
        
    finally:
        db.close()

if __name__ == "__main__":
    cid = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    seed_campaigns(cid)
