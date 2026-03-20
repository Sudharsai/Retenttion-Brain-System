import os
from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from database.session import init_db
from api.routes import auth_routes, customer_routes, analytics_routes, admin_routes
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

app = FastAPI(title="Retention Brain API", description="AI SaaS for Customer Retention")

# Celery Setup (Tasks should be in workers/tasks.py)
celery_app = Celery("retention_worker", broker=REDIS_URL, backend=REDIS_URL)
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    task_always_eager=False # Enable true async with Redis
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

@app.on_event("startup")
def startup_event():
    init_db()
    # Seeding is handled via backend/seed.py typically or inline
    # For now, ensure tables are created.

@app.get("/")
def read_root():
    return {"status": "Retention Brain API v1.0 is active"}

# Health check
@app.get("/health")
def health():
    return {"status": "healthy", "version": "4.0.0"}
