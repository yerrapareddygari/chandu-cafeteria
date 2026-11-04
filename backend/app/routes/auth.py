from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from passlib.context import CryptContext
from app.models.user import UserCreate, UserLogin, user_to_out
from app.database import get_collection
from app.middleware.auth import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/register")
async def register(data: UserCreate):
    users = get_collection("users")

    if await users.find_one({"emp_id": data.emp_id}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Employee ID already registered")

    if await users.find_one({"email": data.email}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user_doc = {
        "emp_id": data.emp_id,
        "name": data.name,
        "email": data.email,
        "hashed_password": pwd_context.hash(data.password),
        "role": "user",
        "department": data.department,
        "created_at": datetime.now(timezone.utc),
    }

    result = await users.insert_one(user_doc)
    return {"message": "User registered successfully", "user_id": str(result.inserted_id)}


@router.post("/login")
async def login(data: UserLogin):
    users = get_collection("users")
    user = await users.find_one({"emp_id": data.emp_id})

    if not user or not pwd_context.verify(data.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid employee ID or password")

    token = create_access_token({"sub": str(user["_id"])})
    return {
        "token": token,
        "user": user_to_out(user),
    }


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return user_to_out(current_user)