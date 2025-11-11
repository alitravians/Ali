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

import os
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
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
        reports_repo.update(report_id, {"status": "resolved", "resolved_at": datetime.utcnow().isoformat()})
        return {"message": "Report resolved"}
    raise HTTPException(status_code=404, detail="Report not found")

@app.post("/api/admin/reports/{report_id}/reject")
async def reject_report(report_id: str):
    report = reports_repo.get(report_id)
    if report:
        reports_repo.update(report_id, {"status": "rejected", "resolved_at": datetime.utcnow().isoformat()})
        return {"message": "Report rejected"}
    raise HTTPException(status_code=404, detail="Report not found")

@app.post("/api/admin/reports/{report_id}/ban-user")
async def ban_user_from_report(report_id: str, duration: int = 30):
    report = reports_repo.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    message = messages_repo.get(report["message_id"])
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    user_id = message["user_id"]
    ban_until = datetime.utcnow() + timedelta(minutes=duration)
    ban_data = {
        "user_id": user_id,
        "banned_until": ban_until.isoformat(),
        "reason": f"Reported message: {report['category']} - {report['reason']}",
        "banned_at": datetime.utcnow().isoformat()
    }
    bans_repo.create(ban_data)
    reports_repo.update(report_id, {"status": "resolved", "action_taken": "user_banned", "resolved_at": datetime.utcnow().isoformat()})
    
    return {"message": f"User {user_id} banned for {duration} minutes"}

@app.post("/api/admin/reports/{report_id}/delete-message")
async def delete_message_from_report(report_id: str):
    report = reports_repo.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    message_id = report["message_id"]
    message = messages_repo.get(message_id)
    if message:
        messages_repo.delete(message_id)
        reports_repo.update(report_id, {"status": "resolved", "action_taken": "message_deleted", "resolved_at": datetime.utcnow().isoformat()})
        await manager.broadcast({"type": "message_deleted", "message_id": message_id})
        return {"message": "Message deleted"}
    raise HTTPException(status_code=404, detail="Message not found")

@app.get("/api/admin/reports/statistics")
async def get_report_statistics():
    all_reports = reports_repo.list_all()
    
    total = len(all_reports)
    pending = len([r for r in all_reports if r.get("status") == "pending"])
    resolved = len([r for r in all_reports if r.get("status") == "resolved"])
    rejected = len([r for r in all_reports if r.get("status") == "rejected"])
    
    categories = {}
    for report in all_reports:
        category = report.get("category", "other")
        categories[category] = categories.get(category, 0) + 1
    
    return {
        "total": total,
        "pending": pending,
        "resolved": resolved,
        "rejected": rejected,
        "by_category": categories
    }

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

@app.put("/api/admin/announcements/{announcement_id}")
async def update_announcement(announcement_id: str, announcement: Announcement):
    updated_data = {
        "content": announcement.content,
    }
    success = announcements_repo.update(announcement_id, updated_data)
    if success:
        updated_announcement = {
            "id": announcement_id,
            "content": announcement.content,
            "created_by": announcement.created_by,
        }
        await manager.broadcast({"type": "announcement_updated", "announcement": updated_announcement})
        return {"message": "Announcement updated", "announcement": updated_announcement}
    return {"error": "Failed to update announcement"}

@app.delete("/api/admin/announcements/{announcement_id}")
async def delete_announcement(announcement_id: str):
    success = announcements_repo.delete(announcement_id)
    if success:
        await manager.broadcast({"type": "announcement_deleted", "id": announcement_id})
        return {"message": "Announcement deleted"}
    return {"error": "Failed to delete announcement"}

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

import asyncio
import traceback
from .firebase_config import firebase_api

diagnostic_runs = {}
recent_errors = []

class DiagnosticRun(BaseModel):
    run_id: Optional[str] = None

