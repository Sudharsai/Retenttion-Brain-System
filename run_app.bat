@echo off
echo --- Retention Brain: Advanced Docker Launch (CTO Grade) ---
echo.

:: 1. Force Kill Local Stale Processes (to free up ports for Docker)
echo [1/3] Purging legacy local processes...
taskkill /F /IM python.exe /T /FI "STATUS eq RUNNING" >nul 2>&1
taskkill /F /IM node.exe /T /FI "STATUS eq RUNNING" >nul 2>&1
echo.

:: 2. Launch Docker Stack
echo [2/3] Initializing Full-Stack Docker (MySQL, Redis, Backend, Worker, Frontend)...
echo.
echo IMPORTANT: Ensure Docker Desktop is RUNNING before continuing.
echo.
pause

docker-compose up --build

echo.
echo If you see errors above, please ensure Docker Desktop is started and retry.
echo.
pause
