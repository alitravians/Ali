from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel

class UserRole(str, Enum):
    ADMIN = "admin"
    SUPERVISOR = "supervisor"
    MEMBER = "member"

class UserStatus(str, Enum):
    ACTIVE = "active"
    BANNED = "banned"
    SUSPENDED = "suspended"

class TicketStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class User(BaseModel):
    id: Optional[int] = None
    username: str
    password: str
    role: UserRole
    status: UserStatus = UserStatus.ACTIVE
    language: str = "ar"

class TicketTranslation(BaseModel):
    title: dict[str, str] = {}
    description: dict[str, str] = {}

class VisitorInfo(BaseModel):
    name: str
    email: str

class Ticket(BaseModel):
    id: Optional[int] = None
    title: str
    description: str
    translations: Optional[TicketTranslation] = None
    status: TicketStatus = TicketStatus.OPEN
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()
    created_by: Optional[int] = None  # User ID if created by authenticated user
    visitor_info: Optional[VisitorInfo] = None  # Contact info if created by visitor
    assigned_to: Optional[int] = None  # Supervisor ID

class TicketMessage(BaseModel):
    id: Optional[int] = None
    ticket_id: int
    sender_id: int
    content: str
    created_at: datetime = datetime.now()

class TicketReport(BaseModel):
    id: Optional[int] = None
    ticket_id: int
    reporter_id: int
    reason: str
    status: str = "pending"
    created_at: datetime = datetime.now()
