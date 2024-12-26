from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from .models import (
    User, Ticket, TicketMessage, TicketReport, UserRole, TicketStatus, VisitorInfo,
    UserDB, TicketDB, TicketMessageDB, TicketReportDB
)
from .database import SQLAlchemyDB, get_db

# Initialize database
db = SQLAlchemyDB()

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

# User endpoints
from pydantic import BaseModel
from .models import User, Ticket, TicketMessage, TicketReport, UserRole, UserStatus, TicketStatus

@app.get("/users/", response_model=List[User])
async def get_users():
    return db.get_users()

@app.get("/tickets/", response_model=List[Ticket])
async def get_tickets(
    lang: str = Query(default="en", description="Language code"),
    type: str = Query(default="all", description="Filter by ticket type: all, visitor, user")
):
    tickets = db.get_tickets()
    filtered_tickets = []
    
    # Filter tickets based on type
    for ticket in tickets:
        if type == "visitor" and ticket.visitor_info:
            filtered_tickets.append(ticket)
        elif type == "user" and ticket.created_by and not ticket.visitor_info:
            filtered_tickets.append(ticket)
        elif type == "all":
            filtered_tickets.append(ticket)
    
    # Apply translations if needed
    if lang != "en":
        translated_tickets = []
        for ticket in filtered_tickets:
            if ticket.translations and lang in ticket.translations.title and lang in ticket.translations.description:
                translated_ticket = Ticket(**ticket.dict())
                translated_ticket.title = ticket.translations.title[lang]
                translated_ticket.description = ticket.translations.description[lang]
                translated_tickets.append(translated_ticket)
            else:
                translated_tickets.append(ticket)
        return translated_tickets
    return filtered_tickets

class LoginCredentials(BaseModel):
    username: str
    password: str

