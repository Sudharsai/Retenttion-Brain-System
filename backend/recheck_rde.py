import os
import sys

# Add current dir to path
sys.path.append(os.getcwd())

from database.session import SessionLocal
from models.domain import Customer, RetentionAction
from workers.tasks import execute_retention_actions

def main():
    db = SessionLocal()
    try:
        # Reset one customer for company 1
        customer = db.query(Customer).filter(Customer.company_id == 1).first()
        if not customer:
            print("No customers found for company 1")
            return
            
        action = db.query(RetentionAction).filter(RetentionAction.customer_id == customer.id).first()
        if not action:
            # Create if missing
            action = RetentionAction(customer_id=customer.id)
            db.add(action)
        
        action.status = "PENDING"
        # Ensure it's not NONE so it sends something
        if action.action_type == "NONE":
            action.action_type = "EMAIL"
            
        db.commit()
        print(f"Reset action for customer {customer.id} to PENDING (Type: {action.action_type})")
        
        # Trigger task synchronously to see immediate result in logs
        from workers.tasks import execute_retention_actions
        # execute_retention_actions(1) # Run synchronously for verification
        
        # Actually, let's run it via Celery to verify the full stack
        result = execute_retention_actions.delay(1)
        print(f"Triggered execute_retention_actions.delay(1) - Task ID: {result.id}")
        
    finally:
        db.close()

if __name__ == "__main__":
    main()
