from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import plotly.graph_objects as go
import plotly.utils
import json
from auth.cognito import cognito_scheme
from database.dynamodb import dynamodb_client
from database.models import User

router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(cognito_scheme)]  # Apply Cognito auth to all endpoints in this router
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

def create_sample_plot() -> Dict[str, Any]:
    try:
        # Sample user activity data
        users = [
            {"id": 1, "name": "John Fred", "email": "john@example.com", "activity_score": 85},
            {"id": 2, "name": "Jane Doe", "email": "jane@example.com", "activity_score": 92},
            {"id": 3, "name": "Bob Smith", "email": "bob@example.com", "activity_score": 78},
            {"id": 4, "name": "Alice Johnson", "email": "alice@example.com", "activity_score": 95}
        ]
        
        # Create lists for x and y values
        names = [user["name"] for user in users]
        scores = [user["activity_score"] for user in users]
        
        # Create a bar chart
        fig = go.Figure(data=[
            go.Bar(
                x=names,
                y=scores,
                marker_color='rgb(55, 83, 109)'
            )
        ])
        
        # Update layout with title and axis labels
        fig.update_layout(
            title="User Activity Scores",
            xaxis_title="User Name",
            yaxis_title="Activity Score",
            template="plotly_white"
        )
        
        # Convert to JSON format
        return json.loads(json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating plot: {str(e)}")

@router.get("", response_model=Dict[str, Any])
async def get_users():
    try:
        # Generate the plot data
        plot_data = create_sample_plot()
        
        # Return both user data and plot data
        return {
            "users": [
                {"id": 1, "name": "John Doe", "email": "john@example.com", "is_active": True},
                {"id": 2, "name": "Jane Doe", "email": "jane@example.com", "is_active": True}
            ],
            "plot": plot_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}", response_model=User)
async def get_user(user_id: int):
    try:
        item = await dynamodb_client.get_item("users", {"id": str(user_id)})
        if not item:
            raise HTTPException(status_code=404, detail="User not found")
        return User.from_item(item)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users", response_model=User)
async def create_user(user: User):
    try:
        success = await dynamodb_client.put_item("users", user.to_item())
        if not success:
            raise HTTPException(status_code=500, detail="Failed to create user")
        return user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/email/{email}", response_model=List[User])
async def get_user_by_email(email: str):
    try:
        items = await dynamodb_client.query_by_index(
            "users",
            "email-index",
            "email = :email",
            {":email": email}
        )
        return [User.from_item(item) for item in items]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, user: User):
    try:
        # Ensure the user exists
        existing_user = await dynamodb_client.get_item("users", {"id": user_id})
        if not existing_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Update the user
        user.id = user_id  # Ensure we don't change the ID
        success = await dynamodb_client.put_item("users", user.to_item())
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update user")
        return user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    try:
        success = await dynamodb_client.delete_item("users", {"id": user_id})
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete user")
        return {"message": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 