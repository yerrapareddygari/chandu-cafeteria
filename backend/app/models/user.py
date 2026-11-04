from datetime import datetime, timezone
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal

Role = Literal["user", "manager", "admin"]


class UserCreate(BaseModel):
    emp_id: str = Field(..., min_length=3, max_length=20)
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    department: str = "General"


class UserLogin(BaseModel):
    emp_id: str
    password: str


class UserOut(BaseModel):
    id: str = Field(alias="_id")
    emp_id: str
    name: str
    email: str
    role: Role
    department: str
    created_at: datetime

    class Config:
        populate_by_name = True


class UserInDB(BaseModel):
    emp_id: str
    name: str
    email: str
    hashed_password: str
    role: Role = "user"
    department: str = "General"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def user_to_out(user_doc: dict) -> dict:
    """Return a safe user dict for API responses — strips hashed_password."""
    return {
        "_id": str(user_doc["_id"]),
        "emp_id": user_doc["emp_id"],
        "name": user_doc["name"],
        "email": user_doc["email"],
        "role": user_doc["role"],
        "department": user_doc.get("department", "General"),
        "created_at": user_doc.get("created_at"),
    }