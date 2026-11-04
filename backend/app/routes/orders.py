import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from pydantic import BaseModel
from typing import List, Optional
from app.models.order import OrderCreate, OrderStatusUpdate
from app.database import get_collection
from app.middleware.auth import require_role, get_current_user
from app.routes.notifications import notify_user

router = APIRouter(prefix="/orders", tags=["orders"])


def _generate_order_code() -> str:
    return secrets.token_hex(3).upper()


def _order_out(order: dict) -> dict:
    order["_id"] = str(order["_id"])
    order["user_id"] = str(order["user_id"])
    return order


class CommentCreate(BaseModel):
    message: str


@router.post("")
async def place_order(
    data: OrderCreate,
    current_user: dict = Depends(require_role("user")),
):
    orders = get_collection("orders")
    total = sum(item.price * item.quantity for item in data.items)

    doc = {
        "user_id": ObjectId(current_user["_id"]),
        "user_name": current_user["name"],
        "items": [item.model_dump() for item in data.items],
        "total": round(total, 2),
        "status": "pending",
        "order_code": _generate_order_code(),
        "created_at": datetime.now(timezone.utc),
        "ready_at": None,
        "comments": [],
    }
    result = await orders.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    doc["user_id"] = current_user["_id"]
    return _order_out(doc)


@router.get("/mine")
async def my_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(require_role("user")),
):
    orders = get_collection("orders")
    filter_q = {"user_id": ObjectId(current_user["_id"])}
    total = await orders.count_documents(filter_q)
    cursor = orders.find(filter_q).sort("created_at", -1).skip(skip).limit(limit)
    results = []
    async for doc in cursor:
        results.append(_order_out(doc))
    return {"orders": results, "total": total, "has_more": skip + limit < total}


@router.get("/pending")
async def pending_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(require_role("manager", "admin")),
):
    orders = get_collection("orders")
    filter_q = {"status": {"$in": ["pending", "preparing", "ready", "paid"]}}
    total = await orders.count_documents(filter_q)
    cursor = orders.find(filter_q).sort("created_at", 1).skip(skip).limit(limit)
    results = []
    async for doc in cursor:
        results.append(_order_out(doc))
    return {"orders": results, "total": total, "has_more": skip + limit < total}


@router.get("/active")
async def active_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(require_role("manager", "admin")),
):
    orders = get_collection("orders")
    filter_q = {"status": {"$nin": ["delivered", "cancelled"]}}
    total = await orders.count_documents(filter_q)
    cursor = orders.find(filter_q).sort("created_at", 1).skip(skip).limit(limit)
    results = []
    async for doc in cursor:
        results.append(_order_out(doc))
    return {"orders": results, "total": total, "has_more": skip + limit < total}


@router.put("/{order_id}/status")
async def update_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    current_user: dict = Depends(require_role("manager", "admin")),
):
    orders = get_collection("orders")
    update_fields = {}
    push_fields = {}

    update_fields["status"] = data.status
    if data.status == "ready":
        update_fields["ready_at"] = datetime.now(timezone.utc)

    # Track who processed this status transition
    push_fields["processed_by"] = {
        "user_id": current_user["_id"],
        "user_name": current_user["name"],
        "role": current_user["role"],
        "status": data.status,
        "at": datetime.now(timezone.utc),
    }

    result = await orders.find_one_and_update(
        {"_id": ObjectId(order_id)},
        {"$set": update_fields, "$push": push_fields},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Order not found")

    if data.status == "ready":
        await notify_user(
            str(result["user_id"]),
            f"Your order #{result['order_code']} is ready! Please pay at the counter.",
            order_id=str(result["_id"]),
        )
    elif data.status == "paid":
        await notify_user(
            str(result["user_id"]),
            f"Payment confirmed for order #{result['order_code']}. Collect your food!",
            order_id=str(result["_id"]),
        )

    # Auto-post a default comment on every status change
    default_messages = {
        "preparing": "Your food is being prepared. Please wait while we cook your meal. Feel free to send any special requests.",
        "ready": "Your order is ready! Please proceed to the counter to pay and collect your food.",
        "paid": "Payment confirmed — please collect your food at the counter. Enjoy!",
        "delivered": "Order completed. Thank you for ordering with us! If you have any feedback, we'd love to hear it.",
    }
    if data.status in default_messages:
        auto_comment = {
            "user_id": current_user["_id"],
            "user_name": current_user["name"],
            "role": current_user["role"],
            "message": default_messages[data.status],
            "created_at": datetime.now(timezone.utc),
        }
        await orders.update_one(
            {"_id": ObjectId(order_id)},
            {"$push": {"comments": auto_comment}},
        )

    return _order_out(result)


@router.get("/all")
async def all_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(require_role("admin")),
):
    """Admin: view every order in the system (paginated)."""
    orders = get_collection("orders")
    total = await orders.count_documents({})
    cursor = orders.find({}).sort("created_at", -1).skip(skip).limit(limit)
    results = []
    async for doc in cursor:
        results.append(_order_out(doc))
    return {"orders": results, "total": total, "has_more": skip + limit < total}


