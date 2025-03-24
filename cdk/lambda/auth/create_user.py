import os
import boto3
from datetime import datetime

def handler(event, context):
    try:
        # Extract user attributes from the Cognito event
        user_attributes = event['request']['userAttributes']
        
        # Get the user's sub (unique identifier) and email
        user_id = user_attributes.get('sub')
        email = user_attributes.get('email', '').lower()
        
        # Initialize DynamoDB client
        dynamodb = boto3.resource('dynamodb')
        users_table = dynamodb.Table(os.environ['DYNAMODB_USERS_TABLE'])
        
        # Create user record
        user_record = {
            'id': user_id,
            'email': email,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'status': 'active'
        }
        
        # Store in DynamoDB
        users_table.put_item(Item=user_record)
        
        print(f"Successfully created user record for {email}")
        
        # Return the event object back to Cognito
        return event
        
    except Exception as e:
        print(f'Error in post-signup handler: {str(e)}')
        # Still return the event to allow the user to be created in Cognito
        return event 