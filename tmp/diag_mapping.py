import pandas as pd
import sys
import os

# Add backend to path
sys.path.append('/app')

from services.ml_service import MLService

csv_path = '/app/data/WA_Fn-UseC_-Telco-Customer-Churn (1).csv'
if not os.path.exists(csv_path):
    # Try another common path
    csv_path = '/app/uploads/WA_Fn-UseC_-Telco-Customer-Churn (1).csv'

if os.path.exists(csv_path):
    df = pd.read_csv(csv_path)
    mapping = MLService.identify_columns(df)
    print(f"MAPPING: {mapping}")
    print(f"COLUMNS: {list(df.columns)}")
else:
    print(f"CSV NOT FOUND AT {csv_path}")
    # List files in /app/uploads
    if os.path.exists('/app/uploads'):
        print(f"FILES IN /app/uploads: {os.listdir('/app/uploads')}")
