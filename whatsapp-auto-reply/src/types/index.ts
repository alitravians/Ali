export interface AutoReplyRule {
  id: string;
  keywords: string[];
  replies: string[];
  matchType: 'exact' | 'fuzzy';
  isEnabled: boolean;
  delaySeconds: number;
  scheduleEnabled: boolean;
  scheduleFrom: string;
  scheduleTo: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export interface LogEntry {
  id: string;
  ruleId: string;
  ruleName: string;
  incomingMessage: string;
  sentReply: string;
  senderNumber: string;
  timestamp: string;
  status: 'success' | 'failed';
  errorMessage?: string;
}

export interface AppSettings {
  isServiceEnabled: boolean;
  scheduleEnabled: boolean;
  scheduleFrom: string;
  scheduleTo: string;
  excludedNumbers: string[];
  replyTarget: 'all' | 'unsaved' | 'saved';
  darkMode: boolean;
  notifyOnMatch: boolean;
  notifyOnFailure: boolean;
  notifyOnServiceStop: boolean;
}

export interface NotificationItem {
  id: string;
  type: 'match' | 'failure' | 'service' | 'permission';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface DashboardStats {
  totalReplies: number;
  activeRules: number;
  totalRules: number;
  successRate: number;
  todayReplies: number;
  weeklyData: { day: string; count: number }[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  isServiceEnabled: false,
  scheduleEnabled: false,
  scheduleFrom: '09:00',
  scheduleTo: '22:00',
  excludedNumbers: [],
  replyTarget: 'all',
  darkMode: true,
  notifyOnMatch: true,
  notifyOnFailure: true,
  notifyOnServiceStop: true,
};
