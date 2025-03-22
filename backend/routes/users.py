from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import plotly.graph_objects as go
import plotly.utils
import json
from auth.cognito import cognito_scheme

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