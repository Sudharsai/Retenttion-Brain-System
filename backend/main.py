import os
from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from database.session import init_db, SessionLocal
from api.routes import auth_routes, customer_routes, analytics_routes, admin_routes, campaign_routes
from celery import Celery
from dotenv import load_dotenv
from api.controllers.auth_controller import get_password_hash
from models.domain import User

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL")

# If REDIS_URL is not set, default to localhost for development
if not REDIS_URL:
    REDIS_URL = "redis://localhost:6379/0"

app = FastAPI(title="Retention Brain API", description="AI SaaS for Customer Retention")

# Celery Setup (Tasks should be in workers/tasks.py)
celery_app = Celery("retention_worker", broker=REDIS_URL, backend=REDIS_URL)
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    task_always_eager=os.getenv("TASK_ALWAYS_EAGER", "False").lower() == "true"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database
# init_db() # This is now called in the startup event

# Routes
app.include_router(auth_routes.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(customer_routes.router, prefix="/api/v1/customers", tags=["Customers"])
app.include_router(analytics_routes.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(admin_routes.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(campaign_routes.router, prefix="/api/v1/campaigns", tags=["Campaign Management"])

@app.on_event("startup")
def startup_event():
    try:
        init_db()
    except Exception as e:
        print(f"Error during database initialization: {e}")
    
    try:
        from seed import seed_all, SessionLocal
        from models.domain import User, Company
        db = SessionLocal()
        try:
            user_count = db.query(User).count()
            if user_count == 0:
                print("Database empty of users, seeding default accounts...")
                seed_all(db)
            else:
                # Check if we should force a format refresh (check first user hash)
                first_user = db.query(User).first()
                if first_user and not first_user.password_hash.startswith("$pbkdf2-sha256$"):
                    print("Old hash format detected. Refreshing all user accounts...")
                    db.query(User).delete()
                    db.commit()
                    seed_all(db)
        finally:
            db.close()
    except Exception as e:
        print(f"Error during startup re-seeding: {e}")

@app.get("/")
def read_root():
    return {"status": "Retention Brain API v1.0 is active"}

# Health check
@app.get("/health")
def health():
    return {"status": "healthy", "version": "4.0.0"}
