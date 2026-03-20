import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import json

def train_churn_model(csv_path: str, model_save_path: str = "churn_model.json"):
    df = pd.read_csv(csv_path)
    
    # Simple Preprocessing
    df = df.dropna()
    le = LabelEncoder()
    for col in df.columns:
        if df[col].dtype == object and col not in ["customerID", "Email"]:
            df[col] = le.fit_transform(df[col].astype(str))
            
    X = df.drop(columns=["Churn", "customerID", "Email"], errors="ignore")
    y = df["Churn"].map({"Yes": 1, "No": 0})
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = xgb.XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1)
    model.fit(X_train, y_train)
    
    model.save_model(model_save_path)
    return model
