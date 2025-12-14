const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const generateId = require('../utils/generateId');

// Store for active battle timers
const battleTimers = new Map();

/**
 * Initialize Socket.IO handlers
 * @param {Server} io - Socket.IO server instance
 */
const initializeSocket = (io) => {
  // Store io globally for controllers to access
  global.io = io;

  // Authentication middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ userId: decoded.userId }).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    console.log(`User connected: ${user.username} (${socket.id})`);

    // Update user's online status and socket ID
    await User.findOneAndUpdate(
      { userId: user.userId },
      { isOnline: true, socketId: socket.id }
    );

    // Auto-join user's notification room (using their userId)
    socket.join(`user:${user.userId}`);

    // ============== CHAT EVENTS ==============

    // Join a chat room
    socket.on('chat:join', async (roomId) => {
      try {
        const room = await ChatRoom.findOne({ roomId });
        if (!room) return socket.emit('error', { message: 'Room not found' });

        // Authorization check (skip for global)
        if (room.type !== 'global' && !room.participants.includes(user.userId)) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        socket.join(`chat:${roomId}`);
        socket.emit('chat:joined', { roomId });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Leave a chat room
    socket.on('chat:leave', (roomId) => {
      socket.leave(`chat:${roomId}`);
      socket.emit('chat:left', { roomId });
    });

    // Send a chat message
    socket.on('chat:send', async ({ roomId, content }) => {
      try {
        if (!content || content.trim().length === 0) return;
        if (content.length > 1000) {
          return socket.emit('error', { message: 'Message too long' });
        }

        const room = await ChatRoom.findOne({ roomId });
        if (!room) return socket.emit('error', { message: 'Room not found' });

        // Authorization check
        if (room.type !== 'global' && !room.participants.includes(user.userId)) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        if (!room.isActive) {
          return socket.emit('error', { message: 'Chat room is inactive' });
        }

        // Create and save message
        const message = new Message({
          messageId: generateId('msg'),
          roomId,
          senderId: user.userId,
          senderUsername: user.username,
          content: content.trim()
        });

        message.moderate();
        await message.save();

        // Update room
        room.lastMessageAt = new Date();
        
        // Update unread for private chats
        if (room.type === 'private') {
          const otherUserId = room.participants.find(p => p !== user.userId);
          await room.incrementUnread(otherUserId);
        }
        await room.save();

        // Broadcast to room
        io.to(`chat:${roomId}`).emit('chat:message', message);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Mark messages as read
    socket.on('chat:read', async (roomId) => {
      try {
        const room = await ChatRoom.findOne({ roomId });
        if (room && room.type === 'private') {
          await room.resetUnread(user.userId);
        }
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // ============== BATTLE EVENTS ==============

    // Join a battle room
    socket.on('battle:join', async (battleId) => {
      try {
        const Battle = require('../models/Battle');
        const battle = await Battle.findOne({ battleId });
        
        if (!battle) {
          return socket.emit('error', { message: 'Battle not found' });
        }

        if (battle.player1Id !== user.userId && battle.player2Id !== user.userId) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        socket.join(`battle:${battleId}`);
        socket.emit('battle:joined', { battleId });

        // Send full log for reconnection
        const BattleLog = require('../models/BattleLog');
        const logs = await BattleLog.getLog(battleId);
        socket.emit('battle:log:full', logs);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Leave battle room
    socket.on('battle:leave', (battleId) => {
      socket.leave(`battle:${battleId}`);
    });

    // Submit battle action (move, switch, etc.)
    socket.on('battle:action', async ({ battleId, action }) => {
      try {
        // Clear inactivity timer for this player
        const timerKey = `${battleId}:${user.userId}`;
        if (battleTimers.has(timerKey)) {
          clearTimeout(battleTimers.get(timerKey).timeout);
          clearTimeout(battleTimers.get(timerKey).warning);
          battleTimers.delete(timerKey);
        }

        // Emit action to battle engine (this would integrate with your battle logic)
        io.to(`battle:${battleId}`).emit('battle:action:received', {
          playerId: user.userId,
          action
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // ============== NOTIFICATION EVENTS ==============

    // Mark notification as read via socket
    socket.on('notification:read', async (notificationId) => {
      try {
        const Notification = require('../models/Notification');
        const notification = await Notification.findOne({ notificationId });
        
        if (notification && notification.recipientId === user.userId) {
          await notification.markAsRead();
        }
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // ============== DISCONNECTION ==============

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${user.username}`);
      
      await User.findOneAndUpdate(
        { userId: user.userId },
        { isOnline: false, socketId: null }
      );
    });
  });

  return io;
};

/**
 * Start inactivity timer for a player in a battle
 * @param {string} battleId 
 * @param {string} playerId 
 * @param {string} playerUsername 
 * @param {number} turnTimeoutSeconds - Total turn time (default 60s)
 * @param {number} warningSeconds - When to warn (default 10s remaining)
 */
const startInactivityTimer = (battleId, playerId, playerUsername, turn, turnTimeoutSeconds = 60, warningSeconds = 10) => {
  const timerKey = `${battleId}:${playerId}`;
  const battleLogController = require('../controllers/battleLogController');
  
  // Clear existing timer
  if (battleTimers.has(timerKey)) {
    clearTimeout(battleTimers.get(timerKey).timeout);
    clearTimeout(battleTimers.get(timerKey).warning);
  }

  // Set warning timer
  const warningTime = (turnTimeoutSeconds - warningSeconds) * 1000;
  const warningTimer = setTimeout(async () => {
    await battleLogController.logWarning(battleId, turn, playerId, playerUsername, warningSeconds);
  }, warningTime);

  // Set timeout timer
  const timeoutTimer = setTimeout(async () => {
    await battleLogController.logTimeout(battleId, turn, playerId, playerUsername);
    
    // Emit timeout event for battle engine to handle
    if (global.io) {
      global.io.to(`battle:${battleId}`).emit('battle:timeout', { playerId });
    }
    
    battleTimers.delete(timerKey);
  }, turnTimeoutSeconds * 1000);

  battleTimers.set(timerKey, {
    warning: warningTimer,
    timeout: timeoutTimer
  });
};

/**
 * Clear inactivity timer
 */
const clearInactivityTimer = (battleId, playerId) => {
  const timerKey = `${battleId}:${playerId}`;
  if (battleTimers.has(timerKey)) {
    clearTimeout(battleTimers.get(timerKey).timeout);
    clearTimeout(battleTimers.get(timerKey).warning);
    battleTimers.delete(timerKey);
  }
};

module.exports = {
  initializeSocket,
  startInactivityTimer,
  clearInactivityTimer
};
