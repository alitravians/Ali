from .database import engine, SessionLocal
from .models import Base, User
from .auth import get_password_hash

def init_db():
    # Create tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # Create test admin user
    db = SessionLocal()
    admin = User(
        username='admin',
        password_hash=get_password_hash('admin123'),
        email='admin@school.com',
        name='Admin User',
        role='admin'
    )
    db.add(admin)
    db.commit()
    db.close()

if __name__ == "__main__":
    init_db()
