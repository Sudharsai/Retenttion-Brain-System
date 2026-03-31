import requests
import json

def verify_api():
    base_url = "http://localhost:8000/api/v1"
    
    # 1. Login to get token
    login_url = f"{base_url}/auth/login"
    login_data = {"id_field": "admin", "password": "admin123"}
    r = requests.post(login_url, json=login_data)
    if r.status_code != 200:
        print("Login failed")
        return
        
    token = r.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Check Revenue Exposure Detail
    rev_url = f"{base_url}/customers/revenue-at-risk"
    r = requests.get(rev_url, headers=headers)
    data = r.json().get("data", [])
    if data:
        first = data[0]
        print(f"Revenue Exposure Check: {'PASS' if 'ai_insight' in first else 'FAIL'}")
        print(f"Sample Insight: {first.get('ai_insight')}")
    else:
        print("Revenue Exposure Check: NO DATA")

    # 3. Check All Customers for Gender
    cust_url = f"{base_url}/customers/?limit=5"
    r = requests.get(cust_url, headers=headers)
    items = r.json().get("data", {}).get("items", [])
    if items:
        first = items[0]
        print(f"Customers Gender Check: {'PASS' if 'gender' in first else 'FAIL'}")
        print(f"Sample Gender: {first.get('gender')}")
        print(f"Sample Name: {first.get('name')}")
    else:
        print("Customers Check: NO DATA")

    # 4. Check Campaigns (Seeded)
    camp_url = f"{base_url}/analytics/campaigns"
    r = requests.get(camp_url, headers=headers)
    data = r.json().get("data", [])
    print(f"Campaigns Check: {'PASS' if len(data) > 0 else 'FAIL'} (Count: {len(data)})")

if __name__ == "__main__":
    verify_api()
