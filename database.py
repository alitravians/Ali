import threading
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from models import User, Message, BanRecord, Report, BanAppeal, Announcement
import uuid

class InMemoryDatabase:
    def __init__(self):
        self._lock = threading.RLock()
        self.users: Dict[str, User] = {}
        self.messages: Dict[str, Message] = {}
        self.ban_records: Dict[str, BanRecord] = {}
        self.reports: Dict[str, Report] = {}
        self.ban_appeals: Dict[str, BanAppeal] = {}
        self.announcements: Dict[str, Announcement] = {}
        self.site_settings = {
            "maintenance_mode": False,
            "maintenance_message": "",
            "profanity_filter": True,
            "max_message_length": 500,
            "allow_guest_users": False
        }
        
        admin_id = str(uuid.uuid4())
        admin_user_id = "1000000000"  # Fixed admin user ID
        self.users[admin_id] = User(
            id=admin_id,
            user_id=admin_user_id,
            username="admin",
            role="admin",
            status="active"
        )
    
    def create_user(self, username: str, role: str = "user", user_id: str = None) -> User:
        with self._lock:
            internal_id = str(uuid.uuid4())
            if user_id is None:
                import random
                while True:
                    user_id = ''.join([str(random.randint(0, 9)) for _ in range(10)])
                    if not any(u.user_id == user_id for u in self.users.values()):
                        break
            
            user = User(
                id=internal_id,
                user_id=user_id,
                username=username,
                role=role,
                status="active"
            )
            self.users[internal_id] = user
            return user
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        with self._lock:
            return self.users.get(user_id)
    
    def get_user_by_user_id(self, user_id: str) -> Optional[User]:
        with self._lock:
            for user in self.users.values():
                if user.user_id == user_id:
                    return user
            return None
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        with self._lock:
            for user in self.users.values():
                if user.username == username:
                    return user
            return None
    
    def get_all_users(self) -> List[User]:
        with self._lock:
            return list(self.users.values())
    
    def update_user(self, user_id: str, **kwargs) -> Optional[User]:
        with self._lock:
            if user_id in self.users:
                user_data = self.users[user_id].dict()
                user_data.update(kwargs)
                self.users[user_id] = User(**user_data)
                return self.users[user_id]
            return None
    
    def update_user_id(self, internal_id: str, new_user_id: str) -> Optional[User]:
        """Update user's 10-digit ID (only allowed once per user)"""
        with self._lock:
            if internal_id in self.users:
                user = self.users[internal_id]
                if user.id_changed:
                    return None  # User has already changed their ID once
                
                if any(u.user_id == new_user_id for u in self.users.values()):
                    return None  # User ID already exists
                
                if not (new_user_id.isdigit() and len(new_user_id) == 10):
                    return None  # Invalid format
                
                user_data = user.dict()
                user_data['user_id'] = new_user_id
                user_data['id_changed'] = True
                self.users[internal_id] = User(**user_data)
                return self.users[internal_id]
            return None
    
    def create_message(self, user_id: str, username: str, content: str, is_bold: bool = False) -> Message:
        with self._lock:
            message_id = str(uuid.uuid4())
            message = Message(
                id=message_id,
                user_id=user_id,
                username=username,
                content=content,
                is_bold=is_bold
            )
            self.messages[message_id] = message
            return message
    
    def get_message_by_id(self, message_id: str) -> Optional[Message]:
        with self._lock:
            return self.messages.get(message_id)
    
    def get_all_messages(self, limit: int = 100) -> List[Message]:
        with self._lock:
            messages = [msg for msg in self.messages.values() if not msg.is_deleted]
            return sorted(messages, key=lambda x: x.timestamp, reverse=True)[:limit]
    
    def delete_message(self, message_id: str) -> bool:
        with self._lock:
            if message_id in self.messages:
                self.messages[message_id].is_deleted = True
                return True
            return False
    
    def create_ban_record(self, user_id: str, reason: str, duration_minutes: int, banned_by: str) -> BanRecord:
        with self._lock:
            ban_id = str(uuid.uuid4())
            expires_at = datetime.now() + timedelta(minutes=duration_minutes)
            ban_record = BanRecord(
                id=ban_id,
                user_id=user_id,
                reason=reason,
                duration_minutes=duration_minutes,
                banned_by=banned_by,
                expires_at=expires_at
            )
            self.ban_records[ban_id] = ban_record
            return ban_record
    
    def get_ban_records_by_user(self, user_id: str) -> List[BanRecord]:
        with self._lock:
            return [record for record in self.ban_records.values() if record.user_id == user_id]
    
    def get_all_ban_records(self) -> List[BanRecord]:
        with self._lock:
            return list(self.ban_records.values())
    
    def create_report(self, reporter_id: str, target_user_id: str, reason: str) -> Report:
        with self._lock:
            report_id = str(uuid.uuid4())
            report = Report(
                id=report_id,
                reporter_id=reporter_id,
                target_user_id=target_user_id,
                reason=reason
            )
            self.reports[report_id] = report
            return report
    
    def get_report_by_id(self, report_id: str) -> Optional[Report]:
        with self._lock:
            return self.reports.get(report_id)
    
    def get_all_reports(self) -> List[Report]:
        with self._lock:
            return list(self.reports.values())
    
    def update_report_status(self, report_id: str, status: str) -> Optional[Report]:
        with self._lock:
            if report_id in self.reports:
                self.reports[report_id].status = status
                return self.reports[report_id]
            return None
    
    def create_ban_appeal(self, user_id: str, reason: str) -> BanAppeal:
        with self._lock:
            appeal_id = str(uuid.uuid4())
            appeal = BanAppeal(
                id=appeal_id,
                user_id=user_id,
                reason=reason
            )
            self.ban_appeals[appeal_id] = appeal
            return appeal
    
    def get_ban_appeal_by_id(self, appeal_id: str) -> Optional[BanAppeal]:
        with self._lock:
            return self.ban_appeals.get(appeal_id)
    
    def get_all_ban_appeals(self) -> List[BanAppeal]:
        with self._lock:
            return list(self.ban_appeals.values())
    
    def update_ban_appeal(self, appeal_id: str, status: str, admin_response: str = None) -> Optional[BanAppeal]:
        with self._lock:
            if appeal_id in self.ban_appeals:
                self.ban_appeals[appeal_id].status = status
                if admin_response:
                    self.ban_appeals[appeal_id].admin_response = admin_response
                return self.ban_appeals[appeal_id]
            return None
    
    def create_announcement(self, title: str, content: str, created_by: str) -> Announcement:
        with self._lock:
            announcement_id = str(uuid.uuid4())
            announcement = Announcement(
                id=announcement_id,
                title=title,
                content=content,
                created_by=created_by
            )
            self.announcements[announcement_id] = announcement
            return announcement
    
    def get_announcement_by_id(self, announcement_id: str) -> Optional[Announcement]:
        with self._lock:
            return self.announcements.get(announcement_id)
    
    def get_all_announcements(self) -> List[Announcement]:
        with self._lock:
            return sorted(self.announcements.values(), key=lambda x: x.created_at, reverse=True)
    
    def delete_announcement(self, announcement_id: str) -> bool:
        with self._lock:
            if announcement_id in self.announcements:
                del self.announcements[announcement_id]
                return True
            return False
    
    def get_site_settings(self) -> dict:
        with self._lock:
            return self.site_settings.copy()
    
    def update_site_settings(self, **kwargs) -> dict:
        with self._lock:
            self.site_settings.update(kwargs)
            return self.site_settings.copy()
    
    def get_analytics(self) -> dict:
        """Get analytics data for admin dashboard"""
        with self._lock:
            total_users = len(self.users)
            active_users = len([u for u in self.users.values() if u.status == "active"])
            total_messages = len([m for m in self.messages.values() if not m.is_deleted])
            
            today = datetime.now().date()
            today_messages = len([
                m for m in self.messages.values() 
                if not m.is_deleted and m.timestamp.date() == today
            ])
            
            return {
                "totalUsers": total_users,
                "activeUsers": active_users,
                "totalMessages": total_messages,
                "todayMessages": today_messages,
                "bannedUsers": len([u for u in self.users.values() if u.status == "banned"]),
                "mutedUsers": len([u for u in self.users.values() if u.status == "muted"]),
                "pendingReports": len([r for r in self.reports.values() if r.status == "pending"]),
                "pendingAppeals": len([a for a in self.ban_appeals.values() if a.status == "pending"])
            }

db = InMemoryDatabase()