async def run_diagnostic_check(check_name: str, check_func, weight: int, run_id: str):
    """Run a single diagnostic check and update progress"""
    try:
        start_time = datetime.utcnow()
        result = await check_func()
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()
        
        return {
            "check": check_name,
            "status": "success" if result["status"] == "pass" else "warning" if result["status"] == "warning" else "error",
            "message": result["message"],
            "details": result.get("details", {}),
            "duration": duration,
            "weight": weight
        }
    except Exception as e:
        return {
            "check": check_name,
            "status": "error",
            "message": f"Check failed: {str(e)}",
            "details": {"error": str(e), "traceback": traceback.format_exc()},
            "duration": 0,
            "weight": weight
        }

async def check_firebase_connectivity():
    """Check Firebase read/write connectivity"""
    try:
        test_key = f"diagnostics/healthcheck/{uuid.uuid4()}"
        test_data = {"test": "data", "timestamp": datetime.utcnow().isoformat()}
        
        write_result = firebase_api.set(test_key, test_data)
        if not write_result:
            return {"status": "error", "message": "Firebase write failed"}
        
        read_result = firebase_api.get(test_key)
        if not read_result or read_result.get("test") != "data":
            return {"status": "error", "message": "Firebase read failed"}
        
        firebase_api.delete(test_key)
        
        return {"status": "pass", "message": "Firebase connectivity OK", "details": {"read": "OK", "write": "OK", "delete": "OK"}}
    except Exception as e:
        return {"status": "error", "message": f"Firebase connectivity failed: {str(e)}"}

async def check_endpoint_health(endpoint: str, expected_status: int = 200):
    """Check if an endpoint is responding"""
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(f"http://localhost:8000{endpoint}", timeout=5.0)
            if response.status_code == expected_status:
                return {"status": "pass", "message": f"Endpoint {endpoint} OK", "details": {"status_code": response.status_code}}
            else:
                return {"status": "warning", "message": f"Endpoint {endpoint} returned {response.status_code}", "details": {"status_code": response.status_code}}
    except Exception as e:
        return {"status": "error", "message": f"Endpoint {endpoint} failed: {str(e)}"}

async def check_environment_variables():
    """Check if Firebase configuration is properly set up"""
    from .firebase_config import FIREBASE_DB_URL
    
    if FIREBASE_DB_URL and FIREBASE_DB_URL.startswith("https://"):
        return {
            "status": "pass", 
            "message": "Firebase configuration OK (using firebase_config.py)", 
            "details": {
                "config_source": "firebase_config.py",
                "database_url_configured": True
            }
        }
    
    required_vars = ["FIREBASE_DATABASE_URL", "FIREBASE_API_KEY"]
    missing = []
    present = []
    
    for var in required_vars:
        if os.getenv(var):
            present.append(var)
        else:
            missing.append(var)
    
    if missing:
        return {
            "status": "warning", 
            "message": f"Firebase not configured via firebase_config.py or environment variables", 
            "details": {
                "missing_env_vars": missing, 
                "present_env_vars": present,
                "config_source": "none"
            }
        }
    
    return {
        "status": "pass", 
        "message": "Firebase configuration OK (using environment variables)", 
        "details": {
            "config_source": "environment_variables",
            "present_env_vars": present
        }
    }

async def check_database_integrity():
    """Check database structure and data integrity"""
    try:
        issues = []
        
        try:
            users_repo.list_all()
        except Exception as e:
            issues.append(f"Users repository error: {str(e)}")
        
        try:
            messages_repo.list_all()
        except Exception as e:
            issues.append(f"Messages repository error: {str(e)}")
        
        try:
            bans_repo.list_all()
        except Exception as e:
            issues.append(f"Bans repository error: {str(e)}")
        
        if issues:
            return {"status": "error", "message": "Database integrity issues found", "details": {"issues": issues}}
        
        return {"status": "pass", "message": "Database integrity OK", "details": {"repositories_checked": 3}}
    except Exception as e:
        return {"status": "error", "message": f"Database integrity check failed: {str(e)}"}

async def check_recent_errors():
    """Check for recent errors in the system"""
    if recent_errors:
        return {"status": "warning", "message": f"Found {len(recent_errors)} recent errors", "details": {"errors": recent_errors[-5:]}}
    return {"status": "pass", "message": "No recent errors", "details": {"error_count": 0}}

