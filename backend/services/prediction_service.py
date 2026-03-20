import xgboost as xgb
import pandas as pd
import numpy as np
import os
from sqlalchemy.orm import Session
from models.domain import Customer, ChurnScore, UpliftScore, RevenueData

class PredictionService:
    def __init__(self, model_path: str = "churn_model.json"):
        self.model = xgb.Booster()
        if os.path.exists(model_path):
            self.model.load_model(model_path)
    
    def predict_churn(self, data: pd.DataFrame):
        dmatrix = xgb.DMatrix(data)
        return self.model.predict(dmatrix)

    def process_customer_batch(self, db: Session, customers: list):
        # Logic to update churn/uplift scores in DB
        for c in customers:
             # Mocking scores for demo
             prob = np.random.uniform(0.1, 0.9)
             uplift = np.random.uniform(-0.1, 0.2)
             rev = np.random.uniform(50, 500)
             
             db.add(ChurnScore(customer_id=c.id, churn_probability=prob))
             db.add(UpliftScore(customer_id=c.id, uplift_score=uplift))
             db.add(RevenueData(customer_id=c.id, revenue=rev, revenue_at_risk=rev * prob))
        db.commit()
