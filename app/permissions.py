from enum import Enum
from typing import List, Optional
from fastapi import HTTPException, Security, status
from fastapi.security import OAuth2PasswordBearer
from . import models
from .auth import get_current_user

class Permission(str, Enum):
    # Student permissions
    VIEW_OWN_GRADES = "view_own_grades"
    REQUEST_BOOK_LOAN = "request_book_loan"
    VIEW_SCHOOL_RULES = "view_school_rules"
    UPDATE_PROFILE = "update_profile"
    
    # Librarian permissions
    MANAGE_BOOKS = "manage_books"
    PROCESS_LOANS = "process_loans"
    TRACK_OVERDUE = "track_overdue"
    GENERATE_REPORTS = "generate_reports"
    
    # Admin permissions
    SYSTEM_CONFIG = "system_config"
    ASSIGN_ROLES = "assign_roles"
    VIEW_AUDIT_LOGS = "view_audit_logs"
    EMERGENCY_OVERRIDE = "emergency_override"
    MANAGE_USERS = "manage_users"
    MANAGE_GRADES = "manage_grades"
    MANAGE_RULES = "manage_rules"
    MANAGE_STUDENTS = "manage_students"
    MANAGE_LOANS = "manage_loans"
    VIEW_ANALYTICS = "view_analytics"

ROLE_PERMISSIONS = {
    models.UserRole.STUDENT: [
        Permission.VIEW_OWN_GRADES,
        Permission.REQUEST_BOOK_LOAN,
        Permission.VIEW_SCHOOL_RULES,
        Permission.UPDATE_PROFILE,
    ],
    models.UserRole.LIBRARIAN: [
        Permission.MANAGE_BOOKS,
        Permission.PROCESS_LOANS,
        Permission.TRACK_OVERDUE,
        Permission.GENERATE_REPORTS,
        Permission.VIEW_SCHOOL_RULES,
    ],
    models.UserRole.ADMIN: [
        Permission.SYSTEM_CONFIG,
        Permission.ASSIGN_ROLES,
        Permission.VIEW_AUDIT_LOGS,
        Permission.EMERGENCY_OVERRIDE,
        Permission.MANAGE_USERS,
        Permission.MANAGE_GRADES,
        Permission.MANAGE_RULES,
        Permission.MANAGE_STUDENTS,
        Permission.MANAGE_LOANS,
        Permission.MANAGE_BOOKS,
        Permission.VIEW_ANALYTICS,
        Permission.PROCESS_LOANS,
        Permission.TRACK_OVERDUE,
        Permission.GENERATE_REPORTS,
        Permission.VIEW_SCHOOL_RULES,
    ]
}

class PermissionChecker:
    def __init__(self, required_permissions: List[Permission]):
        self.required_permissions = required_permissions
    
    async def __call__(self, user: models.User = Security(get_current_user)) -> models.User:
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated"
            )
            
        # Convert string role to UserRole enum
        try:
            user_role = models.UserRole(user.role)
            user_permissions = ROLE_PERMISSIONS.get(user_role, [])
            
            for permission in self.required_permissions:
                if permission not in user_permissions:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Permission denied. Required permission: {permission}"
                    )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid user role"
            )
        
        return user

def has_permission(permission: Permission) -> PermissionChecker:
    return PermissionChecker([permission])

def has_permissions(permissions: List[Permission]) -> PermissionChecker:
    return PermissionChecker(permissions)

# Convenience decorators for common permission checks
require_student = has_permissions([
    Permission.VIEW_OWN_GRADES,
    Permission.REQUEST_BOOK_LOAN,
    Permission.VIEW_SCHOOL_RULES,
    Permission.UPDATE_PROFILE,
])

require_librarian = has_permissions([
    Permission.MANAGE_BOOKS,
    Permission.PROCESS_LOANS,
    Permission.TRACK_OVERDUE,
    Permission.GENERATE_REPORTS,
])

require_admin = has_permissions([
    Permission.SYSTEM_CONFIG,
    Permission.ASSIGN_ROLES,
    Permission.VIEW_AUDIT_LOGS,
    Permission.EMERGENCY_OVERRIDE,
    Permission.MANAGE_USERS,
    Permission.MANAGE_GRADES,
    Permission.MANAGE_RULES,
    Permission.VIEW_ANALYTICS,
])

# Special check for admin-only operations that require emergency override
async def require_emergency_override(user: models.User = Security(get_current_user)) -> bool:
    if user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Emergency override can only be performed by administrators"
        )
    return True
