import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from typing import List
from services.ai_service import AIService

# Mock SMTP settings - In production, these would be in .env
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "notifications@retention-brain.io")
SMTP_PASS = os.getenv("SMTP_PASS", "neural-sync-secret")

def send_retention_email(recipient_email: str, customer_name: str, customer_data: dict = None):
    """
    Sends a personalized 'Gain Back' email to a high-risk customer.
    """
    if not recipient_email:
        return False
        
    msg = MIMEMultipart()
    msg['From'] = f"Retention Brain <{SMTP_USER}>"
    msg['To'] = recipient_email
    msg['Subject'] = f"Strategic Update for {customer_name}"

    # Generate AI-powered content
    ai_input = customer_data or {"name": customer_name, "email": recipient_email}
    body = AIService.generate_retention_content(ai_input, mode="email")
    
    msg.attach(MIMEText(body, 'plain'))

    try:
        # For this demo, we'll just log the attempt if SMTP isn't configured
        if not SMTP_PASS or SMTP_PASS == "neural-sync-secret":
            print(f"[MOCK MAIL] Sending retention email to {recipient_email}")
            return True
            
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

def bulk_send_retention_emails(customers: List[dict]):
    """
    Sends emails to multiple customers.
    """
    count = 0
    for c in customers:
        if send_retention_email(c['email'], c['name']):
            count += 1
    return count
