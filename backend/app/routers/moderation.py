from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..models.user import User, UserRole
from ..models.report import Report, ReportStatus
from ..models.message import Message
from ..schemas import ReportCreate, ReportResponse, UpdateReportRequest
from ..auth import get_current_user
from ..utils.logging import log_admin_action
from ..utils.moderation_logger import log_moderation_event

router = APIRouter()

@router.post("/reports", response_model=ReportResponse)
async def create_report(
    report: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_report = Report(
        reporter_id=current_user.id,
        target_id=report.target_id,
        report_type=report.report_type,
        reason=report.reason,
        details=report.details,
        status=ReportStatus.OPEN
    )
    
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    log_moderation_event(
        action_taken="create_report",
        reason=report.reason.value,
        moderator_id=str(current_user.id)
    )
    
    return new_report

@router.get("/reports", response_model=List[ReportResponse])
async def get_reports(
    status: ReportStatus = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view reports"
        )
    
    query = db.query(Report)
    if status:
        query = query.filter(Report.status == status)
    
    return query.order_by(Report.created_at.desc()).all()

@router.put("/reports/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: int,
    update_data: UpdateReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update reports"
        )
    
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    report.status = update_data.status
    report.moderator_notes = update_data.moderator_notes
    report.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(report)
    
    log_admin_action(
        admin_username=current_user.username,
        action="update_report",
        details=f"Report {report_id} status updated to {update_data.status}"
    )
    
    return report
