"""
Chandu Cafeteria — Database Seed Script
Creates required collections, indexes, and demo data if not present.
Runs on container startup — safe to run multiple times (idempotent).
"""
import os
import asyncio
from datetime import datetime, timezone
from pymongo import MongoClient, ASCENDING, DESCENDING
from passlib.context import CryptContext

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/chandu-cafeteria")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEMO_USERS = [
    {"emp_id": "EMP001", "name": "Ravi Kumar", "email": "ravi@chandu.com", "password": "demo123", "role": "user", "department": "Engineering"},
    {"emp_id": "EMP002", "name": "Priya Sharma", "email": "priya@chandu.com", "password": "demo123", "role": "user", "department": "Design"},
    {"emp_id": "EMP003", "name": "Amit Patel", "email": "amit@chandu.com", "password": "demo123", "role": "user", "department": "Product"},
    {"emp_id": "MGR001", "name": "Vikram Singh", "email": "vikram@chandu.com", "password": "mgr123", "role": "manager", "department": "Operations"},
    {"emp_id": "ADM001", "name": "Chandu Reddy", "email": "chandu@chandu.com", "password": "adm123", "role": "admin", "department": "Cafeteria"},
]

DEMO_MENU = [
    {"name": "Masala Dosa", "category": "South Indian", "price": 60.00, "description": "Crispy rice crepe with spiced potato filling", "time_slot": "breakfast", "available": True},
    {"name": "Idli Sambar", "category": "South Indian", "price": 45.00, "description": "Steamed rice cakes with lentil soup", "time_slot": "breakfast", "available": True},
    {"name": "Poha", "category": "Indian Breakfast", "price": 35.00, "description": "Flattened rice with peanuts and spices", "time_slot": "breakfast", "available": True},
    {"name": "Veg Biryani", "category": "Rice", "price": 80.00, "description": "Fragrant basmati rice with vegetables", "time_slot": "lunch", "available": True},
    {"name": "Paneer Butter Masala", "category": "Gravy", "price": 90.00, "description": "Cottage cheese in rich tomato gravy", "time_slot": "lunch", "available": True},
    {"name": "Dal Khichdi", "category": "Rice", "price": 55.00, "description": "Comforting rice-lentil porridge", "time_slot": "lunch", "available": True},
    {"name": "Samosa", "category": "Snacks", "price": 25.00, "description": "Crispy pastry with spiced potato filling", "time_slot": "snacks", "available": True},
    {"name": "Masala Chai", "category": "Beverages", "price": 20.00, "description": "Spiced Indian tea with milk", "time_slot": "snacks", "available": True},
    {"name": "Veg Sandwich", "category": "Quick Bites", "price": 40.00, "description": "Grilled sandwich with vegetables", "time_slot": "other", "available": True},
    {"name": "Fruit Juice", "category": "Beverages", "price": 35.00, "description": "Fresh seasonal fruit juice", "time_slot": "other", "available": True},
]


def run():
    uri = MONGO_URI
    if not uri:
        print("No MONGO_URI, skipping seed")
        return

    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    try:
        client.admin.command("ping")
    except Exception as e:
        print(f"MongoDB unreachable: {e}")
        return

    db_name = uri.rsplit("/", 1)[-1].split("?")[0] or "chandu-cafeteria"
    db = client[db_name]
    print(f"Seeding database: {db_name}")

    # ── Create indexes ──
    db.users.create_index([("emp_id", ASCENDING)], unique=True)
    db.users.create_index([("role", ASCENDING)])
    db.menu_items.create_index([("time_slot", ASCENDING)])
    db.menu_items.create_index([("category", ASCENDING)])
    db.menu_items.create_index([("available", ASCENDING)])
    db.orders.create_index([("user_id", ASCENDING)])
    db.orders.create_index([("status", ASCENDING)])
    db.orders.create_index([("created_at", DESCENDING)])
    db.orders.create_index([("order_code", ASCENDING)], unique=True)
    db.notifications.create_index([("user_id", ASCENDING)])
    db.notifications.create_index([("created_at", DESCENDING)])
    db.config.create_index([("key", ASCENDING)], unique=True)
    print("Indexes: created")

    # ── Seed users (if none exist) ──
    if db.users.count_documents({}) == 0:
        for u in DEMO_USERS:
            u["hashed_password"] = pwd_context.hash(u.pop("password"))
            u["created_at"] = datetime.now(timezone.utc)
            db.users.insert_one(u)
        print(f"Seeded {len(DEMO_USERS)} users")

    # ── Seed menu (if none exist) ──
    if db.menu_items.count_documents({}) == 0:
        db.menu_items.insert_many(DEMO_MENU)
        print(f"Seeded {len(DEMO_MENU)} menu items")

    # ── Seed shop config ──
    if db.config.count_documents({"key": "shop_status"}) == 0:
        db.config.insert_one({"key": "shop_status", "status": "open", "message": None, "closed_slots": []})
        print("Seeded shop config")

    print("Done.")
    client.close()


if __name__ == "__main__":
    run()