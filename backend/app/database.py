from datetime import datetime
from typing import Dict, List, Optional
from .models import User, Ticket, TicketMessage, TicketReport, UserRole, UserStatus, TicketStatus, TicketTranslation

class InMemoryDB:
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

# Initialize the database
db = InMemoryDB()
