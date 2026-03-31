def assign_segment(customer: dict) -> str:
    """
    Assign a retention segment based on churn risk, CLV, and engagement.
    
    Input:
    - churn_probability (float 0-1 or 0-100)
    - clv (float)
    - last_active_days (int)
    - engagement_score (float 0-1)
    """
    churn_prob = customer.get("churn_probability", 0.0)
    # Normalize to 0-1 if it's 0-100
    if churn_prob > 1.0:
        churn_prob = churn_prob / 100.0
        
    clv = float(customer.get("clv", customer.get("revenue", 0.0) * 12))
    last_active = int(customer.get("last_active_days", 0))
    engagement = float(customer.get("engagement_score", 0.5))
    if churn_prob > 0.75 and clv > 150:
        return "HIGH_VALUE_RISK"
    elif churn_prob > 0.75:
        return "LOW_VALUE_RISK"
    elif last_active > 15:
        return "INACTIVE"
    elif churn_prob < 0.3 and engagement > 0.7:
        return "LOYAL"
    else:
        return "MODERATE"
