# This file contains helper functions for authentication

import bcrypt
from datetime import datetime, timedelta, timezone
from flask_jwt_extended import create_access_token, create_refresh_token

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

def generate_tokens(user_id: int, additional_claims: dict = None) -> dict:
    """Generate access and refresh tokens for a user"""
    if additional_claims is None:
        additional_claims = {}
    
    # Add user_id to claims
    identity = {'user_id': user_id, **additional_claims}
    
    # Create tokens with identity
    access_token = create_access_token(
        identity=identity,
        fresh=True
    )
    
    refresh_token = create_refresh_token(
        identity=identity
    )
    
    return {
        'access_token': access_token,
        'refresh_token': refresh_token
    }
