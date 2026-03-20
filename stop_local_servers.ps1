echo "--- Clearing Port 3000 (Frontend) ---"
$proc3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($proc3000) {
    $proc3000.OwningProcess | Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    echo "Stopped process on Port 3000"
} else {
    echo "Port 3000 is already clear."
}

echo "--- Clearing Port 8000 (Backend) ---"
$proc8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($proc8000) {
    $proc8000.OwningProcess | Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    echo "Stopped process on Port 8000"
} else {
    echo "Port 8000 is already clear."
}

echo "--- Clearing Port 6379 (Redis) ---"
$proc6379 = Get-NetTCPConnection -LocalPort 6379 -ErrorAction SilentlyContinue
if ($proc6379) {
    $proc6379.OwningProcess | Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    echo "Stopped local Redis process."
}

echo "Ports are now clear. You can run: docker-compose up --build"
