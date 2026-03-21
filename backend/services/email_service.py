import smtplib
import os
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")


def build_html_email(subject: str, body: str, recipient_name: str) -> str:
    """Wrap plain body text in a professional HTML email template."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f7fb; margin: 0; padding: 0; }}
        .wrapper {{ max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }}
        .header {{ background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 36px 40px; }}
        .header h1 {{ color: white; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }}
        .header p {{ color: rgba(255,255,255,0.7); margin: 6px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; }}
        .body {{ padding: 40px; }}
        .greeting {{ font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 20px; }}
        .content {{ font-size: 15px; line-height: 1.7; color: #475569; white-space: pre-line; }}
        .footer {{ padding: 24px 40px; background: #f8fafc; border-top: 1px solid #e2e8f0; }}
        .footer p {{ margin: 0; font-size: 11px; color: #94a3b8; }}
        .badge {{ display: inline-block; background: #eff6ff; color: #3b82f6; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; padding: 4px 10px; border-radius: 20px; margin-bottom: 16px; }}
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>Retention Brain</h1>
          <p>Customer Retention Intelligence</p>
        </div>
        <div class="body">
          <div class="badge">Personalized Outreach</div>
          <div class="greeting">Hi {recipient_name},</div>
          <div class="content">{body}</div>
        </div>
        <div class="footer">
          <p>You're receiving this because you're a valued customer. To unsubscribe, reply with "unsubscribe".</p>
          <p style="margin-top:6px;">© 2026 Retention Brain · Sent via Neural Outreach Engine</p>
        </div>
      </div>
    </body>
    </html>
    """


def send_single_email(to_email: str, to_name: str, subject: str, body: str) -> bool:
    """Send a single email. Returns True on success, False on failure."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Retention Brain <{SMTP_USER}>"
        msg["To"] = f"{to_name} <{to_email}>"

        # Plain text fallback
        plain_body = f"Hi {to_name},\n\n{body}\n\n--\nRetention Brain"
        msg.attach(MIMEText(plain_body, "plain"))

        # HTML version
        html_body = build_html_email(subject, body, to_name)
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, to_email, msg.as_string())

        return True

    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


def send_bulk_emails(recipients: List[Dict], subject: str, body: str) -> Dict:
    """
    Send emails to a list of recipients.
    recipients: [{"email": str, "name": str}]
    Returns: {"sent": int, "failed": int, "results": [...]}
    """
    results = []
    sent = 0
    failed = 0

    # Reuse a single SMTP connection for bulk sending
    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)

            for r in recipients:
                try:
                    msg = MIMEMultipart("alternative")
                    msg["Subject"] = subject
                    msg["From"] = f"Retention Brain <{SMTP_USER}>"
                    msg["To"] = f"{r['name']} <{r['email']}>"

                    plain = f"Hi {r['name']},\n\n{body}\n\n--\nRetention Brain"
                    msg.attach(MIMEText(plain, "plain"))
                    msg.attach(MIMEText(build_html_email(subject, body, r['name']), "html"))

                    server.sendmail(SMTP_USER, r["email"], msg.as_string())
                    results.append({"email": r["email"], "status": "sent"})
                    sent += 1

                except Exception as e:
                    results.append({"email": r["email"], "status": "failed", "error": str(e)})
                    failed += 1

    except Exception as e:
        logger.error(f"SMTP connection failed: {e}")
        # Mark all remaining as failed
        for r in recipients:
            if not any(res["email"] == r["email"] for res in results):
                results.append({"email": r["email"], "status": "failed", "error": str(e)})
                failed += 1

    return {"sent": sent, "failed": failed, "results": results}
