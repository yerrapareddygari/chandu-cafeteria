#!/bin/bash
# ── Chandu Cafeteria — Docker Entrypoint ──
# Waits for MongoDB to be reachable, runs seed script, then starts the app

set -e

echo "=== Chandu Cafeteria Backend ==="

# Wait for MongoDB (max 30s)
if [ -n "$MONGO_URI" ]; then
    echo "→ Checking MongoDB connection..."
    MAX_RETRIES=30
    RETRY=0
    until python3 -c "
import os, sys
from pymongo import MongoClient
uri = os.environ.get('MONGO_URI', '')
if not uri:
    print('No MONGO_URI set — skipping MongoDB check')
    sys.exit(0)
try:
    client = MongoClient(uri, serverSelectionTimeoutMS=3000)
    client.admin.command('ping')
    print('MongoDB: connected')
except Exception as e:
    sys.exit(1)
" 2>/dev/null; do
        RETRY=$((RETRY + 1))
        if [ $RETRY -ge $MAX_RETRIES ]; then
            echo "⚠ MongoDB not reachable after ${MAX_RETRIES}s — starting anyway"
            break
        fi
        sleep 1
    done

    # Run seed script to create collections and indexes
    echo "→ Running seed script..."
    python3 /app/seed.py 2>/dev/null && echo "Seed: OK" || echo "Seed: skipped (may already exist)"
else
    echo "⚠ No MONGO_URI set — running without MongoDB check"
fi

echo "→ Starting uvicorn..."
exec "$@"