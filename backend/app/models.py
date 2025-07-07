from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"

class UserStatus(str, Enum):
    ACTIVE = "active"
    MUTED = "muted"
    BANNED = "banned"
    OFFLINE = "offline"

class ReportCategory(str, Enum):
    OFFENSIVE = "offensive_message"
    INAPPROPRIATE = "inappropriate_phrases"
    RELIGION_POLITICS = "religion_politics"

class ReportStatus(str, Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"

class AppealStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class User(BaseModel):
    user_id: str = Field(..., description="10-digit unique user ID")
    username: str
    password_hash: str
    role: UserRole = UserRole.USER
    status: UserStatus = UserStatus.ACTIVE
    created_at: datetime = Field(default_factory=datetime.now)
    muted_until: Optional[datetime] = None
    banned_until: Optional[datetime] = None
    ban_reason: Optional[str] = None
    last_seen: datetime = Field(default_factory=datetime.now)

class Message(BaseModel):
    message_id: str
    user_id: str
    username: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)
    is_deleted: bool = False
    deleted_by: Optional[str] = None

class BanRecord(BaseModel):
    ban_id: str
    user_id: str
    banned_by: str
    reason: str
    banned_at: datetime = Field(default_factory=datetime.now)
    banned_until: Optional[datetime] = None
    is_active: bool = True

class Report(BaseModel):
    report_id: str
    reporter_id: str
    reported_message_id: str
    reported_user_id: str
    category: ReportCategory
    reason: str
    status: ReportStatus = ReportStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.now)
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None

class BanAppeal(BaseModel):
    appeal_id: str
    user_id: str
    ban_id: str
    reason: str
    status: AppealStatus = AppealStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.now)
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    admin_response: Optional[str] = None

class Announcement(BaseModel):
    announcement_id: str
    title: str
    content: str
    created_by: str
    created_at: datetime = Field(default_factory=datetime.now)
    is_active: bool = True

class LoginRequest(BaseModel):
    username: str
    password: Optional[str] = None

class AdminLoginRequest(BaseModel):
    username: str
    access_code: str

class RegisterRequest(BaseModel):
    username: str

class MessageRequest(BaseModel):
    content: str

class BanUserRequest(BaseModel):
    user_id: str
    reason: str
    duration_hours: Optional[int] = None

class MuteUserRequest(BaseModel):
    user_id: str
    duration_minutes: int = 30

class UnbanUserRequest(BaseModel):
    user_id: str

class ModeratorBanRequest(BaseModel):
    user_id: str
    reason: str
    duration_minutes: int

class ChangeUserIdRequest(BaseModel):
    old_user_id: str
    new_user_id: str

class Notification(BaseModel):
    notification_id: str
    user_id: str
    title: str
    content: str
    type: str
    created_at: datetime = Field(default_factory=datetime.now)
    is_read: bool = False

class ReportRequest(BaseModel):
    message_id: str
    category: ReportCategory
    reason: str

class AppealRequest(BaseModel):
    reason: str

class AppealResponse(BaseModel):
    appeal_id: str
    action: str
    response: str

class AnnouncementRequest(BaseModel):
    title: str
    content: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    role: str
    status: str
    ban_reason: Optional[str] = None
    banned_until: Optional[str] = None

class UserInfo(BaseModel):
    user_id: str
    username: str
    role: UserRole
    status: UserStatus
    last_seen: datetime
    is_online: bool = False
