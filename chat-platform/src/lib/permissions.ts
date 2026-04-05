export const PERMISSIONS = {
  // Chat
  SEND_MESSAGE: 'send_message',
  EDIT_OWN_MESSAGE: 'edit_own_message',
  DELETE_OWN_MESSAGE: 'delete_own_message',
  REPLY_TO_MESSAGE: 'reply_to_message',
  SEND_BOLD_MESSAGE: 'send_bold_message',

  // Rooms
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  CREATE_ROOM: 'create_room',
  EDIT_ROOM: 'edit_room',
  DELETE_ROOM: 'delete_room',
  FREEZE_ROOM: 'freeze_room',

  // Moderation
  DELETE_ANY_MESSAGE: 'delete_any_message',
  MUTE_USER: 'mute_user',
  WARN_USER: 'warn_user',
  TEMP_BAN: 'temp_ban',
  VIEW_REPORTS: 'view_reports',
  HANDLE_REPORTS: 'handle_reports',
  ESCALATE_REPORT: 'escalate_report',

  // Admin
  MANAGE_ROLES: 'manage_roles',
  MANAGE_PERMISSIONS: 'manage_permissions',
  MANAGE_USERS: 'manage_users',
  MANAGE_ROOMS: 'manage_rooms',
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_AUDIT_LOG: 'view_audit_log',
  SEND_ANNOUNCEMENT: 'send_announcement',
  TOGGLE_CHAT: 'toggle_chat',
  PERMANENT_BAN: 'permanent_ban',
  MANAGE_MODERATORS: 'manage_moderators',
  VIEW_STATS: 'view_stats',
  SEND_ADMIN_NOTES: 'send_admin_notes',
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const DEFAULT_ROLES = [
  {
    name: 'owner',
    displayName: 'المالك',
    level: 100,
    color: '#FFD700',
    isSystem: true,
    permissions: Object.values(PERMISSIONS),
  },
  {
    name: 'admin',
    displayName: 'مدير',
    level: 90,
    color: '#FF4444',
    isSystem: true,
    permissions: Object.values(PERMISSIONS),
  },
  {
    name: 'head_moderator',
    displayName: 'رئيس المشرفين',
    level: 70,
    color: '#FF8800',
    isSystem: true,
    permissions: [
      PERMISSIONS.SEND_MESSAGE, PERMISSIONS.EDIT_OWN_MESSAGE, PERMISSIONS.DELETE_OWN_MESSAGE,
      PERMISSIONS.REPLY_TO_MESSAGE, PERMISSIONS.SEND_BOLD_MESSAGE, PERMISSIONS.JOIN_ROOM,
      PERMISSIONS.LEAVE_ROOM, PERMISSIONS.FREEZE_ROOM, PERMISSIONS.DELETE_ANY_MESSAGE,
      PERMISSIONS.MUTE_USER, PERMISSIONS.WARN_USER, PERMISSIONS.TEMP_BAN,
      PERMISSIONS.VIEW_REPORTS, PERMISSIONS.HANDLE_REPORTS, PERMISSIONS.ESCALATE_REPORT,
      PERMISSIONS.VIEW_AUDIT_LOG,
    ],
  },
  {
    name: 'moderator',
    displayName: 'مشرف',
    level: 50,
    color: '#00AA00',
    isSystem: true,
    permissions: [
      PERMISSIONS.SEND_MESSAGE, PERMISSIONS.EDIT_OWN_MESSAGE, PERMISSIONS.DELETE_OWN_MESSAGE,
      PERMISSIONS.REPLY_TO_MESSAGE, PERMISSIONS.SEND_BOLD_MESSAGE, PERMISSIONS.JOIN_ROOM,
      PERMISSIONS.LEAVE_ROOM, PERMISSIONS.DELETE_ANY_MESSAGE, PERMISSIONS.MUTE_USER,
      PERMISSIONS.WARN_USER, PERMISSIONS.TEMP_BAN, PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.HANDLE_REPORTS, PERMISSIONS.ESCALATE_REPORT,
    ],
  },
  {
    name: 'helper',
    displayName: 'مساعد مشرف',
    level: 30,
    color: '#00CCCC',
    isSystem: true,
    permissions: [
      PERMISSIONS.SEND_MESSAGE, PERMISSIONS.EDIT_OWN_MESSAGE, PERMISSIONS.DELETE_OWN_MESSAGE,
      PERMISSIONS.REPLY_TO_MESSAGE, PERMISSIONS.SEND_BOLD_MESSAGE, PERMISSIONS.JOIN_ROOM,
      PERMISSIONS.LEAVE_ROOM, PERMISSIONS.DELETE_ANY_MESSAGE, PERMISSIONS.WARN_USER,
      PERMISSIONS.VIEW_REPORTS,
    ],
  },
  {
    name: 'member',
    displayName: 'عضو',
    level: 10,
    color: '#808080',
    isDefault: true,
    isSystem: true,
    permissions: [
      PERMISSIONS.SEND_MESSAGE, PERMISSIONS.EDIT_OWN_MESSAGE, PERMISSIONS.DELETE_OWN_MESSAGE,
      PERMISSIONS.REPLY_TO_MESSAGE, PERMISSIONS.JOIN_ROOM, PERMISSIONS.LEAVE_ROOM,
    ],
  },
  {
    name: 'muted',
    displayName: 'مكتوم',
    level: 5,
    color: '#999999',
    isSystem: true,
    permissions: [PERMISSIONS.JOIN_ROOM, PERMISSIONS.LEAVE_ROOM],
  },
  {
    name: 'banned',
    displayName: 'محظور',
    level: 0,
    color: '#333333',
    isSystem: true,
    permissions: [],
  },
];

export function canPerformAction(userLevel: number, targetLevel: number): boolean {
  return userLevel > targetLevel;
}

export function getRoleBadge(roleName: string): string {
  const badges: Record<string, string> = {
    owner: 'المالك',
    admin: 'مدير',
    head_moderator: 'رئيس المشرفين',
    moderator: 'مشرف',
    helper: 'مساعد',
    member: 'عضو',
    muted: 'مكتوم',
    banned: 'محظور',
  };
  return badges[roleName] || roleName;
}

export function isModeratorOrAbove(level: number): boolean {
  return level >= 50;
}

export function isAdminOrAbove(level: number): boolean {
  return level >= 90;
}
