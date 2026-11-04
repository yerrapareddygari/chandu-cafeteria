from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from app.models.menu import MenuItemCreate, MenuItemUpdate
from app.database import get_collection
from app.middleware.auth import get_current_user, require_role
from typing import Optional

router = APIRouter(prefix="/menu", tags=["menu"])


def _item_out(item: dict) -> dict:
    item["_id"] = str(item["_id"])
    return item


@router.get("")
async def list_menu(
    time_slot: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    query = {}
    if time_slot:
        query["time_slot"] = time_slot

    items = get_collection("menu_items")
    cursor = items.find(query).sort("time_slot", 1)
    results = []
    async for doc in cursor:
        results.append(_item_out(doc))
    return {"items": results}


@router.post("")
async def create_item(
    data: MenuItemCreate,
    current_user: dict = Depends(require_role("manager", "admin")),
):
    items = get_collection("menu_items")

    # Check for duplicate: same name (case-insensitive) in same time_slot
    existing = await items.find_one({
        "name": {"$regex": f"^{data.name}$", "$options": "i"},
        "time_slot": data.time_slot,
    })
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"'{data.name}' already exists in {data.time_slot}. Edit the existing item instead.",
        )

    doc = {
        **data.model_dump(),
        "created_by": current_user["_id"],
        "created_at": datetime.now(timezone.utc),
    }
    result = await items.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return _item_out(doc)


@router.put("/{item_id}")
async def update_item(
    item_id: str,
    data: MenuItemUpdate,
    current_user: dict = Depends(require_role("manager", "admin")),
):
    items = get_collection("menu_items")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await items.find_one_and_update(
        {"_id": ObjectId(item_id)},
        {"$set": update_data},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return _item_out(result)


@router.delete("/{item_id}")
async def delete_item(
    item_id: str,
    current_user: dict = Depends(require_role("manager", "admin")),
):
    items = get_collection("menu_items")
    result = await items.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"message": "Item deleted"}