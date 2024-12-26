from datetime import datetime
from typing import Dict, List, Optional, Union
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from passlib.context import CryptContext
from .models import (
    Base, User, UserDB, Ticket, TicketMessage, TicketReport,
    UserRole, UserStatus, TicketStatus, TicketTranslation
)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create SQLite engine with proper thread handling
engine = create_engine("sqlite:///./support_tickets.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class DBInterface:
    """Interface that both InMemoryDB and SQLAlchemyDB will implement"""
    def create_user(self, user: User) -> User:
        raise NotImplementedError
    
    def get_user(self, user_id: int) -> Optional[User]:
        raise NotImplementedError
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        raise NotImplementedError
    
    def create_ticket(self, ticket: Ticket) -> Ticket:
        raise NotImplementedError
    
    def get_ticket(self, ticket_id: int) -> Optional[Ticket]:
        raise NotImplementedError
    
    def get_user_tickets(self, user_id: int) -> List[Ticket]:
        raise NotImplementedError
    
    def get_assigned_tickets(self, supervisor_id: int) -> List[Ticket]:
        raise NotImplementedError
    
    def create_message(self, message: TicketMessage) -> TicketMessage:
        raise NotImplementedError
    
    def get_ticket_messages(self, ticket_id: int) -> List[TicketMessage]:
        raise NotImplementedError
    
    def create_report(self, report: TicketReport) -> TicketReport:
        raise NotImplementedError
    
    def get_reports(self) -> List[TicketReport]:
        raise NotImplementedError
    
    def get_users(self) -> List[User]:
        raise NotImplementedError
    
    def get_tickets(self) -> List[Ticket]:
        raise NotImplementedError
    
    def update_ticket_status(self, ticket_id: int, status: TicketStatus) -> Optional[Ticket]:
        raise NotImplementedError
    
    def assign_ticket(self, ticket_id: int, supervisor_id: int) -> Optional[Ticket]:
        raise NotImplementedError

class InMemoryDB(DBInterface):
    def __init__(self):
        self.users: Dict[int, User] = {}
        self.tickets: Dict[int, Ticket] = {}
        self.messages: Dict[int, TicketMessage] = {}
        self.reports: Dict[int, TicketReport] = {}
        self.user_id_counter = 1
        self.ticket_id_counter = 1
        self.message_id_counter = 1
        self.report_id_counter = 1
        
        # Create default admin user
        admin_user = self.create_user(
            User(
                username="admin",
                password="admin123",  # Should be hashed in production
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE,
                language="ar"
            )
        )
        
        # Create test tickets with translations
        self.create_ticket(
            Ticket(
                title="Login Issue",
                description="Cannot login to the system",
                translations=TicketTranslation(
                    title={
                        "en": "Login Issue",
                        "ar": "مشكلة في تسجيل الدخول",
                        "fr": "Problème de connexion",
                        "es": "Problema de inicio de sesión",
                        "de": "Anmeldeproblem"
                    },
                    description={
                        "en": "Cannot login to the system",
                        "ar": "لا يمكن تسجيل الدخول إلى النظام",
                        "fr": "Impossible de se connecter au système",
                        "es": "No se puede iniciar sesión en el sistema",
                        "de": "Anmeldung am System nicht möglich"
                    }
                ),
                status=TicketStatus.OPEN,
                created_by=admin_user.id
            )
        )
        
        self.create_ticket(
            Ticket(
                title="Dark Mode Request",
                description="Need dark mode feature",
                translations=TicketTranslation(
                    title={
                        "en": "Dark Mode Request",
                        "ar": "طلب الوضع المظلم",
                        "fr": "Demande de mode sombre",
                        "es": "Solicitud de modo oscuro",
                        "de": "Anfrage für Dunkelmodus"
                    },
                    description={
                        "en": "Need dark mode feature",
                        "ar": "نحتاج إلى ميزة الوضع المظلم",
                        "fr": "Besoin de la fonctionnalité mode sombre",
                        "es": "Se necesita función de modo oscuro",
                        "de": "Dunkelmodus-Funktion wird benötigt"
                    }
                ),
                status=TicketStatus.IN_PROGRESS,
                created_by=admin_user.id
            )
        )

    def create_user(self, user: User) -> User:
        user.id = self.user_id_counter
        self.users[user.id] = user
        self.user_id_counter += 1
        return user

    def get_user(self, user_id: int) -> Optional[User]:
        return self.users.get(user_id)

    def get_user_by_username(self, username: str) -> Optional[User]:
        return next((u for u in self.users.values() if u.username == username), None)

    def create_ticket(self, ticket: Ticket) -> Ticket:
        ticket.id = self.ticket_id_counter
        self.tickets[ticket.id] = ticket
        self.ticket_id_counter += 1
        return ticket

    def get_ticket(self, ticket_id: int) -> Optional[Ticket]:
        return self.tickets.get(ticket_id)

    def get_user_tickets(self, user_id: int) -> List[Ticket]:
        return [t for t in self.tickets.values() if t.created_by == user_id]

    def get_assigned_tickets(self, supervisor_id: int) -> List[Ticket]:
        return [t for t in self.tickets.values() if t.assigned_to == supervisor_id]

    def create_message(self, message: TicketMessage) -> TicketMessage:
        message.id = self.message_id_counter
        self.messages[message.id] = message
        self.message_id_counter += 1
        return message

    def get_ticket_messages(self, ticket_id: int) -> List[TicketMessage]:
        return [m for m in self.messages.values() if m.ticket_id == ticket_id]

    def create_report(self, report: TicketReport) -> TicketReport:
        report.id = self.report_id_counter
        self.reports[report.id] = report
        self.report_id_counter += 1
        return report

    def get_reports(self) -> List[TicketReport]:
        return list(self.reports.values())
    
    def get_users(self) -> List[User]:
        return list(self.users.values())
    
    def get_tickets(self) -> List[Ticket]:
        return list(self.tickets.values())

    def update_ticket_status(self, ticket_id: int, status: TicketStatus) -> Optional[Ticket]:
        if ticket := self.tickets.get(ticket_id):
            ticket.status = status
            ticket.updated_at = datetime.now()
            return ticket
        return None

    def assign_ticket(self, ticket_id: int, supervisor_id: int) -> Optional[Ticket]:
        if ticket := self.tickets.get(ticket_id):
            ticket.assigned_to = supervisor_id
            ticket.status = TicketStatus.IN_PROGRESS
            ticket.updated_at = datetime.now()
            return ticket
        return None

class SQLAlchemyDB(DBInterface):
    def __init__(self):
        # Create tables
        Base.metadata.create_all(bind=engine)
        self.SessionLocal = SessionLocal
        
        # Create default admin user if it doesn't exist
        db = self.get_session()
        try:
            admin = db.query(UserDB).filter(UserDB.username == "admin").first()
            if not admin:
                admin = User(
                    username="admin",
                    password="admin123",  # Will be hashed in create_user
                    role=UserRole.ADMIN,
                    status=UserStatus.ACTIVE,
                    language="ar"
                )
                self.create_user(admin)
        finally:
            db.close()
    
    def get_session(self) -> Session:
        return self.SessionLocal()
    
    def create_user(self, user: User) -> User:
        db = self.get_session()
        try:
            # Hash the password
            hashed_password = pwd_context.hash(user.password)
            
            # Create UserDB instance
            user_dict = user.dict(exclude={'id', 'created_at', 'updated_at'})
            user_dict['password'] = hashed_password
            db_user = UserDB(**user_dict)
            
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            
            # Convert back to Pydantic model
            return User.from_orm(db_user)
        finally:
            db.close()
    
    def get_user(self, user_id: int) -> Optional[User]:
        db = self.get_session()
        try:
            db_user = db.query(UserDB).filter(UserDB.id == user_id).first()
            return User.from_orm(db_user) if db_user else None
        finally:
            db.close()
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        db = self.get_session()
        try:
            db_user = db.query(UserDB).filter(UserDB.username == username).first()
            return User.from_orm(db_user) if db_user else None
        finally:
            db.close()
    
    def create_ticket(self, ticket: Ticket) -> Ticket:
        db = self.get_session()
        try:
            db.add(ticket)
            db.commit()
            db.refresh(ticket)
            return ticket
        finally:
            db.close()
    
    def get_ticket(self, ticket_id: int) -> Optional[Ticket]:
        db = self.get_session()
        try:
            return db.query(Ticket).filter(Ticket.id == ticket_id).first()
        finally:
            db.close()
    
    def get_user_tickets(self, user_id: int) -> List[Ticket]:
        db = self.get_session()
        try:
            return db.query(Ticket).filter(Ticket.created_by == user_id).all()
        finally:
            db.close()
    
    def get_assigned_tickets(self, supervisor_id: int) -> List[Ticket]:
        db = self.get_session()
        try:
            return db.query(Ticket).filter(Ticket.assigned_to == supervisor_id).all()
        finally:
            db.close()
    
    def create_message(self, message: TicketMessage) -> TicketMessage:
        db = self.get_session()
        try:
            db.add(message)
            db.commit()
            db.refresh(message)
            return message
        finally:
            db.close()
    
    def get_ticket_messages(self, ticket_id: int) -> List[TicketMessage]:
        db = self.get_session()
        try:
            return db.query(TicketMessage).filter(TicketMessage.ticket_id == ticket_id).all()
        finally:
            db.close()
    
    def create_report(self, report: TicketReport) -> TicketReport:
        db = self.get_session()
        try:
            db.add(report)
            db.commit()
            db.refresh(report)
            return report
        finally:
            db.close()
    
    def get_reports(self) -> List[TicketReport]:
        db = self.get_session()
        try:
            return db.query(TicketReport).all()
        finally:
            db.close()
    
    def get_users(self) -> List[User]:
        db = self.get_session()
        try:
            db_users = db.query(UserDB).all()
            return [User.from_orm(u) for u in db_users]
        finally:
            db.close()
    
    def get_tickets(self) -> List[Ticket]:
        db = self.get_session()
        try:
            return db.query(Ticket).all()
        finally:
            db.close()
    
    def update_ticket_status(self, ticket_id: int, status: TicketStatus) -> Optional[Ticket]:
        db = self.get_session()
        try:
            ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
            if ticket:
                ticket.status = status
                ticket.updated_at = datetime.now()
                db.commit()
                db.refresh(ticket)
            return ticket
        finally:
            db.close()
    
    def assign_ticket(self, ticket_id: int, supervisor_id: int) -> Optional[Ticket]:
        db = self.get_session()
        try:
            ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
            if ticket:
                ticket.assigned_to = supervisor_id
                ticket.status = TicketStatus.IN_PROGRESS
                ticket.updated_at = datetime.now()
                db.commit()
                db.refresh(ticket)
            return ticket
        finally:
            db.close()

# Initialize the database with SQLAlchemy implementation
# Keep InMemoryDB as fallback for testing
db: DBInterface = SQLAlchemyDB()
