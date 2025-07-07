import threading
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from .models import *
import random
import string

class InMemoryDatabase:
    def __init__(self):
        self.users: Dict[str, User] = {}
        self.messages: List[Message] = []
        self.ban_records: Dict[str, BanRecord] = {}
        self.reports: Dict[str, Report] = {}
        self.appeals: Dict[str, BanAppeal] = {}
        self.announcements: Dict[str, Announcement] = {}
        self.active_connections: Dict[str, datetime] = {}
        self.lock = threading.Lock()
        
        self._create_default_admin()
    
    def _create_default_admin(self):
        admin_id = "1000000000"
        admin_user = User(
            user_id=admin_id,
            username="admin",
            password_hash="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE
        )
        self.users[admin_id] = admin_user
    
    def generate_user_id(self) -> str:
        while True:
            user_id = ''.join(random.choices(string.digits, k=10))
            if user_id not in self.users:
                return user_id
    
    def generate_id(self) -> str:
        return str(uuid.uuid4())
    
    def create_user(self, username: str, password_hash: str) -> User:
        with self.lock:
            user_id = self.generate_user_id()
            user = User(
                user_id=user_id,
                username=username,
                password_hash=password_hash
            )
            self.users[user_id] = user
            return user
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        return self.users.get(user_id)
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        for user in self.users.values():
            if user.username == username:
                return user
        return None
    
    def update_user_status(self, user_id: str, status: UserStatus):
        with self.lock:
            if user_id in self.users:
                self.users[user_id].status = status
                self.users[user_id].last_seen = datetime.now()
    
    def set_user_online(self, user_id: str):
        with self.lock:
            self.active_connections[user_id] = datetime.now()
            if user_id in self.users:
                self.users[user_id].last_seen = datetime.now()
    
    def set_user_offline(self, user_id: str):
        with self.lock:
            if user_id in self.active_connections:
                del self.active_connections[user_id]
    
    def get_online_users(self) -> List[UserInfo]:
        with self.lock:
            online_users = []
            current_time = datetime.now()
            
            for user_id, last_ping in list(self.active_connections.items()):
                if current_time - last_ping > timedelta(minutes=5):
                    del self.active_connections[user_id]
                    continue
                
                user = self.users.get(user_id)
                if user:
                    online_users.append(UserInfo(
                        user_id=user.user_id,
                        username=user.username,
                        role=user.role,
                        status=user.status,
                        last_seen=user.last_seen,
                        is_online=True
                    ))
            
            return online_users
    
    def add_message(self, user_id: str, username: str, content: str) -> Message:
        with self.lock:
            message = Message(
                message_id=self.generate_id(),
                user_id=user_id,
                username=username,
                content=content
            )
            self.messages.append(message)
            return message
    
    def get_messages(self, limit: int = 100) -> List[Message]:
        with self.lock:
            return [msg for msg in self.messages[-limit:] if not msg.is_deleted]
    
    def delete_message(self, message_id: str, deleted_by: str) -> bool:
        with self.lock:
            for message in self.messages:
                if message.message_id == message_id:
                    message.is_deleted = True
                    message.deleted_by = deleted_by
                    return True
            return False
    
    def ban_user(self, user_id: str, banned_by: str, reason: str, duration_hours: Optional[int] = None) -> BanRecord:
        with self.lock:
            banned_until = None
            if duration_hours:
                banned_until = datetime.now() + timedelta(hours=duration_hours)
            
            ban_record = BanRecord(
                ban_id=self.generate_id(),
                user_id=user_id,
                banned_by=banned_by,
                reason=reason,
                banned_until=banned_until
            )
            
            self.ban_records[ban_record.ban_id] = ban_record
            
            if user_id in self.users:
                self.users[user_id].status = UserStatus.BANNED
                self.users[user_id].banned_until = banned_until
                self.users[user_id].ban_reason = reason
            
            return ban_record
    
    def mute_user(self, user_id: str, duration_minutes: int = 30):
        with self.lock:
            if user_id in self.users:
                muted_until = datetime.now() + timedelta(minutes=duration_minutes)
                self.users[user_id].status = UserStatus.MUTED
                self.users[user_id].muted_until = muted_until
    
    def unban_user(self, user_id: str):
        with self.lock:
            if user_id in self.users:
                self.users[user_id].status = UserStatus.ACTIVE
                self.users[user_id].banned_until = None
                self.users[user_id].ban_reason = None
            
            for ban_record in self.ban_records.values():
                if ban_record.user_id == user_id and ban_record.is_active:
                    ban_record.is_active = False
    
    def create_report(self, reporter_id: str, message_id: str, reported_user_id: str, category: ReportCategory, reason: str) -> Report:
        with self.lock:
            report = Report(
                report_id=self.generate_id(),
                reporter_id=reporter_id,
                reported_message_id=message_id,
                reported_user_id=reported_user_id,
                category=category,
                reason=reason
            )
            self.reports[report.report_id] = report
            return report
    
    def get_reports(self) -> List[Report]:
        with self.lock:
            return list(self.reports.values())
    
    def create_appeal(self, user_id: str, reason: str) -> BanAppeal:
        with self.lock:
            active_ban = None
            for ban_record in self.ban_records.values():
                if ban_record.user_id == user_id and ban_record.is_active:
                    active_ban = ban_record
                    break
            
            if not active_ban:
                raise ValueError("No active ban found for user")
            
            appeal = BanAppeal(
                appeal_id=self.generate_id(),
                user_id=user_id,
                ban_id=active_ban.ban_id,
                reason=reason
            )
            self.appeals[appeal.appeal_id] = appeal
            return appeal
    
    def get_appeals(self) -> List[BanAppeal]:
        with self.lock:
            return list(self.appeals.values())
    
    def respond_to_appeal(self, appeal_id: str, admin_id: str, action: str, response: str):
        with self.lock:
            if appeal_id in self.appeals:
                appeal = self.appeals[appeal_id]
                appeal.status = AppealStatus.APPROVED if action == "approve" else AppealStatus.REJECTED
                appeal.reviewed_by = admin_id
                appeal.reviewed_at = datetime.now()
                appeal.admin_response = response
                
                if action == "approve":
                    self.unban_user(appeal.user_id)
    
    def create_announcement(self, title: str, content: str, created_by: str) -> Announcement:
        with self.lock:
            announcement = Announcement(
                announcement_id=self.generate_id(),
                title=title,
                content=content,
                created_by=created_by
            )
            self.announcements[announcement.announcement_id] = announcement
            return announcement
    
    def get_active_announcements(self) -> List[Announcement]:
        with self.lock:
            return [ann for ann in self.announcements.values() if ann.is_active]
    
    def get_all_users(self) -> List[UserInfo]:
        with self.lock:
            online_user_ids = set(self.active_connections.keys())
            return [
                UserInfo(
                    user_id=user.user_id,
                    username=user.username,
                    role=user.role,
                    status=user.status,
                    last_seen=user.last_seen,
                    is_online=user.user_id in online_user_ids
                )
                for user in self.users.values()
            ]
    
    def get_statistics(self) -> dict:
        with self.lock:
            return {
                "total_users": len(self.users),
                "online_users": len(self.active_connections),
                "total_messages": len([msg for msg in self.messages if not msg.is_deleted]),
                "pending_reports": len([r for r in self.reports.values() if r.status == ReportStatus.PENDING]),
                "pending_appeals": len([a for a in self.appeals.values() if a.status == AppealStatus.PENDING]),
                "active_bans": len([b for b in self.ban_records.values() if b.is_active])
            }
    
    def change_user_id(self, old_user_id: str, new_user_id: str) -> bool:
        with self.lock:
            if old_user_id not in self.users or new_user_id in self.users:
                return False
            
            user = self.users[old_user_id]
            user.user_id = new_user_id
            self.users[new_user_id] = user
            del self.users[old_user_id]
            
            for message in self.messages:
                if message.user_id == old_user_id:
                    message.user_id = new_user_id
            
            for ban_record in self.ban_records.values():
                if ban_record.user_id == old_user_id:
                    ban_record.user_id = new_user_id
            
            for report in self.reports.values():
                if report.reporter_id == old_user_id:
                    report.reporter_id = new_user_id
                if report.reported_user_id == old_user_id:
                    report.reported_user_id = new_user_id
            
            for appeal in self.appeals.values():
                if appeal.user_id == old_user_id:
                    appeal.user_id = new_user_id
            
            if old_user_id in self.active_connections:
                self.active_connections[new_user_id] = self.active_connections[old_user_id]
                del self.active_connections[old_user_id]
            
            return True
    
    def create_notification(self, user_id: str, title: str, content: str, notification_type: str):
        with self.lock:
            if not hasattr(self, 'notifications'):
                self.notifications = {}
            
            notification = {
                "notification_id": self.generate_id(),
                "user_id": user_id,
                "title": title,
                "content": content,
                "type": notification_type,
                "created_at": datetime.now(),
                "is_read": False
            }
            self.notifications[notification["notification_id"]] = notification
            return notification
    
    def get_user_notifications(self, user_id: str):
        with self.lock:
            if not hasattr(self, 'notifications'):
                self.notifications = {}
            
            return [n for n in self.notifications.values() if n["user_id"] == user_id]
    
    def mark_notification_read(self, notification_id: str, user_id: str) -> bool:
        with self.lock:
            if not hasattr(self, 'notifications'):
                self.notifications = {}
            
            if notification_id in self.notifications:
                notification = self.notifications[notification_id]
                if notification["user_id"] == user_id:
                    notification["is_read"] = True
                    return True
            return False

from .sqlite_database import SQLiteDatabase
db = SQLiteDatabase()
