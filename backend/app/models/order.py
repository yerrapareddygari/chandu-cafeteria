from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

OrderStatus = Literal["pending", "preparing", "ready", "paid", "delivered", "cancelled"]


class OrderItem(BaseModel):
    menu_item_id: str
    name: str
    quantity: int = Field(default=1, ge=1)
    price: float
    time_slot: Optional[str] = None


class OrderCreate(BaseModel):
    items: List[OrderItem]


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderOut(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    user_name: str
    items: List[OrderItem]
    total: float
    status: OrderStatus
    order_code: str
    created_at: datetime
    ready_at: Optional[datetime] = None

    class Config:
        populate_by_name = True