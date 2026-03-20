import sys
import os
from sqlalchemy.orm import Session
from sqlalchemy import func

# Ensure the module can be loaded correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.domain import Customer, ChurnScore, UpliftScore, RevenueData

class CustomerRepository:
    """Enforces multi-tenant data isolation via company_id."""
    
    def __init__(self, db: Session, company_id: int):
        self.db = db
        self.company_id = company_id

    def get_dashboard_kpis(self):
        # 1. Total Customers
        total = self.db.query(func.count(Customer.id)).filter(Customer.company_id == self.company_id).scalar() or 0
        
        # 2. High Risk
        high_risk = self.db.query(func.count(Customer.id)).join(ChurnScore).filter(
            Customer.company_id == self.company_id,
            ChurnScore.churn_probability > 0.7
        ).scalar() or 0
        
        # 3. Revenue at Risk
        rev_risk = self.db.query(func.sum(RevenueData.revenue_at_risk)).join(Customer).filter(
            Customer.company_id == self.company_id
        ).scalar() or 0.0

        # 4. Persuadable
        persuadables = self.db.query(func.count(Customer.id)).join(UpliftScore).filter(
            Customer.company_id == self.company_id,
            UpliftScore.uplift_score > 0
        ).scalar() or 0

        return {
            "total_customers": total,
            "high_risk_customers": high_risk,
            "revenue_at_risk": rev_risk,
            "persuadables": persuadables
        }
        
    def get_paginated_customers(self, skip: int = 0, limit: int = 50):
        return self.db.query(Customer).filter(Customer.company_id == self.company_id).offset(skip).limit(limit).all()

    def get_high_risk_customers(self):
        return self.db.query(Customer, ChurnScore.churn_probability, RevenueData.revenue_at_risk)\
            .join(ChurnScore).join(RevenueData)\
            .filter(Customer.company_id == self.company_id, ChurnScore.churn_probability > 0.7).all()

    def get_revenue_risk_details(self):
        return self.db.query(Customer, ChurnScore.churn_probability, RevenueData.revenue, RevenueData.revenue_at_risk)\
            .join(ChurnScore).join(RevenueData)\
            .filter(Customer.company_id == self.company_id, RevenueData.revenue_at_risk > 0).all()

    def get_uplift_insights(self):
        return self.db.query(Customer, ChurnScore.churn_probability, UpliftScore.uplift_score, RevenueData.revenue)\
            .join(ChurnScore).join(UpliftScore).join(RevenueData)\
            .filter(Customer.company_id == self.company_id).all()
