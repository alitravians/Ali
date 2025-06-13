from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import json
import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from auth import authenticate_user, get_current_user, get_current_user_object, require_admin, require_moderator_or_admin
from database import db
from models import User, Message, BanRecord, Report, BanAppeal, Announcement

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, username: str):
        """Handle new WebSocket connections"""
        await websocket.accept()
        self.active_connections.append(websocket)
        self.user_connections[username] = websocket
        
        await self.broadcast_message({
            "type": "user_joined",
            "username": username,
            "message": f"{username} joined the chat",
            "timestamp": str(datetime.now())
        })

    async def disconnect(self, websocket: WebSocket, username: str):
        """Handle WebSocket disconnections"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if username in self.user_connections:
            del self.user_connections[username]
            
        await self.broadcast_message({
            "type": "user_left",
            "username": username,
            "message": f"{username} left the chat",
            "timestamp": str(datetime.now())
        })

    async def broadcast_message(self, message: dict):
        """Broadcast message to all connected users"""
        message_str = json.dumps(message)
        disconnected_connections = []
        
        for connection in self.active_connections:
            try:
                await connection.send_text(message_str)
            except Exception:
                disconnected_connections.append(connection)
        
        for connection in disconnected_connections:
            if connection in self.active_connections:
                self.active_connections.remove(connection)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send message to specific WebSocket connection"""
        try:
            await websocket.send_text(message)
        except Exception:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)

manager = ConnectionManager()

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

class LoginRequest(BaseModel):
    username: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    username: str
    role: str

class MessageRequest(BaseModel):
    content: str

class ReportRequest(BaseModel):
    target_user_id: str
    reason: str

class BanRequest(BaseModel):
    reason: str
    duration_minutes: int

class MuteRequest(BaseModel):
    duration_minutes: int

class BanAppealRequest(BaseModel):
    reason: str

class AnnouncementRequest(BaseModel):
    title: str
    content: str

@app.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Username-only authentication endpoint"""
    try:
        access_token = authenticate_user(request.username)
        user = db.get_user_by_username(request.username)
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            username=user.username,
            role=user.role
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )

@app.get("/messages")
async def get_messages(limit: int = 100, current_user: str = Depends(get_current_user)):
    """Get chat history"""
    try:
        messages = db.get_all_messages(limit=limit)
        return {"messages": messages}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve messages"
        )

@app.post("/messages")
async def send_message(request: MessageRequest, current_user: str = Depends(get_current_user)):
    """Send new message"""
    try:
        user = db.get_user_by_username(current_user)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.status == "muted" and user.mute_until and user.mute_until > datetime.now():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User is muted until {user.mute_until}"
            )
        
        message = db.create_message(
            user_id=user.id,
            username=user.username,
            content=request.content
        )
        
        await manager.broadcast_message({
            "type": "chat_message",
            "id": message.id,
            "username": message.username,
            "message": message.content,
            "timestamp": str(message.timestamp)
        })
        
        return {"message": "Message sent successfully", "message_id": message.id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send message"
        )

@app.delete("/messages/{message_id}")
async def delete_message(message_id: str, current_user = Depends(require_moderator_or_admin)):
    """Delete message (moderator/admin only)"""
    try:
        success = db.delete_message(message_id)
        if not success:
            raise HTTPException(status_code=404, detail="Message not found")
        
        await manager.broadcast_message({
            "type": "message_deleted",
            "message_id": message_id,
            "deleted_by": current_user.username,
            "timestamp": str(datetime.now())
        })
        
        return {"message": "Message deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete message"
        )

@app.post("/users/{user_id}/mute")
async def mute_user(user_id: str, request: MuteRequest, current_user = Depends(require_moderator_or_admin)):
    """Mute user (moderator/admin only)"""
    try:
        mute_until = datetime.now() + timedelta(minutes=request.duration_minutes)
        user = db.update_user(user_id, status="muted", mute_until=mute_until)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        await manager.broadcast_message({
            "type": "user_muted",
            "user_id": user_id,
            "username": user.username,
            "muted_by": current_user.username,
            "mute_until": str(mute_until),
            "timestamp": str(datetime.now())
        })
        
        return {"message": f"User muted until {mute_until}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mute user"
        )

@app.post("/users/{user_id}/ban")
async def ban_user(user_id: str, request: BanRequest, current_user = Depends(require_moderator_or_admin)):
    """Ban user (moderator/admin only)"""
    try:
        ban_until = datetime.now() + timedelta(minutes=request.duration_minutes)
        user = db.update_user(
            user_id, 
            status="banned", 
            ban_until=ban_until, 
            ban_reason=request.reason
        )
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        db.create_ban_record(
            user_id=user_id,
            reason=request.reason,
            duration_minutes=request.duration_minutes,
            banned_by=current_user.username
        )
        
        await manager.broadcast_message({
            "type": "user_banned",
            "user_id": user_id,
            "username": user.username,
            "banned_by": current_user.username,
            "reason": request.reason,
            "ban_until": str(ban_until),
            "timestamp": str(datetime.now())
        })
        
        return {"message": f"User banned until {ban_until}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to ban user"
        )

@app.post("/reports")
async def submit_report(request: ReportRequest, current_user: str = Depends(get_current_user)):
    """Submit user report"""
    try:
        user = db.get_user_by_username(current_user)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        report = db.create_report(
            reporter_id=user.id,
            target_user_id=request.target_user_id,
            reason=request.reason
        )
        
        return {"message": "Report submitted successfully", "report_id": report.id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit report"
        )

@app.get("/admin/users")
async def get_all_users(current_user = Depends(require_admin)):
    """Get all users (admin only)"""
    try:
        users = db.get_all_users()
        return {"users": users}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve users"
        )

@app.get("/admin/reports")
async def get_all_reports(current_user = Depends(require_admin)):
    """Get all reports (admin only)"""
    try:
        reports = db.get_all_reports()
        return {"reports": reports}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve reports"
        )

@app.get("/admin/ban-appeals")
async def get_ban_appeals(current_user = Depends(require_admin)):
    """Get ban appeals (admin only)"""
    try:
        appeals = db.get_all_ban_appeals()
        return {"appeals": appeals}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve ban appeals"
        )

@app.post("/ban-appeals")
async def submit_ban_appeal(request: BanAppealRequest, current_user: str = Depends(get_current_user)):
    """Submit ban appeal"""
    try:
        user = db.get_user_by_username(current_user)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        appeal = db.create_ban_appeal(
            user_id=user.id,
            reason=request.reason
        )
        
        return {"message": "Ban appeal submitted successfully", "appeal_id": appeal.id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit ban appeal"
        )

@app.post("/admin/announcements")
async def create_announcement(request: AnnouncementRequest, current_user = Depends(require_admin)):
    """Create announcement (admin only)"""
    try:
        announcement = db.create_announcement(
            title=request.title,
            content=request.content,
            created_by=current_user.username
        )
        
        await manager.broadcast_message({
            "type": "announcement",
            "id": announcement.id,
            "title": announcement.title,
            "content": announcement.content,
            "created_by": announcement.created_by,
            "timestamp": str(announcement.created_at)
        })
        
        return {"message": "Announcement created successfully", "announcement_id": announcement.id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create announcement"
        )

@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    """WebSocket endpoint for real-time chat"""
    await manager.connect(websocket, username)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            await manager.broadcast_message({
                "type": "chat_message",
                "username": username,
                "message": message_data.get("message", ""),
                "timestamp": str(datetime.now())
            })
            
    except WebSocketDisconnect:
        await manager.disconnect(websocket, username)
