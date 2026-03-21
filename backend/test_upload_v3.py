import requests
import time
import os

BASE_URL = "http://localhost:8000/api/v1"

def test_upload():
    # 1. Login to get token
    login_data = {"id_field": "admin", "password": "admin123"}
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Create a dummy industry-agnostic CSV
    csv_content = """Account_ID,Full_Name,Email,Balance,Visits,Purchases,Attrition,Territory
CUST-9999,John Doe,john@industry.com,5000.50,45,12,No,North
CUST-8888,Jane Smith,jane@industry.com,1200.00,10,2,Yes,South
"""
    with open("industry_test.csv", "w") as f:
        f.write(csv_content)
    
    # 3. Upload CSV
    with open("industry_test.csv", "rb") as f:
        files = {"file": ("industry_test.csv", f, "text/csv")}
        response = requests.post(f"{BASE_URL}/customers/upload-csv", headers=headers, files=files)
    
    print(f"Upload Response: {response.json()}")
    if not response.json().get("success"):
        return

    # 4. Wait for processing (Celery)
    print("Waiting for processing...")
    time.sleep(10)
    
    # 5. Check if customers were created
    response = requests.get(f"{BASE_URL}/customers/", headers=headers)
    customers = response.json()["data"]["items"]
    print(f"Found {len(customers)} customers.")
    
    for c in customers:
        if c["external_customer_id"] in ["CUST-9999", "CUST-8888"]:
            print(f"SUCCESS: Found customer {c['external_customer_id']} with churn_risk {c['churn_risk']}")

    # 6. Cleanup
    os.remove("industry_test.csv")

if __name__ == "__main__":
    test_upload()