async def check_all_api_endpoints():
    """Check all API endpoints systematically"""
    endpoints_to_check = [
        ("/healthz", 200),
        ("/api/messages", 200),
        ("/api/announcements", 200),
        ("/api/chat/settings", 200),
        ("/api/users", 200),
        ("/api/admin/bans", 200),
        ("/api/admin/mutes", 200),
        ("/api/admin/reports", 200),
        ("/api/admin/appeals", 200),
        ("/api/admin/files", 200),
    ]
    
    issues = []
    working = []
    
    for endpoint, expected_status in endpoints_to_check:
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(f"http://localhost:8000{endpoint}", timeout=5.0)
                if response.status_code == expected_status:
                    working.append(endpoint)
                else:
                    issues.append(f"{endpoint}: Expected {expected_status}, got {response.status_code}")
        except Exception as e:
            issues.append(f"{endpoint}: {str(e)}")
    
    if issues:
        return {
            "status": "error" if len(issues) > len(working) else "warning",
            "message": f"Found {len(issues)} endpoint issues out of {len(endpoints_to_check)} checked",
            "details": {
                "working_endpoints": working,
                "failed_endpoints": issues,
                "severity": "high" if len(issues) > len(working) else "medium",
                "solution": "Check backend logs for errors. Verify all repository methods are working correctly."
            }
        }
    
    return {
        "status": "pass",
        "message": f"All {len(endpoints_to_check)} API endpoints responding correctly",
        "details": {"endpoints_checked": len(endpoints_to_check), "all_working": working}
    }

async def check_websocket_connectivity():
    """Check WebSocket connection capability"""
    try:
        if manager and hasattr(manager, 'active_connections'):
            return {
                "status": "pass",
                "message": "WebSocket manager initialized correctly",
                "details": {
                    "active_connections": len(manager.active_connections),
                    "manager_status": "ready"
                }
            }
        else:
            return {
                "status": "error",
                "message": "WebSocket manager not properly initialized",
                "details": {
                    "severity": "high",
                    "solution": "Check ConnectionManager class initialization in main.py"
                }
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"WebSocket check failed: {str(e)}",
            "details": {
                "severity": "high",
                "solution": "Verify ConnectionManager class and WebSocket endpoint configuration"
            }
        }

async def check_firebase_security():
    """Check Firebase security configuration"""
    try:
        from .firebase_config import FIREBASE_DB_URL
        import os
        
        issues = []
        warnings = []
        
        if not FIREBASE_DB_URL or not FIREBASE_DB_URL.startswith("https://"):
            issues.append("Firebase Database URL not properly configured")
        
        firebase_creds_env = os.getenv("FIREBASE_CREDENTIALS")
        if not firebase_creds_env:
            warnings.append("Firebase credentials not found in environment variables")
        
        try:
            test_read = firebase_api.get("users")
            if test_read is not None:
                warnings.append("Firebase security rules may be too permissive (public read access)")
        except:
            pass
        
        if issues:
            return {
                "status": "error",
                "message": "Firebase security configuration has critical issues",
                "details": {
                    "issues": issues,
                    "warnings": warnings,
                    "severity": "critical",
                    "solution": "Update firebase_config.py with correct credentials and review Firebase security rules"
                }
            }
        elif warnings:
            return {
                "status": "warning",
                "message": "Firebase security configuration has warnings",
                "details": {
                    "warnings": warnings,
                    "severity": "medium",
                    "solution": "Review Firebase security rules at console.firebase.google.com"
                }
            }
        
        return {
            "status": "pass",
            "message": "Firebase security configuration OK",
            "details": {"database_url": "configured", "credentials": "configured"}
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Firebase security check failed: {str(e)}",
            "details": {
                "severity": "high",
                "solution": "Check firebase_config.py file and ensure all credentials are set"
            }
        }

