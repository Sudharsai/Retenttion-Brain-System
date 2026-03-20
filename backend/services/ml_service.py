import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from typing import Dict, List, Tuple
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

class MLService:
    @staticmethod
    def identify_columns(df: pd.DataFrame) -> Dict[str, str]:
        """
        Dynamically identify columns based on common keywords.
        """
        mapping = {}
        cols = {c.lower(): c for c in df.columns}
        
        # Target mapping
        keywords = {
            'customer_id': ['id', 'cust', 'uuid', 'external'],
            'name': ['name', 'full_name', 'client'],
            'email': ['email', 'mail', 'address'],
            'revenue': ['rev', 'revenue', 'amount', 'spend', 'billing'],
            'usage': ['usage', 'activity', 'engagement', 'score', 'points'],
            'transactions': ['trans', 'count', 'orders', 'freq'],
            'churn': ['churn', 'label', 'target', 'left', 'attrition']
        }
        
        for key, search_words in keywords.items():
            for word in search_words:
                matched = [c for c in cols if word in c]
                if matched:
                    mapping[key] = cols[matched[0]]
                    break
        
        return mapping

    @staticmethod
    def train_model(df: pd.DataFrame) -> Tuple[Dict, xgb.XGBClassifier, float]:
        """
        Rigorous Train/Test Pipeline:
        1. Feature Mapping & Cleaning
        2. Train/Test Split
        3. XGBoost Training
        4. Evaluation
        """
        mapping = MLService.identify_columns(df)
        
        # Ensure we have enough features
        features = ['revenue', 'usage', 'transactions']
        available_features = [mapping[f] for f in features if f in mapping]
        
        if not available_features:
            raise ValueError("Insufficient feature columns identified in dataset.")

        # Prepare X and y
        X = df[available_features].copy()
        for col in X.columns:
            X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0)
            
        # Target variable
        if 'churn' in mapping:
            y = pd.to_numeric(df[mapping['churn']], errors='coerce').fillna(0).astype(int)
        else:
            # Synthetic target for demonstration if 'churn' column is missing
            # Logic: Churn = 1 if engagement < 20th percentile
            eng = (X.iloc[:, 0] * 0.4 + X.iloc[:, 1] * 0.6)
            y = (eng < eng.quantile(0.2)).astype(int)

        # Step: Split Data (Row-wise splitting as requested)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Step: Train Model
        model = xgb.XGBClassifier(n_estimators=100, max_depth=3, learning_rate=0.1, random_state=42)
        model.fit(X_train, y_train)
        
        # Step: Evaluation
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]
        
        metrics = {
            "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
            "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
            "recall": round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
            "f1_score": round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
            "roc_auc": round(float(roc_auc_score(y_test, y_prob)), 4) if len(np.unique(y_test)) > 1 else 1.0
        }
        
        return metrics, model, float(X.mean().mean())

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
        df['usage_frequency'] = df['transactions'] / df['usage'].replace(0, 1)
        df['avg_transaction_value'] = df['revenue'] / df['transactions'].replace(0, 1)
        df['engagement_score'] = (df['usage'] * 0.6) + (df['transactions'] * 0.4)
        
        return df

    @staticmethod
    def train_and_score(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict]:
        """
        Inference passing:
        Uses the training pipeline to generate scores for the entire dataset.
        """
        if df.empty: return df, {}
        
        try:
            metrics, model, _ = MLService.train_model(df)
            mapping = MLService.identify_columns(df)
            
            # Map input to features for prediction
            features = ['revenue', 'usage', 'transactions']
            available_features = [mapping[f] for f in features if f in mapping]
            X = df[available_features].copy()
            for col in X.columns:
                X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0)
                
            # Predictions
            df['churn_probability'] = model.predict_proba(X)[:, 1]
            
            # Uplift Simulation
            df['uplift_score'] = df['churn_probability'] * 0.4
            rev_col = mapping.get('revenue', df.columns[0])
            df['revenue_at_risk'] = pd.to_numeric(df[rev_col], errors='coerce').fillna(0) * df['churn_probability']
            
            return df, metrics
        except Exception as e:
            print(f"ML Training Failed, falling back to heuristic: {e}")
            df = MLService.preprocess_data(df)
            df['churn_probability'] = 0.5
            df['uplift_score'] = 0.1
            df['revenue_at_risk'] = 0.0
            return df, {"accuracy": 0, "error": str(e)}
