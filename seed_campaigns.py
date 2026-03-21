import sys
import os

# Add backend to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from database.session import SessionLocal
from models.campaign import Campaign, CampaignEmail
from models.domain import Company, Customer
import random
from datetime import datetime, timedelta

def seed_campaigns():
    db = SessionLocal()
    try:
        company = db.query(Company).filter(Company.name == "TechCorp Solutions").first()
        if not company:
            print("Company not found. Run seed.py first.")
            return

        print(f"Seeding campaigns for {company.name} (ID: {company.id})...")
        
        campaigns = [
            {"name": "Neural SMS Blast", "roi": 12.4, "cost": 1500, "progress": 100, "recipients": 1200, "sent": 1198, "failed": 2},
            {"name": "VIP Concierge", "roi": 28.1, "cost": 4200, "progress": 100, "recipients": 450, "sent": 450, "failed": 0},
            {"name": "Retention Email V2", "roi": 15.7, "cost": 800, "progress": 100, "recipients": 5000, "sent": 4950, "failed": 50},
            {"name": "Push Win-back", "roi": 9.2, "cost": 1200, "progress": 100, "recipients": 800, "sent": 780, "failed": 20},
            {"name": "Loyalty Rewards", "roi": 22.5, "cost": 3100, "progress": 100, "recipients": 2100, "sent": 2100, "failed": 0}
        ]

        for camp_data in campaigns:
            campaign = Campaign(
                company_id=company.id,
                name=camp_data["name"],
                subject="Neural Retention Stream",
                body="Sample Body",
                segment="High Risk",
                status="sent",
                roi=camp_data["roi"],
                cost=camp_data["cost"],
                progress=camp_data["progress"],
                total_recipients=camp_data["recipients"],
                sent_count=camp_data["sent"],
                failed_count=camp_data["failed"]
            )
            db.add(campaign)
            db.flush() # Get campaign.id

            # Seed sample recipient logs (first 10)
            customers = db.query(Customer).filter(Customer.company_id == company.id).limit(10).all()
            for i, cust in enumerate(customers):
                status = "sent" if i < 9 else "failed"
                error = None if status == "sent" else "SMTP Error: 550 User unknown"
                db.add(CampaignEmail(
                    campaign_id=campaign.id,
                    customer_id=cust.id,
                    recipient_email=cust.email,
                    recipient_name=cust.name,
                    status=status,
                    error_message=error,
                    sent_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48))
                ))
        
        db.commit()
        print("Campaigns seeded successfully.")
    except Exception as e:
        print(f"Error seeding campaigns: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_campaigns()
