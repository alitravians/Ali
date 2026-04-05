export interface ChatUser {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  role: string;
  roleLevel: number;
  roleDisplayName: string;
  roleColor: string;
  permissions: string[];
  status: 'ONLINE' | 'OFFLINE' | 'AWAY' | 'DO_NOT_DISTURB';
  lastActive?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  roomId: string;
  replyToId?: string;
  isEdited: boolean;
  isDeleted: boolean;
  isBold: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatar?: string;
    roleDisplayName: string;
    roleColor: string;
    roleLevel: number;
  };
  replyTo?: {
    id: string;
    content: string;
    user: { username: string };
  };
}

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: 'PUBLIC' | 'PRIVATE' | 'ANNOUNCEMENT';
  isPrivate: boolean;
  isFrozen: boolean;
  maxMembers?: number;
  sortOrder: number;
  memberCount: number;
  unreadCount?: number;
  lastMessage?: ChatMessage;
  onlineCount?: number;
}

export interface PunishmentInfo {
  id: string;
  type: 'mute' | 'ban' | 'warning';
  reason: string;
  duration?: number;
  startsAt: string;
  expiresAt?: string;
  issuedBy: string;
  issuerName: string;
}

export interface ServerToClientEvents {
  'message:new': (message: ChatMessage) => void;
  'message:edited': (data: { messageId: string; content: string; roomId: string }) => void;
  'message:deleted': (data: { messageId: string; roomId: string }) => void;
  'room:user_joined': (data: { roomId: string; user: ChatUser }) => void;
  'room:user_left': (data: { roomId: string; userId: string }) => void;
  'room:frozen': (data: { roomId: string; isFrozen: boolean }) => void;
  'room:updated': (data: { roomId: string; changes: Partial<ChatRoom> }) => void;
  'typing:update': (data: { roomId: string; userId: string; username: string; isTyping: boolean }) => void;
  'user:status': (data: { userId: string; status: string; lastActive?: string }) => void;
  'user:punished': (data: PunishmentInfo) => void;
  'user:unpunished': (data: { type: 'unmute' | 'unban'; userId: string }) => void;
  'notification:new': (data: { id: string; type: string; title: string; content?: string }) => void;
  'announcement:new': (data: { id: string; title: string; content: string }) => void;
  'chat:toggled': (data: { isOpen: boolean; reason?: string }) => void;
  'online:count': (data: { roomId: string; count: number }) => void;
  'error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  'message:send': (data: { content: string; roomId: string; replyToId?: string }) => void;
  'message:edit': (data: { messageId: string; content: string }) => void;
  'message:delete': (data: { messageId: string }) => void;
  'room:join': (data: { roomId: string }) => void;
  'room:leave': (data: { roomId: string }) => void;
  'typing:start': (data: { roomId: string }) => void;
  'typing:stop': (data: { roomId: string }) => void;
}
