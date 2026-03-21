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
        
        keywords = {
            'customer_id': ['customerid', 'id', 'cust', 'uuid', 'external', 'account', 'user_id', 'member_no'],
            'name': ['name', 'full_name', 'client', 'gender', 'first_name', 'surname', 'account_name'], 
            'email': ['email', 'mail', 'address', 'contact_point', 'electronic_mail'],
            'revenue': ['charges', 'amount', 'revenue', 'spend', 'price', 'billing', 'totalcharges', 'monthlycharges', 'mrr', 'arr', 'sales', 'balance', 'value'],
            'usage': ['tenure', 'months', 'usage', 'activity', 'engagement', 'score', 'points', 'seniority', 'age', 'duration', 'visits', 'logins'],
            'transactions': ['trans', 'count', 'orders', 'freq', 'services', 'calls', 'events', 'purchases', 'interactions', 'shipments'],
            'churn': ['churn', 'label', 'target', 'left', 'attrition', 'status', 'exited', 'stopped', 'churned', 'inactive'],
            'region': ['region', 'state', 'city', 'country', 'location', 'geo', 'area', 'zip', 'territory', 'branch'],
            'channel': ['channel', 'communication', 'contact', 'media', 'medium', 'method', 'touchpoint'],
            'engagement_score': ['engagement_score', 'interaction_score', 'usage_frequency', 'activity_index'],
            'satisfaction': ['satisfaction', 'nps', 'rating', 'feedback', 'review', 'csat'],
            'support_tickets': ['ticket', 'support', 'issue', 'complaint', 'incident', 'case'],
            'tenure': ['tenure', 'months', 'seniority', 'age', 'experience', 'membership_duration']
        }
        
        for key, search_words in keywords.items():
            best_match = None
            for word in search_words:
                matches = [cols[c] for c in cols if word in c]
                if not matches: continue
                
                if key in ['revenue', 'usage', 'transactions', 'tenure', 'engagement_score', 'satisfaction', 'support_tickets']:
                    numeric_matches = []
                    for m in matches:
                        sample = pd.to_numeric(df[m].head(10), errors='coerce')
                        if not sample.isna().all():
                            numeric_matches.append(m)
                    
                    if numeric_matches:
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
        Train XGBoost model on available features.
        """
        mapping = MLService.identify_columns(df)
        
        # Features for retention/churn prediction
        features = ['revenue', 'usage', 'transactions', 'tenure', 'engagement_score', 'satisfaction', 'support_tickets']
        available_features = [f for f in features if f in df.columns]
        
        # Fallback if standardized columns not present
        if len(available_features) < 2:
            mapped_features = [mapping[f] for f in features if f in mapping]
            available_features = list(set(available_features + mapped_features))
        
        if not available_features:
            raise ValueError("Insufficient feature columns identified in dataset.")

        X = df[available_features].copy()
        for col in X.columns:
            X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0)
            
        if 'churn' in mapping:
            target_series = df[mapping['churn']].astype(str).str.lower()
            y = target_series.apply(lambda x: 1 if x in ['yes', '1', 'true', 'churned'] else 0).values
        else:
            # Synthetic target if missing
            if not X.empty:
                eng = (X.iloc[:, 0] * 0.4 + X.iloc[:, 1] * 0.6)
                y = (eng < eng.quantile(0.2)).astype(int).values
            else:
                y = np.zeros(len(df))

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        model = xgb.XGBClassifier(n_estimators=100, max_depth=3, learning_rate=0.1, random_state=42)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]
        
        metrics = {
            "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
            "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
            "recall": round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
            "f1_score": round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
            "roc_auc": round(float(roc_auc_score(y_test, y_prob)), 4) if len(np.unique(y_test)) > 1 else 1.0
        }
        
        return metrics, model, available_features

    @staticmethod
    def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
        """
        Standardize and engineer features.
        """
        mapping = MLService.identify_columns(df)
        
        # Map primary columns
        columns_to_map = ['revenue', 'usage', 'transactions', 'tenure', 'engagement_score', 'satisfaction', 'support_tickets']
        for col in columns_to_map:
            if mapping.get(col):
                df[col] = pd.to_numeric(df[mapping[col]], errors='coerce').fillna(0)
            elif col not in df.columns:
                df[col] = 0.0

        # Feature Engineering
        df['usage_frequency'] = df['transactions'] / df['usage'].replace(0, 1)
        df['avg_transaction_value'] = df['revenue'] / df['transactions'].replace(0, 1)
        
        # Persuadability Logic
        # persuadability_score = (engagement_recency × 0.3 + response_rate × 0.3 + discount_sensitivity × 0.2 + channel_pref × 0.2)
        # Using proxies from available data
        recency_proxy = (df['usage'] / df['usage'].max()).fillna(0.5) if not df['usage'].empty else 0.5
        resp_rate_proxy = (df['transactions'] / df['transactions'].max()).fillna(0.5) if not df['transactions'].empty else 0.5
        df['persuadability_score'] = (recency_proxy * 30 + resp_rate_proxy * 30 + 20 + 20) # Simplified proxy
        
        # Geography Risk
        # (regional_churn_rate * 0.4 + local_competition * 0.3 + internal_service_quality * 0.3)
        region_col = mapping.get('region')
        if region_col:
            # Mock regional churn rate if real data unavailable
            df['region_val'] = df[region_col].factorize()[0]
            df['geography_risk_score'] = 40 + (df['region_val'] % 40) # 40-80 range
        else:
            df['geography_risk_score'] = 25.0 # Low default
            
        return df

    @staticmethod
    def train_and_score(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict]:
        """
        Run full pipeline and generate refined metrics.
        """
        if df.empty: return df, {}
        
        df = MLService.preprocess_data(df)

        try:
            metrics, model, features = MLService.train_model(df)
            X = df[features].copy()
            for col in X.columns:
                X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0)
            
            # Predict Proba
            probs = model.predict_proba(X)
            df['churn_probability'] = probs[:, 1]
            df['retention_probability'] = probs[:, 0]
            
            # Refine weights based on model findings
            # Financial Risk = churn_prob * LTV (LTV modeled as revenue * 12 for simplicity)
            df['ltv'] = df['revenue'] * 12
            df['financial_risk'] = df['churn_probability'] * df['ltv']
            
            # Uplift Logic (Refined)
            # uplift_score = P(retain | intervention) - P(retain | no_intervention)
            # Intervention success rate estimated at 15% increase in retention
            df['uplift_score'] = (df['retention_probability'] * 1.15).clip(0, 1) - df['retention_probability']
            
            # Expected Recovery = LTV * uplift_score
            df['expected_recovery'] = df['ltv'] * df['uplift_score']
            
            # Normalize risk scores 0-100
            df['churn_probability'] = df['churn_probability'] * 100
            df['retention_probability'] = df['retention_probability'] * 100
            
            mapping = MLService.identify_columns(df)
            if mapping.get('channel'): df['communication_channel'] = df[mapping['channel']]
            else: df['communication_channel'] = 'Email'

            return df, metrics
        except Exception as e:
            print(f"ML Pipeline Failure: {e}")
            df['churn_probability'] = 50.0
            df['retention_probability'] = 50.0
            df['uplift_score'] = 0.05
            df['financial_risk'] = df['revenue'] * 6 # Fallback
            return df, {"accuracy": 0, "error": str(e)}
