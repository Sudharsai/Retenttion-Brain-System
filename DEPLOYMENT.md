# Retention Brain Deployment Guide

This document outlines the steps to deploy the **Retention Brain** application in a production environment using Docker Compose.

## 📋 Prerequisites
- Docker and Docker Compose installed on the target server.
- SMTP credentials (Gmail App Password) for mail services.
- Domain name pointed to the server IP (optional for local production testing).

## 🚀 Deployment Steps

### 1. Clone & Configure
Ensure the project files are on the server.
Verify the `./backend/.env` file contains the correct production credentials:
- `JWT_SECRET`: A unique, secure string.
- `POSTGRES_PASSWORD`: A strong password for the database.
- `SMTP_USER`: Your Gmail address.
- `SMTP_PASS`: Your 16-character Gmail App Password.

### 2. Launch with Production Profile
Run the following command to build and start all services in detached mode:
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

### 3. Verify Services
Check that all containers are running:
```bash
docker ps
```
The following containers should be active:
- `rb-frontend-prod` (Port 3000)
- `rb-backend-prod` (Port 8000)
- `rb-worker-prod`
- `rb-database-prod`
- `rb-redis-prod`

### 4. Database Seeding
The application will automatically initialize and seed the database on the first startup if no users are found. 
Default Admin credentials:
- **Super Admin**: `admin@neural.link` / `password123`
- **Admin**: `admin@enterprise.com` / `password123`

## 📡 Networking & Security
- **Backend API**: Accessible at `http://<server-ip>:8000`.
- **Frontend Dashboard**: Accessible at `http://<server-ip>:3000`.
- **CORS**: Currently set to allow all origins in `backend/main.py`. For high-security environments, restrict `allow_origins` to your specific frontend domain.

## 🛠 Maintenance
To view logs for troubleshooting:
```bash
docker-compose -f docker-compose.prod.yml logs -f backend
```

To stop the services:
```bash
docker-compose -f docker-compose.prod.yml down
```
