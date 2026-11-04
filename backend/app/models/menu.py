from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import Optional, Literal

TimeSlot = Literal["breakfast", "lunch", "snacks", "other"]


class MenuItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(default="general")
    price: float = Field(..., gt=0)
    time_slot: TimeSlot
    description: str = ""
    image_url: str = ""
    available: bool = True


class MenuItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    time_slot: Optional[TimeSlot] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    available: Optional[bool] = None


class MenuItemOut(BaseModel):
    id: str = Field(alias="_id")
    name: str
    category: str
    price: float
    time_slot: str
    description: str
    image_url: str
    available: bool
    created_by: str
    created_at: datetime

    class Config:
        populate_by_name = True