async def check_frontend_backend_integration():
    """Check integration points between frontend and backend"""
    try:
        integration_points = []
        issues = []
        
        try:
            users_repo.list_all()
            integration_points.append("Users repository: OK")
        except Exception as e:
            issues.append(f"Users repository: {str(e)}")
        
        try:
            messages_repo.list_all()
            integration_points.append("Messages repository: OK")
        except Exception as e:
            issues.append(f"Messages repository: {str(e)}")
        
        try:
            announcements_repo.list_all()
            integration_points.append("Announcements repository: OK")
        except Exception as e:
            issues.append(f"Announcements repository: {str(e)}")
        
        try:
            settings_repo.get()
            integration_points.append("Settings repository: OK")
        except Exception as e:
            issues.append(f"Settings repository: {str(e)}")
        
        if issues:
            return {
                "status": "error",
                "message": f"Found {len(issues)} integration issues",
                "details": {
                    "working": integration_points,
                    "issues": issues,
                    "severity": "high",
                    "solution": "Check repository implementations in repositories.py and Firebase connectivity"
                }
            }
        
        return {
            "status": "pass",
            "message": "All frontend-backend integration points working",
            "details": {"integration_points": integration_points}
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Integration check failed: {str(e)}",
            "details": {
                "severity": "critical",
                "solution": "Check repositories.py and ensure all repository classes are properly initialized"
            }
        }

async def check_authentication_system():
    """Check authentication and authorization system"""
    try:
        issues = []
        checks = []
        
        if SECRET_KEY == "your-secret-key-change-in-production":
            issues.append("JWT secret key is using default value (security risk)")
        else:
            checks.append("JWT secret key: Configured")
        
        try:
            test_hash = hash_password("test123")
            if verify_password("test123", test_hash):
                checks.append("Password hashing: Working")
            else:
                issues.append("Password verification not working correctly")
        except Exception as e:
            issues.append(f"Password hashing error: {str(e)}")
        
        try:
            test_token = create_access_token({"sub": "test_user"})
            if test_token and len(test_token) > 20:
                checks.append("JWT token creation: Working")
            else:
                issues.append("JWT token creation producing invalid tokens")
        except Exception as e:
            issues.append(f"JWT token creation error: {str(e)}")
        
        if issues:
            return {
                "status": "warning" if len(checks) > len(issues) else "error",
                "message": f"Authentication system has {len(issues)} issues",
                "details": {
                    "working": checks,
                    "issues": issues,
                    "severity": "high" if any("security" in i.lower() for i in issues) else "medium",
                    "solution": "Update SECRET_KEY in main.py and verify password hashing functions"
                }
            }
        
        return {
            "status": "pass",
            "message": "Authentication system working correctly",
            "details": {"checks_passed": checks}
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Authentication check failed: {str(e)}",
            "details": {
                "severity": "critical",
                "solution": "Check authentication functions in main.py"
            }
        }

async def check_performance_metrics():
    """Check system performance metrics"""
    try:
        import time
        metrics = {}
        
        start = time.time()
        try:
            firebase_api.get("users")
            metrics["firebase_read_time"] = time.time() - start
        except:
            metrics["firebase_read_time"] = -1
        
        start = time.time()
        try:
            messages_repo.list_all()
            metrics["messages_query_time"] = time.time() - start
        except:
            metrics["messages_query_time"] = -1
        
        issues = []
        if metrics.get("firebase_read_time", 0) > 2.0:
            issues.append("Firebase read time is slow (>2s)")
        if metrics.get("messages_query_time", 0) > 1.0:
            issues.append("Messages query time is slow (>1s)")
        
        if issues:
            return {
                "status": "warning",
                "message": "Performance issues detected",
                "details": {
                    "metrics": metrics,
                    "issues": issues,
                    "severity": "medium",
                    "solution": "Consider optimizing database queries and checking network connectivity to Firebase"
                }
            }
        
        return {
            "status": "pass",
            "message": "Performance metrics within acceptable range",
            "details": {"metrics": metrics}
        }
    except Exception as e:
        return {
            "status": "warning",
            "message": f"Performance check failed: {str(e)}",
            "details": {"severity": "low"}
        }

