import sys
import os

# Add backend to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from database.session import SessionLocal
from api.controllers import analytics_controller
import json

def diagnose():
    db = SessionLocal()
    try:
        print("--- Diagnosing Executive Metrics for Company ID: 1 ---")
        metrics = analytics_controller.get_executive_metrics(db, 1)
        print(json.dumps(metrics, indent=2))
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    diagnose()
