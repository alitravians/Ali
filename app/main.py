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

from auth import authenticate_user, get_current_user, get_current_user_object, require_admin, require_moderator_or_admin, create_access_token, generate_user_id
from database import db
from models import User, Message, BanRecord, Report, BanAppeal, Announcement
from moderation import content_moderator, ViolationType

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
        self.user_status: Dict[str, str] = {}  # Track user online/offline status
        self.typing_users: Dict[str, datetime] = {}  # Track who is typing

    async def connect(self, websocket: WebSocket, username: str):
        """Handle new WebSocket connections"""
        await websocket.accept()
        self.active_connections.append(websocket)
        self.user_connections[username] = websocket
        self.user_status[username] = "online"
        
        user = db.get_user_by_username(username)
        user_info = {
            "username": username,
            "role": user.role if user else "user",
            "status": user.status if user else "active"
        }
        
        await self.broadcast_message({
            "type": "user_joined",
            "username": username,
            "user_info": user_info,
            "online_count": len(self.active_connections),
            "timestamp": str(datetime.now())
        })
        
        online_users = []
        for online_username, status in self.user_status.items():
            if status == "online":
                online_user = db.get_user_by_username(online_username)
                if online_user:
                    online_users.append({
                        "username": online_username,
                        "role": online_user.role,
                        "status": online_user.status
                    })
        
        await self.send_personal_message(json.dumps({
            "type": "online_users_list",
            "users": online_users,
            "timestamp": str(datetime.now())
        }), websocket)

    async def disconnect(self, websocket: WebSocket, username: str):
        """Handle WebSocket disconnections"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if username in self.user_connections:
            del self.user_connections[username]
        if username in self.user_status:
            self.user_status[username] = "offline"
        if username in self.typing_users:
            del self.typing_users[username]
            
        await self.broadcast_message({
            "type": "user_left",
            "username": username,
            "online_count": len(self.active_connections),
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

    async def handle_typing_indicator(self, username: str, is_typing: bool):
        """Handle typing indicators"""
        if is_typing:
            self.typing_users[username] = datetime.now()
        else:
            if username in self.typing_users:
                del self.typing_users[username]
        
        current_time = datetime.now()
        expired_users = [
            user for user, timestamp in self.typing_users.items()
            if (current_time - timestamp).seconds > 10
        ]
        for user in expired_users:
            del self.typing_users[user]
        
        await self.broadcast_message({
            "type": "typing_update",
            "typing_users": list(self.typing_users.keys()),
            "timestamp": str(current_time)
        })

    def get_online_users(self) -> List[Dict]:
        """Get list of currently online users"""
        online_users = []
        for username, status in self.user_status.items():
            if status == "online":
                user = db.get_user_by_username(username)
                if user:
                    online_users.append({
                        "username": username,
                        "role": user.role,
                        "status": user.status
                    })
        return online_users

    async def broadcast_moderation_action(self, action_type: str, data: dict):
        """Broadcast real-time moderation actions"""
        await self.broadcast_message({
            "type": f"moderation_{action_type}",
            "data": data,
            "timestamp": str(datetime.now())
        })

manager = ConnectionManager()

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

class LoginRequest(BaseModel):
    username: str
    login_type: str = "member"
    admin_code: Optional[str] = None

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
    """Enhanced authentication endpoint with admin code verification"""
    try:
        access_token = authenticate_user(request.username, request.login_type, request.admin_code)
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

@app.get("/admin/settings")
async def get_site_settings(current_user = Depends(require_admin)):
    """Get site settings (admin only)"""
    try:
        settings = db.get_site_settings()
        return {"settings": settings}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get site settings")

@app.post("/admin/settings")
async def update_site_settings(request: dict, current_user = Depends(require_admin)):
    """Update site settings (admin only)"""
    try:
        maintenance_mode = request.get("maintenanceMode", False)
        maintenance_message = request.get("maintenanceMessage", "")
        profanity_filter = request.get("profanityFilter", True)
        max_message_length = request.get("maxMessageLength", 500)
        allow_guest_users = request.get("allowGuestUsers", False)
        
        updated_settings = db.update_site_settings(
            maintenance_mode=maintenance_mode,
            maintenance_message=maintenance_message,
            profanity_filter=profanity_filter,
            max_message_length=max_message_length,
            allow_guest_users=allow_guest_users
        )
        
        await manager.broadcast_message({
            "type": "site_status_update",
            "maintenance_mode": maintenance_mode,
            "maintenance_message": maintenance_message,
            "timestamp": str(datetime.now())
        })
        
        return {"message": "Site settings updated successfully", "settings": updated_settings}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update site settings")

@app.get("/admin/analytics")
async def get_analytics(current_user = Depends(require_admin)):
    """Get site analytics (admin only)"""
    try:
        users = db.get_all_users()
        messages = db.get_all_messages()
        ban_records = db.get_all_ban_records()
        
        analytics = {
            "total_users": len(users),
            "active_users": len([u for u in users if u.status == "active"]),
            "total_messages": len(messages),
            "today_messages": len([m for m in messages if m.timestamp.date() == datetime.now().date()]),
            "banned_users": len([u for u in users if u.status == "banned"]),
            "muted_users": len([u for u in users if u.status == "muted"])
        }
        
        return {"analytics": analytics}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get analytics")

@app.get("/user/profile")
async def get_user_profile(current_user: str = Depends(get_current_user)):
    """Get current user profile information"""
    try:
        user = db.get_user_by_username(current_user)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        response_data = {
            "username": user.username,
            "user_id": user.user_id,
            "role": user.role,
            "status": user.status,
            "id_changed": user.id_changed
        }
        
        if user.status == "banned" and user.ban_until:
            response_data.update({
                "ban_reason": user.ban_reason,
                "ban_duration_minutes": user.ban_duration_minutes,
                "ban_until": user.ban_until.isoformat() if user.ban_until else None
            })
        
        return response_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user profile"
        )

@app.post("/auth/register")
async def register(request: dict):
    """Register new user with automatic 10-digit ID generation"""
    try:
        username = request.get("username", "").strip()
        
        if not username:
            raise HTTPException(status_code=400, detail="Username is required")
        
        if len(username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
        
        existing_user = db.get_user_by_username(username)
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already exists")
        
        user_id = generate_user_id()
        user = db.create_user(username=username, role="user", user_id=user_id)
        
        access_token = create_access_token(username=username)
        
        return {
            "access_token": access_token,
            "username": user.username,
            "role": user.role,
            "user_id": user.user_id,
            "message": "Registration successful"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Registration failed")

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
    """Send new message with AI content moderation"""
    try:
        user = db.get_user_by_username(current_user)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.status == "muted" and user.mute_until and user.mute_until > datetime.now():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User is muted until {user.mute_until}"
            )
        
        if user.status == "banned" and user.ban_until and user.ban_until > datetime.now():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User is banned until {user.ban_until}"
            )
        
        moderation_result = await content_moderator.moderate_content(request.content, user.id)
        
        if moderation_result.is_violation:
            should_ban, ban_minutes = content_moderator.should_auto_ban(user.id, moderation_result.violation_type)
            
            if should_ban:
                ban_until = datetime.now() + timedelta(minutes=ban_minutes)
                db.update_user(
                    user.id, 
                    status="banned", 
                    ban_until=ban_until, 
                    ban_reason=f"تم الحظر التلقائي: {moderation_result.reason}"
                )
                
                db.create_ban_record(
                    user_id=user.id,
                    reason=f"تم الحظر التلقائي: {moderation_result.reason}",
                    duration_minutes=ban_minutes,
                    banned_by="AI_MODERATOR"
                )
                
                await manager.broadcast_moderation_action("user_auto_banned", {
                    "user_id": user.id,
                    "username": user.username,
                    "reason": moderation_result.reason,
                    "ban_until": str(ban_until)
                })
                
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"تم حظرك تلقائياً حتى {ban_until.strftime('%Y-%m-%d %H:%M')} بسبب: {moderation_result.reason}"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"تم رفض الرسالة: {moderation_result.reason}"
                )
        
        is_bold = False
        content = request.content
        if content.startswith('$') and user.role in ['moderator', 'admin']:
            content = content[1:]  # Remove $ prefix
            is_bold = True
        elif content.startswith('$'):
            content = content[1:]
        
        message = db.create_message(
            user_id=user.id,
            username=user.username,
            content=content,
            is_bold=is_bold
        )
        
        await manager.broadcast_message({
            "type": "chat_message",
            "id": message.id,
            "username": message.username,
            "message": message.content,
            "timestamp": str(message.timestamp),
            "is_bold": message.is_bold
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
        
        await manager.broadcast_moderation_action("message_deleted", {
            "message_id": message_id,
            "deleted_by": current_user.username
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
    """Mute user by 10-digit user ID (moderator/admin only)"""
    try:
        user = db.get_user_by_user_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        mute_until = datetime.now() + timedelta(minutes=request.duration_minutes)
        updated_user = db.update_user(user.id, status="muted", mute_until=mute_until)
        
        if not updated_user:
            raise HTTPException(status_code=404, detail="Failed to update user")
        
        await manager.broadcast_moderation_action("user_muted", {
            "user_id": user.user_id,  # Send 10-digit ID in broadcast
            "username": user.username,
            "muted_by": current_user.username,
            "mute_until": str(mute_until)
        })
        
        return {"message": f"User {user.username} (ID: {user.user_id}) muted until {mute_until}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mute user"
        )

@app.post("/users/{user_id}/ban")
async def ban_user(user_id: str, request: BanRequest, current_user = Depends(require_moderator_or_admin)):
    """Ban user by 10-digit user ID (moderator/admin only)"""
    try:
        user = db.get_user_by_user_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        ban_until = datetime.now() + timedelta(minutes=request.duration_minutes)
        updated_user = db.update_user(
            user.id,  # Use internal ID for update
            status="banned", 
            ban_until=ban_until, 
            ban_reason=request.reason
        )
        
        if not updated_user:
            raise HTTPException(status_code=404, detail="Failed to update user")
        
        db.create_ban_record(
            user_id=user.id,  # Use internal ID for ban record
            reason=request.reason,
            duration_minutes=request.duration_minutes,
            banned_by=current_user.username
        )
        
        await manager.broadcast_moderation_action("user_banned", {
            "user_id": user.user_id,  # Send 10-digit ID in broadcast
            "username": user.username,
            "banned_by": current_user.username,
            "reason": request.reason,
            "duration_minutes": request.duration_minutes,
            "ban_until": str(ban_until)
        })
        
        return {"message": f"User {user.username} (ID: {user.user_id}) banned until {ban_until}"}
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

@app.post("/admin/users")
async def create_admin_user(request: dict, current_user = Depends(require_admin)):
    """Create a new admin user (admin only)"""
    try:
        username = request.get("username")
        admin_code = request.get("admin_code")
        
        if not username or not admin_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username and admin code are required"
            )
        
        existing_user = db.get_user_by_username(username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
        
        user_id = generate_user_id()
        user = db.create_user(username=username, role="admin", user_id=user_id)
        
        return {"message": "Admin user created successfully", "username": username, "user_id": user_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create admin user"
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

@app.put("/admin/users/{user_id}/role")
async def update_user_role(user_id: str, request: dict, current_user = Depends(require_admin)):
    """Update user role (admin only)"""
    try:
        new_role = request.get("role")
        if not new_role or new_role not in ["user", "moderator", "admin"]:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        updated_user = db.update_user(user_id, role=new_role)
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "User role updated successfully", "user": updated_user}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update user role")

@app.post("/admin/ban-appeals/{appeal_id}/respond")
async def respond_to_ban_appeal(appeal_id: str, request: dict, current_user = Depends(require_admin)):
    """Respond to ban appeal (admin only)"""
    try:
        response_text = request.get("response")
        approved = request.get("approved", False)
        
        if not response_text:
            raise HTTPException(status_code=400, detail="Response text is required")
        
        status = "approved" if approved else "rejected"
        updated_appeal = db.update_ban_appeal(appeal_id, status, response_text)
        
        if not updated_appeal:
            raise HTTPException(status_code=404, detail="Ban appeal not found")
        
        if approved:
            user = db.get_user_by_id(updated_appeal.user_id)
            if user:
                db.update_user(user.id, status="active", ban_until=None, ban_reason=None)
        
        return {"message": "Ban appeal response submitted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to respond to ban appeal")

@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    """Enhanced WebSocket endpoint for real-time chat with typing indicators"""
    await manager.connect(websocket, username)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            message_type = message_data.get("type", "chat_message")
            
            if message_type == "typing_start":
                await manager.handle_typing_indicator(username, True)
            elif message_type == "typing_stop":
                await manager.handle_typing_indicator(username, False)
            elif message_type == "chat_message":
                await manager.handle_typing_indicator(username, False)
                
                await manager.broadcast_message({
                    "type": "chat_message",
                    "username": username,
                    "message": message_data.get("message", ""),
                    "timestamp": str(datetime.now())
                })
            elif message_type == "ping":
                await manager.send_personal_message(json.dumps({
                    "type": "pong",
                    "timestamp": str(datetime.now())
                }), websocket)
            
    except WebSocketDisconnect:
        await manager.disconnect(websocket, username)