async def check_chat_settings_functionality():
    """Check Chat Settings admin panel functionality"""
    try:
        issues = []
        checks = []
        
        try:
            settings = settings_repo.get()
            if settings:
                checks.append("Settings retrieval: OK")
                
                if "is_open" in settings:
                    checks.append("Chat open/close toggle: Configured")
                else:
                    issues.append("Chat open/close setting missing from settings structure")
                
                if "close_message" in settings:
                    checks.append("Close message field: Configured")
                else:
                    issues.append("Close message field missing from settings structure")
            else:
                issues.append("Settings repository returned empty data")
        except Exception as e:
            issues.append(f"Settings retrieval error: {str(e)}")
        
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get("http://localhost:8000/api/chat/settings", timeout=5.0)
                if response.status_code == 200:
                    checks.append("Chat settings API endpoint: Working")
                else:
                    issues.append(f"Chat settings endpoint returned status {response.status_code}")
        except Exception as e:
            issues.append(f"Chat settings endpoint error: {str(e)}")
        
        if issues:
            return {
                "status": "error" if len(issues) > len(checks) else "warning",
                "message": f"Chat Settings has {len(issues)} issues",
                "details": {
                    "working": checks,
                    "issues": issues,
                    "severity": "high" if len(issues) > len(checks) else "medium",
                    "solution": "Check settings_repo in repositories.py and verify chat settings API endpoints in main.py",
                    "path": "AdminPanel.tsx (Chat Settings section), main.py (/api/chat/settings)"
                }
            }
        
        return {
            "status": "pass",
            "message": "Chat Settings functionality working correctly",
            "details": {"checks_passed": checks}
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Chat Settings check failed: {str(e)}",
            "details": {
                "severity": "high",
                "solution": "Check AdminPanel.tsx Chat Settings section and settings repository implementation",
                "path": "frontend/src/components/AdminPanel.tsx, backend/app/repositories.py"
            }
        }

async def check_appeals_system():
    """Check Appeals admin panel functionality"""
    try:
        issues = []
        checks = []
        
        try:
            appeals = appeals_repo.list_all()
            checks.append(f"Appeals retrieval: OK ({len(appeals)} appeals)")
            
            if appeals:
                sample_appeal = appeals[0]
                required_fields = ["id", "user_id", "appeal_text", "status"]
                missing_fields = [f for f in required_fields if f not in sample_appeal]
                
                if missing_fields:
                    issues.append(f"Appeals missing required fields: {', '.join(missing_fields)}")
                else:
                    checks.append("Appeals data structure: Valid")
        except Exception as e:
            issues.append(f"Appeals retrieval error: {str(e)}")
        
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get("http://localhost:8000/api/admin/appeals", timeout=5.0)
                if response.status_code == 200:
                    checks.append("Appeals API endpoint: Working")
                else:
                    issues.append(f"Appeals endpoint returned status {response.status_code}")
        except Exception as e:
            issues.append(f"Appeals endpoint error: {str(e)}")
        
        if issues:
            return {
                "status": "error" if len(issues) > len(checks) else "warning",
                "message": f"Appeals System has {len(issues)} issues",
                "details": {
                    "working": checks,
                    "issues": issues,
                    "severity": "high" if len(issues) > len(checks) else "medium",
                    "solution": "Check appeals_repo in repositories.py and verify appeals API endpoints. Ensure appeal response functionality is working.",
                    "path": "AdminPanel.tsx (Appeals section), main.py (/api/appeals)"
                }
            }
        
        return {
            "status": "pass",
            "message": "Appeals System working correctly",
            "details": {"checks_passed": checks}
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Appeals System check failed: {str(e)}",
            "details": {
                "severity": "high",
                "solution": "Check AdminPanel.tsx Appeals section and appeals repository implementation",
                "path": "frontend/src/components/AdminPanel.tsx, backend/app/repositories.py"
            }
        }

