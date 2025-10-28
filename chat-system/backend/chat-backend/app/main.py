from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta, timezone
import json
import uuid
import hashlib
from jose import JWTError, jwt
import os
from .repositories import (
    users_repo, messages_repo, bans_repo, mutes_repo,
    appeals_repo, reports_repo, files_repo, announcements_repo, settings_repo
)

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

class UserRegister(BaseModel):
    username: str
    password: str
    email: str
    bigo_name: str
    user_id: str

class UserLogin(BaseModel):
    username: str
    password: Optional[str] = None

class AdminLogin(BaseModel):
    username: str
    access_code: str

class Message(BaseModel):
    content: str
    user_id: str
    username: str
    role: str

class BanUser(BaseModel):
    user_id: str
    duration_minutes: int
    reason: str

class MuteUser(BaseModel):
    user_id: str
    duration_minutes: int
    reason: str

class ReportMessage(BaseModel):
    message_id: str
    reporter_id: str
    category: str
    reason: str

class BanAppeal(BaseModel):
    user_id: str
    appeal_text: str

class AppealResponse(BaseModel):
    appeal_id: str
    response: str
    action: str

class Announcement(BaseModel):
    content: str
    created_by: str

class ChatSettings(BaseModel):
    is_open: bool
    close_message: str

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def generate_user_id() -> str:
    return str(uuid.uuid4().int)[:10]

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/api/register")
async def register(user: UserRegister):
    if users_repo.get_by_username(user.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user_id = generate_user_id()
    user_data = {
        "username": user.username,
        "password": hash_password(user.password),
        "email": user.email,
        "bigo_name": user.bigo_name,
        "user_id": user_id,
        "role": "user",
        "created_at": datetime.utcnow().isoformat()
    }
    users_repo.create(user.username, user_data)
    
    return {
        "message": "User registered successfully",
        "user_id": user_id,
        "username": user.username
    }

@app.post("/api/login")
async def login(user: UserLogin):
    stored_user = users_repo.get_by_username(user.username)
    if not stored_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    ban = bans_repo.get(stored_user["user_id"])
    if ban:
        if datetime.fromisoformat(ban["expires_at"]) > datetime.utcnow():
            remaining = datetime.fromisoformat(ban["expires_at"]) - datetime.utcnow()
            remaining_minutes = max(0, int(remaining.total_seconds() / 60))
            raise HTTPException(
                status_code=403,
                detail={
                    "type": "banned",
                    "reason": ban["reason"],
                    "expires_at": ban["expires_at"],
                    "duration_minutes": ban["duration_minutes"],
                    "remaining_minutes": remaining_minutes
                }
            )
        else:
            bans_repo.delete(stored_user["user_id"])
    
    if user.password and not verify_password(user.password, stored_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user.username, "role": stored_user["role"]})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "username": stored_user["username"],
            "user_id": stored_user["user_id"],
            "role": stored_user["role"]
        }
    }

@app.post("/api/admin/login")
async def admin_login(admin: AdminLogin):
    if admin.access_code != "3131":
        raise HTTPException(status_code=401, detail="Invalid access code")
    
    stored_user = users_repo.get_by_username(admin.username)
    if not stored_user:
        user_id = generate_user_id()
        user_data = {
            "username": admin.username,
            "password": hash_password("admin"),
            "email": "admin@chat.com",
            "bigo_name": "Admin",
            "user_id": user_id,
            "role": "admin",
            "created_at": datetime.utcnow().isoformat()
        }
        users_repo.create(admin.username, user_data)
        stored_user = user_data
    else:
        users_repo.update(admin.username, {"role": "admin"})
        stored_user["role"] = "admin"
    
    token = create_access_token({"sub": admin.username, "role": "admin"})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "username": stored_user["username"],
            "user_id": stored_user["user_id"],
            "role": "admin"
        }
    }

@app.get("/api/messages")
async def get_messages():
    return {"messages": messages_repo.list_all()}

