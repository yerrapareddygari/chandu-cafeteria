from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, Dict
from app.database import get_collection
from app.middleware.auth import require_role

router = APIRouter(prefix="/shop", tags=["shop"])

SHOP_CONFIG_ID = "shop_status"

SLOTS = ["breakfast", "lunch", "snacks", "other"]


class ShopStatusUpdate(BaseModel):
    status: Optional[str] = None  # "open", "closed", "break" — whole shop
    closed_slots: Optional[list] = None  # list of slot keys to close, e.g. ["lunch", "snacks"]


@router.get("/status")
async def get_shop_status():
    config = get_collection("config")
    doc = await config.find_one({"key": SHOP_CONFIG_ID})
    if not doc:
        return {"status": "open", "message": None, "closed_slots": []}
    doc["_id"] = str(doc["_id"])
    return {
        "status": doc.get("status", "open"),
        "message": doc.get("message"),
        "closed_slots": doc.get("closed_slots", []),
    }


@router.put("/status")
async def set_shop_status(
    data: ShopStatusUpdate,
    current_user: dict = Depends(require_role("manager")),
):
    config = get_collection("config")
    update = {}

    if data.status is not None:
        update["status"] = data.status
        if data.status == "closed":
            update["message"] = "Shop is currently closed. Please check back later."
        elif data.status == "break":
            update["message"] = "We'll be right back! The team is on a short break. 🕐"
        else:
            update["message"] = None

    if data.closed_slots is not None:
        update["closed_slots"] = [s for s in data.closed_slots if s in SLOTS]

    update["updated_by"] = current_user.get("name", "manager")

    await config.update_one(
        {"key": SHOP_CONFIG_ID},
        {"$set": update},
        upsert=True,
    )

    doc = await config.find_one({"key": SHOP_CONFIG_ID})
    return {
        "status": doc.get("status", "open"),
        "message": doc.get("message"),
        "closed_slots": doc.get("closed_slots", []),
    }