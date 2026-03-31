from sqlalchemy.orm import Session
from sqlalchemy import func, Integer
from sqlalchemy import text
from models.domain import Customer, ChurnScore, UpliftScore, RevenueData, Dataset, RetentionAction, RetentionFeedback
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
            "avg_churn_prob": 0.0,
            "dataset_count": db.query(func.count(Dataset.id)).filter(Dataset.company_id == company_id).scalar() or 0
        }
    
    # Map view results to response
    return {
        "total_customers": int(result.total_customers),
        "high_risk_customers": db.query(func.count(Customer.id)).filter(Customer.company_id == company_id, Customer.churn_risk > 70).scalar() or 0,
        "revenue_at_risk": float(result.revenue_at_risk or 0),
        "geography_risk": float(result.avg_geography_risk or 0),
        "persuadables": db.query(func.count(Customer.id)).filter(Customer.company_id == company_id, Customer.uplift_score > 0).scalar() or 0,
        "avg_churn_prob": float(result.avg_churn_risk or 0),
        "dataset_count": db.query(func.count(Dataset.id)).filter(Dataset.company_id == company_id).scalar() or 0
    }

def get_high_risk_drilldown(db: Session, company_id: int):
    # Match the KPI count logic: churn_risk > 70
    customers = db.query(Customer).filter(Customer.company_id == company_id, Customer.churn_risk > 70).order_by(Customer.churn_risk.desc()).limit(1000).all()
    return [{
        "id": c.id,
        "external_customer_id": c.external_customer_id,
        "name": c.name,
        "email": c.email,
        "gender": c.gender or "Unknown",
        "churn_risk": c.churn_risk,
        "revenue": float(c.revenue or 0),
        "subscription_type": c.subscription_type or "Standard",
        "last_active_days": c.last_active_days or 0,
        "communication_channel": c.communication_channel or "Email",
        "action_type": c.retention_actions[0].action_type if c.retention_actions else "PENDING",
        "campaign_type": c.retention_actions[0].campaign_type if c.retention_actions else "NONE",
        "priority_score": c.retention_actions[0].priority_score if c.retention_actions else 0.0
    } for c in customers]

def get_customers(db: Session, company_id: int, skip: int = 0, limit: int = 20, risk_filter: Optional[str] = None):
    query = db.query(Customer).filter(Customer.company_id == company_id)
    if risk_filter == "high": query = query.filter(Customer.churn_risk > 70)
    elif risk_filter == "medium": query = query.filter(Customer.churn_risk.between(40, 70))
    elif risk_filter == "low": query = query.filter(Customer.churn_risk < 40)
    
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    
    return {
        "total": total, 
        "items": [{
            "id": c.id,
            "external_customer_id": c.external_customer_id,
            "name": c.name,
            "email": c.email,
            "gender": c.gender or "Unknown",
            "revenue": float(c.revenue or 0),
            "subscription_type": c.subscription_type or "Standard",
            "last_active_days": c.last_active_days or 0,
            "engagement_score": c.engagement_score or 0.5,
            "churn_risk": c.churn_risk,
            "uplift_score": c.uplift_score,
            "communication_channel": c.communication_channel,
            "action_type": c.retention_actions[0].action_type if c.retention_actions else "PENDING",
            "campaign_type": c.retention_actions[0].campaign_type if c.retention_actions else "NONE",
            "priority_score": c.retention_actions[0].priority_score if c.retention_actions else 0.0
        } for c in items]
    }

def get_uplift_insights(db: Session, company_id: int):
    results = db.query(Customer, UpliftScore).join(UpliftScore).filter(Customer.company_id == company_id, Customer.uplift_score > 0).order_by(Customer.uplift_score.desc()).limit(100).all()
    return [{
        "id": c.id,
        "external_customer_id": c.external_customer_id,
        "name": c.name, 
        "gender": c.gender or "Unknown",
        "subscription_type": c.subscription_type or "Standard",
        "churn_prob": float(c.churn_risk) / 100.0,
        "churn_risk": c.churn_risk, 
        "uplift_score": c.uplift_score, 
        "revenue": float(c.revenue or 0),
        "expected_roi": float(c.revenue or 0) * c.uplift_score * 0.2,
        "ai_strategy": u.strategy
    } for c, u in results]

def get_revenue_risk_details(db: Session, company_id: int):
    # Join with RevenueData and optionally with UpliftScore for AI strategy
    results = db.query(Customer, RevenueData, UpliftScore).outerjoin(RevenueData).outerjoin(UpliftScore).filter(Customer.company_id == company_id).order_by(func.coalesce(RevenueData.risk_amount, 0).desc()).limit(50).all()
    return [{
        "id": c.id,
        "external_customer_id": c.external_customer_id,
        "name": c.name, 
        "gender": c.gender or "Unknown",
        "revenue": float(c.revenue or 0), 
        "risk_amount": float(r.risk_amount or 0) if r else 0.0, 
        "churn_risk": c.churn_risk,
        "ai_insight": u.strategy if u else "N/A"
    } for c, r, u in results]

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
def get_top_priority_customers(db: Session, company_id: int, limit: int = 20):
    customers = db.query(Customer).join(RetentionAction).filter(
        Customer.company_id == company_id,
        RetentionAction.priority_score > 0
    ).order_by(RetentionAction.priority_score.desc()).limit(limit).all()
    
    return [{
        "id": c.id,
        "name": c.name,
        "segment": c.segment or "MODERATE",
        "priority_score": c.retention_actions[0].priority_score if c.retention_actions else 0,
        "action_type": c.retention_actions[0].action_type if c.retention_actions else "PENDING",
        "campaign_type": c.retention_actions[0].campaign_type if c.retention_actions else "NONE",
        "channel": c.retention_actions[0].channel if c.retention_actions else "AUTO",
        "churn_risk": c.churn_risk
    } for c in customers]

def get_campaign_analytics(db: Session, company_id: int):
    # Aggregate feedback loop data
    results = db.query(
        RetentionFeedback.campaign_type,
        func.count(RetentionFeedback.id).label("total"),
        func.sum(func.cast(RetentionFeedback.success, Integer)).label("successes")
    ).join(Customer).filter(Customer.company_id == company_id).group_by(RetentionFeedback.campaign_type).all()
    
    return [{
        "campaign": r.campaign_type,
        "success_rate": (float(r.successes) / r.total) if r.total > 0 else 0,
        "total_actions": r.total
    } for r in results]