@app.post("/users/login", response_model=User)
async def login(credentials: LoginCredentials, db_session: Session = Depends(get_db)):
    user_db = db_session.query(UserDB).filter(UserDB.username == credentials.username).first()
    if not user_db or not pwd_context.verify(credentials.password, user_db.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    # Convert SQLAlchemy model to Pydantic model for response
    return User(
        id=user_db.id,
        username=user_db.username,
        password=user_db.password,  # Note: In production, consider not returning the hashed password
        role=user_db.role,
        status=user_db.status,
        language=user_db.language
    )


@app.post("/users/", response_model=User)
async def create_user(user: User, db_session: Session = Depends(get_db)):
    if db_session.query(UserDB).filter(UserDB.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Hash the password before storing
    hashed_password = pwd_context.hash(user.password)
    user_db = UserDB(
        username=user.username,
        password=hashed_password,
        role=user.role,
        status=user.status,
        language=user.language
    )
    
    db_session.add(user_db)
    db_session.commit()
    db_session.refresh(user_db)
    
    # Convert back to Pydantic model for response
    return User(
        id=user_db.id,
        username=user_db.username,
        password=user_db.password,  # Note: In production, consider not returning the hashed password
        role=user_db.role,
        status=user_db.status,
        language=user_db.language
    )

@app.get("/users/{user_id}", response_model=User)
async def get_user(user_id: int):
    if user := db.get_user(user_id):
        return user
    raise HTTPException(status_code=404, detail="User not found")

class CreateTicketRequest(BaseModel):
    title: str
    description: str
    status: TicketStatus = TicketStatus.OPEN
    created_at: datetime = datetime.now()
    created_by: Optional[int] = None
    visitor_info: Optional[VisitorInfo] = None

# Ticket endpoints
@app.post("/tickets/", response_model=Ticket)
async def create_ticket(ticket_request: CreateTicketRequest):
    if ticket_request.created_by:
        if not db.get_user(ticket_request.created_by):
            raise HTTPException(status_code=404, detail="User not found")
    elif not ticket_request.visitor_info:
        raise HTTPException(status_code=400, detail="Either created_by or visitor_info must be provided")
    
    ticket = Ticket(
        title=ticket_request.title,
        description=ticket_request.description,
        status=ticket_request.status,
        created_at=ticket_request.created_at,
        created_by=ticket_request.created_by,
        visitor_info=ticket_request.visitor_info
    )
    return db.create_ticket(ticket)

from fastapi import Query

@app.get("/tickets/{ticket_id}", response_model=Ticket)
async def get_ticket(ticket_id: int, lang: str = Query(default="en", description="Language code")):
    if ticket := db.get_ticket(ticket_id):
        if ticket.translations and lang in ticket.translations.title and lang in ticket.translations.description:
            # Create a copy of the ticket to avoid modifying the stored one
            translated_ticket = Ticket(**ticket.dict())
            translated_ticket.title = ticket.translations.title[lang]
            translated_ticket.description = ticket.translations.description[lang]
            return translated_ticket
        return ticket
    raise HTTPException(status_code=404, detail="Ticket not found")

@app.get("/tickets/user/{user_id}", response_model=List[Ticket])
async def get_user_tickets(user_id: int):
    return db.get_user_tickets(user_id)

@app.get("/tickets/assigned/{supervisor_id}", response_model=List[Ticket])
async def get_assigned_tickets(supervisor_id: int):
    return db.get_assigned_tickets(supervisor_id)

class TicketStatusUpdate(BaseModel):
    status: TicketStatus

@app.put("/tickets/{ticket_id}/status")
async def update_ticket_status(ticket_id: int, status_update: TicketStatusUpdate):
    if ticket := db.update_ticket_status(ticket_id, status_update.status):
        return ticket
    raise HTTPException(status_code=404, detail="Ticket not found")

@app.put("/tickets/{ticket_id}/assign/{supervisor_id}")
async def assign_ticket(ticket_id: int, supervisor_id: int):
    supervisor = db.get_user(supervisor_id)
    if not supervisor or supervisor.role not in [UserRole.ADMIN, UserRole.SUPERVISOR]:
        raise HTTPException(status_code=400, detail="Invalid supervisor")
    
    if ticket := db.assign_ticket(ticket_id, supervisor_id):
        return ticket
    raise HTTPException(status_code=404, detail="Ticket not found")

# Message endpoints
class CreateMessageRequest(BaseModel):
    content: str
    sender_id: int

@app.post("/tickets/{ticket_id}/messages/", response_model=TicketMessage)
async def create_message(ticket_id: int, message: CreateMessageRequest):
    if not db.get_ticket(ticket_id):
        raise HTTPException(status_code=404, detail="Ticket not found")
    if not db.get_user(message.sender_id):
        raise HTTPException(status_code=404, detail="User not found")
    ticket_message = TicketMessage(
        ticket_id=ticket_id,
        content=message.content,
        sender_id=message.sender_id,
        created_at=datetime.now()
    )
    return db.create_message(ticket_message)

@app.get("/tickets/{ticket_id}/messages/", response_model=List[TicketMessage])
async def get_ticket_messages(ticket_id: int):
    if not db.get_ticket(ticket_id):
        raise HTTPException(status_code=404, detail="Ticket not found")
    return db.get_ticket_messages(ticket_id)

# Report endpoints
@app.post("/reports/", response_model=TicketReport)
async def create_report(report: TicketReport):
    if not db.get_ticket(report.ticket_id):
        raise HTTPException(status_code=404, detail="Ticket not found")
    if not db.get_user(report.reporter_id):
        raise HTTPException(status_code=404, detail="User not found")
    return db.create_report(report)


@app.get("/reports/", response_model=List[TicketReport])
async def get_reports():
    return db.get_reports()

# Supervisor response endpoints
class SupervisorResponse(BaseModel):
    content: str
    supervisor_id: int

@app.post("/tickets/{ticket_id}/supervisor-response", response_model=TicketMessage)
async def create_supervisor_response(ticket_id: int, response: SupervisorResponse):
    supervisor = db.get_user(response.supervisor_id)
    if not supervisor or supervisor.role not in [UserRole.ADMIN, UserRole.SUPERVISOR]:
        raise HTTPException(status_code=403, detail="Only supervisors can respond to tickets")
    
    ticket = db.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Create response message
    message = TicketMessage(
        ticket_id=ticket_id,
        content=response.content,
        sender_id=response.supervisor_id,
        created_at=datetime.now()
    )
    
    # Update ticket status to in progress if it's open
    if ticket.status == TicketStatus.OPEN:
        db.update_ticket_status(ticket_id, TicketStatus.IN_PROGRESS)
    
    return db.create_message(message)

@app.get("/tickets/visitor/{email}", response_model=List[Ticket])
async def get_visitor_tickets(email: str):
    """Get all tickets submitted by a visitor with the given email"""
    tickets = db.get_tickets()
    return [
        ticket for ticket in tickets 
        if ticket.visitor_info and ticket.visitor_info.email == email
    ]
