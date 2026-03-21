from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .domain import Base

class CampaignStatus(str, enum.Enum):
    draft = "draft"
    sending = "sending"
    sent = "sent"
    failed = "failed"

class EmailStatus(str, enum.Enum):
    pending = "pending"
    sent = "sent"
    failed = "failed"

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    body = Column(Text, nullable=False)
    segment = Column(String(100), default="all")      # all | high_risk | persuadable
    status = Column(String(50), default=CampaignStatus.draft)
    total_recipients = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    progress = Column(Integer, default=0)
    roi = Column(Float, default=0.0)
    uplift = Column(Float, default=0.0)
    cost = Column(Float, default=0.0)
    color = Column(String(50), default="bg-blue-500")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime, nullable=True)

    emails = relationship("CampaignEmail", back_populates="campaign", cascade="all, delete-orphan")

class CampaignEmail(Base):
    __tablename__ = "campaign_emails"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    recipient_email = Column(String(255), nullable=False)
    recipient_name = Column(String(255), nullable=False)
    status = Column(String(50), default=EmailStatus.pending)
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, nullable=True)

    campaign = relationship("Campaign", back_populates="emails")
