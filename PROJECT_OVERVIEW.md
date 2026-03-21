# Project Overview: Neural Retention Brain

## What is this project?
The **Neural Retention Brain** is an AI-driven SaaS platform designed to predict, prevent, and recover customer churn. It uses machine learning (Neural Networks) to analyze customer behavior and automate retention strategies in real-time.

## Key Value Propositions (What to tell your guide)
1. **Predictive Intelligence**: It doesn't just show historical data; it predicts the *future probability* of churn using a "Neural Decay" model.
2. **Automated Intervention**: The system can automatically trigger win-back campaigns (Email/SMS) as soon as a customer hits a critical risk threshold.
3. **Financial Transparency**: Every campaign records its own ROI and Uplift, allowing executives to see the direct financial impact of AI-driven retention.
4. **Real-time Synchronization**: The dashboard refreshes Every 10 seconds, providing a live "Neural Stream" of customer health.

## What to SHOW your Project Guide
1. **The Executive Command Center**: Show the high-level NRR (Net Revenue Retention) and the "Revenue at Risk" cards. This shows the scale of the problem.
2. **Uplift & ROI Matrix**: Show the "Campaign Efficiency Index" bar chart. This demonstrates that the AI knows which channels (SMS vs Email) are most effective.
3. **Churn Forecast Engine**: Demonstrate the "Neural Decay Distribution." Explain that this is the AI's internal belief about when customers will leave.
4. **Identity Base (Identity Base Tab)**: Show the drill-down on a "High Risk" customer. This shows the system's ability to "see" individual customer pain points.
5. **Campaign History**: Show the delivery logs. Even if SMTP isn't connected to a live server, show the *logs* that prove the system is attempting to save customers.

## Technical Stack
- **Backend**: FastAPI (Python), SQLAlchemy (PostgreSQL), Redis.
- **AI/ML**: Custom Neural Simulation Engine.
- **Worker**: Celery (Background Tasks).
- **Frontend**: Next.js 14, React, TailwindCSS, Recharts.
- **Infrastructure**: Dockerized multi-service architecture.
