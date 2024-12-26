from datetime import datetime
from enum import Enum
from typing import Optional, Dict
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Enum as SQLAlchemyEnum, DateTime, JSON, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

# Keep Pydantic models for API validation
class PydanticBase(BaseModel):
    class Config:
        from_attributes = True

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

class UserDB(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(SQLAlchemyEnum(UserRole))
    status = Column(SQLAlchemyEnum(UserStatus), default=UserStatus.ACTIVE)
    language = Column(String, default="ar")
    
    # Relationships
    tickets = relationship("TicketDB", back_populates="creator", foreign_keys="[TicketDB.created_by]")
    assigned_tickets = relationship("TicketDB", back_populates="supervisor", foreign_keys="[TicketDB.assigned_to]")
    messages = relationship("TicketMessageDB", back_populates="sender")
    reports = relationship("TicketReportDB", back_populates="reporter")

class User(PydanticBase):
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

class TicketDB(Base):
    __tablename__ = "tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    translations = Column(JSON)  # Store TicketTranslation as JSON
    status = Column(SQLAlchemyEnum(TicketStatus), default=TicketStatus.OPEN)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    created_by = Column(Integer, ForeignKey("users.id"))
    visitor_info = Column(JSON)  # Store VisitorInfo as JSON
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    creator = relationship("UserDB", back_populates="tickets", foreign_keys=[created_by])
    supervisor = relationship("UserDB", back_populates="assigned_tickets", foreign_keys=[assigned_to])
    messages = relationship("TicketMessageDB", back_populates="ticket")
    reports = relationship("TicketReportDB", back_populates="ticket")

class Ticket(PydanticBase):
    id: Optional[int] = None
    title: str
    description: str
    translations: Optional[TicketTranslation] = None
    status: TicketStatus = TicketStatus.OPEN
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()
    created_by: Optional[int] = None
    visitor_info: Optional[VisitorInfo] = None
    assigned_to: Optional[int] = None

class TicketMessageDB(Base):
    __tablename__ = "ticket_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    sender_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String)
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    ticket = relationship("TicketDB", back_populates="messages")
    sender = relationship("UserDB", back_populates="messages")

class TicketMessage(PydanticBase):
    id: Optional[int] = None
    ticket_id: int
    sender_id: int
    content: str
    created_at: datetime = datetime.now()

class TicketReportDB(Base):
    __tablename__ = "ticket_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    reporter_id = Column(Integer, ForeignKey("users.id"))
    reason = Column(String)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    ticket = relationship("TicketDB", back_populates="reports")
    reporter = relationship("UserDB", back_populates="reports")

class TicketReport(PydanticBase):
    id: Optional[int] = None
    ticket_id: int
    reporter_id: int
    reason: str
    status: str = "pending"
    created_at: datetime = datetime.now()
