import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { AutoReplyRule, LogEntry, AppSettings, NotificationItem, DEFAULT_SETTINGS } from '../types';
import * as storage from '../store/storage';

interface AppContextType {
  rules: AutoReplyRule[];
  logs: LogEntry[];
  settings: AppSettings;
  notifications: NotificationItem[];
  unreadCount: number;
  addRule: (rule: AutoReplyRule) => void;
  updateRule: (rule: AutoReplyRule) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  updateSettings: (settings: AppSettings) => void;
  addNotification: (notification: NotificationItem) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const refreshData = useCallback(() => {
    setRules(storage.getRules());
    setLogs(storage.getLogs());
    setSettings(storage.getSettings());
    setNotifications(storage.getNotifications());
  }, []);

  useEffect(() => {
    storage.loadDemoData();
    refreshData();
  }, [refreshData]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleAddRule = useCallback((rule: AutoReplyRule) => {
    storage.addRule(rule);
    setRules(storage.getRules());
  }, []);

  const handleUpdateRule = useCallback((rule: AutoReplyRule) => {
    storage.updateRule(rule);
    setRules(storage.getRules());
  }, []);

  const handleDeleteRule = useCallback((id: string) => {
    storage.deleteRule(id);
    setRules(storage.getRules());
  }, []);

  const handleToggleRule = useCallback((id: string) => {
    storage.toggleRule(id);
    setRules(storage.getRules());
  }, []);

  const handleAddLog = useCallback((log: LogEntry) => {
    storage.addLog(log);
    setLogs(storage.getLogs());
  }, []);

  const handleClearLogs = useCallback(() => {
    storage.clearLogs();
    setLogs([]);
  }, []);

  const handleUpdateSettings = useCallback((newSettings: AppSettings) => {
    storage.saveSettings(newSettings);
    setSettings(newSettings);
  }, []);

  const handleAddNotification = useCallback((notification: NotificationItem) => {
    storage.addNotification(notification);
    setNotifications(storage.getNotifications());
  }, []);

  const handleMarkNotificationRead = useCallback((id: string) => {
    storage.markNotificationRead(id);
    setNotifications(storage.getNotifications());
  }, []);

  const handleMarkAllNotificationsRead = useCallback(() => {
    storage.markAllNotificationsRead();
    setNotifications(storage.getNotifications());
  }, []);

  const handleClearNotifications = useCallback(() => {
    storage.clearNotifications();
    setNotifications([]);
  }, []);

  return (
    <AppContext.Provider
      value={{
        rules,
        logs,
        settings,
        notifications,
        unreadCount,
        addRule: handleAddRule,
        updateRule: handleUpdateRule,
        deleteRule: handleDeleteRule,
        toggleRule: handleToggleRule,
        addLog: handleAddLog,
        clearLogs: handleClearLogs,
        updateSettings: handleUpdateSettings,
        addNotification: handleAddNotification,
        markNotificationRead: handleMarkNotificationRead,
        markAllNotificationsRead: handleMarkAllNotificationsRead,
        clearNotifications: handleClearNotifications,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