@app.post("/api/messages")
async def send_message(message: Message):
    mute = mutes_repo.get(message.user_id)
    if mute:
        if datetime.fromisoformat(mute["expires_at"]) > datetime.utcnow():
            raise HTTPException(
                status_code=403,
                detail={
                    "type": "muted",
                    "reason": mute["reason"],
                    "expires_at": mute["expires_at"]
                }
            )
        else:
            mutes_repo.delete(message.user_id)
    
    settings = settings_repo.get()
    if not settings.get("is_open", True) and message.role != "admin":
        raise HTTPException(status_code=403, detail="Chat is currently closed")
    
    content = message.content
    is_admin_bold = False
    if message.role in ["admin", "moderator"] and content.startswith("$"):
        is_admin_bold = True
        content = content[1:]  # Strip the $ prefix
    elif content.startswith("$"):
        content = content[1:]
    
    new_message = {
        "content": content,
        "user_id": message.user_id,
        "username": message.username,
        "role": message.role,
        "is_admin_bold": is_admin_bold,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    msg_id = messages_repo.create(new_message)
    new_message["id"] = msg_id
    await manager.broadcast({"type": "new_message", "message": new_message})
    
    return {"message": "Message sent", "data": new_message}

@app.delete("/api/messages/{message_id}")
async def delete_message(message_id: str):
    messages_repo.delete(message_id)
    await manager.broadcast({"type": "message_deleted", "message_id": message_id})
    return {"message": "Message deleted"}

@app.delete("/api/messages")
async def clear_messages():
    messages_repo.clear_all()
    await manager.broadcast({"type": "messages_cleared"})
    return {"message": "All messages cleared"}

@app.post("/api/admin/ban")
async def ban_user(ban: BanUser):
    expires_at = datetime.utcnow() + timedelta(minutes=ban.duration_minutes)
    ban_data = {
        "user_id": ban.user_id,
        "reason": ban.reason,
        "duration_minutes": ban.duration_minutes,
        "expires_at": expires_at.isoformat(),
        "banned_at": datetime.utcnow().isoformat()
    }
    bans_repo.create(ban.user_id, ban_data)
    
    await manager.broadcast({
        "type": "user_banned",
        "user_id": ban.user_id,
        "reason": ban.reason,
        "expires_at": expires_at.isoformat()
    })
    
    return {"message": "User banned successfully"}

@app.post("/api/admin/unban/{user_id}")
async def unban_user(user_id: str):
    bans_repo.delete(user_id)
    await manager.broadcast({"type": "user_unbanned", "user_id": user_id})
    return {"message": "User unbanned successfully"}

@app.get("/api/ban/{user_id}")
async def get_user_ban(user_id: str):
    ban = bans_repo.get(user_id)
    if not ban:
        raise HTTPException(status_code=404, detail="No active ban found")
    
    if datetime.fromisoformat(ban["expires_at"]) <= datetime.utcnow():
        bans_repo.delete(user_id)
        raise HTTPException(status_code=404, detail="Ban has expired")
    
    remaining = datetime.fromisoformat(ban["expires_at"]) - datetime.utcnow()
    ban["remaining_minutes"] = max(0, int(remaining.total_seconds() / 60))
    
    return {
        "reason": ban["reason"],
        "duration_minutes": ban["duration_minutes"],
        "expires_at": ban["expires_at"],
        "remaining_minutes": ban["remaining_minutes"]
    }

@app.get("/api/admin/bans")
async def get_bans():
    all_bans = bans_repo.list_all()
    active_bans = []
    
    if isinstance(all_bans, dict):
        items = all_bans.items()
    else:
        items = [(b.get("user_id") or b.get("id"), b) for b in all_bans]
    
    for user_id, ban in items:
        if datetime.fromisoformat(ban["expires_at"]) > datetime.utcnow():
            remaining = datetime.fromisoformat(ban["expires_at"]) - datetime.utcnow()
            ban["remaining_minutes"] = int(remaining.total_seconds() / 60)
            active_bans.append(ban)
        else:
            bans_repo.delete(user_id)
    return {"bans": active_bans}

@app.post("/api/admin/mute")
async def mute_user(mute: MuteUser):
    expires_at = datetime.utcnow() + timedelta(minutes=mute.duration_minutes)
    mute_data = {
        "user_id": mute.user_id,
        "reason": mute.reason,
        "duration_minutes": mute.duration_minutes,
        "expires_at": expires_at.isoformat(),
        "muted_at": datetime.utcnow().isoformat()
    }
    mutes_repo.create(mute.user_id, mute_data)
    
    await manager.broadcast({
        "type": "user_muted",
        "user_id": mute.user_id,
        "reason": mute.reason,
        "expires_at": expires_at.isoformat()
    })
    
    return {"message": "User muted successfully"}

@app.get("/api/admin/mutes")
async def get_mutes():
    all_mutes = mutes_repo.list_all()
    active_mutes = []
    
    if isinstance(all_mutes, dict):
        items = all_mutes.items()
    else:
        items = [(m.get("user_id") or m.get("id"), m) for m in all_mutes]
    
    for user_id, mute in items:
        if datetime.fromisoformat(mute["expires_at"]) > datetime.utcnow():
            remaining = datetime.fromisoformat(mute["expires_at"]) - datetime.utcnow()
            mute["remaining_minutes"] = int(remaining.total_seconds() / 60)
            active_mutes.append(mute)
        else:
            mutes_repo.delete(user_id)
    return {"mutes": active_mutes}

@app.post("/api/admin/unmute/{user_id}")
async def unmute_user(user_id: str):
    mutes_repo.delete(user_id)
    return {"message": "User unmuted successfully"}

@app.post("/api/reports")
async def report_message(report: ReportMessage):
    new_report = {
        "message_id": report.message_id,
        "reporter_id": report.reporter_id,
        "category": report.category,
        "reason": report.reason,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat()
    }
    report_id = reports_repo.create(new_report)
    return {"message": "Report submitted", "report_id": report_id}

@app.get("/api/admin/reports")
async def get_reports():
    return {"reports": reports_repo.list_all()}

@app.post("/api/admin/reports/{report_id}/resolve")
async def resolve_report(report_id: str):
    report = reports_repo.get(report_id)
    if report:
        reports_repo.update(report_id, {"status": "resolved"})
        return {"message": "Report resolved"}
    raise HTTPException(status_code=404, detail="Report not found")

@app.post("/api/appeals")
async def submit_appeal(appeal: BanAppeal):
    actual_user_id = appeal.user_id
    user = users_repo.get_by_username(appeal.user_id)
    if user:
        actual_user_id = user["user_id"]
    
    if not bans_repo.get(actual_user_id):
        raise HTTPException(status_code=400, detail="User is not banned")
    
    new_appeal = {
        "user_id": actual_user_id,
        "appeal_text": appeal.appeal_text,
        "status": "pending",
        "response": None,
        "created_at": datetime.utcnow().isoformat()
    }
    appeal_id = appeals_repo.create(new_appeal)
    return {"message": "Appeal submitted", "appeal_id": appeal_id}

@app.get("/api/appeals/{user_id}")
async def get_user_appeals(user_id: str):
    actual_user_id = user_id
    user = users_repo.get_by_username(user_id)
    if user:
        actual_user_id = user["user_id"]
    all_appeals = appeals_repo.list_all()
    user_appeals = [a for a in all_appeals if a.get("user_id") == actual_user_id]
    return {"appeals": user_appeals}

@app.get("/api/admin/appeals")
async def get_all_appeals():
    return {"appeals": appeals_repo.list_all()}

@app.post("/api/admin/appeals/respond")
async def respond_to_appeal(response: AppealResponse):
    appeal = appeals_repo.get(response.appeal_id)
    if appeal:
        appeals_repo.update(response.appeal_id, {
            "status": "resolved",
            "response": response.response,
            "action": response.action
        })
        
        if response.action == "accept":
            bans_repo.delete(appeal["user_id"])
            await manager.broadcast({
                "type": "user_unbanned",
                "user_id": appeal["user_id"]
            })
        
        return {"message": "Appeal responded"}
    raise HTTPException(status_code=404, detail="Appeal not found")

@app.post("/api/admin/announcements")
async def create_announcement(announcement: Announcement):
    new_announcement = {
        "content": announcement.content,
        "created_by": announcement.created_by,
        "created_at": datetime.utcnow().isoformat()
    }
    ann_id = announcements_repo.create(new_announcement)
    new_announcement["id"] = ann_id
    await manager.broadcast({"type": "new_announcement", "announcement": new_announcement})
    return {"message": "Announcement created", "announcement": new_announcement}

@app.get("/api/announcements")
async def get_announcements():
    return {"announcements": announcements_repo.list_all()}

@app.post("/api/admin/chat/settings")
async def update_chat_settings(settings: ChatSettings):
    settings_data = {
        "is_open": settings.is_open,
        "close_message": settings.close_message
    }
    settings_repo.update(settings_data)
    await manager.broadcast({"type": "chat_settings_updated", "settings": settings_data})
    return {"message": "Chat settings updated", "settings": settings_data}

@app.get("/api/chat/settings")
async def get_chat_settings():
    settings = settings_repo.get()
    if not settings:
        settings = {"is_open": True, "close_message": ""}
    return {"settings": settings}

@app.post("/api/files/upload")
async def upload_file(file: UploadFile = File(...), user_id: str = ""):
    pending_file = {
        "filename": file.filename,
        "user_id": user_id,
        "status": "pending",
        "uploaded_at": datetime.utcnow().isoformat()
    }
    file_id = files_repo.create(pending_file)
    return {"message": "File uploaded, awaiting approval", "file_id": file_id}

@app.get("/api/admin/files")
async def get_pending_files():
    all_files = files_repo.list_pending()
    return {"files": all_files}

@app.post("/api/admin/files/{file_id}/approve")
async def approve_file(file_id: str):
    file = files_repo.get(file_id)
    if file:
        files_repo.update(file_id, {"status": "approved"})
        file["status"] = "approved"
        await manager.broadcast({"type": "file_approved", "file": file})
        return {"message": "File approved"}
    raise HTTPException(status_code=404, detail="File not found")

@app.post("/api/admin/files/{file_id}/reject")
async def reject_file(file_id: str):
    file = files_repo.get(file_id)
    if file:
        files_repo.update(file_id, {"status": "rejected"})
        return {"message": "File rejected"}
    raise HTTPException(status_code=404, detail="File not found")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/api/users")
async def get_users():
    all_users = users_repo.list_all()
    return {"users": [{"username": u["username"], "user_id": u["user_id"], "role": u["role"]} for u in all_users.values()]}
