from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer
import jwt
from datetime import datetime, timedelta
from typing import Optional
from database import db

SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

def create_access_token(username: str) -> str:
    """Create JWT access token for username-only authentication"""
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": username,
        "exp": expire,
        "iat": datetime.utcnow()
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> str:
    """Verify JWT token and return username"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(token: str = Depends(security)) -> str:
    """Dependency for protected routes - returns username"""
    username = verify_token(token.credentials)
    
    user = db.get_user_by_username(username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.status == "banned" and user.ban_until and user.ban_until > datetime.now():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User is banned until {user.ban_until}. Reason: {user.ban_reason}",
        )
    
    return username

def get_current_user_object(token: str = Depends(security)):
    """Dependency that returns the full User object"""
    username = get_current_user(token)
    user = db.get_user_by_username(username)
    return user

def require_admin(current_user = Depends(get_current_user_object)):
    """Dependency that requires admin role"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def require_moderator_or_admin(current_user = Depends(get_current_user_object)):
    """Dependency that requires moderator or admin role"""
    if current_user.role not in ["moderator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Moderator or admin access required"
        )
    return current_user

def authenticate_user(username: str) -> Optional[str]:
    """Simple username-only authentication - creates user if doesn't exist"""
    user = db.get_user_by_username(username)
    
    if user is None:
        role = "user"
        if username == "admin":
            role = "admin"
        elif username == "مشرف" or username == "moderator":
            role = "moderator"
        
        user = db.create_user(username=username, role=role)
    
    if user.status == "banned" and user.ban_until and user.ban_until > datetime.now():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User is banned until {user.ban_until}. Reason: {user.ban_reason}",
        )
    
    access_token = create_access_token(username=username)
    return access_token
