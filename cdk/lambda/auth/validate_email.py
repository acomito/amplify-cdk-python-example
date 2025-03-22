def handler(event, context):
    try:
        # Get the email from the request
        email = event['request']['userAttributes'].get('email', '').lower()
        
        # Check if email contains 'psm'
        if 'psm' not in email.split('@')[1]:
            raise Exception('Email domain must contain "psm"')
            
        # Return the event object back to Cognito
        return event
        
    except Exception as e:
        raise Exception(f'Error in pre-signup validation: {str(e)}') 