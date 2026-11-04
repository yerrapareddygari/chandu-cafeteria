from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGO_URI, MONGO_MAX_POOL_SIZE, MONGO_MIN_POOL_SIZE

client = AsyncIOMotorClient(
    MONGO_URI,
    maxPoolSize=MONGO_MAX_POOL_SIZE,
    minPoolSize=MONGO_MIN_POOL_SIZE,
    maxIdleTimeMS=30000,
    connectTimeoutMS=5000,
    serverSelectionTimeoutMS=5000,
)
db = client.get_default_database()


def get_collection(name: str):
    return db[name]