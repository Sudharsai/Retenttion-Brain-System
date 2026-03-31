from datetime import datetime

def decide_retention_action(customer: dict) -> dict:
    """
    Core orchestrator to decide the best retention strategy.
    
    Inputs:
    - churn_probability (float)
    - clv (float)
    - segment (string)
    - last_active_days (int)
    - engagement_score (float)
    """
    churn_prob = customer.get("churn_probability", 0.0)
    # Normalize to 0-1 if it's 0-100
    if churn_prob > 1.0:
        churn_prob = churn_prob / 100.0
        
    clv = float(customer.get("clv", customer.get("revenue", 0.0) * 12))
    segment = customer.get("segment", "MODERATE")
    last_active = int(customer.get("last_active_days", 0))
    engagement = float(customer.get("engagement_score", 0.5))
    
    # Decision Logic
    if segment == "HIGH_VALUE_RISK":
        action = "CALL"
        campaign = "PREMIUM_RETENTION"
    elif segment == "LOW_VALUE_RISK":
        action = "EMAIL"
        campaign = "DISCOUNT"
    elif segment == "INACTIVE":
        action = "EMAIL"
        campaign = "REENGAGEMENT"
    elif segment == "LOYAL":
        action = "NONE"
        campaign = "UPSELL"
    else:
        action = "EMAIL"
        campaign = "REMINDER"
        
    # Priority Score calculation
    priority_score = churn_prob * clv * (1 + engagement)
    
    # Channel Selection Logic
    if priority_score > 150:
        channel = "CALL"
    elif priority_score > 50:
        channel = "EMAIL"
    else:
        channel = "SMS"
        
    # For 'NONE' actions, override channel
    if action == "NONE":
        channel = "NONE"
        
    return {
        "action_type": action,
        "campaign_type": campaign,
        "priority_score": priority_score,
        "channel": channel,
        "segment": segment,
        "scheduled_at": datetime.utcnow()
    }
