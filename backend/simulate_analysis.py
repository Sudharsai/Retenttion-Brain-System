import sys
import os
import pandas as pd
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Ensure the module can be loaded correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from workers.tasks import process_neural_dataset

# Use a sample dataset
sample_csv = "c:/Users/Sudarsan/OneDrive/sudarsun/CAREER PATH/Data Analyst/Project/Main/ml_pipeline/data/test_data_synthetic.csv"

if not os.path.exists(sample_csv):
    print(f"ERROR: Sample file {sample_csv} not found.")
    sys.exit(1)

print(f"Triggering analysis for {sample_csv}...")
# Call the task directly (simulating 'always_eager=True' or worker execution)
result = process_neural_dataset(sample_csv, company_id=1)

print(f"Analysis result: {result}")
