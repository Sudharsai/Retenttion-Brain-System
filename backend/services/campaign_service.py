import smtplib
from email.mime.text import MIMEText
import os

class CampaignService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.sender = os.getenv("SMTP_SENDER", "sudharsai1303@gmail.com")
        self.password = os.getenv("SMTP_PASSWORD", "gaqw tysu fzuf deeo")

    def send_retention_email(self, to_email: str, name: str, offer: str):
        try:
            msg = MIMEText(f"Hello {name},\n\nWe value your loyalty. {offer}\n\nBest,\nRetentionBrain Team")
            msg["Subject"] = "Exclusive Retention Offer for You"
            msg["From"] = self.sender
            msg["To"] = to_email

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender, self.password)
                server.send_message(msg)
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False
