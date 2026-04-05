import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { decode } from 'next-auth/jwt';
import type { ClientToServerEvents, ServerToClientEvents, PresenceUser } from './src/types/chat';
import { filterMessage, checkSpam, processBoldMessage, getBannedWords } from './src/lib/chat-utils';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const prisma = new PrismaClient();

// ==================== Presence System ====================
// Track online users: userId -> Set<socketId>
const onlineUsers = new Map<string, Set<string>>();
// Track socket to user mapping with full presence info
const socketToUser = new Map<string, {
  userId: string;
  username: string;
  roleLevel: number;
  roleDisplayName: string;
  roleColor: string;
  avatar?: string;
  currentRoomId?: string;
}>();
// Track which room each socket is in
const socketRooms = new Map<string, string>();
// Track typing users per room
const typingUsers = new Map<string, Map<string, { username: string; timeout: NodeJS.Timeout }>>();

/** Build a PresenceUser from stored socket info */
function buildPresenceUser(socketInfo: {
  userId: string;
  username: string;
  roleLevel: number;
  roleDisplayName: string;
  roleColor: string;
  avatar?: string;
  currentRoomId?: string;
}, typingRoomId?: string): PresenceUser {
  let status: 'ONLINE' | 'IN_ROOM' | 'TYPING' | 'OFFLINE' = 'ONLINE';
  if (typingRoomId) {
    // Check if this user is currently typing in any room
    for (const [, roomTyping] of typingUsers) {
      if (roomTyping.has(socketInfo.userId)) {
        status = 'TYPING';
        break;
      }
    }
  }
  if (status !== 'TYPING' && socketInfo.currentRoomId) {
    status = 'IN_ROOM';
  }
  return {
    id: socketInfo.userId,
    username: socketInfo.username,
    avatar: socketInfo.avatar,
    roleLevel: socketInfo.roleLevel,
    roleDisplayName: socketInfo.roleDisplayName,
    roleColor: socketInfo.roleColor,
    status,
    currentRoomId: socketInfo.currentRoomId,
  };
}

/** Get all online presence users sorted by role level desc */
function getAllPresenceUsers(): PresenceUser[] {
  const seenUsers = new Map<string, PresenceUser>();
  for (const [, info] of socketToUser) {
    if (!seenUsers.has(info.userId)) {
      seenUsers.set(info.userId, buildPresenceUser(info, 'check'));
    }
  }
  // Sort by roleLevel desc, then by username
  return Array.from(seenUsers.values()).sort((a, b) => {
    if (b.roleLevel !== a.roleLevel) return b.roleLevel - a.roleLevel;
    return a.username.localeCompare(b.username);
  });
}

/** Get room online counts */
function getRoomCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  const roomUsers = new Map<string, Set<string>>();
  for (const [, info] of socketToUser) {
    if (info.currentRoomId) {
      if (!roomUsers.has(info.currentRoomId)) {
        roomUsers.set(info.currentRoomId, new Set());
      }
      roomUsers.get(info.currentRoomId)!.add(info.userId);
    }
  }
  for (const [roomId, users] of roomUsers) {
    counts[roomId] = users.size;
  }
  return counts;
}

