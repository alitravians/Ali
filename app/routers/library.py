from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from .. import models, permissions
from ..database import get_db
from pydantic import BaseModel

router = APIRouter(prefix="/library", tags=["library"])

class BookResponse(BaseModel):
    id: int
    title: str
    author: str
    isbn: str
    available_copies: int
    category: str

class BookLoanRequest(BaseModel):
    book_id: int
    days_to_borrow: int = 14  # Default loan period

class BookLoanResponse(BaseModel):
    id: int
    book_title: str
    borrow_date: datetime
    due_date: datetime
    return_date: datetime | None
    status: str

@router.get("/books", response_model=List[BookResponse])
async def list_books(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.VIEW_SCHOOL_RULES))  # All users can view books
):
    """List all available books"""
    books = db.query(models.Book).filter(models.Book.available_copies > 0).all()
    return books

@router.post("/loans", response_model=BookLoanResponse)
async def request_book_loan(
    loan_request: BookLoanRequest,
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.REQUEST_BOOK_LOAN)),
    db: Session = Depends(get_db)
):
    """Request to borrow a book"""
    if not current_user.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can request book loans"
        )
    
    # Check if book exists and is available
    book = db.query(models.Book).filter(models.Book.id == loan_request.book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    
    if book.available_copies <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Book is not available for loan"
        )
    
    # Check if student has any overdue books
    overdue_loans = db.query(models.BookLoan).filter(
        models.BookLoan.student_id == current_user.student.id,
        models.BookLoan.status == "overdue"
    ).count()
    
    if overdue_loans > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot borrow books while you have overdue loans"
        )
    
    # Create loan record
    borrow_date = datetime.utcnow()
    due_date = borrow_date + timedelta(days=loan_request.days_to_borrow)
    
    loan = models.BookLoan(
        book_id=book.id,
        student_id=current_user.student.id,
        borrow_date=borrow_date,
        due_date=due_date,
        status="borrowed"
    )
    
    # Update book availability
    book.available_copies -= 1
    
    db.add(loan)
    db.commit()
    db.refresh(loan)
    
    return BookLoanResponse(
        id=loan.id,
        book_title=book.title,
        borrow_date=loan.borrow_date,
        due_date=loan.due_date,
        return_date=loan.return_date,
        status=loan.status
    )

@router.get("/loans/me", response_model=List[BookLoanResponse])
async def get_my_loans(
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.REQUEST_BOOK_LOAN)),
    db: Session = Depends(get_db)
):
    """Get all loans for the current student"""
    if not current_user.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view their loans"
        )
    
    loans = db.query(models.BookLoan).filter(
        models.BookLoan.student_id == current_user.student.id
    ).all()
    
    return [
        BookLoanResponse(
            id=loan.id,
            book_title=loan.book.title,
            borrow_date=loan.borrow_date,
            due_date=loan.due_date,
            return_date=loan.return_date,
            status=loan.status
        ) for loan in loans
    ]

@router.post("/loans/{loan_id}/return")
async def return_book(
    loan_id: int,
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.PROCESS_LOANS)),
    db: Session = Depends(get_db)
):
    """Process a book return (librarian only)"""
    loan = db.query(models.BookLoan).filter(models.BookLoan.id == loan_id).first()
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found"
        )
    
    if loan.status == "returned":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Book has already been returned"
        )
    
    loan.status = "returned"
    loan.return_date = datetime.utcnow()
    
    # Update book availability
    book = db.query(models.Book).filter(models.Book.id == loan.book_id).first()
    book.available_copies += 1
    
    db.commit()
    
    return {"message": "Book returned successfully"}

@router.get("/loans/overdue", response_model=List[BookLoanResponse])
async def get_overdue_loans(
    current_user: models.User = Depends(permissions.has_permission(permissions.Permission.TRACK_OVERDUE)),
    db: Session = Depends(get_db)
):
    """Get all overdue loans (librarian only)"""
    overdue_loans = db.query(models.BookLoan).filter(
        models.BookLoan.due_date < datetime.utcnow(),
        models.BookLoan.status == "borrowed"
    ).all()
    
    return [
        BookLoanResponse(
            id=loan.id,
            book_title=loan.book.title,
            borrow_date=loan.borrow_date,
            due_date=loan.due_date,
            return_date=loan.return_date,
            status="overdue"
        ) for loan in overdue_loans
    ]
