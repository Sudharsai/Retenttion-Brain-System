from sqlalchemy.orm import Session
from passlib.context import CryptContext
import random
import os
import sys

# Ensure the module can be loaded correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database.session import SessionLocal, engine
from models.domain import Base, Company, User, Customer, ChurnScore, UpliftScore, RevenueData, AppLog

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def init_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # 0. Clean and Seed
    print("Pre-seeding cleanup...")
    db.query(User).delete()
    db.query(Company).delete()
    db.commit()

    print("Seeding database...")
    
    # 1. Create a Primary Tenant
    techcorp = Company(name="TechCorp Solutions")
    db.add(techcorp)
    db.commit()
    db.refresh(techcorp)

    # 2. Sequential User Provisioning
    super_admin = User(
        username="super_admin",
        email="superadmin@retentionbrain.com",
        password_hash=get_password_hash("super123"),
        role="super_admin"
    )
    platform_admin = User(
        username="admin",
        email="admin@retentionbrain.com",
        password_hash=get_password_hash("admin123"),
        role="admin"
    )
    client_user = User(
        username="demouser",
        email="demo@techcorp.com",
        password_hash=get_password_hash("demo123"),
        role="user",
        company_id=techcorp.id
    )
    
    db.add_all([super_admin, platform_admin, client_user])
    db.commit()

    # 3. Create sample customers for TechCorp
    names = ["Alice Smith", "Bob Johnson", "Charlie Davis", "Diana Prince", "Evan Wright", "Fiona Gallagher", "George Miller", "Hannah Abbott", "Ian Malcolm", "Jane Doe"]
    
    for i, name in enumerate(names):
        cust = Customer(
            name=name,
            email=f"{name.split()[0].lower()}@example.com",
            external_customer_id=f"CUST-{1000+i}",
            company_id=techcorp.id,
            revenue=random.uniform(100, 5000),
            usage_score=random.uniform(0, 100),
            transactions_count=random.randint(1, 50)
        )
        db.add(cust)
        db.commit()
        db.refresh(cust)

        # Generate mock metrics
        churn_prob = random.uniform(0.1, 0.95)
        uplift = random.uniform(-0.1, 0.3) if churn_prob > 0.4 else random.uniform(0.0, 0.1)
        rev = random.uniform(100, 5000)
        risk = rev * churn_prob if churn_prob > 0.6 else 0

        db.add(ChurnScore(customer_id=cust.id, probability=churn_prob, factors={"usage": random.randint(1, 100)}))
        db.add(UpliftScore(customer_id=cust.id, score=uplift, strategy="Targeted Outreach"))
        db.add(RevenueData(customer_id=cust.id, total_revenue=rev, risk_amount=risk))

    db.commit()
    print("Database seeded successfully with users 'admin' and 'demouser'.")
    db.close()

if __name__ == "__main__":
    init_db()
