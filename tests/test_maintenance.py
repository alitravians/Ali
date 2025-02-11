import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta, timezone
from jose import jwt

from app.main import app
from app.database import Base, get_db
from app.models import User, UserRole, MaintenanceConfig
from app.auth import create_access_token, SECRET_KEY, ALGORITHM

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override the get_db dependency
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function")
def test_db():
    # Create tables
    Base.metadata.drop_all(bind=engine)  # Drop all tables first
    Base.metadata.create_all(bind=engine)

    try:
        db = TestingSessionLocal()

        # Create admin user
        admin = User(
            username="admin",
            password_hash="$2b$12$LckIoLFhPxOkVdFl9USS/.O0Y0Gqo1wFbPD1L6WRTEbgIZBjVSF/G",  # admin123
            role=UserRole.ADMIN,
            email="admin@school.com",
            name="Admin User"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        # Create student user
        student = User(
            username="student",
            password_hash="$2b$12$LckIoLFhPxOkVdFl9USS/.O0Y0Gqo1wFbPD1L6WRTEbgIZBjVSF/G",  # student123
            role=UserRole.STUDENT,
            email="student@school.com",
            name="Test Student"
        )
        db.add(student)
        db.commit()
        db.refresh(student)

        # Create maintenance config
        config = MaintenanceConfig(
            is_enabled=0,
            message="النظام تحت الصيانة حالياً",
            allow_admin_access=1
        )
        db.add(config)
        db.commit()
        db.refresh(config)

        yield db
    finally:
        db.close()

@pytest.fixture(scope="function")
def client():
    return TestClient(app)

@pytest.mark.asyncio
async def test_functionality(test_db, client):
    """Test all functionality including admin dashboard and maintenance mode"""
    # Get admin and student users from database
    admin = test_db.query(User).filter(User.username == "admin").first()
    student = test_db.query(User).filter(User.username == "student").first()

    # Create test tokens with correct claims
    admin_token = create_access_token(data={"sub": admin.username, "role": admin.role})
    student_token = create_access_token(data={"sub": student.username, "role": student.role})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}
    print(f"Admin token claims: {jwt.decode(admin_token, SECRET_KEY, algorithms=[ALGORITHM])}")  # Debug log

    # Test 1: Admin Login and Dashboard Access
    print("\n=== Testing Admin Login and Dashboard ===")
    response = client.get("/admin/stats", headers=admin_headers)
    assert response.status_code == 200, "Admin login failed"
    print("✓ Admin login successful")

    # Test 2: Admin Dashboard Sections
    print("\n=== Testing Admin Dashboard Sections ===")
    endpoints = [
        ("/admin/students", "Student management"),
        ("/admin/books", "Book management"),
        ("/admin/loans", "Loan management"),
        ("/admin/rules", "Rule management")
    ]

    for endpoint, section in endpoints:
        response = client.get(endpoint, headers=admin_headers)
        assert response.status_code == 200, f"{section} access failed"
        print(f"✓ {section} accessible")

    # Test 3: Maintenance Mode
    print("\n=== Testing Maintenance Mode ===")
    maintenance_config = {
        "is_enabled": True,
        "message": "النظام تحت الصيانة",
        "start_time": datetime.now(timezone.utc).isoformat(),
        "end_time": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        "allow_admin_access": True
    }

    # Enable maintenance mode directly in the database
    print("\nEnabling maintenance mode...")
    config = test_db.query(MaintenanceConfig).first()
    config.is_enabled = 1
    config.message = "النظام تحت الصيانة حالياً"
    config.allow_admin_access = 1
    test_db.commit()
    test_db.refresh(config)
    assert config.is_enabled == 1, f"Maintenance mode not enabled in database. Got: {config.is_enabled}"
    print("✓ Maintenance mode enabled with Arabic message")

    # Check maintenance status
    print("\nVerifying maintenance status...")
    response = client.get("/maintenance/status")
    assert response.status_code == 200, "Failed to get maintenance status"
    assert response.json()["is_enabled"] == True, "Maintenance status not showing as enabled"
    print("✓ Maintenance status verified")

    # Test admin access during maintenance
    print("\nTesting admin access during maintenance...")
    response = client.get("/admin/stats", headers=admin_headers)
    assert response.status_code == 200, "Admin access denied during maintenance"
    print("✓ Admin access maintained during maintenance")

    # Test student access during maintenance
    print("\nTesting student access during maintenance...")

    # Verify maintenance mode is enabled
    test_db.rollback()  # Rollback any pending changes
    test_db.expire_all()  # Expire all objects to force a refresh

    config = test_db.query(MaintenanceConfig).first()
    test_db.refresh(config)  # Ensure we have the latest state
    assert config.is_enabled == 1, "Maintenance mode should be enabled"

    # Test student access to a public endpoint
    response = client.get("/maintenance/status", headers=student_headers)
    assert response.status_code == 200, "Status endpoint should be accessible"

    # Test student access to a protected endpoint
    response = client.get("/rules/", headers=student_headers)
    assert response.status_code == 503, "Student not blocked during maintenance"
    print("✓ Student access blocked during maintenance")

    # Test student access to another protected endpoint
    response = client.get("/academic/grades", headers=student_headers)
    assert response.status_code == 503, "Student not blocked during maintenance"
    print("✓ Student access blocked during maintenance")

    # Disable maintenance mode
    print("\nDisabling maintenance mode...")
    config.is_enabled = 0
    test_db.commit()
    test_db.refresh(config)
    assert config.is_enabled == 0, "Maintenance mode should be disabled"

    # Test student access after maintenance mode is disabled
    response = client.get("/rules/", headers=student_headers)
    assert response.status_code == 200, "Student access not restored after maintenance"
    print("✓ Student access restored after maintenance")

