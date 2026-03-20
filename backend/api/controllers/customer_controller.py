from sqlalchemy.orm import Session
from sqlalchemy import func
from models.domain import Customer, ChurnScore, UpliftScore, RevenueData
from fastapi import HTTPException
from typing import List, Optional

def get_dashboard_kpis(db: Session, company_id: int):
    """
    KPI Cards Logic:
    - Total Customers -> count(customers)
    - High Risk -> churn_risk > 0.7
    - Revenue at Risk -> sum(revenue * churn_risk)
    - Persuadable -> uplift_score > 0
    """
    total = db.query(func.count(Customer.id)).filter(Customer.company_id == company_id).scalar() or 0
    high_risk = db.query(func.count(Customer.id)).filter(
        Customer.company_id == company_id, 
        Customer.churn_risk > 0.7
    ).scalar() or 0
    
    # Revenue at Risk: sum(revenue * churn_risk)
    # Since we store risk_amount in RevenueData, we can sum it
    rev_at_risk = db.query(func.sum(RevenueData.risk_amount)).join(Customer).filter(
        Customer.company_id == company_id
    ).scalar() or 0.0
    
    persuadables = db.query(func.count(Customer.id)).filter(
        Customer.company_id == company_id,
        Customer.uplift_score > 0
    ).scalar() or 0
    
    return {
        "total_customers": total,
        "high_risk_customers": high_risk,
        "revenue_at_risk": float(rev_at_risk),
        "persuadables": persuadables,
        "avg_churn_prob": db.query(func.avg(Customer.churn_risk)).filter(Customer.company_id == company_id).scalar() or 0.0
    }

def get_customers(db: Session, company_id: int, skip: int = 0, limit: int = 20, risk_filter: Optional[str] = None):
    query = db.query(Customer).filter(Customer.company_id == company_id)
    
    if risk_filter == "high":
        query = query.filter(Customer.churn_risk > 0.7)
    elif risk_filter == "medium":
        query = query.filter(Customer.churn_risk.between(0.4, 0.7))
    elif risk_filter == "low":
        query = query.filter(Customer.churn_risk < 0.4)
        
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    
    return {"total": total, "items": items}

def get_uplift_insights(db: Session, company_id: int):
    """
    Display: churn_probability, uplift_score, ROI
    """
    # Simply return top customers with uplift > 0
    customers = db.query(Customer).filter(
        Customer.company_id == company_id,
        Customer.uplift_score > 0
    ).order_by(Customer.uplift_score.desc()).limit(100).all()
    
    results = []
    for c in customers:
        results.append({
            "name": c.name,
            "churn_probability": c.churn_risk,
            "uplift_score": c.uplift_score,
            "expected_roi": float(c.revenue or 0) * c.uplift_score * 0.2, # Assumption 20% conversion improvement
            "neural_analysis": f"Strong indicators for {c.name}. Targeting will yield positive uplift."
        })
    return results

def get_revenue_risk_details(db: Session, company_id: int):
    # Customer-wise revenue risk
    results = db.query(Customer, RevenueData).join(RevenueData).filter(
        Customer.company_id == company_id
    ).order_by(RevenueData.risk_amount.desc()).limit(50).all()
    
    return [{
        "customer_name": c.name,
        "revenue": float(c.revenue or 0),
        "risk_amount": float(r.risk_amount or 0),
        "churn_probability": c.churn_risk
    } for c, r in results]