@router.get("/stats")
async def order_stats(current_user: dict = Depends(require_role("admin"))):
    """Admin: aggregated stats — total orders, revenue, by time_slot."""
    orders = get_collection("orders")
    pipeline = [
        {"$match": {"status": {"$nin": ["cancelled"]}}},
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.time_slot",
            "count": {"$sum": 1},
            "revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}},
        }},
    ]
    slot_stats = {}
    async for doc in orders.aggregate(pipeline):
        slot = doc["_id"] if doc["_id"] else "unknown"
        slot_stats[slot] = {"count": doc["count"], "revenue": round(doc["revenue"], 2)}

    # Total counts
    total_all = await orders.count_documents({})
    total_active = await orders.count_documents({"status": {"$nin": ["delivered", "cancelled"]}})
    total_revenue_pipeline = [
        {"$match": {"status": {"$nin": ["cancelled"]}}},
        {"$unwind": "$items"},
        {"$group": {"_id": None, "total": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}}}},
    ]
    total_revenue = 0
    async for doc in orders.aggregate(total_revenue_pipeline):
        total_revenue = round(doc["total"], 2)

    # Status breakdown
    status_counts = {}
    async for doc in orders.aggregate([
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]):
        status_counts[doc["_id"]] = doc["count"]

    return {
        "total_orders": total_all,
        "active_orders": total_active,
        "total_revenue": total_revenue,
        "by_slot": slot_stats,
        "by_status": status_counts,
    }


@router.get("/by-emp-id")
async def orders_by_emp_id(
    emp_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(require_role("admin")),
):
    """Admin: lookup all orders for a specific employee ID."""
    users = get_collection("users")
    user = await users.find_one({"emp_id": emp_id})
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    orders = get_collection("orders")
    filter_q = {"user_id": ObjectId(user["_id"])}
    total = await orders.count_documents(filter_q)
    cursor = orders.find(filter_q).sort("created_at", -1).skip(skip).limit(limit)
    results = []
    async for doc in cursor:
        results.append(_order_out(doc))
    return {"orders": results, "user_name": user.get("name", emp_id), "total": total, "has_more": skip + limit < total}


@router.get("/favorites")
async def favorites(current_user: dict = Depends(require_role("user"))):
    """User: most frequently ordered items."""
    orders = get_collection("orders")
    pipeline = [
        {"$match": {"user_id": ObjectId(current_user["_id"])}},
        {"$unwind": "$items"},
        {"$group": {
            "_id": {"name": "$items.name", "price": "$items.price", "menu_item_id": "$items.menu_item_id", "time_slot": "$items.time_slot"},
            "count": {"$sum": "$items.quantity"},
        }},
        {"$sort": {"count": -1}},
        {"$limit": 6},
    ]
    results = []
    async for doc in orders.aggregate(pipeline):
        results.append({
            "menu_item_id": doc["_id"]["menu_item_id"],
            "name": doc["_id"]["name"],
            "price": doc["_id"]["price"],
            "time_slot": doc["_id"].get("time_slot", "other"),
            "times_ordered": doc["count"],
        })
    return {"items": results}


