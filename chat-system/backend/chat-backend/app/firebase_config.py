import requests
import json
from typing import Any, Dict, Optional

FIREBASE_DB_URL = "https://team-page-app-c1667-default-rtdb.firebaseio.com"

class FirebaseDB:
    """Simple Firebase Realtime Database wrapper using REST API"""
    
    def __init__(self, base_url: str = FIREBASE_DB_URL):
        self.base_url = base_url.rstrip('/')
    
    def _get_url(self, path: str) -> str:
        """Construct full URL for a given path"""
        path = path.strip('/')
        return f"{self.base_url}/{path}.json" if path else f"{self.base_url}/.json"
    
    def get(self, path: str) -> Optional[Any]:
        """Get data from Firebase"""
        try:
            response = requests.get(self._get_url(path))
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Firebase GET error: {e}")
            return None
    
    def set(self, path: str, data: Any) -> bool:
        """Set data in Firebase (overwrites existing data)"""
        try:
            response = requests.put(self._get_url(path), json=data)
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"Firebase SET error: {e}")
            return False
    
    def push(self, path: str, data: Any) -> Optional[str]:
        """Push data to Firebase (creates new child with unique key)"""
        try:
            response = requests.post(self._get_url(path), json=data)
            response.raise_for_status()
            result = response.json()
            return result.get('name')  # Returns the generated key
        except Exception as e:
            print(f"Firebase PUSH error: {e}")
            return None
    
    def update(self, path: str, data: Dict) -> bool:
        """Update data in Firebase (merges with existing data)"""
        try:
            response = requests.patch(self._get_url(path), json=data)
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"Firebase UPDATE error: {e}")
            return False
    
    def delete(self, path: str) -> bool:
        """Delete data from Firebase"""
        try:
            response = requests.delete(self._get_url(path))
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"Firebase DELETE error: {e}")
            return False

firebase_db = FirebaseDB()
