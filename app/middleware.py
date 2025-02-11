from fastapi import Request, HTTPException, status
from .database import get_db
from . import models
from .auth import get_current_user

async def maintenance_middleware(request: Request, call_next):
    """Middleware to handle maintenance mode"""
    db = next(get_db())
    config = db.query(models.MaintenanceConfig).first()
    
    if config and config.is_enabled:
        # Allow access to maintenance status endpoint and healthz
        if request.url.path in ["/maintenance/status", "/healthz"]:
            return await call_next(request)
            
        # Check if admin access is allowed
        if config.allow_admin_access:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                try:
                    user = await get_current_user(token, db)
                    if user.role == models.UserRole.ADMIN:
                        return await call_next(request)
                except:
                    pass
        
        # Block access with custom message
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=config.message or "النظام تحت الصيانة حالياً"
        )
    
    return await call_next(request)
