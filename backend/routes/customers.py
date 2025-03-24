from fastapi import APIRouter, Depends, HTTPException
from typing import List
from auth.cognito import cognito_scheme
from database.dynamodb import dynamodb_client, DynamoDBClient
from database.models import Customer

router = APIRouter(
    prefix="/customers",
    tags=["customers"],
    dependencies=[Depends(cognito_scheme)]
)

@router.post("", response_model=Customer)
async def create_customer(customer: Customer):
    try:
        success = await dynamodb_client.put_item(DynamoDBClient.CUSTOMERS_TABLE, customer.to_item())
        if not success:
            raise HTTPException(status_code=500, detail="Failed to create customer")
        return customer
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[Customer])
async def get_customers():
    try:
        # For now, we'll use a scan operation since we're getting all customers
        # In a production environment, you might want to implement pagination
        items = await dynamodb_client.scan_table(DynamoDBClient.CUSTOMERS_TABLE)
        return [Customer.from_item(item) for item in items]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str):
    try:
        item = await dynamodb_client.get_item(DynamoDBClient.CUSTOMERS_TABLE, {"id": customer_id})
        if not item:
            raise HTTPException(status_code=404, detail="Customer not found")
        return Customer.from_item(item)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/name/{name}", response_model=List[Customer])
async def get_customer_by_name(name: str):
    try:
        items = await dynamodb_client.query_by_index(
            DynamoDBClient.CUSTOMERS_TABLE,
            "name-index",
            "name = :name",
            {":name": name}
        )
        return [Customer.from_item(item) for item in items]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, customer: Customer):
    try:
        # Ensure the customer exists
        existing_customer = await dynamodb_client.get_item(DynamoDBClient.CUSTOMERS_TABLE, {"id": customer_id})
        if not existing_customer:
            raise HTTPException(status_code=404, detail="Customer not found")

        # Update the customer
        customer.id = customer_id  # Ensure we don't change the ID
        success = await dynamodb_client.put_item(DynamoDBClient.CUSTOMERS_TABLE, customer.to_item())
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update customer")
        return customer
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{customer_id}")
async def delete_customer(customer_id: str):
    try:
        success = await dynamodb_client.delete_item(DynamoDBClient.CUSTOMERS_TABLE, {"id": customer_id})
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete customer")
        return {"message": "Customer deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 