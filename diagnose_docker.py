import sys
import os
import json
from sqlalchemy.orm import Session
from sqlalchemy import text

# Add /app to sys.path if needed
sys.path.append('/app')

from database.session import SessionLocal
from api.controllers import analytics_controller

def diagnose():
    db = SessionLocal()
    try:
        # Check if v_retention_metrics has data
        res = db.execute(text("SELECT * FROM v_retention_metrics")).all()
        print(f"DEBUG: v_retention_metrics has {len(res)} rows total.")
        for row in res:
            print(f"DEBUG: Found company_id={row.company_id}, customers={row.total_customers}, revenue={row.total_revenue}")

        print("--- Calling get_executive_metrics(db, 1) ---")
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
