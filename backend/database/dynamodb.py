import os
import boto3
from typing import Any, Dict, List, Optional, Literal
from botocore.exceptions import ClientError

# Define valid table names as a literal type
TableName = Literal['users', 'sites', 'customers']

class DynamoDBClient:
    # Table name constants
    USERS_TABLE = 'users'
    SITES_TABLE = 'sites'
    CUSTOMERS_TABLE = 'customers'

    # Environment variable mapping
    TABLE_ENV_VARS = {
        USERS_TABLE: 'DYNAMODB_USERS_TABLE',
        SITES_TABLE: 'DYNAMODB_SITES_TABLE',
        CUSTOMERS_TABLE: 'DYNAMODB_CUSTOMERS_TABLE'
    }

    def __init__(self):
        try:
            # Validate required environment variables
            required_env_vars = [
                'AWS_REGION',
                *self.TABLE_ENV_VARS.values()
            ]
            
            missing_vars = [var for var in required_env_vars if not os.getenv(var)]
            if missing_vars:
                raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

            self.region = os.getenv('AWS_REGION')
            print(f"Initializing DynamoDB client in region: {self.region}")

            self.dynamodb = boto3.resource(
                'dynamodb',
                region_name=self.region
            )

            # Initialize tables with environment variables
            self.tables = {
                table_name: self.dynamodb.Table(os.getenv(env_var))
                for table_name, env_var in self.TABLE_ENV_VARS.items()
            }

            # Store actual table names for reference
            self.actual_table_names = {
                table_name: table.table_name
                for table_name, table in self.tables.items()
            }

            # Verify table names and print schemas
            print("Initialized DynamoDB tables:")
            for logical_name, table in self.tables.items():
                print(f"- {logical_name}: {table.table_name}")
                # Print table schema
                table_desc = table.meta.client.describe_table(TableName=table.table_name)
                key_schema = table_desc['Table']['KeySchema']
                print(f"  Key Schema: {key_schema}")

        except Exception as e:
            raise Exception(f"Failed to initialize DynamoDB client: {str(e)}")

    def get_table(self, table_name: TableName):
        """Get a table by name."""
        table = self.tables.get(table_name)
        if not table:
            raise ValueError(
                f"Invalid table name: '{table_name}'. "
                f"Must be one of: {list(self.TABLE_ENV_VARS.keys())}. "
                f"Actual table names are: {self.actual_table_names}"
            )
        return table

    def get_actual_table_name(self, table_name: TableName) -> str:
        """Get the actual DynamoDB table name for a logical table name."""
        return self.actual_table_names[table_name]

    async def get_item(self, table_name: TableName, key: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Get an item from a table by its key."""
        try:
            table = self.get_table(table_name)
            response = table.get_item(Key=key)
            return response.get('Item')
        except ClientError as e:
            print(f"Error getting item from {self.get_actual_table_name(table_name)}: {str(e)}")
            return None

    async def put_item(self, table_name: TableName, item: Dict[str, Any]) -> bool:
        """Put an item into a table."""
        try:
            table = self.get_table(table_name)
            # Ensure the item has an id field
            if 'id' not in item:
                print(f"Error: Item must have an 'id' field for table {self.get_actual_table_name(table_name)}")
                return False
                
            # First check if the item exists
            existing_item = await self.get_item(table_name, {'id': item['id']})
            if existing_item:
                print(f"Warning: Overwriting existing item with id {item['id']} in {self.get_actual_table_name(table_name)}")
            
            table.put_item(Item=item)
            return True
        except ClientError as e:
            print(f"Error putting item into {self.get_actual_table_name(table_name)}: {str(e)}")
            return False

    async def scan_table(self, table_name: TableName, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Scan a table with optional pagination."""
        try:
            table = self.get_table(table_name)
            params = {}
            if limit:
                params['Limit'] = limit
            
            items = []
            response = table.scan(**params)
            items.extend(response.get('Items', []))

            # Handle pagination if there are more items
            while 'LastEvaluatedKey' in response:
                params['ExclusiveStartKey'] = response['LastEvaluatedKey']
                response = table.scan(**params)
                items.extend(response.get('Items', []))
                
                # If we have a limit and we've reached it, stop
                if limit and len(items) >= limit:
                    items = items[:limit]
                    break

            return items
        except ClientError as e:
            print(f"Error scanning table {self.get_actual_table_name(table_name)}: {str(e)}")
            return []

    async def query_by_index(
        self, 
        table_name: TableName, 
        index_name: str, 
        key_condition_expression: str,
        expression_attribute_values: Dict[str, Any],
        expression_attribute_names: Optional[Dict[str, str]] = None
    ) -> List[Dict[str, Any]]:
        """Query items using a GSI."""
        try:
            table = self.get_table(table_name)
            params = {
                'IndexName': index_name,
                'KeyConditionExpression': key_condition_expression,
                'ExpressionAttributeValues': expression_attribute_values,
            }
            if expression_attribute_names:
                params['ExpressionAttributeNames'] = expression_attribute_names

            response = table.query(**params)
            return response.get('Items', [])
        except ClientError as e:
            print(f"Error querying {self.get_actual_table_name(table_name)} with index {index_name}: {str(e)}")
            return []

    async def update_item(
        self,
        table_name: TableName,
        key: Dict[str, Any],
        update_expression: str,
        expression_attribute_values: Dict[str, Any],
        expression_attribute_names: Optional[Dict[str, str]] = None
    ) -> bool:
        """Update an item in a table."""
        try:
            table = self.get_table(table_name)
            params = {
                'Key': key,
                'UpdateExpression': update_expression,
                'ExpressionAttributeValues': expression_attribute_values,
            }
            if expression_attribute_names:
                params['ExpressionAttributeNames'] = expression_attribute_names

            table.update_item(**params)
            return True
        except ClientError as e:
            print(f"Error updating item in {self.get_actual_table_name(table_name)}: {str(e)}")
            return False

    async def delete_item(self, table_name: TableName, key: Dict[str, Any]) -> bool:
        """Delete an item from a table."""
        try:
            table = self.get_table(table_name)
            table.delete_item(Key=key)
            return True
        except ClientError as e:
            print(f"Error deleting item from {self.get_actual_table_name(table_name)}: {str(e)}")
            return False

    async def get_table_info(self, table_name: TableName) -> Dict[str, Any]:
        """Get detailed information about a table."""
        try:
            table = self.get_table(table_name)
            return table.meta.client.describe_table(TableName=table.table_name)
        except ClientError as e:
            print(f"Error getting table info for {self.get_actual_table_name(table_name)}: {str(e)}")
            return {}

# Create a singleton instance
dynamodb_client = DynamoDBClient() 