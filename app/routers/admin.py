from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from .. import models, permissions
from ..database import get_db
from ..auth import get_password_hash
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta

router = APIRouter(prefix="/admin", tags=["admin"])

# Student Management Models
class StudentCreate(BaseModel):
    name: str
    admission_number: str
    class_name: str
    grade_level: str

class StudentUpdate(BaseModel):
    name: Optional[str]
    class_name: Optional[str]
    grade_level: Optional[str]

class StudentResponse(BaseModel):
    id: int
    name: str
    admission_number: str
    class_name: str
    grade_level: str
    created_at: datetime

# Book Management Models
class BookCreate(BaseModel):
    title: str
    author: str
    isbn: str
    total_copies: int
    category: str

class BookUpdate(BaseModel):
    title: Optional[str]
    author: Optional[str]
    isbn: Optional[str]
    total_copies: Optional[int]
    category: Optional[str]

class BookResponse(BaseModel):
    id: int
    title: str
    author: str
    isbn: str
    total_copies: int
    available_copies: int
    category: str

# Loan Management Models
class LoanCreate(BaseModel):
    book_id: int
    student_id: int
    due_date: datetime

class LoanUpdate(BaseModel):
    return_date: Optional[datetime]
    status: Optional[str]

class LoanResponse(BaseModel):
    id: int
    book_id: int
    student_id: int
    borrow_date: datetime
    due_date: datetime
    return_date: Optional[datetime]
    status: str

# Rule Management Models
class RuleCreate(BaseModel):
    title: str
    description: str
    category: str

class RuleUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    category: Optional[str]

class RuleResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    created_at: datetime
    updated_at: datetime

# User Management Models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str
    name: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr]
    role: Optional[str]
    name: Optional[str]
    is_active: Optional[bool]

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    name: str
    created_at: datetime
    is_active: bool

# Analytics Models
class SystemStats(BaseModel):
    total_students: int
    total_books: int
    active_loans: int
    overdue_loans: int
    total_rules: int

class AuditLog(BaseModel):
    id: int
    user_id: int
    action: str
    resource: str
    timestamp: datetime
    details: str

# Maintenance Mode Models
class MaintenanceConfigUpdate(BaseModel):
    is_enabled: bool
    message: Optional[str]
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    allow_admin_access: Optional[bool]

class MaintenanceConfigResponse(BaseModel):
    is_enabled: bool
    message: Optional[str]
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    allow_admin_access: bool
    created_at: datetime
    updated_at: datetime

# User Management Endpoints
@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_USERS))
):
    """List all users in the system"""
    try:
        users = db.query(models.User).all()
        return [UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role,
            name=user.name,
            created_at=user.created_at,
            is_active=True  # Default value since we don't track this yet
        ) for user in users]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/users", response_model=UserResponse)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_USERS))
):
    """Create a new user"""
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    db_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=get_password_hash(user.password),
        role=user.role,
        name=user.name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_USERS))
):
    """Update user details"""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Only admins can change roles
    if user.role and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only administrators can change user roles"
        )
    
    for field, value in user.dict(exclude_unset=True).items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

# System Configuration and Analytics
@router.get("/stats", response_model=SystemStats)
async def get_system_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.VIEW_ANALYTICS))
):
    """Get system-wide statistics"""
    return {
        "total_students": db.query(models.Student).count(),
        "total_books": db.query(models.Book).count(),
        "active_loans": db.query(models.BookLoan).filter(models.BookLoan.status == "borrowed").count(),
        "overdue_loans": db.query(models.BookLoan).filter(
            models.BookLoan.due_date < datetime.utcnow(),
            models.BookLoan.status == "borrowed"
        ).count(),
        "total_rules": db.query(models.SchoolRule).count()
    }

@router.get("/audit-logs", response_model=List[AuditLog])
async def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.VIEW_AUDIT_LOGS))
):
    """Get system audit logs"""
    # This would typically be implemented with a proper audit log table
    # For now, we'll return a placeholder
    return []