/** Broadcast presence counts to all connected clients */
function broadcastPresenceCounts(io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>) {
  const roomCounts = getRoomCounts();
  const totalOnline = onlineUsers.size;
  io.emit('presence:room_counts', { roomCounts, totalOnline });
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: dev ? '*' : ['https://chatzone-platform.fly.dev'], methods: ['GET', 'POST'], credentials: true },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Socket.IO middleware: verify NextAuth JWT before allowing connection
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || '';
      // Parse the next-auth session token from cookies
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => {
          const [key, ...vals] = c.trim().split('=');
          return [key, vals.join('=')];
        })
      );
      const sessionToken = cookies['next-auth.session-token'] || cookies['__Secure-next-auth.session-token'];
      if (!sessionToken) {
        return next(new Error('غير مصرح: لا يوجد رمز جلسة'));
      }
      const secret = process.env.NEXTAUTH_SECRET;
      if (!secret) {
        return next(new Error('خطأ في إعدادات السيرفر'));
      }
      const token = await decode({ token: sessionToken, secret });
      if (!token || !token.sub) {
        return next(new Error('غير مصرح: رمز الجلسة غير صالح'));
      }
      // Attach verified userId to socket data for use in connection handler
      (socket as any).verifiedUserId = token.sub;
      next();
    } catch {
      next(new Error('غير مصرح: فشل التحقق من الجلسة'));
    }
  });

  io.on('connection', async (socket) => {
    // Use verified userId from JWT instead of trusting client-provided data
    const verifiedUserId = (socket as any).verifiedUserId as string;
    if (!verifiedUserId) {
      socket.disconnect();
      return;
    }

    // Server-side verification: look up user and role from database using verified identity
    const dbUser = await prisma.user.findUnique({
      where: { id: verifiedUserId },
      include: { userRoles: { include: { role: true } } },
    });

    if (!dbUser) {
      socket.disconnect();
      return;
    }

    // Check if user is banned — prevent banned users from connecting
    const activeBan = await prisma.ban.findFirst({
      where: { userId: verifiedUserId, isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    });
    if (activeBan) {
      socket.emit('error', { message: 'أنت محظور من الدردشة' });
      socket.disconnect();
      return;
    }

    const highestUserRole = dbUser.userRoles.reduce(
      (h, ur) => (ur.role.level > h.level ? ur.role : h),
      { level: 0, name: 'member', displayName: 'عضو', color: '#808080' }
    );

    const userId = dbUser.id;
    const username = dbUser.username;
    let roleLevel = highestUserRole.level;

    // Refresh role level from DB (called before authorization-sensitive operations)
    let lastRoleRefresh = Date.now();
    const ROLE_REFRESH_INTERVAL = 60_000; // 1 minute
    async function refreshRoleLevel(): Promise<number> {
      if (Date.now() - lastRoleRefresh < ROLE_REFRESH_INTERVAL) return roleLevel;
      try {
        const freshUser = await prisma.user.findUnique({
          where: { id: userId },
          include: { userRoles: { include: { role: true } } },
        });
        if (freshUser) {
          const freshRole = freshUser.userRoles.reduce(
            (h, ur) => (ur.role.level > h.level ? ur.role : h),
            { level: 0, name: 'member', displayName: 'عضو', color: '#808080' }
          );
          roleLevel = freshRole.level;
          // Also update socketInfo
          socketInfo.roleLevel = freshRole.level;
          socketInfo.roleDisplayName = freshRole.displayName;
          socketInfo.roleColor = freshRole.color;
        }
        lastRoleRefresh = Date.now();
      } catch (e) {
        console.error('Role refresh error:', e);
      }
      return roleLevel;
    }

    const socketInfo = {
      userId,
      username,
      roleLevel,
      roleDisplayName: highestUserRole.displayName,
      roleColor: highestUserRole.color,
      avatar: dbUser.avatar || undefined,
      currentRoomId: undefined as string | undefined,
    };

    // Track online status
    const isNewUser = !onlineUsers.has(userId);
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);
    socketToUser.set(socket.id, socketInfo);

    // Update user status in DB
    prisma.user.update({
      where: { id: userId },
      data: { status: 'ONLINE', lastActive: new Date() },
    }).catch(console.error);

    // Broadcast online status
    io.emit('user:status', { userId, status: 'ONLINE' });

    // If new user coming online, broadcast presence join
    if (isNewUser) {
      const presenceUser = buildPresenceUser(socketInfo);
      io.emit('presence:join', { user: presenceUser });
      broadcastPresenceCounts(io);
    }

    // Auto-send full presence list to the connecting socket
    // This fixes the race condition where client emits presence:request
    // before the server finishes async connection setup
    {
      const users = getAllPresenceUsers();
      const roomCounts = getRoomCounts();
      socket.emit('presence:full', {
        users,
        totalOnline: onlineUsers.size,
        roomCounts,
      });
    }

    // Client requests full presence list (for manual refresh)
    socket.on('presence:request', () => {
      const users = getAllPresenceUsers();
      const roomCounts = getRoomCounts();
      socket.emit('presence:full', {
        users,
        totalOnline: onlineUsers.size,
        roomCounts,
      });
    });

    // Join room
    socket.on('room:join', async ({ roomId }) => {
      // Refresh role level for authorization checks
      await refreshRoleLevel();

      // Check if room exists and enforce private room access control
      const room = await prisma.room.findUnique({ where: { id: roomId } });
      if (!room) {
        socket.emit('error', { message: 'الغرفة غير موجودة' });
        return;
      }
      if (room.isPrivate || room.type === 'PRIVATE') {
        const isMember = await prisma.roomMember.findUnique({
          where: { userId_roomId: { userId, roomId } },
        });
        if (!isMember && roleLevel < 50) {
          socket.emit('error', { message: 'هذه الغرفة خاصة' });
          return;
        }
      }

      // Leave previous room if any
      const prevRoom = socketRooms.get(socket.id);
      if (prevRoom && prevRoom !== roomId) {
        // Clean up typing state for the previous room
        const prevRoomTyping = typingUsers.get(prevRoom);
        if (prevRoomTyping) {
          const existingTyping = prevRoomTyping.get(userId);
          if (existingTyping) clearTimeout(existingTyping.timeout);
          prevRoomTyping.delete(userId);
          io.to(`room:${prevRoom}`).emit('typing:update', { roomId: prevRoom, userId, username, isTyping: false });
        }
        socket.leave(`room:${prevRoom}`);
        io.to(`room:${prevRoom}`).emit('room:user_left', { roomId: prevRoom, userId });
      }

      socket.join(`room:${roomId}`);
      socketRooms.set(socket.id, roomId);

      // Update socket info
      const info = socketToUser.get(socket.id);
      if (info) {
        info.currentRoomId = roomId;
      }

      // Ensure membership
      await prisma.roomMember.upsert({
        where: { userId_roomId: { userId, roomId } },
        create: { userId, roomId },
        update: {},
      }).catch(console.error);

      // Notify room
      io.to(`room:${roomId}`).emit('room:user_joined', {
        roomId,
        user: {
          id: userId,
          username,
          status: 'ONLINE',
          role: '',
          roleLevel: socketInfo.roleLevel,
          roleDisplayName: socketInfo.roleDisplayName,
          roleColor: socketInfo.roleColor,
          permissions: [],
        },
      });

      // Send online count for this room
      const roomSockets = await io.in(`room:${roomId}`).fetchSockets();
      const uniqueUsers = new Set(roomSockets.map(s => socketToUser.get(s.id)?.userId).filter(Boolean));
      io.to(`room:${roomId}`).emit('online:count', { roomId, count: uniqueUsers.size });

      // Broadcast presence update
      io.emit('presence:update', { userId, status: 'IN_ROOM', currentRoomId: roomId });
      broadcastPresenceCounts(io);
    });

    // Leave room
    socket.on('room:leave', ({ roomId }) => {
      const actualRoom = socketRooms.get(socket.id);
      if (actualRoom !== roomId) return; // Ignore if not in this room

      // Clean up typing state for this room
      const roomTyping = typingUsers.get(roomId);
      if (roomTyping) {
        const existingTyping = roomTyping.get(userId);
        if (existingTyping) clearTimeout(existingTyping.timeout);
        roomTyping.delete(userId);
        io.to(`room:${roomId}`).emit('typing:update', { roomId, userId, username, isTyping: false });
      }

      socket.leave(`room:${roomId}`);
      socketRooms.delete(socket.id);

      const info = socketToUser.get(socket.id);
      if (info) {
        info.currentRoomId = undefined;
      }

      io.to(`room:${roomId}`).emit('room:user_left', { roomId, userId });
      io.emit('presence:update', { userId, status: 'ONLINE', currentRoomId: undefined });
      broadcastPresenceCounts(io);
    });

    // Send message
    socket.on('message:send', async ({ content, roomId, replyToId }) => {
      try {
        // Verify user has joined this room via room:join
        if (socketRooms.get(socket.id) !== roomId) {
          socket.emit('error', { message: 'يجب الانضمام للغرفة أولاً' });
          return;
        }

        // Reject empty messages
        if (!content || !content.trim()) {
          socket.emit('error', { message: 'لا يمكن إرسال رسالة فارغة' });
          return;
        }

        // Spam check first (in-memory, no DB) to prevent DB DoS
        if (checkSpam(userId)) {
          socket.emit('error', { message: 'أنت ترسل رسائل بسرعة كبيرة. انتظر قليلاً' });
          return;
        }

        // Enforce message length limit (cheap check before DB queries)
        if (content.length > 5000) {
          socket.emit('error', { message: 'الرسالة طويلة جداً' });
          return;
        }

        // Refresh role level for authorization checks
        await refreshRoleLevel();

        // Enforce configurable message length limit
        const maxLenSetting = await prisma.siteSetting.findUnique({ where: { key: 'max_message_length' } });
        const maxLen = parseInt(maxLenSetting?.value || '2000', 10);
        if (content.length > maxLen) {
          socket.emit('error', { message: 'الرسالة طويلة جداً' });
          return;
        }

        // Check if chat is open
        const chatSetting = await prisma.siteSetting.findUnique({ where: { key: 'chat_enabled' } });
        if (chatSetting && chatSetting.value === 'false') {
          socket.emit('error', { message: 'الدردشة مغلقة حالياً' });
          return;
        }

        // Check room frozen
        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (!room) { socket.emit('error', { message: 'الغرفة غير موجودة' }); return; }
        if (room.isFrozen && roleLevel < 50) {
          socket.emit('error', { message: 'الغرفة مجمدة حالياً' });
          return;
        }

        // Check private room access
        if (room.isPrivate || room.type === 'PRIVATE') {
          const isMember = await prisma.roomMember.findUnique({
            where: { userId_roomId: { userId, roomId } },
          });
          if (!isMember && roleLevel < 50) {
            socket.emit('error', { message: 'هذه الغرفة خاصة' });
            return;
          }
        }

        // Check announcement room - only mods and above can send
        if (room.type === 'ANNOUNCEMENT' && roleLevel < 50) {
          socket.emit('error', { message: 'غرفة الإعلانات مخصصة للإدارة فقط' });
          return;
        }

        // Check mute
        const activeMute = await prisma.mute.findFirst({
          where: { userId, isActive: true, expiresAt: { gt: new Date() } },
        });
        if (activeMute) {
          socket.emit('error', { message: `أنت مكتوم حتى ${activeMute.expiresAt.toISOString()} – السبب: ${activeMute.reason}` });
          return;
        }

        // Check ban
        const activeBan = await prisma.ban.findFirst({
          where: { userId, isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        });
        if (activeBan) {
          socket.emit('error', { message: 'أنت محظور من الدردشة' });
          return;
        }

        // Process bold ($) for mods/admins
        const { text, isBold } = processBoldMessage(content, roleLevel >= 50);

        // Reject empty messages
        if (!text.trim()) {
          socket.emit('error', { message: 'لا يمكن إرسال رسالة فارغة' });
          return;
        }

        // Word filter
        const bannedWords = await getBannedWords();
        const { filtered } = filterMessage(text, bannedWords);

        // Get user info for message
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            userRoles: { include: { role: true } },
          },
        });

        const highestRole = user?.userRoles.reduce(
          (h, ur) => (ur.role.level > h.level ? ur.role : h),
          { level: 0, name: 'member', displayName: 'عضو', color: '#808080' }
        ) || { level: 0, name: 'member', displayName: 'عضو', color: '#808080' };

        // Validate replyToId belongs to same room and isn't deleted
        let validReplyToId = replyToId || null;
        if (validReplyToId) {
          const replyTarget = await prisma.message.findUnique({
            where: { id: validReplyToId },
            select: { roomId: true, isDeleted: true },
          });
          if (!replyTarget || replyTarget.roomId !== roomId || replyTarget.isDeleted) {
            validReplyToId = null;
          }
        }

        // Save message
        const message = await prisma.message.create({
          data: {
            content: filtered,
            userId,
            roomId,
            replyToId: validReplyToId,
            isBold,
          },
          include: {
            user: { select: { id: true, username: true, displayName: true, avatar: true } },
            replyTo: {
              select: { id: true, content: true, user: { select: { username: true } } },
            },
          },
        });

        // Broadcast message
        io.to(`room:${roomId}`).emit('message:new', {
          id: message.id,
          content: message.content,
          userId: message.userId,
          roomId: message.roomId,
          replyToId: message.replyToId || undefined,
          isEdited: false,
          isDeleted: false,
          isBold: message.isBold,
          createdAt: message.createdAt.toISOString(),
          user: {
            id: message.user.id,
            username: message.user.username,
            displayName: message.user.displayName || undefined,
            avatar: message.user.avatar || undefined,
            roleDisplayName: highestRole.displayName,
            roleColor: highestRole.color,
            roleLevel: highestRole.level,
          },
          replyTo: message.replyTo
            ? { id: message.replyTo.id, content: message.replyTo.content, user: { username: message.replyTo.user.username } }
            : undefined,
        });
      } catch (error) {
        console.error('Message send error:', error);
        socket.emit('error', { message: 'فشل إرسال الرسالة' });
      }
    });

    // Edit message
    socket.on('message:edit', async ({ messageId, content }) => {
      try {
        // Refresh role level for authorization checks
        await refreshRoleLevel();

        // Reject empty content
        if (!content || !content.trim()) {
          socket.emit('error', { message: 'لا يمكن إرسال رسالة فارغة' });
          return;
        }

        // Enforce message length limit
        if (content.length > 5000) {
          socket.emit('error', { message: 'الرسالة طويلة جداً' });
          return;
        }

        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message || message.isDeleted) return;
        if (message.userId !== userId && roleLevel < 90) {
          socket.emit('error', { message: 'لا تملك صلاحية تعديل هذه الرسالة' });
          return;
        }

        // Check if chat is open
        const chatSetting = await prisma.siteSetting.findUnique({ where: { key: 'chat_enabled' } });
        if (chatSetting && chatSetting.value === 'false') {
          socket.emit('error', { message: 'الدردشة مغلقة حالياً' });
          return;
        }

        // Check room frozen
        const room = await prisma.room.findUnique({ where: { id: message.roomId } });
        if (room?.isFrozen && roleLevel < 50) {
          socket.emit('error', { message: 'الغرفة مجمدة حالياً' });
          return;
        }

        // Check mute
        const activeMute = await prisma.mute.findFirst({
          where: { userId, isActive: true, expiresAt: { gt: new Date() } },
        });
        if (activeMute) {
          socket.emit('error', { message: `أنت مكتوم حتى ${activeMute.expiresAt.toISOString()} – السبب: ${activeMute.reason}` });
          return;
        }

        // Check ban
        const activeBan = await prisma.ban.findFirst({
          where: { userId, isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        });
        if (activeBan) {
          socket.emit('error', { message: 'أنت محظور من الدردشة' });
          return;
        }

        const { text: processedText, isBold } = processBoldMessage(content, roleLevel >= 50);
        const bannedWords = await getBannedWords();
        const { filtered } = filterMessage(processedText, bannedWords);

        await prisma.messageEdit.create({
          data: { messageId, editedById: userId, oldContent: message.content, newContent: filtered },
        });

        await prisma.message.update({
          where: { id: messageId },
          data: { content: filtered, isEdited: true, isBold },
        });

        io.to(`room:${message.roomId}`).emit('message:edited', {
          messageId, content: filtered, roomId: message.roomId,
        });
      } catch (error) {
        console.error('Message edit error:', error);
      }
    });

    // Delete message
    socket.on('message:delete', async ({ messageId }) => {
      try {
        // Refresh role level for authorization checks
        await refreshRoleLevel();

        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message || message.isDeleted) return;

        // Regular users can only delete their own messages in rooms they've joined
        if (message.userId !== userId && roleLevel < 50) {
          socket.emit('error', { message: 'لا تملك صلاحية حذف هذه الرسالة' });
          return;
        }
        // Non-mods must be in the room to delete their own messages
        if (roleLevel < 50 && socketRooms.get(socket.id) !== message.roomId) {
          socket.emit('error', { message: 'يجب الانضمام للغرفة أولاً' });
          return;
        }

        await prisma.message.update({
          where: { id: messageId },
          data: { isDeleted: true },
        });

        io.to(`room:${message.roomId}`).emit('message:deleted', {
          messageId, roomId: message.roomId,
        });

        if (message.userId !== userId) {
          await prisma.auditLog.create({
            data: {
              action: 'DELETE_MESSAGE',
              performedBy: userId,
              targetUserId: message.userId,
              details: { messageId, content: message.content, roomId: message.roomId },
            },
          });
        }
      } catch (error) {
        console.error('Message delete error:', error);
      }
    });

    // Typing indicators
    socket.on('typing:start', ({ roomId }) => {
      // Verify user has joined this room
      if (socketRooms.get(socket.id) !== roomId) return;

      if (!typingUsers.has(roomId)) typingUsers.set(roomId, new Map());
      const roomTyping = typingUsers.get(roomId)!;

      const existing = roomTyping.get(userId);
      if (existing) clearTimeout(existing.timeout);

      const timeout = setTimeout(() => {
        roomTyping.delete(userId);
        socket.to(`room:${roomId}`).emit('typing:update', { roomId, userId, username, isTyping: false });
        // Update presence back to IN_ROOM
        io.emit('presence:update', { userId, status: 'IN_ROOM', currentRoomId: roomId });
      }, 3000);

      roomTyping.set(userId, { username, timeout });
      socket.to(`room:${roomId}`).emit('typing:update', { roomId, userId, username, isTyping: true });
      // Broadcast typing presence
      io.emit('presence:update', { userId, status: 'TYPING', currentRoomId: roomId });
    });

    socket.on('typing:stop', ({ roomId }) => {
      // Verify user has joined this room
      if (socketRooms.get(socket.id) !== roomId) return;

      const roomTyping = typingUsers.get(roomId);
      if (roomTyping) {
        const existing = roomTyping.get(userId);
        if (existing) clearTimeout(existing.timeout);
        roomTyping.delete(userId);
      }
      socket.to(`room:${roomId}`).emit('typing:update', { roomId, userId, username, isTyping: false });
      // Update presence back to IN_ROOM
      const info = socketToUser.get(socket.id);
      if (info?.currentRoomId) {
        io.emit('presence:update', { userId, status: 'IN_ROOM', currentRoomId: info.currentRoomId });
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      // Clean up socket maps BEFORE broadcasting so counts are accurate
      const hadRoom = socketToUser.get(socket.id)?.currentRoomId;
      socketToUser.delete(socket.id);
      socketRooms.delete(socket.id);

      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          const now = new Date();
          prisma.user.update({
            where: { id: userId },
            data: { status: 'OFFLINE', lastActive: now },
          }).catch(console.error);
          io.emit('user:status', { userId, status: 'OFFLINE', lastActive: now.toISOString() });
          // Broadcast presence leave
          io.emit('presence:leave', { userId });
          broadcastPresenceCounts(io);
        } else if (hadRoom) {
          // User still online but a room socket disconnected — update room counts
          broadcastPresenceCounts(io);
        }
      }

      // Clean up typing — only for the disconnected socket's room, not all rooms
      // This prevents clearing typing state from other tabs that are still active
      if (hadRoom) {
        const roomTyping = typingUsers.get(hadRoom);
        if (roomTyping) {
          const existing = roomTyping.get(userId);
          if (existing) {
            clearTimeout(existing.timeout);
            roomTyping.delete(userId);
            // Notify room members to clear the typing indicator
            io.to(`room:${hadRoom}`).emit('typing:update', { roomId: hadRoom, userId, username, isTyping: false });
          }
        }
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Server ready on http://${hostname}:${port}`);
  });
});
