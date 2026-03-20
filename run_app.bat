@echo off
echo --- Retention Brain: Launch Sequence ---
echo.

:: 1. Check for Docker
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Desktop is not running. Please start it to enable MySQL and Redis.
    pause
    exit /b
)

:: 2. Start Infrastructure
echo [1/3] Starting MySQL and Redis via Docker...
docker-compose up -d

:: 3. Start Backend
echo [2/3] Starting FastAPI Backend...
start cmd /k "cd backend && python -m uvicorn main:app --reload --port 8000"

:: 4. Start Frontend
echo [3/3] Starting Next.js Frontend...
echo Note: If 'npm' is not in your current PATH, please run 'npm run dev' manually in the frontend folder.
start cmd /k "cd frontend && npm run dev"

echo.
echo Retention Brain services are initializing.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
pause
