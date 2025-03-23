from fastapi import APIRouter, Depends
from auth.cognito import cognito_scheme
from database.dynamodb import dynamodb_client, DynamoDBClient
from database.models import Customer
import os
 

router = APIRouter(
    prefix="/customers",
    tags=["customers"],
    dependencies=[Depends(cognito_scheme)]
)

EXAMPLE_CUSTOMERS = [
    {
        "name": "Acme Corporation",
        "logo": "https://example.com/logos/acme.png"
    },
    {
        "name": "Stark Industries",
        "logo": "https://example.com/logos/stark.png"
    },
    {
        "name": "Wayne Enterprises",
        "logo": "https://example.com/logos/wayne.png"
    },
    {
        "name": "Umbrella Corporation",
        "logo": "https://example.com/logos/umbrella.png"
    },
    {
        "name": "Cyberdyne Systems",
        "logo": "https://example.com/logos/cyberdyne.png"
    },
    {
        "name": "Oscorp Industries",
        "logo": "https://example.com/logos/oscorp.png"
    },
    {
        "name": "Weyland-Yutani Corp",
        "logo": "https://example.com/logos/weyland.png"
    },
    {
        "name": "Tyrell Corporation",
        "logo": "https://example.com/logos/tyrell.png"
    },
    {
        "name": "Initech",
        "logo": "https://example.com/logos/initech.png"
    }
]

async def seed_example_customers():
    """Seed example customers if we're not in production and the table is empty."""
    try:
        # Check if we're in production
        if os.getenv('APP_ENV', 'development').lower() == 'production':
            print("Skipping customer seeding in production environment")
            return

        # Check if table is empty
        existing_items = await dynamodb_client.scan_table(DynamoDBClient.CUSTOMERS_TABLE)
        if existing_items and len(existing_items) > 0:
            print("Customers table already contains data, skipping seeding")
            return

        print("Seeding example customers...")
        for customer_data in EXAMPLE_CUSTOMERS:
            customer = Customer(**customer_data)
            success = await dynamodb_client.put_item(DynamoDBClient.CUSTOMERS_TABLE, customer.to_item())
            if not success:
                print(f"Failed to seed customer: {customer.name}")
            else:
                print(f"Seeded customer: {customer.name}")

        print("Finished seeding example customers")
    except Exception as e:
        print(f"Error seeding customers: {str(e)}")