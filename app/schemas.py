from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    name: str
    role: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class GradeBase(BaseModel):
    subject: str
    score: float
    term: str
    academic_year: str

class GradeCreate(GradeBase):
    student_id: int

class Grade(GradeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class BookBase(BaseModel):
    title: str
    author: str
    isbn: str
    total_copies: int
    available_copies: int
    category: str

class BookCreate(BookBase):
    pass

class Book(BookBase):
    id: int

    class Config:
        from_attributes = True

class BookLoanBase(BaseModel):
    book_id: int
    student_id: int
    due_date: datetime

class BookLoanCreate(BookLoanBase):
    pass

class BookLoan(BookLoanBase):
    id: int
    borrow_date: datetime
    return_date: Optional[datetime] = None
    status: str

    class Config:
        from_attributes = True

class SchoolRuleBase(BaseModel):
    title: str
    description: str
    category: str

class SchoolRuleCreate(SchoolRuleBase):
    pass

class SchoolRule(SchoolRuleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
