from services.retention_decision_engine import generate_retention_action

def test_rde_logic():
    # 1. High Churn + Premium Subscription -> CALL
    res1 = generate_retention_action({
        "churn_probability": 0.85,
        "revenue": 15.0,
        "last_active_days": 2,
        "subscription_type": "Premium"
    })
    print(f"Test 1 (Premium): {res1['action_type']} - {res1['campaign_type']} (Priority: {res1['priority_score']})")
    assert res1['action_type'] == "CALL"

    # 2. High Churn + High Revenue -> CALL
    res2 = generate_retention_action({
        "churn_probability": 0.85,
        "revenue": 600.0,
        "last_active_days": 2,
        "subscription_type": "Basic"
    })
    print(f"Test 2 (High Revenue): {res2['action_type']} - {res2['campaign_type']}")
    assert res2['action_type'] == "CALL"

    # 3. High Churn + Inactive -> EMAIL (REENGAGEMENT)
    res3 = generate_retention_action({
        "churn_probability": 0.75,
        "revenue": 50.0,
        "last_active_days": 25,
        "subscription_type": "Standard"
    })
    print(f"Test 3 (Inactive): {res3['action_type']} - {res3['campaign_type']}")
    assert res3['action_type'] == "EMAIL"
    assert res3['campaign_type'] == "REENGAGEMENT"

    # 4. Low Churn -> NONE
    res4 = generate_retention_action({
        "churn_probability": 0.2,
        "revenue": 100.0,
        "last_active_days": 1,
        "subscription_type": "Standard"
    })
    print(f"Test 4 (Low Risk): {res4['action_type']} - {res4['campaign_type']}")
    assert res4['action_type'] == "NONE"

    print("All logic tests passed!")

if __name__ == "__main__":
    test_rde_logic()
