#!/bin/bash
# Chandu Cafeteria — Production Startup Script
# Run: bash start.sh

set -e

DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Chandu Cafeteria — Starting production ==="

# ── Backend: 4 uvicorn workers ──
cd "$DIR/backend"
export MONGO_MAX_POOL_SIZE=200
export MONGO_MIN_POOL_SIZE=20
export RATE_LIMIT_REQUESTS=60
export RATE_LIMIT_WINDOW=60

echo "Starting 4 backend workers on ports 8001-8004..."
for PORT in 8001 8002 8003 8004; do
    uvicorn app.main:app --host 127.0.0.1 --port $PORT --workers 1 --log-level warning &
done
echo "Backend workers started (PIDs: $(jobs -p | tr '\n' ' '))"

# ── Frontend: build if needed ──
cd "$DIR/frontend"
if [ ! -d "dist" ] || [ "src" -nt "dist" ]; then
    echo "Building frontend..."
    npx vite build --outDir dist
fi

# ── Nginx ──
if command -v nginx &>/dev/null; then
    echo "Copying nginx config..."
    sudo cp "$DIR/nginx.conf" /etc/nginx/sites-available/chandu-cafeteria 2>/dev/null || \
        cp "$DIR/nginx.conf" /etc/nginx/conf.d/chandu-cafeteria.conf 2>/dev/null || true
    sudo nginx -t && sudo nginx -s reload 2>/dev/null || echo "Nginx not running — start it manually"
else
    echo "⚠ Nginx not found — install: sudo apt install nginx"
fi

echo "=== Ready: http://localhost ==="
echo "PIDs: $(jobs -p)"
wait