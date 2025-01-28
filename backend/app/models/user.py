from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base

class UserRole(str, enum.Enum):
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"
    PRIMARY_ADMIN = "primary_admin"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    display_name = Column(String)
    bio = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.USER)
    is_banned = Column(Boolean, default=False)
    ban_reason = Column(String, nullable=True)
    ban_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("Message", back_populates="user")
    reports_filed = relationship("Report", back_populates="reporter")
    appeals = relationship("Appeal", back_populates="user")
    bans = relationship("UserBan", foreign_keys="UserBan.user_id", back_populates="user")

    def set_password(self, password: str):
        import bcrypt
        self.hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
