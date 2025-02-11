from fastapi import APIRouter, Depends, HTTPException, status, Form, Security, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Dict
from pydantic import BaseModel
from .. import models, auth
from ..database import get_db
import logging
import traceback  # For detailed error logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Configure OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    try:
        # Log incoming data
        logger.info("Login attempt received")
        logger.info(f"Login attempt with username: {form_data.username}")
        
        # Query user
        user = db.query(models.User).filter(models.User.username == form_data.username).first()
        logger.info(f"Found user: {user is not None}")
        
        if not user:
            logger.warning(f"Login failed - user not found: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        logger.info(f"User details - ID: {user.id}, Hash: {user.password_hash}")
        
        # Verify password
        try:
            is_valid = auth.verify_password(form_data.password, user.password_hash)
            logger.info(f"Password verification result: {is_valid}")
            
            if not is_valid:
                logger.warning(f"Login failed - invalid password for user: {form_data.username}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect username or password",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Generate tokens
            tokens = auth.create_tokens(user.id, user.username)
            logger.info(f"Login successful for user: {form_data.username}")
            return {
                "access_token": tokens["access_token"],
                "token_type": "bearer"
            }
        except Exception as e:
            logger.error(f"Password verification error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error verifying password"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during authentication"
        )

class RegisterRequest(BaseModel):
    username: str
    password: str
    email: str
    name: str

@router.post("/register")
async def register(
    user_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """Temporary endpoint for testing - creates a new admin user"""
    try:
        if db.query(models.User).filter(models.User.username == user_data.username).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        user = models.User(
            username=user_data.username,
            password_hash=auth.get_password_hash(user_data.password),
            email=user_data.email,
            name=user_data.name,
            role="admin"  # For testing, create as admin
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return auth.create_tokens(user.id, user.username)
    except Exception as e:
        db.rollback()
        print(f"Error in register: {str(e)}")  # Debug logging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
