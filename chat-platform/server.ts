import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import type { ClientToServerEvents, ServerToClientEvents } from './src/types/chat';
import { filterMessage, checkSpam, processBoldMessage, getBannedWords } from './src/lib/chat-utils';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const prisma = new PrismaClient();

// Track online users: userId -> Set<socketId>
const onlineUsers = new Map<string, Set<string>>();
// Track socket to user mapping
const socketToUser = new Map<string, { userId: string; username: string; roleLevel: number }>();
// Track typing users per room
const typingUsers = new Map<string, Map<string, { username: string; timeout: NodeJS.Timeout }>>();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', async (socket) => {
    const clientUserId = socket.handshake.auth.userId as string;
    const clientUsername = socket.handshake.auth.username as string;

    if (!clientUserId || !clientUsername) {
      socket.disconnect();
      return;
    }

    // Server-side verification: look up user and role from database
    const dbUser = await prisma.user.findUnique({
      where: { id: clientUserId },
      include: { userRoles: { include: { role: true } } },
    });

    if (!dbUser || dbUser.username !== clientUsername) {
      socket.disconnect();
      return;
    }

    const highestUserRole = dbUser.userRoles.reduce(
      (h, ur) => (ur.role.level > h.level ? ur.role : h),
      { level: 0, name: 'member', displayName: 'عضو', color: '#808080' }
    );

    const userId = dbUser.id;
    const username = dbUser.username;
    const roleLevel = highestUserRole.level;

    // Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);
    socketToUser.set(socket.id, { userId, username, roleLevel });

    // Update user status
    prisma.user.update({
      where: { id: userId },
      data: { status: 'ONLINE', lastActive: new Date() },
    }).catch(console.error);

    // Broadcast online status
    io.emit('user:status', { userId, status: 'ONLINE' });

    // Join room
    socket.on('room:join', async ({ roomId }) => {
      socket.join(`room:${roomId}`);

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
          roleLevel,
          roleDisplayName: '',
          roleColor: '',
          permissions: [],
        },
      });

      // Send online count
      const roomSockets = await io.in(`room:${roomId}`).fetchSockets();
      const uniqueUsers = new Set(roomSockets.map(s => socketToUser.get(s.id)?.userId).filter(Boolean));
      io.to(`room:${roomId}`).emit('online:count', { roomId, count: uniqueUsers.size });
    });

    // Leave room
    socket.on('room:leave', ({ roomId }) => {
      socket.leave(`room:${roomId}`);
      io.to(`room:${roomId}`).emit('room:user_left', { roomId, userId });
    });

    // Send message
    socket.on('message:send', async ({ content, roomId, replyToId }) => {
      try {
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

        // Spam check
        if (checkSpam(userId)) {
          socket.emit('error', { message: 'أنت ترسل رسائل بسرعة كبيرة. انتظر قليلاً' });
          return;
        }

        // Process bold ($) for mods/admins
        const { text, isBold } = processBoldMessage(content, roleLevel >= 50);

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

        // Save message
        const message = await prisma.message.create({
          data: {
            content: filtered,
            userId,
            roomId,
            replyToId: replyToId || null,
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
        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message) return;
        if (message.userId !== userId && roleLevel < 90) {
          socket.emit('error', { message: 'لا تملك صلاحية تعديل هذه الرسالة' });
          return;
        }

        // Apply bold processing and word filter (same as message:send)
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
        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message) return;
        if (message.userId !== userId && roleLevel < 50) {
          socket.emit('error', { message: 'لا تملك صلاحية حذف هذه الرسالة' });
          return;
        }

        await prisma.message.update({
          where: { id: messageId },
          data: { isDeleted: true },
        });

        io.to(`room:${message.roomId}`).emit('message:deleted', {
          messageId, roomId: message.roomId,
        });

        // Audit log
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
      if (!typingUsers.has(roomId)) typingUsers.set(roomId, new Map());
      const roomTyping = typingUsers.get(roomId)!;

      // Clear existing timeout
      const existing = roomTyping.get(userId);
      if (existing) clearTimeout(existing.timeout);

      const timeout = setTimeout(() => {
        roomTyping.delete(userId);
        socket.to(`room:${roomId}`).emit('typing:update', { roomId, userId, username, isTyping: false });
      }, 3000);

      roomTyping.set(userId, { username, timeout });
      socket.to(`room:${roomId}`).emit('typing:update', { roomId, userId, username, isTyping: true });
    });

    socket.on('typing:stop', ({ roomId }) => {
      const roomTyping = typingUsers.get(roomId);
      if (roomTyping) {
        const existing = roomTyping.get(userId);
        if (existing) clearTimeout(existing.timeout);
        roomTyping.delete(userId);
      }
      socket.to(`room:${roomId}`).emit('typing:update', { roomId, userId, username, isTyping: false });
    });

    // Disconnect
    socket.on('disconnect', async () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          prisma.user.update({
            where: { id: userId },
            data: { status: 'OFFLINE', lastActive: new Date() },
          }).catch(console.error);
          io.emit('user:status', { userId, status: 'OFFLINE', lastActive: new Date().toISOString() });
        }
      }
      socketToUser.delete(socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Server ready on http://${hostname}:${port}`);
  });
});
