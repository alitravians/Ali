from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas, permissions
from ..database import get_db
from datetime import datetime, timezone
from typing import Optional

router = APIRouter()

@router.get("/maintenance/status")
async def get_maintenance_status(db: Session = Depends(get_db)):
    """Get maintenance mode status"""
    config = db.query(models.MaintenanceConfig).first()
    if not config:
        return {
            "is_enabled": False,
            "message": None,
            "start_time": None,
            "end_time": None,
            "allow_admin_access": True
        }
    return {
        "is_enabled": config.is_enabled,
        "message": config.message,
        "start_time": config.start_time,
        "end_time": config.end_time,
        "allow_admin_access": config.allow_admin_access
    }

@router.put("/maintenance/config")
async def update_maintenance_config(
    config_update: schemas.MaintenanceConfigUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.SYSTEM_CONFIG))
):
    """Update maintenance mode configuration"""
    try:
        # Create initial config if it doesn't exist
        config = db.query(models.MaintenanceConfig).first()
        if not config:
            config = models.MaintenanceConfig(
                is_enabled=0,  # Use explicit integer for SQLite boolean
                message="النظام تحت الصيانة حالياً",
                allow_admin_access=1  # Use explicit integer for SQLite boolean
            )
            db.add(config)
            db.commit()
            db.refresh(config)
        
        # Update config values with explicit type conversion for SQLite
        config.is_enabled = 1 if config_update.is_enabled else 0
        config.message = config_update.message if config_update.message else "النظام تحت الصيانة"
        config.start_time = config_update.start_time
        config.end_time = config_update.end_time
        config.allow_admin_access = 1 if config_update.allow_admin_access else 0
        config.updated_at = datetime.now(timezone.utc)
        
        # Commit changes and refresh to get the latest state
        db.commit()
        db.refresh(config)
        
        # Return the updated config with explicit type conversion
        return {
            "is_enabled": bool(config.is_enabled),
            "message": str(config.message),
            "start_time": config.start_time,
            "end_time": config.end_time,
            "allow_admin_access": bool(config.allow_admin_access)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"فشل في تحديث إعدادات الصيانة: {str(e)}"
        )
