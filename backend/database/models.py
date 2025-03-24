from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime

class User(BaseModel):
    id: str = None
    email: EmailStr
    created_at: str = None
    updated_at: str = None

    def __init__(self, **data):
        # Generate new UUID and timestamps for each instance
        if 'id' not in data:
            data['id'] = str(uuid4())
        if 'created_at' not in data:
            data['created_at'] = datetime.utcnow().isoformat()
        if 'updated_at' not in data:
            data['updated_at'] = datetime.utcnow().isoformat()
        super().__init__(**data)

    def to_item(self) -> dict:
        return self.model_dump()

    @classmethod
    def from_item(cls, item: dict) -> "User":
        return cls(**item)

class Site(BaseModel):
    id: str = None
    name: str
    created_at: str = None
    updated_at: str = None

    def __init__(self, **data):
        # Generate new UUID and timestamps for each instance
        if 'id' not in data:
            data['id'] = str(uuid4())
        if 'created_at' not in data:
            data['created_at'] = datetime.utcnow().isoformat()
        if 'updated_at' not in data:
            data['updated_at'] = datetime.utcnow().isoformat()
        super().__init__(**data)

    def to_item(self) -> dict:
        return self.model_dump()

    @classmethod
    def from_item(cls, item: dict) -> "Site":
        return cls(**item)

class Customer(BaseModel):
    id: str = None
    name: str
    logo: Optional[HttpUrl] = None
    created_at: str = None
    updated_at: str = None

    def __init__(self, **data):
        # Generate new UUID and timestamps for each instance
        if 'id' not in data:
            data['id'] = str(uuid4())
        if 'created_at' not in data:
            data['created_at'] = datetime.utcnow().isoformat()
        if 'updated_at' not in data:
            data['updated_at'] = datetime.utcnow().isoformat()
        super().__init__(**data)

    def to_item(self) -> dict:
        data = self.model_dump()
        # Convert HttpUrl to string for DynamoDB
        if data.get('logo'):
            data['logo'] = str(data['logo'])
        return data

    @classmethod
    def from_item(cls, item: dict) -> "Customer":
        return cls(**item)

    model_config = {
        "from_attributes": True
    }