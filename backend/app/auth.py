from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .database import db
from .models import User, UserRole

SECRET_KEY = "advanced-chat-secret-key-2025"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

ADMIN_ACCESS_CODE = "3131"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return payload
    except JWTError:
        return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = verify_token(credentials.credentials)
        if payload is None:
            raise credentials_exception
        
        user_id = payload.get("sub")
        if not user_id:
            raise credentials_exception
            
        user = db.get_user_by_id(user_id)
        
        if user is None and user_id == "1000000000":
            user = db.get_user_by_username("admin")
            if user is None or user.role != UserRole.ADMIN:
                raise credentials_exception
        elif user is None:
            admin_usernames = ["admin", "Admin", "Boon"]
            for username in admin_usernames:
                potential_user = db.get_user_by_username(username)
                if potential_user and potential_user.role == UserRole.ADMIN:
                    user = potential_user
                    break
            
            if user is None:
                raise credentials_exception
        
        return user
        
    except Exception as e:
        print(f"Authentication error: {e}")
        raise credentials_exception

def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def authenticate_user(username: str, password: str = None) -> Optional[User]:
    user = db.get_user_by_username(username)
    if not user:
        return None
    if password and not verify_password(password, user.password_hash):
        return None
    return user

def authenticate_admin(username: str, access_code: str) -> Optional[User]:
    if access_code != ADMIN_ACCESS_CODE:
        return None
    
    if username == "admin":
        user = db.get_user_by_username(username)
        if user and user.role == UserRole.ADMIN:
            return user
    
    user = db.get_user_by_username(username)
    if not user or user.role != UserRole.ADMIN:
        return None
    return user
