from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from pydantic import BaseModel
from app.database import get_collection
from app.middleware.auth import get_current_user, require_role
from app.models.user import user_to_out

router = APIRouter(prefix="/admin", tags=["admin"])


class GrantAccessRequest(BaseModel):
    user_id: str


@router.get("/users")
async def list_users(current_user: dict = Depends(require_role("admin"))):
    users = get_collection("users")
    cursor = users.find({})
    results = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        doc.pop("hashed_password", None)
        results.append(doc)
    return {"users": results}


@router.post("/grant-access")
async def grant_access(
    req: GrantAccessRequest,
    current_user: dict = Depends(require_role("admin")),
):
    users = get_collection("users")
    result = await users.find_one_and_update(
        {"_id": ObjectId(req.user_id)},
        {"$set": {"role": "manager"}},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    result["_id"] = str(result["_id"])
    result.pop("hashed_password", None)
    return {"message": "User promoted to manager", "user": result}


@router.post("/revoke-access")
async def revoke_access(
    req: GrantAccessRequest,
    current_user: dict = Depends(require_role("admin")),
):
    users = get_collection("users")
    result = await users.find_one_and_update(
        {"_id": ObjectId(req.user_id)},
        {"$set": {"role": "user"}},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    result["_id"] = str(result["_id"])
    result.pop("hashed_password", None)
    return {"message": "User demoted to user", "user": result}