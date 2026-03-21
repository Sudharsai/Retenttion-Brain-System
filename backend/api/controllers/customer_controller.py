from sqlalchemy.orm import Session
from sqlalchemy import func
from models.domain import Customer, ChurnScore, UpliftScore, RevenueData, Dataset
from models.campaign import Campaign
from fastapi import HTTPException
from typing import List, Optional

def get_dashboard_kpis(db: Session, company_id: int):
    # Use the high-speed PostgreSQL view for the fastest possible calculation
    from sqlalchemy import text
    result = db.execute(text("SELECT * FROM v_retention_metrics WHERE company_id = :cid"), {"cid": company_id}).first()
    
    if not result:
        return {
            "total_customers": 0,
            "high_risk_customers": 0,
            "revenue_at_risk": 0.0,
            "persuadables": 0,
            "avg_churn_prob": 0.0
        }
    
    # Map view results to response
    return {
        "total_customers": int(result.total_customers),
        "high_risk_customers": db.query(func.count(Customer.id)).filter(Customer.company_id == company_id, Customer.churn_risk > 70).scalar() or 0,
        "revenue_at_risk": float(result.revenue_at_risk or 0),
        "geography_risk": float(result.avg_geography_risk or 0),
        "persuadables": db.query(func.count(Customer.id)).filter(Customer.company_id == company_id, Customer.uplift_score > 0).scalar() or 0,
        "avg_churn_prob": float(result.avg_churn_risk or 0)
    }

def get_high_risk_drilldown(db: Session, company_id: int):
    # Match the KPI count logic: churn_risk > 70
    customers = db.query(Customer).filter(Customer.company_id == company_id, Customer.churn_risk > 70).order_by(Customer.churn_risk.desc()).limit(1000).all()
    return [{
        "id": c.id,
        "name": c.name,
        "email": c.email,
        "churn_probability": c.churn_risk / 100.0 if c.churn_risk > 1 else c.churn_risk,
        "revenue": float(c.revenue or 0),
        "communication_channel": c.communication_channel or "Email"
    } for c in customers]

def get_customers(db: Session, company_id: int, skip: int = 0, limit: int = 20, risk_filter: Optional[str] = None):
    query = db.query(Customer).filter(Customer.company_id == company_id)
    if risk_filter == "high": query = query.filter(Customer.churn_risk > 70)
    elif risk_filter == "medium": query = query.filter(Customer.churn_risk.between(40, 70))
    elif risk_filter == "low": query = query.filter(Customer.churn_risk < 40)
    return {"total": query.count(), "items": query.offset(skip).limit(limit).all()}

def get_uplift_insights(db: Session, company_id: int):
    customers = db.query(Customer).filter(Customer.company_id == company_id, Customer.uplift_score > 0).order_by(Customer.uplift_score.desc()).limit(100).all()
    return [{"name": c.name, "churn_probability": c.churn_risk, "uplift_score": c.uplift_score, "expected_roi": float(c.revenue or 0) * c.uplift_score * 0.2} for c in customers]

def get_revenue_risk_details(db: Session, company_id: int):
    results = db.query(Customer, RevenueData).join(RevenueData).filter(Customer.company_id == company_id).order_by(RevenueData.risk_amount.desc()).limit(50).all()
    return [{"customer_name": c.name, "revenue": float(c.revenue or 0), "risk_amount": float(r.risk_amount or 0), "churn_probability": c.churn_risk} for c, r in results]

def get_datasets(db: Session, company_id: int):
    return db.query(Dataset).filter(Dataset.company_id == company_id).order_by(Dataset.created_at.desc()).all()

def delete_dataset(db: Session, company_id: int, dataset_id: int):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.company_id == company_id).first()
    if not dataset: raise HTTPException(status_code=404, detail="Dataset not found")
    db.query(Customer).filter(Customer.dataset_id == dataset_id).delete(synchronize_session=False)
    db.query(Dataset).filter(Dataset.id == dataset_id).delete(synchronize_session=False)
    db.commit()
    return {"success": True}

def bulk_delete_datasets(db: Session, company_id: int, dataset_ids: List[int]):
    datasets = db.query(Dataset).filter(Dataset.id.in_(dataset_ids), Dataset.company_id == company_id).all()
    target_ids = [d.id for d in datasets]
    if not target_ids: return {"success": False, "message": "No valid datasets found"}
    db.query(Customer).filter(Customer.dataset_id.in_(target_ids)).delete(synchronize_session=False)
    db.query(Dataset).filter(Dataset.id.in_(target_ids)).delete(synchronize_session=False)
    db.commit()
    return {"success": True, "deleted_count": len(target_ids)}
def get_campaign_timeline(db: Session, company_id: int):
    """
    Returns a list of strategic interventions and campaigns for the timeline.
    """
    from datetime import datetime, timedelta
    
    # Fetch real campaigns from DB
    real_campaigns = db.query(Campaign).filter(Campaign.company_id == company_id).order_by(Campaign.created_at.desc()).all()
    
    timeline = []
    
    # Map real campaigns to timeline format
    for c in real_campaigns:
        timeline.append({
            "id": c.id,
            "name": c.name,
            "type": "Neural Outreach",
            "status": "Active" if c.progress < 100 else "Completed",
            "impact": f"{c.progress}% Sync",
            "date": c.created_at.strftime("%b %d")
        })
        
    # Add some mock historical context if empty
    if not timeline:
        timeline = [
            {"id": 999, "name": "Initial Cluster Mapping", "type": "System Init", "status": "Completed", "impact": "100% Coverage", "date": "Mar 15"},
            {"id": 998, "name": "Legacy Data Sync", "type": "Data Ingestion", "status": "Completed", "impact": "Baseline Set", "date": "Mar 10"}
        ]
        
    return timeline
