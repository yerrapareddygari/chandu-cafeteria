from datetime import datetime, timezone
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.database import get_collection

router = APIRouter(prefix="/ws", tags=["notifications"])

active_connections: Dict[str, WebSocket] = {}


async def notify_user(user_id: str, message: str, order_id: str):
    notifs = get_collection("notifications")
    await notifs.insert_one({
        "user_id": user_id,
        "order_id": order_id,
        "message": message,
        "read": False,
        "created_at": datetime.now(timezone.utc),
    })

    ws = active_connections.get(user_id)
    if ws:
        try:
            await ws.send_json({"type": "notification", "message": message, "order_id": order_id})
        except Exception:
            active_connections.pop(user_id, None)


@router.websocket("/notifications")
async def websocket_notifications(websocket: WebSocket):
    await websocket.accept()
    user_id = None

    try:
        data = await websocket.receive_json()
        user_id = data.get("user_id")
        if not user_id:
            await websocket.close(code=4000)
            return

        active_connections[user_id] = websocket

        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        pass
    finally:
        if user_id:
            active_connections.pop(user_id, None)


@router.get("/notifications")
async def get_notifications(user_id: str):
    notifs = get_collection("notifications")
    cursor = notifs.find({"user_id": user_id}).sort("created_at", -1).limit(50)
    results = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        results.append(doc)
    return {"notifications": results}