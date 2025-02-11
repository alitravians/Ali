from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import declarative_base, relationship
import enum

Base = declarative_base()

class UserRole(str, enum.Enum):
    STUDENT = "student"
    ADMIN = "admin"
    LIBRARIAN = "librarian"

class LoanStatus(str, enum.Enum):
    BORROWED = "borrowed"
    RETURNED = "returned"
    OVERDUE = "overdue"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("Student", back_populates="user", uselist=False)

class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    class_name = Column(String)
    admission_number = Column(String, unique=True)
    grade_level = Column(String)
    
    user = relationship("User", back_populates="student")
    grades = relationship("Grade", back_populates="student")
    book_loans = relationship("BookLoan", back_populates="student")

class Grade(Base):
    __tablename__ = "grades"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    subject = Column(String)
    score = Column(Float)
    term = Column(String)
    academic_year = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("Student", back_populates="grades")

class Book(Base):
    __tablename__ = "books"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    author = Column(String)
    isbn = Column(String, unique=True)
    total_copies = Column(Integer)
    available_copies = Column(Integer)
    category = Column(String)
    
    loans = relationship("BookLoan", back_populates="book")

class BookLoan(Base):
    __tablename__ = "book_loans"
    
    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"))
    student_id = Column(Integer, ForeignKey("students.id"))
    borrow_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime)
    return_date = Column(DateTime, nullable=True)
    status = Column(String)
    
    book = relationship("Book", back_populates="loans")
    student = relationship("Student", back_populates="book_loans")

class SchoolRule(Base):
    __tablename__ = "school_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    category = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
