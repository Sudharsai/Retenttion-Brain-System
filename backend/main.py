import os
from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from database.session import init_db
from database.session import init_db, SessionLocal
from api.routes import auth_routes, customer_routes, analytics_routes, admin_routes
from celery import Celery
from dotenv import load_dotenv
from api.controllers.auth_controller import get_password_hash
from models.domain import User

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

app = FastAPI(title="Retention Brain API", description="AI SaaS for Customer Retention")

# Celery Setup (Tasks should be in workers/tasks.py)
celery_app = Celery("retention_worker", broker=REDIS_URL, backend=REDIS_URL)
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    task_always_eager=True # Force sync for zero-dependency run
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
        "http://frontend:3000" # Docker internal name
    ],
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

@app.on_event("startup")
def startup_event():
    init_db()
    try:
        from seed import seed_if_empty
        seed_if_empty()
    except Exception as e:
        print(f"Error during startup seeding: {e}")

@app.get("/")
def read_root():
    return {"status": "Retention Brain API v1.0 is active"}

# Health check
@app.get("/health")
def health():
    return {"status": "healthy", "version": "4.0.0"}
