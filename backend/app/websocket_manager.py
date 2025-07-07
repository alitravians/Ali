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
        for user_id, connection in self.active_connections.items():
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

manager = ConnectionManager()
