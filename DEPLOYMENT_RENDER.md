# Deployment Guide: Render.com

This project is optimized for deployment on **Render** using a "Blueprint" (`render.yaml`). This will automatically set up PostgreSQL, Redis, the Backend, the Worker, and the Frontend.

## Step 1: Prepare your `.env`
Ensure your local `.env` is NOT in GitHub. Render will use the environment variables defined in the Blueprint.

## Step 2: Create a `render.yaml`
I have provided a `render.yaml` in the root of the project. It defines:
1. **Web Service (Backend)**: FastAPI server.
2. **Background Worker**: Celery worker for campaigns.
3. **Redis Instance**: For task queuing.
4. **PostgreSQL Database**: For core data.
5. **Static Site (Frontend)**: Next.js build.

## Step 3: Deployment Steps
1. Push your code to a GitHub repository.
2. Log in to [Render.com](https://render.com).
3. Click **"New +"** -> **"Blueprint"**.
4. Connect your GitHub repository.
5. Render will detect `render.yaml` and show you the services it will create.
6. Click **"Apply"**.

## Step 4: Environment Variables on Render
After clicking apply, Render will ask for:
- `JWT_SECRET`: Any random long string.
- `DATABASE_URL`: Render will automatically fill this from the Postgres service.
- `REDIS_URL`: Render will automatically fill this from the Redis service.
- `SMTP_USER/PASS`: Your Gmail/SMTP credentials (optional for testing).

## Step 5: Seeding Data
Once the backend is live, run the seeding script via Render's "Shell" tab on the Backend service:
```bash
python seed_campaigns.py
```

## Why Render?
- **Docker Support**: Consistent environment between dev and prod.
- **Private Networking**: The database and redis are NOT exposed to the internet, only the backend can see them.
- **Auto-SSL**: Your frontend and backend will automatically have `https://`.
