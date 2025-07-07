export class StorageManager {
  private static instance: StorageManager;
  private dbName = 'ChatSystemDB';
  private dbVersion = 1;
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
      
      request.onerror = () => reject(request.error);
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
      };
    });
  }

  setSecureItem(key: string, value: any): void {
    try {
      const compressed = JSON.stringify(value);
      localStorage.setItem(`chat_${key}`, compressed);
      sessionStorage.setItem(`chat_session_${key}`, compressed);
    } catch (error) {
      console.error('Storage error:', error);
    }
  }

  getSecureItem(key: string): any {
    try {
      const item = localStorage.getItem(`chat_${key}`) || sessionStorage.getItem(`chat_session_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Storage retrieval error:', error);
      return null;
    }
  }

  async storeInIndexedDB(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getFromIndexedDB(storeName: string, key: string): Promise<any> {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  clearCache(): void {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('chat_')) {
          localStorage.removeItem(key);
        }
      });
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('chat_session_')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async syncData(): Promise<void> {
    try {
      const localData = this.getSecureItem('user_data');
      if (localData) {
        await this.storeInIndexedDB('cache', {
          key: 'user_data',
          value: localData,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Data sync error:', error);
    }
  }
}

export const storageManager = StorageManager.getInstance();
