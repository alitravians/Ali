from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base

class ReportType(str, enum.Enum):
    MESSAGE = "message"
    USER = "user"

class ReportReason(str, enum.Enum):
    HATE_SPEECH = "hate_speech"
    HARASSMENT = "harassment"
    EXPLICIT_CONTENT = "explicit_content"
    SPAM = "spam"
    MISINFORMATION = "misinformation"

class ReportStatus(str, enum.Enum):
    OPEN = "open"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"))
    target_id = Column(Integer, nullable=True)
    report_type = Column(SQLEnum(ReportType))
    reason = Column(SQLEnum(ReportReason))
    status = Column(SQLEnum(ReportStatus), default=ReportStatus.OPEN)
    details = Column(String, nullable=True)
    moderator_notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reports_filed")
