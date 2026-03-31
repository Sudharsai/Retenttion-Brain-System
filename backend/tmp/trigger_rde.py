import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from database.session import SessionLocal
from workers.tasks import run_retention_engine_task
from models.domain import Company, Customer, RetentionAction

def trigger_rde():
    db = SessionLocal()
    company = db.query(Company).filter(Company.name == "TechCorp Solutions").first()
    if not company:
        print("Company TechCorp Solutions not found.")
        return

    print(f"Triggering RDE for company {company.name} (ID: {company.id})...")
    # Call the task directly for testing
    from workers.tasks import send_automated_retention_emails
    result = send_automated_retention_emails(company.id)
    print(f"RDE Execution Result: {result}")
    
    # Check if actions were created
    actions = db.query(RetentionAction).all()
    print(f"Total Retention Actions in DB: {len(actions)}")
    for action in actions[:5]:
        print(f"Action: {action.action_type}, Campaign: {action.campaign_type}, Customer: {action.customer_id}")
    
    db.close()

if __name__ == "__main__":
    trigger_rde()
