import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from typing import Dict, List, Tuple

class MLService:
    @staticmethod
    def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
        """
        Perform feature engineering as per requirements:
        - usage_frequency
        - avg_transaction_value
        - engagement_score
        """
        # Ensure numeric types
        df['revenue'] = pd.to_numeric(df['revenue'], errors='coerce').fillna(0)
        df['usage'] = pd.to_numeric(df['usage'], errors='coerce').fillna(0)
        df['transactions'] = pd.to_numeric(df['transactions'], errors='coerce').fillna(0)

        # Feature Engineering
        # usage_frequency: transactions / usage (if usage is time-based) or just usage
        df['usage_frequency'] = df['transactions'] / df['usage'].replace(0, 1)
        
        # avg_transaction_value: revenue / transactions
        df['avg_transaction_value'] = df['revenue'] / df['transactions'].replace(0, 1)
        
        # engagement_score: normalized (usage + transactions)
        df['engagement_score'] = (df['usage'] * 0.6) + (df['transactions'] * 0.4)
        
        return df

    @staticmethod
    def train_and_score(df: pd.DataFrame) -> pd.DataFrame:
        """
        Step 4: ML Processing
        - Churn Model: churn_probability
        - Uplift Model: predicted_with_offer - predicted_without_offer
        """
        df = MLService.preprocess_data(df)
        
        # Mock ML logic for demonstration if target 'Churn' is not present
        # In a real scenario, we'd load a pre-trained model or train on a segment
        if 'Churn' not in df.columns and 'churn' not in df.columns:
            # Create a synthetic target for training demonstration if needed
            # For inference on new data, we'd use a loaded model.
            # Here we simulate the output probabilities based on engagement.
            df['churn_probability'] = 1 - (df['engagement_score'] / df['engagement_score'].max().replace(0, 1))
            df['churn_probability'] = df['churn_probability'].clip(0, 1)
        else:
            # Simple XGBoost simulation/placeholder
            # X = df[['usage', 'transactions', 'revenue', 'engagement_score']]
            # y = df['Churn']
            # ... model.predict_proba ...
            df['churn_probability'] = np.random.uniform(0.1, 0.9, size=len(df))

        # Uplift Model Approximation:
        # uplift_score = predicted_without_offer - predicted_with_offer (since uplift is decrease in churn)
        # Higher uplift means the offer helps MORE to reduce churn.
        # Logic: uplift = prob(churn|no_offer) - prob(churn|offer)
        
        # Simulating uplift: some people respond better based on engagement
        df['uplift_score'] = df['churn_probability'] * np.random.uniform(0.1, 0.4, size=len(df))
        
        # Revenue at Risk
        df['revenue_at_risk'] = df['revenue'] * df['churn_probability']
        
        return df
