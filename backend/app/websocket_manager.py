from typing import Dict, List
from fastapi import WebSocket
import json
import asyncio
from datetime import datetime
from .database import db
from .models import Message

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_connections: Dict[str, str] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_connections[user_id] = user_id
        db.set_user_online(user_id)
        
        await self.broadcast_user_list()
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.user_connections:
            del self.user_connections[user_id]
        db.set_user_offline(user_id)
    
    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(message)
            except:
                self.disconnect(user_id)
    
    async def broadcast(self, message: str):
        disconnected_users = []
        connections_copy = list(self.active_connections.items())
        for user_id, connection in connections_copy:
            try:
                await connection.send_text(message)
            except:
                disconnected_users.append(user_id)
        
        for user_id in disconnected_users:
            self.disconnect(user_id)
    
    async def broadcast_message(self, message: Message):
        message_data = {
            "type": "message",
            "data": {
                "message_id": message.message_id,
                "user_id": message.user_id,
                "username": message.username,
                "content": message.content,
                "timestamp": message.timestamp.isoformat()
            }
        }
        await self.broadcast(json.dumps(message_data))
    
    async def broadcast_user_list(self):
        online_users = db.get_online_users()
        user_list_data = {
            "type": "user_list",
            "data": [
                {
                    "user_id": user.user_id,
                    "username": user.username,
                    "role": user.role,
                    "status": user.status,
                    "is_online": user.is_online
                }
                for user in online_users
            ]
        }
        await self.broadcast(json.dumps(user_list_data))
    
    async def broadcast_announcement(self, announcement):
        announcement_data = {
            "type": "announcement",
            "data": {
                "announcement_id": announcement.announcement_id,
                "title": announcement.title,
                "content": announcement.content,
                "created_at": announcement.created_at.isoformat()
            }
        }
        await self.broadcast(json.dumps(announcement_data))
    
    async def notify_message_deleted(self, message_id: str):
        delete_data = {
            "type": "message_deleted",
            "data": {"message_id": message_id}
        }
        await self.broadcast(json.dumps(delete_data))
    
    async def notify_status_change(self, user_id: str, action: str, data: dict = None):
        status_data = {
            "type": "status_change",
            "data": {
                "action": action,
                "user_id": user_id,
                **(data or {})
            }
        }
        await self.send_personal_message(json.dumps(status_data), user_id)
    
    async def notify_appeal_response(self, user_id: str, action: str, admin_response: str):
        appeal_data = {
            "type": "appeal_response",
            "data": {
                "action": action,
                "admin_response": admin_response,
                "timestamp": datetime.now().isoformat()
            }
        }
        await self.send_personal_message(json.dumps(appeal_data), user_id)
    
    async def notify_ban_status(self, user_id: str, banned: bool, reason: str = None, duration: str = None):
        ban_data = {
            "type": "ban_notification",
            "data": {
                "banned": banned,
                "reason": reason,
                "duration": duration,
                "timestamp": datetime.now().isoformat()
            }
        }
        await self.send_personal_message(json.dumps(ban_data), user_id)
    
    async def notify_mute_status(self, user_id: str, duration_minutes: int, reason: str = None):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(json.dumps({
                "type": "mute_status",
                "data": {
                    "is_muted": True,
                    "duration_minutes": duration_minutes,
                    "reason": reason or "غير محدد",
                    "message": f"تم كتم حسابك لمدة {duration_minutes} دقيقة. السبب: {reason or 'غير محدد'}"
                }
            }))

manager = ConnectionManager()