@router.get("/popular")
async def popular_orders(current_user: dict = Depends(require_role("user"))):
    """Global: most ordered items across all users."""
    orders = get_collection("orders")
    pipeline = [
        {"$match": {"status": {"$nin": ["cancelled"]}}},
        {"$unwind": "$items"},
        {"$group": {
            "_id": {"name": "$items.name", "price": "$items.price", "menu_item_id": "$items.menu_item_id", "time_slot": "$items.time_slot"},
            "count": {"$sum": "$items.quantity"},
        }},
        {"$sort": {"count": -1}},
        {"$limit": 6},
    ]
    results = []
    async for doc in orders.aggregate(pipeline):
        results.append({
            "menu_item_id": doc["_id"]["menu_item_id"],
            "name": doc["_id"]["name"],
            "price": doc["_id"]["price"],
            "time_slot": doc["_id"].get("time_slot", "other"),
            "times_ordered": doc["count"],
        })
    return {"items": results}


@router.get("/last")
async def last_ordered(current_user: dict = Depends(require_role("user"))):
    """User: most recently ordered distinct items (last N unique)."""
    orders = get_collection("orders")
    cursor = orders.find({"user_id": ObjectId(current_user["_id"])}).sort("created_at", -1)
    seen = set()
    results = []
    async for doc in cursor:
        for item in doc.get("items", []):
            key = item.get("menu_item_id") or item.get("name")
            if key not in seen:
                seen.add(key)
                results.append({
                    "menu_item_id": item.get("menu_item_id", ""),
                    "name": item["name"],
                    "price": item["price"],
                    "time_slot": item.get("time_slot", "other"),
                })
            if len(results) >= 6:
                break
        if len(results) >= 6:
            break
    return {"items": results}


@router.get("/processed")
async def processed_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(require_role("manager")),
):
    """Manager: orders where this manager performed at least one status change."""
    orders = get_collection("orders")
    filter_q = {"processed_by.user_id": current_user["_id"]}
    total = await orders.count_documents(filter_q)
    cursor = orders.find(filter_q).sort("created_at", -1).skip(skip).limit(limit)
    results = []
    async for doc in cursor:
        results.append(_order_out(doc))
    return {"orders": results, "total": total, "has_more": skip + limit < total}


@router.post("/{order_id}/comments")
async def add_comment(
    order_id: str,
    data: CommentCreate,
    current_user: dict = Depends(get_current_user),
):
    orders = get_collection("orders")
    order = await orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Users can only comment on their own orders; managers on any
    if current_user["role"] == "user" and str(order["user_id"]) != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not your order")

    comment = {
        "user_id": current_user["_id"],
        "user_name": current_user["name"],
        "role": current_user["role"],
        "message": data.message,
        "created_at": datetime.now(timezone.utc),
    }

    await orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$push": {"comments": comment}},
    )

    # Notify the other party
    if current_user["role"] in ("manager", "admin"):
        notify_msg = f"Staff update on #{order['order_code']}: {data.message}"
        await notify_user(str(order["user_id"]), notify_msg, order_id=order_id)
    else:
        notify_msg = f"User message on #{order['order_code']}: {data.message}"

    comment["created_at"] = comment["created_at"].isoformat()
    return {"comment": comment}


@router.delete("/{order_id}")
async def delete_order(
    order_id: str,
    current_user: dict = Depends(require_role("manager", "admin")),
):
    orders = get_collection("orders")
    order = await orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    await orders.delete_one({"_id": ObjectId(order_id)})

    await notify_user(
        str(order["user_id"]),
        f"Order #{order['order_code']} has been cancelled by staff.",
        order_id=order_id,
    )

    return {"message": "Order deleted"}