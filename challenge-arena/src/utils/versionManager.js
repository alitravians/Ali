
const CURRENT_VERSION = '2025.11.05.4';
const VERSION_KEY = 'app_version';
const LAST_CHECK_KEY = 'last_version_check';

export const versionManager = {
  getCurrentVersion() {
    return CURRENT_VERSION;
  },

  getStoredVersion() {
    return localStorage.getItem(VERSION_KEY);
  },

  updateStoredVersion() {
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
  },

  needsUpdate() {
    const storedVersion = this.getStoredVersion();
    return !storedVersion || storedVersion !== CURRENT_VERSION;
  },

  clearCacheAndReload() {
    try {
      const importantKeys = ['currentPage'];
      const backup = {};
      
      importantKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) backup[key] = value;
      });

      localStorage.clear();

      Object.keys(backup).forEach(key => {
        localStorage.setItem(key, backup[key]);
      });

      this.updateStoredVersion();

      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }

      window.location.reload(true);
      
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  },

  softRefresh() {
    this.updateStoredVersion();
    window.location.reload();
  },

  getVersionInfo() {
    return {
      current: CURRENT_VERSION,
      stored: this.getStoredVersion(),
      needsUpdate: this.needsUpdate(),
      lastCheck: localStorage.getItem(LAST_CHECK_KEY)
    };
  },

  initialize() {
    const versionInfo = this.getVersionInfo();
    
    if (versionInfo.needsUpdate) {
      console.log('New version detected:', versionInfo.current);
      this.updateStoredVersion();
    }
    
    return versionInfo;
  }
};

export default versionManager;
