from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from .database import get_db
from . import models
from .auth import get_current_user, SECRET_KEY, ALGORITHM
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from .permissions import ROLE_PERMISSIONS, Permission

def check_admin_status(auth_header: str) -> bool:
    """Check if the user is an admin based on the auth header"""
    if not auth_header or not auth_header.startswith("Bearer "):
        print(f"Invalid auth header format: {auth_header}")  # Debug log
        return False
    
    try:
        token = auth_header.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        role = payload.get("role")
        is_admin = role == "admin"
        print(f"Token payload: {payload}, Role: {role}, Is admin: {is_admin}")  # Debug log
        return is_admin
    except (JWTError, IndexError) as e:
        print(f"Error checking admin status: {str(e)}")  # Debug log
        return False

async def maintenance_middleware(request: Request, call_next):
    """Middleware to handle maintenance mode"""
    db = None
    try:
        print(f"\nProcessing request to: {request.url.path}")  # Debug log
        
        # Always allow access to public endpoints
        public_endpoints = ["/maintenance/status", "/healthz", "/maintenance/config", "/auth/token"]
        if request.url.path in public_endpoints:
            print(f"Allowing access to public endpoint: {request.url.path}")  # Debug log
            return await call_next(request)

        # Get database session first
        db = next(get_db())
        db.expire_all()  # Expire all objects to force a refresh
        
        # Check maintenance mode before anything else
        config = db.query(models.MaintenanceConfig).first()
        if config:
            db.refresh(config)  # Ensure we have the latest state
            print(f"Maintenance config found: enabled={config.is_enabled}")  # Debug log
            
            if config.is_enabled == 1:
                print("Maintenance mode is active")  # Debug log
                # Get auth header and check admin status
                auth_header = request.headers.get("Authorization", "")
                print(f"Auth header: {auth_header}")  # Debug log
                
                is_admin = check_admin_status(auth_header)
                print(f"User is admin: {is_admin}")  # Debug log

                if not is_admin:
                    message = config.message if config.message else "النظام تحت الصيانة حالياً"
                    print(f"Blocking non-admin access during maintenance for path: {request.url.path}")  # Debug log
                    
                    # Close database session before returning response
                    if db:
                        db.close()
                        db = None
                    
                    # Return 503 Service Unavailable for non-admin access during maintenance
                    return JSONResponse(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        content={"detail": message}
                    )
                print(f"Allowing admin access during maintenance for path: {request.url.path}")  # Debug log

        # Store database session in request state
        request.state.db = db
        db = None  # Prevent double-close in finally block

        # Process request
        try:
            # Use the existing database session
            response = await call_next(request)
            
            # Get the session back from request state
            db = request.state.db
            if db:
                try:
                    # Only commit if no errors occurred
                    if response.status_code < 400:
                        db.commit()
                    else:
                        db.rollback()
                finally:
                    db.close()
                    request.state.db = None
            
            return response
        except Exception as e:
            if request.state.db:
                try:
                    request.state.db.rollback()
                    request.state.db.close()
                except:
                    pass
                request.state.db = None
            raise e

    except Exception as e:
        if db:
            try:
                db.rollback()
                db.close()
            except:
                pass
            db = None

        if isinstance(e, HTTPException):
            raise e
        print(f"Unexpected error in maintenance middleware: {str(e)}")  # Debug log
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="خطأ غير متوقع في النظام"
        )
    finally:
        if db:
            try:
                db.close()
            except:
                pass

