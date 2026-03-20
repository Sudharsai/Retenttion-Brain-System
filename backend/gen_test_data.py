import pandas as pd
import numpy as np

data = {
    'CustomerID': [f"TEST_{i}" for i in range(20)],
    'Gender': ['Male', 'Female'] * 10,
    'Senior Citizen': [0, 1] * 10,
    'Partner': ['No', 'Yes'] * 10,
    'Dependents': ['No', 'Yes'] * 10,
    'Tenure Months': np.random.randint(1, 72, size=20),
    'Phone Service': ['Yes'] * 20,
    'Multiple Lines': ['No'] * 20,
    'Internet Service': ['Fiber optic'] * 20,
    'Online Security': ['No'] * 20,
    'Online Backup': ['No'] * 20,
    'Device Protection': ['No'] * 20,
    'Tech Support': ['No'] * 20,
    'Streaming TV': ['No'] * 20,
    'Streaming Movies': ['No'] * 20,
    'Contract': ['Month-to-month'] * 20,
    'Paperless Billing': ['Yes'] * 20,
    'Payment Method': ['Electronic check'] * 20,
    'Monthly Charges': np.random.uniform(20, 100, size=20),
    'Total Charges': np.random.uniform(100, 5000, size=20),
    'Churn Label': ['No', 'No', 'Yes', 'No', 'Yes'] * 4
}
df = pd.DataFrame(data)
df.to_csv("c:/Users/Sudarsan/OneDrive/sudarsun/CAREER PATH/Data Analyst/Project/Main/ml_pipeline/data/test_data_synthetic.csv", index=False)
print("Synthetic dataset created.")
