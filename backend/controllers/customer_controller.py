import sys
import os
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

# Ensure the module can be loaded correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import get_db
from models.domain import User
from core.deps import get_current_active_company_user
from repositories.customer_repo import CustomerRepository

router = APIRouter(prefix="/api/v1/customers", tags=["customers"])

@router.get("/dashboard-kpis")
def get_dashboard_kpis(
    user: User = Depends(get_current_active_company_user), 
    db: Session = Depends(get_db)
):
    company_id = user.company_id if user.role == "company_user" else 1 # Admins default to tenant 1 in demo
    repo = CustomerRepository(db, company_id)
    data = repo.get_dashboard_kpis()
    return {"success": True, "data": data, "message": "KPIs fetched successfully"}

@router.get("/")
def get_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    user: User = Depends(get_current_active_company_user), 
    db: Session = Depends(get_db)
):
    company_id = user.company_id if user.role == "company_user" else 1
    repo = CustomerRepository(db, company_id)
    data = repo.get_paginated_customers(skip, limit)
    res = [{"id": c.id, "name": c.name, "email": c.email} for c in data]
    return {"success": True, "data": {"items": res, "total": len(res)}, "message": "Customers fetched"}

@router.get("/high-risk")
def get_high_risk_customers(
    user: User = Depends(get_current_active_company_user), 
    db: Session = Depends(get_db)
):
    company_id = user.company_id if user.role == "company_user" else 1
    repo = CustomerRepository(db, company_id)
    data = repo.get_high_risk_customers()
    res = []
    for customer, churn_prob, rev_risk in data:
        res.append({
            "id": customer.id,
            "name": customer.name,
            "churn_probability": round(churn_prob, 2),
            "revenue_at_risk": round(rev_risk, 2)
        })
    return {"success": True, "data": res, "message": "High risk customers fetched"}

@router.get("/revenue-at-risk")
def get_revenue_risk_details(
    user: User = Depends(get_current_active_company_user), 
    db: Session = Depends(get_db)
):
    company_id = user.company_id if user.role == "company_user" else 1
    repo = CustomerRepository(db, company_id)
    data = repo.get_revenue_risk_details()
    res = []
    for customer, churn_prob, rev, rev_risk in data:
        res.append({
            "id": customer.id,
            "name": customer.name,
            "email": customer.email,
            "churn_probability": round(churn_prob, 2),
            "revenue": round(rev, 2),
            "revenue_at_risk": round(rev_risk, 2)
        })
    return {"success": True, "data": res}

@router.get("/uplift-insights")
def get_uplift_insights(
    user: User = Depends(get_current_active_company_user), 
    db: Session = Depends(get_db)
):
    company_id = user.company_id if user.role == "company_user" else 1
    repo = CustomerRepository(db, company_id)
    data = repo.get_uplift_insights()
    res = []
    for customer, churn_prob, uplift, rev in data:
        risk_level = "HIGH" if churn_prob > 0.7 else ("MEDIUM" if churn_prob > 0.4 else "LOW")
        
        if uplift > 0.15:
            analysis = "Critical Persuadable: High response elasticity detected. Targeted intervention will likely reverse churn intent."
        elif uplift > 0.05:
            analysis = "Stable Persuadable: Moderate response expected. Standard retention flows recommended."
        elif uplift < -0.05:
            analysis = "Sleeping Dog: Intervention might trigger churn. Do not disturb this segment."
        else:
            analysis = "Sure Thing / Lost Cause: Behavior is inelastic to treatment. Optimize for cost savings."

        res.append({
            "id": customer.id, 
            "name": customer.name, 
            "email": customer.email,
            "churn_probability": round(churn_prob, 2), 
            "uplift_score": round(uplift, 3), 
            "expected_roi": round(rev * uplift, 2), 
            "risk_level": risk_level, 
            "neural_analysis": analysis
        })
    return {"success": True, "data": res}