async def check_bans_system():
    """Check Bans admin panel functionality"""
    try:
        issues = []
        checks = []
        
        try:
            bans = bans_repo.list_all()
            checks.append(f"Bans retrieval: OK ({len(bans)} active bans)")
            
            if bans:
                sample_ban = bans[0]
                required_fields = ["user_id", "reason", "banned_until"]
                missing_fields = [f for f in required_fields if f not in sample_ban]
                
                if missing_fields:
                    issues.append(f"Bans missing required fields: {', '.join(missing_fields)}")
                else:
                    checks.append("Bans data structure: Valid")
                    
                if "remaining_minutes" in sample_ban:
                    checks.append("Ban duration calculation: Working")
                else:
                    issues.append("Ban remaining_minutes field not being calculated")
        except Exception as e:
            issues.append(f"Bans retrieval error: {str(e)}")
        
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get("http://localhost:8000/api/admin/bans", timeout=5.0)
                if response.status_code == 200:
                    checks.append("Bans API endpoint: Working")
                else:
                    issues.append(f"Bans endpoint returned status {response.status_code}")
        except Exception as e:
            issues.append(f"Bans endpoint error: {str(e)}")
        
        if issues:
            return {
                "status": "error" if len(issues) > len(checks) else "warning",
                "message": f"Bans System has {len(issues)} issues",
                "details": {
                    "working": checks,
                    "issues": issues,
                    "severity": "high" if len(issues) > len(checks) else "medium",
                    "solution": "Check bans_repo in repositories.py and verify ban/unban API endpoints. Ensure ban duration calculations are correct.",
                    "path": "AdminPanel.tsx (Bans section), main.py (/api/bans)"
                }
            }
        
        return {
            "status": "pass",
            "message": "Bans System working correctly",
            "details": {"checks_passed": checks}
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Bans System check failed: {str(e)}",
            "details": {
                "severity": "high",
                "solution": "Check AdminPanel.tsx Bans section and bans repository implementation",
                "path": "frontend/src/components/AdminPanel.tsx, backend/app/repositories.py"
            }
        }

async def check_mutes_system():
    """Check Mutes admin panel functionality"""
    try:
        issues = []
        checks = []
        
        try:
            mutes = mutes_repo.list_all()
            checks.append(f"Mutes retrieval: OK ({len(mutes)} active mutes)")
            
            if mutes:
                sample_mute = mutes[0]
                required_fields = ["user_id", "reason", "muted_until"]
                missing_fields = [f for f in required_fields if f not in sample_mute]
                
                if missing_fields:
                    issues.append(f"Mutes missing required fields: {', '.join(missing_fields)}")
                else:
                    checks.append("Mutes data structure: Valid")
                    
                if "remaining_minutes" in sample_mute:
                    checks.append("Mute duration calculation: Working")
                else:
                    issues.append("Mute remaining_minutes field not being calculated")
        except Exception as e:
            issues.append(f"Mutes retrieval error: {str(e)}")
        
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get("http://localhost:8000/api/admin/mutes", timeout=5.0)
                if response.status_code == 200:
                    checks.append("Mutes API endpoint: Working")
                else:
                    issues.append(f"Mutes endpoint returned status {response.status_code}")
        except Exception as e:
            issues.append(f"Mutes endpoint error: {str(e)}")
        
        if issues:
            return {
                "status": "error" if len(issues) > len(checks) else "warning",
                "message": f"Mutes System has {len(issues)} issues",
                "details": {
                    "working": checks,
                    "issues": issues,
                    "severity": "high" if len(issues) > len(checks) else "medium",
                    "solution": "Check mutes_repo in repositories.py and verify mute/unmute API endpoints. Ensure mute duration calculations are correct.",
                    "path": "AdminPanel.tsx (Mutes section), main.py (/api/mutes)"
                }
            }
        
        return {
            "status": "pass",
            "message": "Mutes System working correctly",
            "details": {"checks_passed": checks}
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Mutes System check failed: {str(e)}",
            "details": {
                "severity": "high",
                "solution": "Check AdminPanel.tsx Mutes section and mutes repository implementation",
                "path": "frontend/src/components/AdminPanel.tsx, backend/app/repositories.py"
            }
        }

