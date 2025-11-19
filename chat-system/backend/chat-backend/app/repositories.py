"""
Repository layer for Firebase Realtime Database operations.
Abstracts storage implementation from business logic.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from .firebase_config import firebase_db

class UsersRepository:
    """Manages user data in Firebase"""
    
    def get_by_username(self, username: str) -> Optional[Dict]:
        """Get user by username"""
        return firebase_db.get(f"users/{username}")
    
    def get_by_user_id(self, user_id: str) -> Optional[Dict]:
        """Get user by user_id (via index)"""
        username = firebase_db.get(f"user_ids/{user_id}")
        if username:
            return self.get_by_username(username)
        return None
    
    def create(self, username: str, user_data: Dict) -> bool:
        """Create a new user"""
        success = firebase_db.set(f"users/{username}", user_data)
        if success and "user_id" in user_data:
            firebase_db.set(f"user_ids/{user_data['user_id']}", username)
        return success
    
    def list_all(self) -> Dict[str, Dict]:
        """List all users"""
        users = firebase_db.get("users")
        return users if users else {}
    
    def update(self, username: str, data: Dict) -> bool:
        """Update user data (partial update)"""
        return firebase_db.update(f"users/{username}", data)
    
    def delete(self, username: str) -> bool:
        """Delete a user"""
        user = self.get_by_username(username)
        if user and "user_id" in user:
            firebase_db.delete(f"user_ids/{user['user_id']}")
        return firebase_db.delete(f"users/{username}")


class MessagesRepository:
    """Manages chat messages in Firebase"""
    
    def list_all(self, limit: Optional[int] = None) -> List[Dict]:
        """List all messages"""
        messages = firebase_db.get("messages")
        if not messages:
            return []
        
        message_list = []
        for key, msg in messages.items():
            msg['id'] = key
            message_list.append(msg)
        
        message_list.sort(key=lambda x: x.get('created_at', ''))
        
        if limit:
            return message_list[-limit:]
        return message_list
    
    def create(self, message_data: Dict) -> Optional[str]:
        """Create a new message"""
        message_data['created_at'] = datetime.utcnow().isoformat()
        return firebase_db.push("messages", message_data)
    
    def delete(self, message_id: str) -> bool:
        """Delete a message"""
        return firebase_db.delete(f"messages/{message_id}")
    
    def clear_all(self) -> bool:
        """Clear all messages"""
        return firebase_db.delete("messages")


class BansRepository:
    """Manages user bans in Firebase"""
    
    def get(self, user_id: str) -> Optional[Dict]:
        """Get ban by user_id"""
        return firebase_db.get(f"bans/{user_id}")
    
    def set(self, user_id: str, ban_data: Dict) -> bool:
        """Set/update a ban"""
        ban_data['created_at'] = datetime.utcnow().isoformat()
        return firebase_db.set(f"bans/{user_id}", ban_data)
    
    def create(self, user_id: str, ban_data: Dict) -> bool:
        """Create a ban (alias for set)"""
        return self.set(user_id, ban_data)
    
    def delete(self, user_id: str) -> bool:
        """Remove a ban"""
        return firebase_db.delete(f"bans/{user_id}")
    
    def list_all(self) -> List[Dict]:
        """List all bans"""
        bans = firebase_db.get("bans")
        if not bans:
            return []
        
        ban_list = []
        for key, ban in bans.items():
            ban['id'] = key
            ban['user_id'] = key  # Ensure user_id is set
            ban_list.append(ban)
        
        ban_list.sort(key=lambda x: x.get('created_at', ''))
        return ban_list


class MutesRepository:
    """Manages user mutes in Firebase"""
    
    def get(self, user_id: str) -> Optional[Dict]:
        """Get mute by user_id"""
        return firebase_db.get(f"mutes/{user_id}")
    
    def set(self, user_id: str, mute_data: Dict) -> bool:
        """Set/update a mute"""
        mute_data['created_at'] = datetime.utcnow().isoformat()
        return firebase_db.set(f"mutes/{user_id}", mute_data)
    
    def create(self, user_id: str, mute_data: Dict) -> bool:
        """Create a mute (alias for set)"""
        return self.set(user_id, mute_data)
    
    def delete(self, user_id: str) -> bool:
        """Remove a mute"""
        return firebase_db.delete(f"mutes/{user_id}")
    
    def list_all(self) -> List[Dict]:
        """List all mutes"""
        mutes = firebase_db.get("mutes")
        if not mutes:
            return []
        
        mute_list = []
        for key, mute in mutes.items():
            mute['id'] = key
            mute['user_id'] = key  # Ensure user_id is set
            mute_list.append(mute)
        
        mute_list.sort(key=lambda x: x.get('created_at', ''))
        return mute_list


class AppealsRepository:
    """Manages ban appeals in Firebase"""
    
    def get(self, appeal_id: str) -> Optional[Dict]:
        """Get appeal by appeal_id"""
        return firebase_db.get(f"appeals/{appeal_id}")
    
    def list_all(self) -> List[Dict]:
        """List all appeals"""
        appeals = firebase_db.get("appeals")
        if not appeals:
            return []
        
        appeal_list = []
        for key, appeal in appeals.items():
            appeal['id'] = key
            appeal_list.append(appeal)
        
        appeal_list.sort(key=lambda x: x.get('created_at', ''))
        return appeal_list
    
    def list_by_user_id(self, user_id: str) -> List[Dict]:
        """List appeals by user_id"""
        all_appeals = self.list_all()
        return [a for a in all_appeals if a.get('user_id') == user_id]
    
    def create(self, appeal_data: Dict) -> Optional[str]:
        """Create a new appeal"""
        appeal_data['created_at'] = datetime.utcnow().isoformat()
        return firebase_db.push("appeals", appeal_data)
    
    def update(self, appeal_id: str, data: Dict) -> bool:
        """Update appeal data"""
        return firebase_db.update(f"appeals/{appeal_id}", data)
    
    def update_status(self, appeal_id: str, status: str, response: Optional[str] = None) -> bool:
        """Update appeal status"""
        update_data = {"status": status}
        if response:
            update_data["response"] = response
        return firebase_db.update(f"appeals/{appeal_id}", update_data)


class ReportsRepository:
    """Manages message reports in Firebase"""
    
    def get(self, report_id: str) -> Optional[Dict]:
        """Get report by report_id"""
        return firebase_db.get(f"reports/{report_id}")
    
    def list_all(self) -> List[Dict]:
        """List all reports"""
        reports = firebase_db.get("reports")
        if not reports:
            return []
        
        report_list = []
        for key, report in reports.items():
            report['id'] = key
            report_list.append(report)
        
        report_list.sort(key=lambda x: x.get('created_at', ''))
        return report_list
    
    def create(self, report_data: Dict) -> Optional[str]:
        """Create a new report"""
        report_data['created_at'] = datetime.utcnow().isoformat()
        return firebase_db.push("reports", report_data)
    
    def update(self, report_id: str, data: Dict) -> bool:
        """Update report data"""
        return firebase_db.update(f"reports/{report_id}", data)
    
    def update_status(self, report_id: str, status: str) -> bool:
        """Update report status"""
        return firebase_db.update(f"reports/{report_id}", {"status": status})


class FilesRepository:
    """Manages pending files in Firebase"""
    
    def get(self, file_id: str) -> Optional[Dict]:
        """Get file by file_id"""
        return firebase_db.get(f"files/pending/{file_id}")
    
    def list_pending(self) -> List[Dict]:
        """List all pending files"""
        files = firebase_db.get("files/pending")
        if not files:
            return []
        
        file_list = []
        for key, file in files.items():
            file['id'] = key
            file_list.append(file)
        
        file_list.sort(key=lambda x: x.get('created_at', ''))
        return file_list
    
    def create(self, file_data: Dict) -> Optional[str]:
        """Create a new pending file"""
        file_data['created_at'] = datetime.utcnow().isoformat()
        return firebase_db.push("files/pending", file_data)
    
    def update(self, file_id: str, data: Dict) -> bool:
        """Update file data"""
        return firebase_db.update(f"files/pending/{file_id}", data)
    
    def delete(self, file_id: str) -> bool:
        """Delete a pending file"""
        return firebase_db.delete(f"files/pending/{file_id}")


class AnnouncementsRepository:
    """Manages announcements in Firebase"""
    
    def list_all(self) -> List[Dict]:
        """List all announcements"""
        announcements = firebase_db.get("announcements")
        if not announcements:
            return []
        
        announcement_list = []
        for key, announcement in announcements.items():
            announcement['id'] = key
            announcement_list.append(announcement)
        
        announcement_list.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return announcement_list
    
    def create(self, announcement_data: Dict) -> Optional[str]:
        """Create a new announcement"""
        announcement_data['created_at'] = datetime.utcnow().isoformat()
        return firebase_db.push("announcements", announcement_data)
    
    def update(self, announcement_id: str, data: Dict) -> bool:
        """Update announcement data"""
        data['updated_at'] = datetime.utcnow().isoformat()
        return firebase_db.update(f"announcements/{announcement_id}", data)
    
    def delete(self, announcement_id: str) -> bool:
        """Delete an announcement"""
        return firebase_db.delete(f"announcements/{announcement_id}")


class SettingsRepository:
    """Manages chat settings in Firebase"""
    
    def get(self) -> Dict:
        """Get chat settings"""
        settings = firebase_db.get("settings")
        if not settings:
            return {"is_open": True, "close_message": ""}
        return settings
    
    def update(self, settings_data: Dict) -> bool:
        """Update chat settings"""
        return firebase_db.update("settings", settings_data)


class AuditLogRepository:
    """Manages audit log for admin/moderator actions"""
    
    def list_all(self, limit: Optional[int] = None) -> List[Dict]:
        """List all audit log entries"""
        logs = firebase_db.get("audit_log")
        if not logs:
            return []
        
        log_list = []
        for key, log in logs.items():
            log['id'] = key
            log_list.append(log)
        
        log_list.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        if limit:
            return log_list[:limit]
        return log_list
    
    def create(self, log_data: Dict) -> Optional[str]:
        """Create a new audit log entry"""
        log_data['created_at'] = datetime.utcnow().isoformat()
        return firebase_db.push("audit_log", log_data)


class PrivateMessagesRepository:
    """Manages private messages between users"""
    
    def list_by_conversation(self, user1_id: str, user2_id: str, limit: Optional[int] = None) -> List[Dict]:
        """List messages in a conversation between two users"""
        all_messages = firebase_db.get("private_messages")
        if not all_messages:
            return []
        
        conversation_messages = []
        for key, msg in all_messages.items():
            if (msg.get('sender_id') == user1_id and msg.get('receiver_id') == user2_id) or \
               (msg.get('sender_id') == user2_id and msg.get('receiver_id') == user1_id):
                msg['id'] = key
                conversation_messages.append(msg)
        
        conversation_messages.sort(key=lambda x: x.get('created_at', ''))
        
        if limit:
            return conversation_messages[-limit:]
        return conversation_messages
    
    def list_conversations(self, user_id: str) -> List[Dict]:
        """List all conversations for a user"""
        all_messages = firebase_db.get("private_messages")
        if not all_messages:
            return []
        
        conversations = {}
        for key, msg in all_messages.items():
            if msg.get('sender_id') == user_id:
                other_user = msg.get('receiver_id')
            elif msg.get('receiver_id') == user_id:
                other_user = msg.get('sender_id')
            else:
                continue
            
            if other_user not in conversations or msg.get('created_at', '') > conversations[other_user].get('created_at', ''):
                msg['id'] = key
                msg['other_user_id'] = other_user
                conversations[other_user] = msg
        
        return list(conversations.values())
    
    def create(self, message_data: Dict) -> Optional[str]:
        """Create a new private message"""
        message_data['created_at'] = datetime.utcnow().isoformat()
        message_data['read'] = False
        return firebase_db.push("private_messages", message_data)
    
    def mark_as_read(self, message_id: str) -> bool:
        """Mark a message as read"""
        return firebase_db.update(f"private_messages/{message_id}", {"read": True})


class NotificationsRepository:
    """Manages user notifications"""
    
    def list_by_user(self, user_id: str, limit: Optional[int] = None) -> List[Dict]:
        """List notifications for a user"""
        all_notifications = firebase_db.get("notifications")
        if not all_notifications:
            return []
        
        user_notifications = []
        for key, notif in all_notifications.items():
            if notif.get('user_id') == user_id:
                notif['id'] = key
                user_notifications.append(notif)
        
        user_notifications.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        if limit:
            return user_notifications[:limit]
        return user_notifications
    
    def create(self, notification_data: Dict) -> Optional[str]:
        """Create a new notification"""
        notification_data['created_at'] = datetime.utcnow().isoformat()
        notification_data['read'] = False
        return firebase_db.push("notifications", notification_data)
    
    def mark_as_read(self, notification_id: str) -> bool:
        """Mark a notification as read"""
        return firebase_db.update(f"notifications/{notification_id}", {"read": True})
    
    def delete(self, notification_id: str) -> bool:
        """Delete a notification"""
        return firebase_db.delete(f"notifications/{notification_id}")


class PointsRepository:
    """Manages user points and rewards"""
    
    def get(self, user_id: str) -> Optional[Dict]:
        """Get points data for a user"""
        points = firebase_db.get(f"points/{user_id}")
        if not points:
            return {"user_id": user_id, "points": 0, "level": 1, "badges": []}
        return points
    
    def update(self, user_id: str, points_data: Dict) -> bool:
        """Update user points"""
        return firebase_db.update(f"points/{user_id}", points_data)
    
    def add_points(self, user_id: str, points: int, reason: str) -> bool:
        """Add points to a user"""
        current = self.get(user_id)
        new_points = current.get('points', 0) + points
        new_level = (new_points // 100) + 1
        
        update_data = {
            "points": new_points,
            "level": new_level,
            "last_points_added": points,
            "last_points_reason": reason,
            "updated_at": datetime.utcnow().isoformat()
        }
        return self.update(user_id, update_data)
    
    def add_badge(self, user_id: str, badge: str) -> bool:
        """Add a badge to a user"""
        current = self.get(user_id)
        badges = current.get('badges', [])
        if badge not in badges:
            badges.append(badge)
            return self.update(user_id, {"badges": badges})
        return True


class RoomsRepository:
    """Manages chat rooms/channels"""
    
    def get(self, room_id: str) -> Optional[Dict]:
        """Get room by room_id"""
        return firebase_db.get(f"rooms/{room_id}")
    
    def list_all(self) -> List[Dict]:
        """List all rooms"""
        rooms = firebase_db.get("rooms")
        if not rooms:
            return []
        
        room_list = []
        for key, room in rooms.items():
            room['id'] = key
            room_list.append(room)
        
        room_list.sort(key=lambda x: x.get('created_at', ''))
        return room_list
    
    def create(self, room_data: Dict) -> Optional[str]:
        """Create a new room"""
        room_data['created_at'] = datetime.utcnow().isoformat()
        room_data['member_count'] = 0
        return firebase_db.push("rooms", room_data)
    
    def update(self, room_id: str, data: Dict) -> bool:
        """Update room data"""
        return firebase_db.update(f"rooms/{room_id}", data)
    
    def delete(self, room_id: str) -> bool:
        """Delete a room"""
        return firebase_db.delete(f"rooms/{room_id}")
    
    def get_messages(self, room_id: str, limit: Optional[int] = None) -> List[Dict]:
        """Get messages for a specific room"""
        messages = firebase_db.get(f"room_messages/{room_id}")
        if not messages:
            return []
        
        message_list = []
        for key, msg in messages.items():
            msg['id'] = key
            message_list.append(msg)
        
        message_list.sort(key=lambda x: x.get('created_at', ''))
        
        if limit:
            return message_list[-limit:]
        return message_list
    
    def add_message(self, room_id: str, message_data: Dict) -> Optional[str]:
        """Add a message to a room"""
        message_data['created_at'] = datetime.utcnow().isoformat()
        return firebase_db.push(f"room_messages/{room_id}", message_data)


users_repo = UsersRepository()
messages_repo = MessagesRepository()
bans_repo = BansRepository()
mutes_repo = MutesRepository()
appeals_repo = AppealsRepository()
reports_repo = ReportsRepository()
files_repo = FilesRepository()
announcements_repo = AnnouncementsRepository()
settings_repo = SettingsRepository()
audit_log_repo = AuditLogRepository()
private_messages_repo = PrivateMessagesRepository()
notifications_repo = NotificationsRepository()
points_repo = PointsRepository()
rooms_repo = RoomsRepository()
