from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, DECIMAL, Enum, JSON, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    domain = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    users = relationship("User", back_populates="company")
    customers = relationship("Customer", back_populates="company")
    datasets = relationship("Dataset", back_populates="company")

class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255))
    row_count = Column(Integer, default=0)
    status = Column(String(50), default="processing") # 'processing', 'completed', 'failed'
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="datasets")
    customers = relationship("Customer", back_populates="dataset")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True)
    username = Column(String(255), unique=True, index=True)
    email = Column(String(255), unique=True, index=True)
    password_hash = Column(String(255))
    role = Column(String(50), default="user") # 'super_admin', 'admin', 'user'
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    company = relationship("Company", back_populates="users")

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="SET NULL"), nullable=True)
    external_customer_id = Column(String(255), nullable=False)
    name = Column(String(255))
    email = Column(String(255))
    revenue = Column(DECIMAL(10, 2))
    usage_score = Column(Float)
    transactions_count = Column(Integer)
    communication_channel = Column(String(50)) # email, phone, SMS
    churn_risk = Column(Float, default=0.0)
    uplift_score = Column(Float, default=0.0)
    persuadability_score = Column(Float, default=0.0)
    geography_risk_score = Column(Float, default=0.0)
    retention_probability = Column(Float, default=0.0)
    expected_recovery = Column(Float, default=0.0)
    last_notified = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="customers")
    dataset = relationship("Dataset", back_populates="customers")
    churn_scores = relationship("ChurnScore", back_populates="customer")
    uplift_scores = relationship("UpliftScore", back_populates="customer")
    revenue_data = relationship("RevenueData", back_populates="customer")

class ChurnScore(Base):
    __tablename__ = "churn_scores"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    probability = Column(Float, nullable=False)
    factors = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    customer = relationship("Customer", back_populates="churn_scores")

class UpliftScore(Base):
    __tablename__ = "uplift_scores"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, nullable=False)
    strategy = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    customer = relationship("Customer", back_populates="uplift_scores")

class RevenueData(Base):
    __tablename__ = "revenue_data"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    total_revenue = Column(DECIMAL(10, 2))
    risk_amount = Column(DECIMAL(10, 2))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    customer = relationship("Customer", back_populates="revenue_data")

class AppLog(Base):
    __tablename__ = "admin_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(255))
    details = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50)) # CHURN_RISK, DATA_SYNC, SYSTEM, SUCCESS
    details = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class AccessRequest(Base):
    __tablename__ = "access_requests"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=False)
    reason = Column(Text)
    status = Column(String(50), default="pending") # 'pending', 'approved', 'denied'
    created_at = Column(DateTime, default=datetime.utcnow)