# Emergency Override
@router.post("/emergency-override/{resource_id}")
async def emergency_override(
    resource_id: int,
    action: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.require_emergency_override)
):
    """Perform emergency override operations"""
    # Implementation would depend on specific override requirements
    return {"message": f"Emergency override {action} performed on resource {resource_id}"}

# System Configuration
@router.get("/config")
async def get_system_config(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.SYSTEM_CONFIG))
):
    """Get system configuration"""
    return {
        "maintenance_mode": False,
        "allow_new_registrations": True,
        "max_loan_period_days": 14,
        "max_active_loans_per_student": 3
    }

@router.put("/config")
async def update_system_config(
    config: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.SYSTEM_CONFIG))
):
    """Update system configuration"""
    # Implementation would typically involve updating a config table or env vars
    return {"message": "System configuration updated successfully"}

# Student Management Endpoints
@router.get("/students", response_model=List[StudentResponse])
async def list_students(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_STUDENTS))
):
    """List all students"""
    try:
        students = db.query(models.Student).all()
        return [StudentResponse(
            id=student.id,
            name=student.user.name,
            admission_number=student.admission_number,
            class_name=student.class_name,
            grade_level=student.grade_level,
            created_at=student.user.created_at
        ) for student in students]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="فشل في تحميل بيانات الطلاب"
        )

@router.post("/students", response_model=StudentResponse)
async def create_student(
    student: StudentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_STUDENTS))
):
    """Create a new student"""
    if db.query(models.Student).filter(models.Student.admission_number == student.admission_number).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admission number already exists"
        )
    
    db_student = models.Student(**student.dict())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

@router.put("/students/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: int,
    student: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_STUDENTS))
):
    """Update student details"""
    db_student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    for field, value in student.dict(exclude_unset=True).items():
        setattr(db_student, field, value)
    
    db.commit()
    db.refresh(db_student)
    return db_student

@router.delete("/students/{student_id}")
async def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_STUDENTS))
):
    """Delete a student"""
    db_student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    db.delete(db_student)
    db.commit()
    return {"message": "Student deleted successfully"}

# Book Management Endpoints
@router.get("/books", response_model=List[BookResponse])
async def list_books(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_BOOKS))
):
    """List all books"""
    try:
        books = db.query(models.Book).all()
        return books
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/books", response_model=BookResponse)
async def create_book(
    book: BookCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_BOOKS))
):
    """Create a new book"""
    if db.query(models.Book).filter(models.Book.isbn == book.isbn).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ISBN already exists"
        )
    
    db_book = models.Book(**book.dict(), available_copies=book.total_copies)
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

@router.put("/books/{book_id}", response_model=BookResponse)
async def update_book(
    book_id: int,
    book: BookUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_BOOKS))
):
    """Update book details"""
    db_book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    for field, value in book.dict(exclude_unset=True).items():
        if field == 'total_copies':
            # Update available copies proportionally
            old_total = db_book.total_copies
            new_total = value
            if old_total > 0:
                ratio = new_total / old_total
                db_book.available_copies = int(db_book.available_copies * ratio)
        setattr(db_book, field, value)
    
    db.commit()
    db.refresh(db_book)
    return db_book

@router.delete("/books/{book_id}")
async def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_BOOKS))
):
    """Delete a book"""
    db_book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Check if book has active loans
    active_loans = db.query(models.BookLoan).filter(
        models.BookLoan.book_id == book_id,
        models.BookLoan.status == "borrowed"
    ).first()
    if active_loans:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete book with active loans"
        )
    
    db.delete(db_book)
    db.commit()
    return {"message": "Book deleted successfully"}

