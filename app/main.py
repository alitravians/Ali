import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from . import models
from .database import engine, SessionLocal
from .routers import academic, library, rules, admin, auth, maintenance
from .middleware import maintenance_middleware

# Initialize test data
def init_test_data():
    try:
        # Create tables
        models.Base.metadata.create_all(bind=engine)
        
        db = SessionLocal()
        # Create admin user if not exists
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin:
            from .auth import get_password_hash
            import logging
            logging.info("Creating admin user...")
            hashed_password = get_password_hash("admin123")
            logging.info(f"Admin password hash: {hashed_password}")
            admin = models.User(
                username="admin",
                password_hash=hashed_password,
                email="admin@school.com",
                name="Admin User",
                role=models.UserRole.ADMIN
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            logging.info(f"Created admin user with ID: {admin.id}, Role: {admin.role}")  # Debug logging
        
        # Create test student
        student = db.query(models.User).filter(models.User.username == "student").first()
        if not student:
            student = models.User(
                username="student",
                password_hash=get_password_hash("student123"),
                email="student@school.com",
                name="Test Student",
                role=models.UserRole.STUDENT
            )
            db.add(student)
            db.commit()
            
            # Create student profile
            student_profile = models.Student(
                user_id=student.id,
                class_name="Class A",
                admission_number="ST001",
                grade_level="10"
            )
            db.add(student_profile)
            db.commit()
            db.refresh(student_profile)
            print(f"Created test student with ID: {student.id} and profile ID: {student_profile.id}")  # Debug logging
            
            # Add a test grade
            test_grade = models.Grade(
                student_id=student_profile.id,
                subject="Math",
                score=95.0,
                term="Fall 2024",
                academic_year="2024-2025"
            )
            db.add(test_grade)
            db.commit()
            print("Added test grade for student")  # Debug logging
        
        # Create test book
        book = db.query(models.Book).filter(models.Book.isbn == "123-456-789").first()
        if not book:
            book = models.Book(
                title="Test Book",
                author="Test Author",
                isbn="123-456-789",
                total_copies=5,
                available_copies=5,
                category="Test"
            )
            db.add(book)
            db.commit()
            print("Created test book")  # Debug logging
        
        # Create test rule
        rule = db.query(models.SchoolRule).filter(models.SchoolRule.title == "Test Rule").first()
        if not rule:
            rule = models.SchoolRule(
                title="Test Rule",
                description="This is a test rule",
                category="General"
            )
            db.add(rule)
            db.commit()
            print("Created test rule")  # Debug logging
            
        # Create maintenance config if not exists
        config = db.query(models.MaintenanceConfig).first()
        if not config:
            config = models.MaintenanceConfig(
                is_enabled=0,
                message="النظام تحت الصيانة حالياً",
                allow_admin_access=1
            )
            db.add(config)
            db.commit()
            print("Created maintenance config")  # Debug logging
            
    except Exception as e:
        print(f"Error in init_test_data: {str(e)}")  # Debug logging
        db.rollback()
        raise  # Re-raise the exception for debugging
    finally:
        db.close()

# Initialize database and test data on startup
if not "pytest" in sys.modules:
    init_test_data()

app = FastAPI(title="School Management System")

# Add maintenance mode middleware first
app.add_middleware(BaseHTTPMiddleware, dispatch=maintenance_middleware)

# Add CORS middleware after maintenance middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(maintenance.router, tags=["maintenance"])  # Add maintenance router first
app.include_router(auth.router)
app.include_router(academic.router)
app.include_router(library.router)
app.include_router(rules.router)
app.include_router(admin.router)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
