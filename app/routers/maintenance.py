from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, database, permissions
from datetime import datetime
from typing import Optional

router = APIRouter()

@router.get("/maintenance/status")
async def get_maintenance_status(db: Session = Depends(database.get_db)):
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
    is_enabled: bool,
    message: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    allow_admin_access: bool = True,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.SYSTEM_CONFIG))
):
    """Update maintenance mode configuration"""
    try:
        config = db.query(models.MaintenanceConfig).first()
        if not config:
            config = models.MaintenanceConfig()
            db.add(config)
        
        config.is_enabled = is_enabled
        config.message = message
        config.start_time = start_time
        config.end_time = end_time
        config.allow_admin_access = allow_admin_access
        
        db.commit()
        db.refresh(config)
        return {
            "is_enabled": config.is_enabled,
            "message": config.message,
            "start_time": config.start_time,
            "end_time": config.end_time,
            "allow_admin_access": config.allow_admin_access
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"فشل في تحديث إعدادات الصيانة: {str(e)}")