async def run_full_diagnostic_scan(run_id: str):
    """Run all diagnostic checks"""
    checks = [
        ("Firebase Connectivity", check_firebase_connectivity, 10),
        ("Firebase Security Configuration", check_firebase_security, 10),
        ("Environment Variables", check_environment_variables, 8),
        ("Database Integrity", check_database_integrity, 10),
        ("All API Endpoints", check_all_api_endpoints, 12),
        ("WebSocket Connectivity", check_websocket_connectivity, 8),
        ("Frontend-Backend Integration", check_frontend_backend_integration, 12),
        ("Authentication System", check_authentication_system, 10),
        ("Performance Metrics", check_performance_metrics, 10),
        ("Recent Errors", check_recent_errors, 10),
        ("Chat Settings System", check_chat_settings_functionality, 10),
        ("Appeals System", check_appeals_system, 10),
        ("Bans System", check_bans_system, 10),
        ("Mutes System", check_mutes_system, 10),
    ]
    
    results = []
    total_weight = sum(c[2] for c in checks)
    current_progress = 0
    
    diagnostic_runs[run_id]["status"] = "running"
    diagnostic_runs[run_id]["progress"] = 0
    diagnostic_runs[run_id]["checks"] = []
    
    for check_name, check_func, weight in checks:
        diagnostic_runs[run_id]["current_check"] = check_name
        
        result = await run_diagnostic_check(check_name, check_func, weight, run_id)
        results.append(result)
        diagnostic_runs[run_id]["checks"].append(result)
        
        current_progress += weight
        progress_percent = int((current_progress / total_weight) * 100)
        diagnostic_runs[run_id]["progress"] = progress_percent
        
        await asyncio.sleep(0.2)
    
    passed = sum(1 for r in results if r["status"] == "success")
    warnings = sum(1 for r in results if r["status"] == "warning")
    errors = sum(1 for r in results if r["status"] == "error")
    
    summary = {
        "total_checks": len(results),
        "passed": passed,
        "warnings": warnings,
        "errors": errors,
        "overall_status": "healthy" if errors == 0 else "issues_found"
    }
    
    diagnostic_runs[run_id]["status"] = "completed"
    diagnostic_runs[run_id]["progress"] = 100
    diagnostic_runs[run_id]["summary"] = summary
    diagnostic_runs[run_id]["completed_at"] = datetime.utcnow().isoformat()
    
    report_text = generate_report_text(run_id, results, summary)
    diagnostic_runs[run_id]["report_text"] = report_text
    
    return results

