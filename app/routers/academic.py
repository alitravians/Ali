from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, permissions
from ..database import get_db
from ..auth import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/academic", tags=["academic"])

class GradeCreate(BaseModel):
    subject: str
    score: float
    term: str
    academic_year: str

class GradeResponse(GradeCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/grades/me", response_model=List[GradeResponse])
async def get_my_grades(
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.VIEW_OWN_GRADES)),
    db: Session = Depends(get_db)
):
    """Get grades for the currently logged-in student"""
    if not current_user.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view grades"
        )
    
    grades = db.query(models.Grade).filter(
        models.Grade.student_id == current_user.student.id
    ).order_by(
        models.Grade.academic_year.desc(),
        models.Grade.term.desc(),
        models.Grade.subject.asc()
    ).all()
    
    return grades

@router.get("/grades/{student_id}", response_model=List[GradeResponse])
async def get_student_grades(
    student_id: int,
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_GRADES)),
    db: Session = Depends(get_db)
):
    """Get grades for a specific student (admin only)"""
    grades = db.query(models.Grade).filter(
        models.Grade.student_id == student_id
    ).order_by(
        models.Grade.academic_year.desc(),
        models.Grade.term.desc(),
        models.Grade.subject.asc()
    ).all()
    
    if not grades:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No grades found for this student"
        )
    
    return grades

@router.post("/grades/{student_id}")
async def add_grade(
    student_id: int,
    grade: GradeCreate,
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_GRADES)),
    db: Session = Depends(get_db)
):
    """Add a new grade for a student (admin only)"""
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    db_grade = models.Grade(
        student_id=student_id,
        subject=grade.subject,
        score=grade.score,
        term=grade.term,
        academic_year=grade.academic_year
    )
    
    db.add(db_grade)
    db.commit()
    db.refresh(db_grade)
    return db_grade

@router.put("/grades/{grade_id}")
async def update_grade(
    grade_id: int,
    grade: GradeResponse,
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_GRADES)),
    db: Session = Depends(get_db)
):
    """Update an existing grade (admin only)"""
    db_grade = db.query(models.Grade).filter(models.Grade.id == grade_id).first()
    if not db_grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade not found"
        )
    
    for field, value in grade.dict().items():
        setattr(db_grade, field, value)
    
    db.commit()
    db.refresh(db_grade)
    return db_grade
