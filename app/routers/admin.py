from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from .. import models, permissions
from ..database import get_db
from ..auth import get_password_hash
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/admin", tags=["admin"])

# User Management Models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str
    name: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr]
    role: Optional[str]
    name: Optional[str]
    is_active: Optional[bool]

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    name: str
    created_at: datetime
    is_active: bool

# Analytics Models
class SystemStats(BaseModel):
    total_students: int
    total_books: int
    active_loans: int
    overdue_loans: int
    total_rules: int

class AuditLog(BaseModel):
    id: int
    user_id: int
    action: str
    resource: str
    timestamp: datetime
    details: str

# User Management Endpoints
@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_USERS))
):
    """List all users in the system"""
    try:
        users = db.query(models.User).all()
        return [UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role,
            name=user.name,
            created_at=user.created_at,
            is_active=True  # Default value since we don't track this yet
        ) for user in users]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/users", response_model=UserResponse)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_USERS))
):
    """Create a new user"""
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    db_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=get_password_hash(user.password),
        role=user.role,
        name=user.name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_USERS))
):
    """Update user details"""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Only admins can change roles
    if user.role and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only administrators can change user roles"
        )
    
    for field, value in user.dict(exclude_unset=True).items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

# System Configuration and Analytics
@router.get("/stats", response_model=SystemStats)
async def get_system_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.VIEW_ANALYTICS))
):
    """Get system-wide statistics"""
    return {
        "total_students": db.query(models.Student).count(),
        "total_books": db.query(models.Book).count(),
        "active_loans": db.query(models.BookLoan).filter(models.BookLoan.status == "borrowed").count(),
        "overdue_loans": db.query(models.BookLoan).filter(
            models.BookLoan.due_date < datetime.utcnow(),
            models.BookLoan.status == "borrowed"
        ).count(),
        "total_rules": db.query(models.SchoolRule).count()
    }

@router.get("/audit-logs", response_model=List[AuditLog])
async def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.VIEW_AUDIT_LOGS))
):
    """Get system audit logs"""
    # This would typically be implemented with a proper audit log table
    # For now, we'll return a placeholder
    return []

# Emergency Override
@router.post("/emergency-override/{resource_id}")
async def emergency_override(
    resource_id: int,
    action: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.require_emergency_override)
):
    """Perform emergency override operations"""
    # Implementation would depend on specific override requirements
    return {"message": f"Emergency override {action} performed on resource {resource_id}"}

# System Configuration
@router.get("/config")
async def get_system_config(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.SYSTEM_CONFIG))
):
    """Get system configuration"""
    return {
        "maintenance_mode": False,
        "allow_new_registrations": True,
        "max_loan_period_days": 14,
        "max_active_loans_per_student": 3
    }

@router.put("/config")
async def update_system_config(
    config: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.SYSTEM_CONFIG))
):
    """Update system configuration"""
    # Implementation would typically involve updating a config table or env vars
    return {"message": "System configuration updated successfully"}