def generate_report_text(run_id: str, results: list, summary: dict) -> str:
    """Generate a text report of the diagnostic scan"""
    run = diagnostic_runs[run_id]
    
    lines = []
    lines.append("=" * 80)
    lines.append("CHAT SYSTEM - AI DIAGNOSTIC SCAN REPORT")
    lines.append("نظام الدردشة - تقرير المسح التشخيصي بالذكاء الاصطناعي")
    lines.append("=" * 80)
    lines.append(f"Run ID: {run_id}")
    lines.append(f"Started: {run['started_at']}")
    lines.append(f"Completed: {run.get('completed_at', 'N/A')}")
    lines.append(f"Duration: {(datetime.fromisoformat(run.get('completed_at', run['started_at'])) - datetime.fromisoformat(run['started_at'])).total_seconds():.2f}s")
    lines.append("")
    lines.append("SUMMARY / الملخص")
    lines.append("-" * 80)
    lines.append(f"Total Checks: {summary['total_checks']}")
    lines.append(f"Passed: {summary['passed']} ✓")
    lines.append(f"Warnings: {summary['warnings']} ⚠")
    lines.append(f"Errors: {summary['errors']} ✗")
    lines.append(f"Overall Status: {summary['overall_status'].upper()}")
    lines.append("")
    
    if summary['errors'] > 0 or summary['warnings'] > 0:
        lines.append("AI ANALYSIS / التحليل بالذكاء الاصطناعي")
        lines.append("-" * 80)
        
        critical_issues = [r for r in results if r.get("details", {}).get("severity") == "critical"]
        high_issues = [r for r in results if r.get("details", {}).get("severity") == "high"]
        medium_issues = [r for r in results if r.get("details", {}).get("severity") == "medium"]
        
        if critical_issues:
            lines.append("\n🔴 CRITICAL ISSUES (مشاكل حرجة):")
            for issue in critical_issues:
                lines.append(f"  - {issue['check']}: {issue['message']}")
                if issue.get("details", {}).get("solution"):
                    lines.append(f"    Solution: {issue['details']['solution']}")
        
        if high_issues:
            lines.append("\n🟠 HIGH PRIORITY ISSUES (مشاكل ذات أولوية عالية):")
            for issue in high_issues:
                lines.append(f"  - {issue['check']}: {issue['message']}")
                if issue.get("details", {}).get("solution"):
                    lines.append(f"    Solution: {issue['details']['solution']}")
        
        if medium_issues:
            lines.append("\n🟡 MEDIUM PRIORITY ISSUES (مشاكل ذات أولوية متوسطة):")
            for issue in medium_issues:
                lines.append(f"  - {issue['check']}: {issue['message']}")
                if issue.get("details", {}).get("solution"):
                    lines.append(f"    Solution: {issue['details']['solution']}")
        
        lines.append("")
    
    lines.append("DETAILED RESULTS / النتائج التفصيلية")
    lines.append("-" * 80)
    
    for result in results:
        status_icon = "✓" if result["status"] == "success" else "⚠" if result["status"] == "warning" else "✗"
        lines.append(f"\n[{status_icon}] {result['check']}")
        lines.append(f"    Status: {result['status'].upper()}")
        lines.append(f"    Message: {result['message']}")
        lines.append(f"    Duration: {result['duration']:.3f}s")
        
        if result.get("details"):
            severity = result["details"].get("severity")
            if severity:
                lines.append(f"    Severity: {severity.upper()}")
            
            solution = result["details"].get("solution")
            if solution:
                lines.append(f"    Recommended Solution:")
                lines.append(f"      {solution}")
            
            lines.append(f"    Details:")
            for key, value in result["details"].items():
                if key not in ["severity", "solution"]:
                    if isinstance(value, list):
                        lines.append(f"      - {key}:")
                        for item in value[:5]:
                            lines.append(f"          * {item}")
                    else:
                        lines.append(f"      - {key}: {value}")
    
    lines.append("")
    lines.append("=" * 80)
    lines.append("END OF REPORT / نهاية التقرير")
    lines.append("=" * 80)
    
    return "\n".join(lines)

@app.post("/api/diagnostics/scan")
async def start_diagnostic_scan():
    """Start a new diagnostic scan"""
    run_id = str(uuid.uuid4())
    
    diagnostic_runs[run_id] = {
        "run_id": run_id,
        "status": "starting",
        "progress": 0,
        "started_at": datetime.utcnow().isoformat(),
        "checks": [],
        "current_check": None
    }
    
    asyncio.create_task(run_full_diagnostic_scan(run_id))
    
    return {"run_id": run_id, "message": "Diagnostic scan started"}

@app.get("/api/diagnostics/run/{run_id}")
async def get_diagnostic_run(run_id: str):
    """Get the status and results of a diagnostic run"""
    if run_id not in diagnostic_runs:
        raise HTTPException(status_code=404, detail="Diagnostic run not found")
    
    return diagnostic_runs[run_id]

@app.get("/api/diagnostics/run/{run_id}/report.txt")
async def get_diagnostic_report_text(run_id: str):
    """Get the text report of a diagnostic run"""
    if run_id not in diagnostic_runs:
        raise HTTPException(status_code=404, detail="Diagnostic run not found")
    
    run = diagnostic_runs[run_id]
    if run["status"] != "completed":
        raise HTTPException(status_code=400, detail="Diagnostic run not completed yet")
    
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(content=run.get("report_text", "Report not available"), media_type="text/plain")

@app.get("/api/diagnostics/runs")
async def get_diagnostic_runs():
    """Get all diagnostic runs"""
    runs_list = list(diagnostic_runs.values())
    runs_list.sort(key=lambda x: x["started_at"], reverse=True)
    return {"runs": runs_list[:10]}  # Return last 10 runs
