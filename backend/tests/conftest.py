import os

# Must be set before importing app modules
os.environ["MONGO_URI"] = "mongodb://localhost:27017/kpit_cafeteria_test"

import pytest
import asyncio
import pymongo
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.config import MONGO_URI

# Sync pymongo client for DB setup/teardown (avoids Motor event-loop issues)
_sync_client = pymongo.MongoClient("mongodb://localhost:27017")
test_db = _sync_client["kpit_cafeteria_test"]


@pytest.fixture(scope="session")
def event_loop():
    """Session-scoped event loop — one loop for all tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def ac():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.fixture(autouse=True)
def clean_db():
    """Sync DB cleanup using pymongo."""
    test_db["users"].delete_many({})
    test_db["orders"].delete_many({})
    test_db["menu_items"].delete_many({})