import smtplib
import os
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict
from sqlalchemy.orm import Session
from models.domain import AppLog, Customer

class SMTPService:
    @staticmethod
    def get_config():
        return {
            'host': str(os.getenv('SMTP_SERVER', 'smtp.gmail.com')),
            'port': int(os.getenv('SMTP_PORT', '587')),
            'user': str(os.getenv('SMTP_USER', '')),
            'pass': str(os.getenv('SMTP_PASS', '')),
            'use_tls': True
        }

    @staticmethod
    def send_bulk_emails(db: Session, company_id: int, customers: List[Customer], tier: str):
        config = SMTPService.get_config()
        if not config['user'] or not config['pass']:
            print("SMTP Credentials missing")
            return {"success": False, "message": "SMTP Configuration missing"}

        sent_count = 0
        failed_count = 0
        
        try:
            server = smtplib.SMTP(str(config['host']), int(config['port']))
            if config['use_tls']:
                server.starttls()
            server.login(str(config['user']), str(config['pass']))

            for customer in customers:
                try:
                    msg = SMTPService.create_message(customer, tier, str(config['user']))
                    server.send_message(msg)
                    sent_count += 1
                    
                    # Rate limiting: 1 second between emails
                    time.sleep(1)
                except Exception as e:
                    print(f"Failed to send to {customer.email}: {e}")
                    failed_count += 1

            server.quit()
            
            # Log results
            log = AppLog(
                company_id=company_id,
                action="BULK_EMAIL_SENT",
                details=f"Tier: {tier}, Sent: {sent_count}, Failed: {failed_count}"
            )
            db.add(log)
            db.commit()
            
            return {"success": True, "sent": sent_count, "failed": failed_count}
        except Exception as e:
            print(f"SMTP Critical Error: {e}")
            return {"success": False, "message": str(e)}

    @staticmethod
    def create_message(customer: Customer, tier: str, sender: str) -> MIMEMultipart:
        msg = MIMEMultipart()
        msg['From'] = sender
        msg['To'] = customer.email
        msg['Subject'] = "Important: Action Required for Your Account"

        # Templates based on tier
        templates = {
            "High": f"Hi {customer.name},\nWe've noticed some changes in your account activity. As a valued customer, we'd like to offer you a personalized 30% discount on your next 3 months to ensure you continue to get the best value from our service.\n\nRecommended Action: Schedule a support call.",
            "Medium": f"Hi {customer.name},\n\nWe'd love to help you get more out of your account. We've unlocked a special loyalty upgrade for you!\n\nRecommended Action: Check out your new features.",
            "Low": f"Hi {customer.name},\n\nThank you for being a loyal customer! We've added some new resources to your dashboard to help you scale.\n\nRecommended Action: View latest resources."
        }
        
        body = templates.get(tier, templates["Low"])
        msg.attach(MIMEText(body, 'plain'))
        return msg
