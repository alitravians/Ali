from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"

class UserStatus(str, Enum):
    ACTIVE = "active"
    MUTED = "muted"
    BANNED = "banned"

class User(BaseModel):
    id: str
    user_id: str  # 10-digit user ID
    username: str
    role: UserRole = UserRole.USER
    status: UserStatus = UserStatus.ACTIVE
    mute_until: Optional[datetime] = None
    ban_until: Optional[datetime] = None
    ban_reason: Optional[str] = None
    id_changed: bool = False  # Track if user has changed their ID
    created_at: datetime = datetime.now()

class Message(BaseModel):
    id: str
    user_id: str
    username: str
    content: str
    timestamp: datetime = datetime.now()
    is_deleted: bool = False
    is_bold: bool = False  # For moderator $ formatting

class BanRecord(BaseModel):
    id: str
    user_id: str
    reason: str
    duration_minutes: int
    banned_by: str
    created_at: datetime = datetime.now()
    expires_at: datetime

class Report(BaseModel):
    id: str
    reporter_id: str
    target_user_id: str
    reason: str
    status: str = "pending"
    created_at: datetime = datetime.now()

class BanAppeal(BaseModel):
    id: str
    user_id: str
    reason: str
    status: str = "pending"
    admin_response: Optional[str] = None
    created_at: datetime = datetime.now()

class Announcement(BaseModel):
    id: str
    title: str
    content: str
    created_by: str
    created_at: datetime = datetime.now()
