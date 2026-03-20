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
        Prioritizes numeric columns for revenue and usage.
        """
        mapping = {}
        cols = {c.lower(): c for c in df.columns}
        
        # Target mapping - Prioritized keywords
        keywords = {
            'customer_id': ['customerid', 'id', 'cust', 'uuid', 'external'],
            'name': ['name', 'full_name', 'client', 'gender'], 
            'email': ['email', 'mail', 'address'],
            'revenue': ['charges', 'amount', 'revenue', 'spend', 'price', 'billing'],
            'usage': ['tenure', 'months', 'usage', 'activity', 'engagement', 'score', 'points'],
            'transactions': ['trans', 'count', 'orders', 'freq', 'services', 'calls'],
            'churn': ['churn', 'label', 'target', 'left', 'attrition', 'status']
        }
        
        for key, search_words in keywords.items():
            best_match = None
            for word in search_words:
                matches = [cols[c] for c in cols if word in c]
                if not matches: continue
                
                # If searching for numeric fields, prefer columns that are actually numeric
                if key in ['revenue', 'usage', 'transactions']:
                    numeric_matches = []
                    for m in matches:
                        # Sample check for numeric
                        sample = pd.to_numeric(df[m].head(10), errors='coerce')
                        if not sample.isna().all():
                            numeric_matches.append(m)
                    
                    if numeric_matches:
                        # For revenue, prefer 'Total' over 'Monthly' if both match
                        if key == 'revenue':
                            totals = [m for m in numeric_matches if 'total' in m.lower()]
                            best_match = totals[0] if totals else numeric_matches[0]
                        else:
                            best_match = numeric_matches[0]
                        break
                else:
                    best_match = matches[0]
                    break
            
            if best_match:
                mapping[key] = best_match
        
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
        
        # Prioritize preprocessed standardized columns if available
        features = ['revenue', 'usage', 'transactions']
        available_features = [f for f in features if f in df.columns]
        
        if not available_features:
            available_features = [mapping[f] for f in features if f in mapping]
        
        if not available_features:
            raise ValueError("Insufficient feature columns identified in dataset.")

        # Prepare X and y
        X = df[available_features].copy()
        for col in X.columns:
            X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0)
            
        # Target variable
        if 'churn' in mapping:
            target_series = df[mapping['churn']].astype(str).str.lower()
            y = target_series.apply(lambda x: 1 if x in ['yes', '1', 'true', 'churned'] else 0).values
        else:
            # Synthetic target for demonstration if 'churn' column is missing
            # Logic: Churn = 1 if engagement < 20th percentile
            if not X.empty:
                eng = (X.iloc[:, 0] * 0.4 + X.iloc[:, 1] * 0.6)
                y = (eng < eng.quantile(0.2)).astype(int).values
            else:
                y = np.zeros(len(df))

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
        Perform feature engineering safely.
        """
        # Ensure we have numeric base columns even if they aren't named 'revenue', 'usage', etc.
        mapping = MLService.identify_columns(df)
        
        rev_col = mapping.get('revenue')
        use_col = mapping.get('usage')
        tra_col = mapping.get('transactions')

        # Heuristic values if columns are missing
        if rev_col: df['revenue_num'] = pd.to_numeric(df[rev_col], errors='coerce').fillna(0)
        else: df['revenue_num'] = 0.0
        
        if use_col: df['usage_num'] = pd.to_numeric(df[use_col], errors='coerce').fillna(0)
        else: df['usage_num'] = 1.0 # Avoid div by zero
        
        if tra_col: df['trans_num'] = pd.to_numeric(df[tra_col], errors='coerce').fillna(0)
        else: df['trans_num'] = 0.0

        # Feature Engineering using internal safe names
        df['usage_frequency'] = df['trans_num'] / df['usage_num'].replace(0, 1)
        df['avg_transaction_value'] = df['revenue_num'] / df['trans_num'].replace(0, 1)
        df['engagement_score'] = (df['usage_num'] * 0.6) + (df['trans_num'] * 0.4)
        
        # Map back to expected output names for controllers
        df['revenue'] = df['revenue_num']
        df['usage'] = df['usage_num']
        df['transactions'] = df['trans_num']
        
        return df

    @staticmethod
    def train_and_score(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict]:
        """
        Inference passing:
        Uses the training pipeline to generate scores for the entire dataset.
        """
        if df.empty: return df, {}
        
        # Always preprocess to get standardized columns (revenue, usage, etc.)
        df = MLService.preprocess_data(df)

        try:
            metrics, model, _ = MLService.train_model(df)
            mapping = MLService.identify_columns(df)
            
            # Map input to features for prediction
            features = ['revenue', 'usage', 'transactions']
            # Note: preprocess_data already created 'revenue', 'usage', 'transactions' columns
            X = df[features].copy()
            for col in X.columns:
                X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0)
                
            # Predictions
            df['churn_probability'] = model.predict_proba(X)[:, 1]
            
            # Uplift Simulation
            df['uplift_score'] = df['churn_probability'] * 0.4
            df['revenue_at_risk'] = df['revenue'] * df['churn_probability']
            
            return df, metrics
        except Exception as e:
            print(f"ML Training Failed, falling back to heuristic: {e}")
            df['churn_probability'] = 0.5
            df['uplift_score'] = 0.1
            df['revenue_at_risk'] = df['revenue'] * 0.5 # Sensible fallback
            return df, {"accuracy": 0, "error": str(e)}