# Loan Management Endpoints
@router.get("/loans", response_model=List[LoanResponse])
async def list_loans(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_LOANS))
):
    """List all loans"""
    try:
        loans = db.query(models.BookLoan).all()
        return loans
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/loans", response_model=LoanResponse)
async def create_loan(
    loan: LoanCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_LOANS))
):
    """Create a new loan"""
    # Check if book exists and is available
    book = db.query(models.Book).filter(models.Book.id == loan.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.available_copies <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Book is not available"
        )
    
    # Check if student exists and can borrow
    student = db.query(models.Student).filter(models.Student.id == loan.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Create loan
    db_loan = models.BookLoan(
        book_id=loan.book_id,
        student_id=loan.student_id,
        due_date=loan.due_date,
        status="borrowed"
    )
    
    # Update book availability
    book.available_copies -= 1
    
    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)
    return db_loan

@router.put("/loans/{loan_id}", response_model=LoanResponse)
async def update_loan(
    loan_id: int,
    loan: LoanUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_LOANS))
):
    """Update loan details"""
    db_loan = db.query(models.BookLoan).filter(models.BookLoan.id == loan_id).first()
    if not db_loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    old_status = db_loan.status
    for field, value in loan.dict(exclude_unset=True).items():
        setattr(db_loan, field, value)
    
    # If status changed to returned, update book availability
    if old_status == "borrowed" and loan.status == "returned":
        book = db.query(models.Book).filter(models.Book.id == db_loan.book_id).first()
        if book:
            book.available_copies += 1
    
    db.commit()
    db.refresh(db_loan)
    return db_loan

@router.delete("/loans/{loan_id}")
async def delete_loan(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_LOANS))
):
    """Delete a loan"""
    db_loan = db.query(models.BookLoan).filter(models.BookLoan.id == loan_id).first()
    if not db_loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    # If loan is active, restore book availability
    if db_loan.status == "borrowed":
        book = db.query(models.Book).filter(models.Book.id == db_loan.book_id).first()
        if book:
            book.available_copies += 1
    
    db.delete(db_loan)
    db.commit()
    return {"message": "Loan deleted successfully"}

# Rule Management Endpoints
@router.get("/rules", response_model=List[RuleResponse])
async def list_rules(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_RULES))
):
    """List all rules"""
    try:
        rules = db.query(models.SchoolRule).all()
        return rules
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/rules", response_model=RuleResponse)
async def create_rule(
    rule: RuleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_RULES))
):
    """Create a new rule"""
    db_rule = models.SchoolRule(**rule.dict())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.put("/rules/{rule_id}", response_model=RuleResponse)
async def update_rule(
    rule_id: int,
    rule: RuleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_RULES))
):
    """Update rule details"""
    db_rule = db.query(models.SchoolRule).filter(models.SchoolRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    for field, value in rule.dict(exclude_unset=True).items():
        setattr(db_rule, field, value)
    
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.delete("/rules/{rule_id}")
async def delete_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.MANAGE_RULES))
):
    """Delete a rule"""
    db_rule = db.query(models.SchoolRule).filter(models.SchoolRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db.delete(db_rule)
    db.commit()
    return {"message": "Rule deleted successfully"}

# Maintenance Mode Endpoints
@router.get("/maintenance/status", response_model=MaintenanceConfigResponse)
async def get_maintenance_status(db: Session = Depends(get_db)):
    """Get maintenance mode status"""
    config = db.query(models.MaintenanceConfig).first()
    if not config:
        return MaintenanceConfigResponse(
            is_enabled=False,
            message=None,
            start_time=None,
            end_time=None,
            allow_admin_access=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    return config

@router.put("/maintenance/config", response_model=MaintenanceConfigResponse)
async def update_maintenance_config(
    config: MaintenanceConfigUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.SYSTEM_CONFIG))
):
    """Update maintenance mode configuration"""
    db_config = db.query(models.MaintenanceConfig).first()
    if not db_config:
        db_config = models.MaintenanceConfig()
        db.add(db_config)
    
    for field, value in config.dict(exclude_unset=True).items():
        setattr(db_config, field, value)
    
    db.commit()
    db.refresh(db_config)
    return db_config
