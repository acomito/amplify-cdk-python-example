from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Optional
import os
from dotenv import load_dotenv
import requests

load_dotenv()

# Cognito configuration
REGION = os.getenv('AWS_REGION', 'us-east-1')
USER_POOL_ID = os.getenv('COGNITO_USER_POOL_ID')
CLIENT_ID = os.getenv('COGNITO_CLIENT_ID')

# Get the JSON Web Key Set (JWKS) from Cognito
JWKS_URL = f'https://cognito-idp.{REGION}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json'
try:
    JWKS = requests.get(JWKS_URL).json()
except Exception as e:
    print(f"Error fetching JWKS: {e}")
    JWKS = {"keys": []}

cognito_scheme = HTTPBearer()

class CognitoBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)

    async def __call__(self, request: Request) -> Optional[HTTPAuthorizationCredentials]:
        credentials: HTTPAuthorizationCredentials = await super().__call__(request)
        
        if not credentials:
            if self.auto_error:
                raise HTTPException(
                    status_code=403,
                    detail="Invalid authorization code."
                )
            else:
                return None

        if not credentials.scheme == "Bearer":
            if self.auto_error:
                raise HTTPException(
                    status_code=403,
                    detail="Invalid authentication scheme."
                )
            else:
                return None

        if not await self.verify_jwt(credentials.credentials):
            if self.auto_error:
                raise HTTPException(
                    status_code=403,
                    detail="Invalid token or expired token."
                )
            else:
                return None

        return credentials

    async def verify_jwt(self, token: str) -> bool:
        try:
            # Decode the token header to get the key ID (kid)
            header = jwt.get_unverified_header(token)
            kid = header.get('kid')
            
            # Find the corresponding public key from JWKS
            key = None
            for jwk in JWKS['keys']:
                if jwk.get('kid') == kid:
                    key = jwk
                    break
            
            if not key:
                return False

            # Verify the token
            payload = jwt.decode(
                token,
                key,
                algorithms=['RS256'],
                audience=CLIENT_ID,
                issuer=f'https://cognito-idp.{REGION}.amazonaws.com/{USER_POOL_ID}'
            )
            
            return True
        except JWTError:
            return False
        except Exception as e:
            print(f"Error verifying JWT: {e}")
            return False 