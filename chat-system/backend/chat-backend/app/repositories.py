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


users_repo = UsersRepository()
messages_repo = MessagesRepository()
bans_repo = BansRepository()
mutes_repo = MutesRepository()
appeals_repo = AppealsRepository()
reports_repo = ReportsRepository()
files_repo = FilesRepository()
announcements_repo = AnnouncementsRepository()
settings_repo = SettingsRepository()
