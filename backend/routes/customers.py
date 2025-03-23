from fastapi import APIRouter, Depends, HTTPException
from typing import List
from pydantic import BaseModel
from auth.cognito import cognito_scheme

router = APIRouter(
    prefix="/customers",
    tags=["customers"],
    dependencies=[Depends(cognito_scheme)]
)

class CustomerResponse(BaseModel):
    id: str
    name: str
    logo: str
    plan: str

# Mock data
MOCK_CUSTOMERS = [
    {
        "id": "1",
        "name": "Acme Corporation",
        "logo": "default-logo",
        "plan": "Enterprise"
    },
    {
        "id": "2",
        "name": "Stark Industries",
        "logo": "default-logo",
        "plan": "Pro"
    },
    {
        "id": "3",
        "name": "Wayne Enterprises",
        "logo": "default-logo",
        "plan": "Enterprise"
    },
    {
        "id": "4",
        "name": "Umbrella Corp",
        "logo": "default-logo",
        "plan": "Basic"
    }
]

@router.get("/", response_model=List[CustomerResponse])
async def get_customers():
    try:
        return MOCK_CUSTOMERS
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch customers: {str(e)}") 