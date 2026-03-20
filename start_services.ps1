# Retention Brain - Service Orchestration Script (Windows)

Write-Host "--- Starting Retention Brain Services ---" -ForegroundColor Cyan

# 1. Start Redis (Assuming Docker is available or Redis is installed)
if (Get-Command "docker" -ErrorAction SilentlyContinue) {
    Write-Host "[1/4] Starting Redis Container..." -ForegroundColor Yellow
    docker run -d --name rb-redis -p 6379:6379 redis:alpine
} else {
    Write-Host "[1/4] Redis check failed. Ensure Redis is running on localhost:6379" -ForegroundColor Red
}

# 2. Start MySQL (Check if already running on 3307)
$mysqlPort = 3307
$portCheck = Test-NetConnection -ComputerName localhost -Port $mysqlPort
if ($portCheck.TcpTestSucceeded) {
    Write-Host "[2/4] MySQL detected on port $mysqlPort." -ForegroundColor Green
} else {
    Write-Host "[2/4] MySQL NOT detected on port $mysqlPort. Ensure Docker Desktop is running the MySQL container." -ForegroundColor Red
}

# 3. Start Backend
Write-Host "[3/4] Starting FastAPI Backend (Background)..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "python" -ArgumentList "-m uvicorn main:app --reload --host 0.0.0.0 --port 8000" -WorkingDirectory (Join-Path $PSScriptRoot "backend")

# 4. Start Celery Worker
Write-Host "[4/4] Starting Celery Worker (Background CLI)..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "celery" -ArgumentList "-A workers.tasks worker --loglevel=info -P solo" -WorkingDirectory (Join-Path $PSScriptRoot "backend")

Write-Host "`nAll services initialized." -ForegroundColor Green
Write-Host "Backend: http://localhost:8000"
Write-Host "Frontend: http://localhost:3000 (Run 'npm run dev' in frontend directory)"
Write-Host "Sample Data: ./sample_data.csv"
