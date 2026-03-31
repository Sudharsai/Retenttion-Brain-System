import os
import google.generativeai as genai
from typing import Dict, Optional

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class AIService:
    @staticmethod
    def generate_retention_content(customer_data: Dict, mode: str = "email") -> str:
        """
        Generates hyper-personalized retention content using Gemini 3.1 Pro.
        Modes: 'email' (for customers), 'strategy' (for internal sales use).
        """
        if not GEMINI_API_KEY:
            return AIService._get_mock_content(customer_data, mode)

        try:
            model = genai.GenerativeModel('gemini-1.5-pro') # Default to 1.5 Pro (best available)
            
            customer_info = f"""
            Customer Name: {customer_data.get('name', 'Valued Customer')}
            Churn Risk: {customer_data.get('churn_risk', 0)}%
            LTV/Revenue: ${customer_data.get('revenue', 0)}/mo
            Usage Score: {customer_data.get('usage_score', 0)}
            Last Active: {customer_data.get('last_active_days', 0)} days ago
            Segment: {customer_data.get('segment', 'MODERATE')}
            Gender: {customer_data.get('gender', 'Unknown')}
            """

            if mode == "email":
                prompt = f"""
                You are a high-end customer retention specialist. 
                Write a personalized, empathetic, and professional 'Gain Back' email for the following customer:
                {customer_info}
                
                The email should:
                1. Acknowledge their value to the company.
                2. Address potential pain points (hinted by low usage/high risk).
                3. Offer a 20% loyalty discount or a strategic review session.
                4. Maintain a premium, concierge-like tone.
                
                Keep it under 150 words.
                """
            else:
                prompt = f"""
                You are an AI Sales Strategist. 
                Analyze the following at-risk customer and provide a 3-point retention strategy for a sales representative:
                {customer_info}
                
                Focus on:
                1. The likely reason for churn.
                2. The best 'hook' to keep them.
                3. Recommended next action (Call, custom offer, etc.)
                """

            response = model.generate_content(prompt)
            return response.text.strip()

        except Exception as e:
            print(f"Gemini API Error: {e}")
            return AIService._get_mock_content(customer_data, mode)

    @staticmethod
    def _get_mock_content(customer_data: Dict, mode: str) -> str:
        name = customer_data.get('name', 'Valued Customer')
        if mode == "email":
            return f"""
            Hello {name},

            We've noticed you haven't been as active lately. As one of our most valued members, 
            we want to ensure you're getting the absolute most out of our platform.

            Based on your profile, we'd like to offer you an exclusive 20% loyalty discount 
            on your next billing cycle, or a 1-on-1 strategic review with our success team.

            Simply reply to this email or click here to claim your reward.

            Best regards,
            The Retention Brain Team
            """
        else:
            return f"""
            STRATEGY FOR {name.upper()}:
            1. Likely Churn Reason: Low usage intensity and potential competitor movement.
            2. Best Hook: Offer high-touch support or a 'Loyalty Tier' upgrade.
            3. Recommended Action: Schedule a 'Health Check' call within 48 hours.
            """
