from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

class UserBase(BaseModel):
    name: str
    email: str
    
class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool = True

    class Config:
        from_attributes = True

@router.get("", response_model=List[User])
async def get_users():
    try:
        # Here you would typically query your database
        # This is just an example response
        return [
            {"id": 1, "name": "John Doe", "email": "john@example.com", "is_active": True},
            {"id": 2, "name": "Jane Doe", "email": "jane@example.com", "is_active": True}
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}", response_model=User)
async def get_user(user_id: int):
    try:
        # Here you would typically query your database for the specific user
        # This is just an example response
        return {"id": user_id, "name": "John Doe", "email": "john@example.com", "is_active": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=User)
async def create_user(user: UserCreate):
    try:
        # Here you would typically create a new user in your database
        # This is just an example response
        return {"id": 1, **user.dict(), "is_active": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 