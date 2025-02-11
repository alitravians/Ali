from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from . import models
from .database import get_db

# Constants
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"  # Fixed key for testing
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Debug logging
import logging
logging.basicConfig(level=logging.INFO)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        logging.info(f"Attempting to verify password")  # Debug logging
        result = pwd_context.verify(plain_password, hashed_password)
        logging.info(f"Password verification result: {result}")  # Debug logging
        return result
    except Exception as e:
        logging.error(f"Password verification error: {str(e)}")
        logging.error(f"Plain password length: {len(plain_password)}")  # Debug logging
        logging.error(f"Hash length: {len(hashed_password)}")  # Debug logging
        return False

def get_password_hash(password: str) -> str:
    try:
        hashed = pwd_context.hash(password)
        logging.debug(f"Generated password hash: {hashed}")
        return hashed
    except Exception as e:
        logging.error(f"Password hashing error: {str(e)}")
        raise

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "refresh": True})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        user = db.query(models.User).filter(models.User.username == username).first()
        if user is None:
            raise credentials_exception
        return user
    except JWTError as e:
        print(f"JWT Error: {str(e)}")  # Debug logging
        raise credentials_exception
    except Exception as e:
        print(f"Unexpected error in get_current_user: {str(e)}")  # Debug logging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

def create_tokens(user_id: int, username: str, role: str) -> dict:
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": username, "id": user_id, "role": role},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        data={"sub": username, "id": user_id, "role": role}
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }
