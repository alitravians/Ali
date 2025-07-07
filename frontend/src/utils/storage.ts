export class StorageManager {
  private static instance: StorageManager;
  private dbName = 'ChatSystemDB';
  private dbVersion = 2;
  private db: IDBDatabase | null = null;

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.warn('IndexedDB failed, falling back to localStorage');
        resolve();
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('messages')) {
          db.createObjectStore('messages', { keyPath: 'message_id' });
        }
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'user_id' });
        }
        if (!db.objectStoreNames.contains('notifications')) {
          db.createObjectStore('notifications', { keyPath: 'notification_id' });
        }
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('reports')) {
          db.createObjectStore('reports', { keyPath: 'report_id' });
        }
      };
    });
  }

  setSecureItem(key: string, value: any): void {
    try {
      const compressed = this.compressData(value);
      
      if (this.isLocalStorageAvailable()) {
        localStorage.setItem(`chat_${key}`, compressed);
      }
      
      if (this.isSessionStorageAvailable()) {
        sessionStorage.setItem(`chat_session_${key}`, compressed);
      }
      
      this.setCookie(`cookie_${key}`, compressed, 7);
    } catch (error) {
      console.error('Storage error:', error);
    }
  }

  getSecureItem(key: string): any {
    try {
      if (this.isLocalStorageAvailable()) {
        const item = localStorage.getItem(`chat_${key}`);
        if (item) {
          return this.decompressData(item);
        }
      }
      
      if (this.isSessionStorageAvailable()) {
        const sessionItem = sessionStorage.getItem(`chat_session_${key}`);
        if (sessionItem) {
          return this.decompressData(sessionItem);
        }
      }
      
      const cookieData = this.getCookie(`cookie_${key}`);
      if (cookieData) {
        return this.decompressData(cookieData);
      }
      
      return null;
    } catch (error) {
      console.error('Storage retrieval error:', error);
      return null;
    }
  }

  async storeInIndexedDB(storeName: string, data: any): Promise<void> {
    if (!this.db) {
      console.warn('IndexedDB not available, using localStorage fallback');
      this.setSecureItem(`idb_${storeName}_${data.id || data.user_id || data.message_id || Date.now()}`, data);
      return;
    }
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        
        request.onerror = () => {
          console.warn('IndexedDB store failed, using localStorage fallback');
          this.setSecureItem(`idb_${storeName}_${data.id || data.user_id || data.message_id || Date.now()}`, data);
          resolve();
        };
        request.onsuccess = () => resolve();
      } catch (error) {
        console.warn('IndexedDB transaction failed, using localStorage fallback');
        this.setSecureItem(`idb_${storeName}_${data.id || data.user_id || data.message_id || Date.now()}`, data);
        resolve();
      }
    });
  }

  async getFromIndexedDB(storeName: string, key: string): Promise<any> {
    if (!this.db) {
      return this.getSecureItem(`idb_${storeName}_${key}`);
    }
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        
        request.onerror = () => {
          const fallback = this.getSecureItem(`idb_${storeName}_${key}`);
          resolve(fallback);
        };
        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            const fallback = this.getSecureItem(`idb_${storeName}_${key}`);
            resolve(fallback);
          } else {
            resolve(result);
          }
        };
      } catch (error) {
        const fallback = this.getSecureItem(`idb_${storeName}_${key}`);
        resolve(fallback);
      }
    });
  }

  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private isSessionStorageAvailable(): boolean {
    try {
      const test = '__session_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private setCookie(name: string, value: string, days: number): void {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
    } catch (error) {
      console.warn('Failed to set cookie:', error);
    }
  }

  private getCookie(name: string): string | null {
    try {
      const nameEQ = name + "=";
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    } catch (error) {
      console.warn('Failed to get cookie:', error);
      return null;
    }
  }

  private compressData(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      if (typeof btoa !== 'undefined') {
        return btoa(jsonString);
      }
      return jsonString;
    } catch (error) {
      return JSON.stringify(data);
    }
  }

  private decompressData(data: string): any {
    try {
      if (typeof atob !== 'undefined') {
        try {
          return JSON.parse(atob(data));
        } catch {
          return JSON.parse(data);
        }
      }
      return JSON.parse(data);
    } catch (error) {
      console.warn('Failed to decompress data:', error);
      return null;
    }
  }

  clearCache(): void {
    try {
      if (this.isLocalStorageAvailable()) {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('chat_') || key.startsWith('idb_')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      if (this.isSessionStorageAvailable()) {
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('chat_session_')) {
            sessionStorage.removeItem(key);
          }
        });
      }
      
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.startsWith('cookie_')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async syncData(): Promise<void> {
    try {
      const userData = this.getSecureItem('user');
      if (userData) {
        await this.storeInIndexedDB('users', userData);
      }
      
      const token = this.getSecureItem('token');
      if (token) {
        await this.storeInIndexedDB('cache', { key: 'auth_token', value: token, timestamp: Date.now() });
      }
    } catch (error) {
      console.error('Data sync error:', error);
    }
  }

  async invalidateCache(key?: string): Promise<void> {
    try {
      if (key) {
        this.setSecureItem(`${key}_invalidated`, true);
        if (this.isLocalStorageAvailable()) {
          localStorage.removeItem(`chat_${key}`);
        }
        if (this.isSessionStorageAvailable()) {
          sessionStorage.removeItem(`chat_session_${key}`);
        }
      } else {
        this.clearCache();
      }
    } catch (error) {
      console.warn('Failed to invalidate cache:', error);
    }
  }
}

export const storageManager = StorageManager.getInstance();
