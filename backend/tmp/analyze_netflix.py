import pandas as pd
import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from services.ml_service import MLService
from services.retention_decision_engine import generate_retention_action

def analyze_netflix_data():
    csv_path = r"c:\Users\Sudarsan\Downloads\netflix_customer_churn.csv"
    if not os.path.exists(csv_path):
        print(f"File not found: {csv_path}")
        return

    print(f"Loading dataset: {csv_path}")
    df = pd.read_csv(csv_path)
    
    print("Running ML Pipeline (Train & Score)...")
    results_df, metrics = MLService.train_and_score(df)
    
    print("\nML Metrics:")
    for m, v in metrics.items():
        print(f"  {m}: {v}")
        
    print("\nRunning Retention Decision Engine (RDE) on top 10 samples...")
    # Take top 10
    samples = results_df.head(10).to_dict('records')
    
    header = f"{'Customer ID':<40} | {'Risk (%)':<10} | {'Revenue':<8} | {'Action':<10} | {'Campaign'}"
    print("-" * len(header))
    print(header)
    print("-" * len(header))
    
    for s in samples:
        action = generate_retention_action(s)
        cid = s.get('customer_id', 'Unknown')
        risk = s.get('churn_probability', 0)
        rev = s.get('revenue', 0)
        atype = action['action_type']
        camp = action['campaign_type']
        
        print(f"{cid:<40} | {risk:10.2f} | {rev:8.2f} | {atype:<10} | {camp}")

if __name__ == "__main__":
    analyze_netflix_data()
