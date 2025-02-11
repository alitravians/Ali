from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from .. import models, permissions
from ..database import get_db
from pydantic import BaseModel

router = APIRouter(prefix="/rules", tags=["rules"])

class SchoolRuleBase(BaseModel):
    title: str
    description: str
    category: str

class SchoolRuleResponse(SchoolRuleBase):
    id: int
    created_at: datetime
    updated_at: datetime

@router.get("/", response_model=List[SchoolRuleResponse])
async def get_school_rules(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.VIEW_SCHOOL_RULES))
):
    """Get all school rules and regulations"""
    rules = db.query(models.SchoolRule).order_by(
        models.SchoolRule.category,
        models.SchoolRule.title
    ).all()
    return rules

@router.post("/", response_model=SchoolRuleResponse)
async def create_school_rule(
    rule: SchoolRuleBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_RULES))
):
    """Create a new school rule (admin only)"""
    db_rule = models.SchoolRule(**rule.dict())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.put("/{rule_id}", response_model=SchoolRuleResponse)
async def update_school_rule(
    rule_id: int,
    rule: SchoolRuleBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_RULES))
):
    """Update an existing school rule (admin only)"""
    db_rule = db.query(models.SchoolRule).filter(models.SchoolRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    for field, value in rule.dict().items():
        setattr(db_rule, field, value)
    
    db_rule.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.delete("/{rule_id}")
async def delete_school_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_RULES))
):
    """Delete a school rule (admin only)"""
    db_rule = db.query(models.SchoolRule).filter(models.SchoolRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    db.delete(db_rule)
    db.commit()
    return {"message": "Rule deleted successfully"}

@router.get("/categories")
async def get_rule_categories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.VIEW_SCHOOL_RULES))
):
    """Get all unique rule categories"""
    categories = db.query(models.SchoolRule.category).distinct().all()
    return [category[0] for category in categories]
