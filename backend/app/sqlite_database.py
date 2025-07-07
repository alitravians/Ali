import sqlite3
import threading
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from .models import *
import random
import string
import os

class SQLiteDatabase:
    def __init__(self, db_path: str = "chat_system.db"):
        self.db_path = db_path
        self.lock = threading.Lock()
        self._init_database()
        self._create_default_admin()
    
    def _init_database(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                status TEXT NOT NULL DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                muted_until TIMESTAMP,
                banned_until TIMESTAMP,
                ban_reason TEXT,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )''')
            
            conn.execute('''CREATE TABLE IF NOT EXISTS messages (
                message_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                username TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_deleted BOOLEAN DEFAULT FALSE,
                deleted_by TEXT,
                FOREIGN KEY (user_id) REFERENCES users (user_id)
            )''')
            
            conn.execute('''CREATE TABLE IF NOT EXISTS ban_records (
                ban_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                banned_by TEXT NOT NULL,
                reason TEXT NOT NULL,
                banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                banned_until TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (user_id) REFERENCES users (user_id)
            )''')
            
            conn.execute('''CREATE TABLE IF NOT EXISTS reports (
                report_id TEXT PRIMARY KEY,
                reporter_id TEXT NOT NULL,
                reported_message_id TEXT NOT NULL,
                reported_user_id TEXT NOT NULL,
                category TEXT NOT NULL,
                reason TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_by TEXT,
                reviewed_at TIMESTAMP,
                FOREIGN KEY (reporter_id) REFERENCES users (user_id),
                FOREIGN KEY (reported_user_id) REFERENCES users (user_id)
            )''')
            
            conn.execute('''CREATE TABLE IF NOT EXISTS appeals (
                appeal_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                ban_id TEXT NOT NULL,
                reason TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_by TEXT,
                reviewed_at TIMESTAMP,
                admin_response TEXT,
                FOREIGN KEY (user_id) REFERENCES users (user_id),
                FOREIGN KEY (ban_id) REFERENCES ban_records (ban_id)
            )''')
            
            conn.execute('''CREATE TABLE IF NOT EXISTS announcements (
                announcement_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                created_by TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (created_by) REFERENCES users (user_id)
            )''')
            
            conn.execute('''CREATE TABLE IF NOT EXISTS notifications (
                notification_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                type TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_read BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (user_id) REFERENCES users (user_id)
            )''')
            
            conn.commit()
    
    def _create_default_admin(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT user_id FROM users WHERE username = 'admin'")
            existing_admin = cursor.fetchone()
            
            if not existing_admin:
                admin_id = "1000000000"
                cursor.execute("""INSERT INTO users 
                    (user_id, username, password_hash, role, status) 
                    VALUES (?, ?, ?, ?, ?)""",
                    (admin_id, "admin", "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW", "admin", "active"))
                conn.commit()

    def generate_user_id(self) -> str:
        while True:
            user_id = ''.join(random.choices(string.digits, k=10))
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT user_id FROM users WHERE user_id = ?", (user_id,))
                if not cursor.fetchone():
                    return user_id
    
    def create_user(self, username: str, password_hash: str = None) -> User:
        with self.lock:
            user_id = self.generate_user_id()
            user = User(
                user_id=user_id,
                username=username,
                password_hash=password_hash or "",
                role=UserRole.USER,
                status=UserStatus.ACTIVE
            )
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""INSERT INTO users 
                    (user_id, username, password_hash, role, status) 
                    VALUES (?, ?, ?, ?, ?)""",
                    (user_id, username, password_hash or "", "user", "active"))
                conn.commit()
            
            return user
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()
            
            if row:
                return User(
                    user_id=row[0],
                    username=row[1],
                    password_hash=row[2],
                    role=UserRole(row[3]),
                    status=UserStatus(row[4]),
                    created_at=datetime.fromisoformat(row[5]) if row[5] else datetime.now(),
                    muted_until=datetime.fromisoformat(row[6]) if row[6] else None,
                    banned_until=datetime.fromisoformat(row[7]) if row[7] else None,
                    ban_reason=row[8],
                    last_seen=datetime.fromisoformat(row[9]) if row[9] else datetime.now()
                )
        return None
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
            row = cursor.fetchone()
            
            if row:
                return User(
                    user_id=row[0],
                    username=row[1],
                    password_hash=row[2],
                    role=UserRole(row[3]),
                    status=UserStatus(row[4]),
                    created_at=datetime.fromisoformat(row[5]) if row[5] else datetime.now(),
                    muted_until=datetime.fromisoformat(row[6]) if row[6] else None,
                    banned_until=datetime.fromisoformat(row[7]) if row[7] else None,
                    ban_reason=row[8],
                    last_seen=datetime.fromisoformat(row[9]) if row[9] else datetime.now()
                )
        return None
    
    def update_user_status(self, user_id: str, status: UserStatus, 
                          muted_until: datetime = None, banned_until: datetime = None, 
                          ban_reason: str = None):
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""UPDATE users SET 
                    status = ?, muted_until = ?, banned_until = ?, ban_reason = ?
                    WHERE user_id = ?""",
                    (status.value, 
                     muted_until.isoformat() if muted_until else None,
                     banned_until.isoformat() if banned_until else None,
                     ban_reason, user_id))
                conn.commit()
    
    def set_user_online(self, user_id: str):
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("UPDATE users SET last_seen = ? WHERE user_id = ?",
                             (datetime.now().isoformat(), user_id))
                conn.commit()
    
    def set_user_offline(self, user_id: str):
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("UPDATE users SET last_seen = ? WHERE user_id = ?",
                             (datetime.now().isoformat(), user_id))
                conn.commit()
    
    def get_online_users(self) -> List[UserInfo]:
        online_threshold = datetime.now() - timedelta(minutes=5)
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE last_seen > ?", 
                         (online_threshold.isoformat(),))
            rows = cursor.fetchall()
            
            return [
                UserInfo(
                    user_id=row[0],
                    username=row[1],
                    role=UserRole(row[3]),
                    status=UserStatus(row[4]),
                    last_seen=datetime.fromisoformat(row[9]) if row[9] else datetime.now(),
                    is_online=True
                )
                for row in rows
            ]
    
    def get_all_users(self) -> List[UserInfo]:
        online_threshold = datetime.now() - timedelta(minutes=5)
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users")
            rows = cursor.fetchall()
            
            return [
                UserInfo(
                    user_id=row[0],
                    username=row[1],
                    role=UserRole(row[3]),
                    status=UserStatus(row[4]),
                    last_seen=datetime.fromisoformat(row[9]) if row[9] else datetime.now(),
                    is_online=datetime.fromisoformat(row[9]) > online_threshold if row[9] else False
                )
                for row in rows
            ]

    def add_message(self, user_id: str, username: str, content: str) -> Message:
        with self.lock:
            message = Message(
                message_id=str(uuid.uuid4()),
                user_id=user_id,
                username=username,
                content=content,
                timestamp=datetime.now()
            )
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""INSERT INTO messages 
                    (message_id, user_id, username, content, timestamp) 
                    VALUES (?, ?, ?, ?, ?)""",
                    (message.message_id, user_id, username, content, message.timestamp.isoformat()))
                conn.commit()
            
            return message
    
    def get_messages(self, limit: int = 100) -> List[Message]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""SELECT * FROM messages WHERE is_deleted = FALSE 
                           ORDER BY timestamp DESC LIMIT ?""", (limit,))
            rows = cursor.fetchall()
            
            messages = []
            for row in rows:
                messages.append(Message(
                    message_id=row[0],
                    user_id=row[1],
                    username=row[2],
                    content=row[3],
                    timestamp=datetime.fromisoformat(row[4]),
                    is_deleted=bool(row[5]),
                    deleted_by=row[6]
                ))
            
            return list(reversed(messages))
    
    def delete_message(self, message_id: str, deleted_by: str) -> bool:
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""UPDATE messages SET is_deleted = TRUE, deleted_by = ? 
                               WHERE message_id = ?""", (deleted_by, message_id))
                conn.commit()
                return cursor.rowcount > 0
    
    def clear_all_messages(self, deleted_by: str) -> int:
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""UPDATE messages SET is_deleted = TRUE, deleted_by = ? 
                               WHERE is_deleted = FALSE""", (deleted_by,))
                conn.commit()
                return cursor.rowcount

    def ban_user(self, user_id: str, banned_by: str, reason: str, 
                 banned_until: datetime = None) -> BanRecord:
        with self.lock:
            ban_record = BanRecord(
                ban_id=str(uuid.uuid4()),
                user_id=user_id,
                banned_by=banned_by,
                reason=reason,
                banned_until=banned_until
            )
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""INSERT INTO ban_records 
                    (ban_id, user_id, banned_by, reason, banned_until) 
                    VALUES (?, ?, ?, ?, ?)""",
                    (ban_record.ban_id, user_id, banned_by, reason,
                     banned_until.isoformat() if banned_until else None))
                conn.commit()
            
            self.update_user_status(
                user_id, 
                UserStatus.BANNED, 
                banned_until=banned_until,
                ban_reason=reason
            )
            return ban_record
    
    def unban_user(self, user_id: str):
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("UPDATE ban_records SET is_active = FALSE WHERE user_id = ? AND is_active = TRUE",
                             (user_id,))
                conn.commit()
            
            self.update_user_status(user_id, UserStatus.ACTIVE, ban_reason=None, banned_until=None)
    
    def mute_user(self, user_id: str, duration_minutes: int, reason: str):
        with self.lock:
            muted_until = datetime.now() + timedelta(minutes=duration_minutes)
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""UPDATE users SET muted_until = ? WHERE user_id = ?""",
                             (muted_until.isoformat(), user_id))
                conn.commit()
            
            self.create_notification(
                user_id=user_id,
                title="تم كتمك",
                content=f"تم كتمك لمدة {duration_minutes} دقيقة. السبب: {reason}",
                notification_type="mute"
            )
    
    def get_active_bans(self) -> List[BanRecord]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM ban_records WHERE is_active = TRUE")
            rows = cursor.fetchall()
            
            return [
                BanRecord(
                    ban_id=row[0],
                    user_id=row[1],
                    banned_by=row[2],
                    reason=row[3],
                    banned_at=datetime.fromisoformat(row[4]),
                    banned_until=datetime.fromisoformat(row[5]) if row[5] else None,
                    is_active=bool(row[6])
                )
                for row in rows
            ]
    
    def get_user_ban(self, user_id: str) -> Optional[BanRecord]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM ban_records WHERE user_id = ? AND is_active = TRUE", (user_id,))
            row = cursor.fetchone()
            
            if row:
                return BanRecord(
                    ban_id=row[0],
                    user_id=row[1],
                    banned_by=row[2],
                    reason=row[3],
                    banned_at=datetime.fromisoformat(row[4]),
                    banned_until=datetime.fromisoformat(row[5]) if row[5] else None,
                    is_active=bool(row[6])
                )
        return None

    def create_report(self, reporter_id: str, reported_message_id: str, 
                     reported_user_id: str, category: ReportCategory, reason: str) -> Report:
        with self.lock:
            report = Report(
                report_id=str(uuid.uuid4()),
                reporter_id=reporter_id,
                reported_message_id=reported_message_id,
                reported_user_id=reported_user_id,
                category=category,
                reason=reason
            )
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""INSERT INTO reports 
                    (report_id, reporter_id, reported_message_id, reported_user_id, category, reason) 
                    VALUES (?, ?, ?, ?, ?, ?)""",
                    (report.report_id, reporter_id, reported_message_id, reported_user_id, 
                     category.value, reason))
                conn.commit()
            
            return report
    
    def get_pending_reports(self) -> List[Report]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM reports WHERE status = 'pending'")
            rows = cursor.fetchall()
            
            return [
                Report(
                    report_id=row[0],
                    reporter_id=row[1],
                    reported_message_id=row[2],
                    reported_user_id=row[3],
                    category=ReportCategory(row[4]),
                    reason=row[5],
                    status=ReportStatus(row[6]),
                    created_at=datetime.fromisoformat(row[7]),
                    reviewed_by=row[8],
                    reviewed_at=datetime.fromisoformat(row[9]) if row[9] else None
                )
                for row in rows
            ]
    
    def get_all_reports(self) -> List[Report]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM reports")
            rows = cursor.fetchall()
            
            return [
                Report(
                    report_id=row[0],
                    reporter_id=row[1],
                    reported_message_id=row[2],
                    reported_user_id=row[3],
                    category=ReportCategory(row[4]),
                    reason=row[5],
                    status=ReportStatus(row[6]),
                    created_at=datetime.fromisoformat(row[7]),
                    reviewed_by=row[8],
                    reviewed_at=datetime.fromisoformat(row[9]) if row[9] else None
                )
                for row in rows
            ]
    
    def update_report_status(self, report_id: str, status: ReportStatus, reviewed_by: str):
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""UPDATE reports SET status = ?, reviewed_by = ?, reviewed_at = ? 
                               WHERE report_id = ?""",
                             (status.value, reviewed_by, datetime.now().isoformat(), report_id))
                conn.commit()

    def create_appeal(self, user_id: str, ban_id: str, reason: str) -> BanAppeal:
        with self.lock:
            appeal = BanAppeal(
                appeal_id=str(uuid.uuid4()),
                user_id=user_id,
                ban_id=ban_id,
                reason=reason
            )
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""INSERT INTO appeals 
                    (appeal_id, user_id, ban_id, reason) 
                    VALUES (?, ?, ?, ?)""",
                    (appeal.appeal_id, user_id, ban_id, reason))
                conn.commit()
            
            return appeal
    
    def get_pending_appeals(self) -> List[BanAppeal]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM appeals WHERE status = 'pending'")
            rows = cursor.fetchall()
            
            return [
                BanAppeal(
                    appeal_id=row[0],
                    user_id=row[1],
                    ban_id=row[2],
                    reason=row[3],
                    status=AppealStatus(row[4]),
                    created_at=datetime.fromisoformat(row[5]),
                    reviewed_by=row[6],
                    reviewed_at=datetime.fromisoformat(row[7]) if row[7] else None,
                    admin_response=row[8]
                )
                for row in rows
            ]
    
    def get_all_appeals(self) -> List[BanAppeal]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM appeals")
            rows = cursor.fetchall()
            
            return [
                BanAppeal(
                    appeal_id=row[0],
                    user_id=row[1],
                    ban_id=row[2],
                    reason=row[3],
                    status=AppealStatus(row[4]),
                    created_at=datetime.fromisoformat(row[5]),
                    reviewed_by=row[6],
                    reviewed_at=datetime.fromisoformat(row[7]) if row[7] else None,
                    admin_response=row[8]
                )
                for row in rows
            ]
    
    def get_user_appeal(self, user_id: str) -> Optional[BanAppeal]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM appeals WHERE user_id = ? AND status = 'pending'", (user_id,))
            row = cursor.fetchone()
            
            if row:
                return BanAppeal(
                    appeal_id=row[0],
                    user_id=row[1],
                    ban_id=row[2],
                    reason=row[3],
                    status=AppealStatus(row[4]),
                    created_at=datetime.fromisoformat(row[5]),
                    reviewed_by=row[6],
                    reviewed_at=datetime.fromisoformat(row[7]) if row[7] else None,
                    admin_response=row[8]
                )
        return None
    
    def update_appeal_status(self, appeal_id: str, status: AppealStatus, 
                           reviewed_by: str, response: str = None):
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""UPDATE appeals SET status = ?, reviewed_by = ?, 
                               reviewed_at = ?, admin_response = ? WHERE appeal_id = ?""",
                             (status.value, reviewed_by, datetime.now().isoformat(), response, appeal_id))
                conn.commit()
                
                if status == AppealStatus.APPROVED:
                    cursor.execute("SELECT user_id FROM appeals WHERE appeal_id = ?", (appeal_id,))
                    user_row = cursor.fetchone()
                    if user_row:
                        self.unban_user(user_row[0])
                
                cursor.execute("SELECT * FROM appeals WHERE appeal_id = ?", (appeal_id,))
                row = cursor.fetchone()
                
                if row:
                    return BanAppeal(
                        appeal_id=row[0],
                        user_id=row[1],
                        ban_id=row[2],
                        reason=row[3],
                        status=AppealStatus(row[4]),
                        created_at=datetime.fromisoformat(row[5]),
                        reviewed_by=row[6],
                        reviewed_at=datetime.fromisoformat(row[7]) if row[7] else None,
                        admin_response=row[8]
                    )
        return None

    def create_announcement(self, title: str, content: str, created_by: str) -> Announcement:
        with self.lock:
            announcement = Announcement(
                announcement_id=str(uuid.uuid4()),
                title=title,
                content=content,
                created_by=created_by
            )
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""INSERT INTO announcements 
                    (announcement_id, title, content, created_by) 
                    VALUES (?, ?, ?, ?)""",
                    (announcement.announcement_id, title, content, created_by))
                conn.commit()
            
            return announcement
    
    def get_active_announcements(self) -> List[Announcement]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM announcements WHERE is_active = TRUE")
            rows = cursor.fetchall()
            
            return [
                Announcement(
                    announcement_id=row[0],
                    title=row[1],
                    content=row[2],
                    created_by=row[3],
                    created_at=datetime.fromisoformat(row[4]),
                    is_active=bool(row[5])
                )
                for row in rows
            ]
    
    def get_all_announcements(self) -> List[Announcement]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM announcements")
            rows = cursor.fetchall()
            
            return [
                Announcement(
                    announcement_id=row[0],
                    title=row[1],
                    content=row[2],
                    created_by=row[3],
                    created_at=datetime.fromisoformat(row[4]),
                    is_active=bool(row[5])
                )
                for row in rows
            ]
    
    def deactivate_announcement(self, announcement_id: str):
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("UPDATE announcements SET is_active = FALSE WHERE announcement_id = ?",
                             (announcement_id,))
                conn.commit()

    def create_notification(self, user_id: str, title: str, content: str, notification_type: str) -> Notification:
        with self.lock:
            notification = Notification(
                notification_id=str(uuid.uuid4()),
                user_id=user_id,
                title=title,
                content=content,
                type=notification_type
            )
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""INSERT INTO notifications 
                    (notification_id, user_id, title, content, type) 
                    VALUES (?, ?, ?, ?, ?)""",
                    (notification.notification_id, user_id, title, content, notification_type))
                conn.commit()
            
            return notification
    
    def get_user_notifications(self, user_id: str) -> List[Notification]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
            rows = cursor.fetchall()
            
            return [
                Notification(
                    notification_id=row[0],
                    user_id=row[1],
                    title=row[2],
                    content=row[3],
                    type=row[4],
                    created_at=datetime.fromisoformat(row[5]),
                    is_read=bool(row[6])
                )
                for row in rows
            ]
    
    def mark_notification_read(self, notification_id: str, user_id: str) -> bool:
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""UPDATE notifications SET is_read = TRUE 
                               WHERE notification_id = ? AND user_id = ?""",
                             (notification_id, user_id))
                conn.commit()
                return cursor.rowcount > 0
    
    def change_user_id(self, old_user_id: str, new_user_id: str) -> bool:
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute("SELECT user_id FROM users WHERE user_id = ?", (new_user_id,))
                if cursor.fetchone():
                    return False
                
                cursor.execute("SELECT user_id FROM users WHERE user_id = ?", (old_user_id,))
                if not cursor.fetchone():
                    return False
                
                cursor.execute("UPDATE users SET user_id = ? WHERE user_id = ?", (new_user_id, old_user_id))
                cursor.execute("UPDATE messages SET user_id = ? WHERE user_id = ?", (new_user_id, old_user_id))
                cursor.execute("UPDATE ban_records SET user_id = ? WHERE user_id = ?", (new_user_id, old_user_id))
                cursor.execute("UPDATE reports SET reporter_id = ? WHERE reporter_id = ?", (new_user_id, old_user_id))
                cursor.execute("UPDATE reports SET reported_user_id = ? WHERE reported_user_id = ?", (new_user_id, old_user_id))
                cursor.execute("UPDATE appeals SET user_id = ? WHERE user_id = ?", (new_user_id, old_user_id))
                cursor.execute("UPDATE notifications SET user_id = ? WHERE user_id = ?", (new_user_id, old_user_id))
                
                conn.commit()
                return True
    
    def get_statistics(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute("SELECT COUNT(*) FROM users")
            total_users = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM messages WHERE is_deleted = FALSE")
            total_messages = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM reports WHERE status = 'pending'")
            pending_reports = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM appeals WHERE status = 'pending'")
            pending_appeals = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM ban_records WHERE is_active = TRUE")
            active_bans = cursor.fetchone()[0]
            
            online_threshold = datetime.now() - timedelta(minutes=5)
            cursor.execute("SELECT COUNT(*) FROM users WHERE last_seen > ?", (online_threshold.isoformat(),))
            online_users = cursor.fetchone()[0]
            
            return {
                "total_users": total_users,
                "online_users": online_users,
                "total_messages": total_messages,
                "pending_reports": pending_reports,
                "pending_appeals": pending_appeals,
                "active_bans": active_bans
            }
