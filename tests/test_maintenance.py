from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.auth import create_access_token
from app.database import get_db
from app.models import Base, User, MaintenanceConfig
from app.auth import get_password_hash
import json
from datetime import datetime, timedelta
import os

# Use test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create test database and tables
if os.path.exists("test.db"):
    os.remove("test.db")
Base.metadata.create_all(bind=engine)

def init_test_data():
    """Initialize test data"""
    db = TestingSessionLocal()
    try:
        from app.models import User, MaintenanceConfig
        from app.auth import get_password_hash
        
        # Create admin user
        admin = User(
            username="admin",
            password_hash=get_password_hash("admin123"),
            email="admin@school.com",
            name="Admin User",
            role="admin"
        )
        db.add(admin)
        
        # Create maintenance config
        config = MaintenanceConfig(
            is_enabled=False,
            message="النظام تحت الصيانة",
            allow_admin_access=True
        )
        db.add(config)
        
        db.commit()
    except Exception as e:
        print(f"Error initializing test data: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

# Initialize test data
init_test_data()

# Override the database dependency
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_functionality():
    """Test all functionality including admin dashboard and maintenance mode"""
    # Create test tokens
    admin_token = create_access_token({"sub": "admin", "role": "admin"})
    student_token = create_access_token({"sub": "student", "role": "student"})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}

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
        "start_time": datetime.utcnow().isoformat(),
        "end_time": (datetime.utcnow() + timedelta(hours=1)).isoformat(),
        "allow_admin_access": True
    }
    
    # Enable maintenance mode
    print("\nEnabling maintenance mode...")
    response = client.put("/maintenance/config", headers=admin_headers, json=maintenance_config)
    assert response.status_code == 200, "Failed to enable maintenance mode"
    assert response.json()["is_enabled"] == True, "Maintenance mode not enabled"
    assert response.json()["message"] == "النظام تحت الصيانة", "Arabic message not set correctly"
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
    response = client.get("/admin/stats", headers=student_headers)
    assert response.status_code == 503, "Student not blocked during maintenance"
    error_message = response.json()["detail"]
    assert "النظام تحت الصيانة" in error_message, f"Arabic message not shown. Got: {error_message}"
    print("✓ Student access properly blocked with Arabic message")

    # Disable maintenance mode
    print("\nDisabling maintenance mode...")
    maintenance_config["is_enabled"] = False
    response = client.put("/maintenance/config", headers=admin_headers, json=maintenance_config)
    assert response.status_code == 200, "Failed to disable maintenance mode"
    assert response.json()["is_enabled"] == False, "Maintenance mode not disabled"
    print("✓ Maintenance mode disabled")

    # Test student access after maintenance
    print("\nVerifying student access after maintenance...")
    response = client.get("/admin/stats", headers=student_headers)
    assert response.status_code == 403, "Student should still be forbidden after maintenance"
    print("✓ Student access properly restricted after maintenance")

if __name__ == "__main__":
    test_functionality()
