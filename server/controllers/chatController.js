const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const User = require('../models/User');
const generateId = require('../utils/generateId');

// Get chat history for a room
exports.getChatHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, before } = req.query;
    const userId = req.user.userId;

    const room = await ChatRoom.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Chat room not found' });
    }

    // Authorization check (skip for global chat)
    if (room.type !== 'global' && !room.participants.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this chat' });
    }

    const messages = await Message.getForRoom(roomId, {
      limit: parseInt(limit),
      before
    });

    // Reset unread count for private chats
    if (room.type === 'private') {
      await room.resetUnread(userId);
    }

    res.json({
      success: true,
      data: {
        room,
        messages: messages.reverse() // Return in chronological order
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get global chat room
exports.getGlobalChat = async (req, res) => {
  try {
    const room = await ChatRoom.getGlobalRoom();
    const messages = await Message.getForRoom(room.roomId, { limit: 50 });

    res.json({
      success: true,
      data: {
        room,
        messages: messages.reverse()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get or create private chat with another user
exports.getPrivateChat = async (req, res) => {
  try {
    const { targetUsername } = req.params;
    const userId = req.user.userId;

    // Find target user
    const targetUser = await User.findOne({ username: targetUsername });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Cannot chat with yourself
    if (targetUser.userId === userId) {
      return res.status(400).json({ success: false, message: 'Cannot chat with yourself' });
    }

    const room = await ChatRoom.findOrCreatePrivate(userId, targetUser.userId);
    const messages = await Message.getForRoom(room.roomId, { limit: 50 });

    // Reset unread count
    await room.resetUnread(userId);

    res.json({
      success: true,
      data: {
        room,
        targetUser: {
          userId: targetUser.userId,
          username: targetUser.username,
          avatar: targetUser.avatar,
          isOnline: targetUser.isOnline
        },
        messages: messages.reverse()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user's private chat list
exports.getPrivateChats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const rooms = await ChatRoom.find({
      type: 'private',
      participants: userId,
      isActive: true
    }).sort({ lastMessageAt: -1 });

    // Enrich with participant info and unread counts
    const enrichedRooms = await Promise.all(rooms.map(async (room) => {
      const otherUserId = room.participants.find(p => p !== userId);
      const otherUser = await User.findOne({ userId: otherUserId });
      const lastMessage = await Message.findOne({ roomId: room.roomId })
        .sort({ createdAt: -1 });

      return {
        roomId: room.roomId,
        participant: otherUser ? {
          userId: otherUser.userId,
          username: otherUser.username,
          avatar: otherUser.avatar,
          isOnline: otherUser.isOnline
        } : null,
        unreadCount: room.unreadCounts.get(userId) || 0,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          isSystem: lastMessage.isSystem
        } : null
      };
    }));

    res.json({ success: true, data: enrichedRooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get battle chat room
exports.getBattleChat = async (req, res) => {
  try {
    const { battleId } = req.params;
    const userId = req.user.userId;

    const room = await ChatRoom.findOne({ battleId, type: 'battle' });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Battle chat not found' });
    }

    // Check authorization
    if (!room.participants.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const messages = await Message.getForRoom(room.roomId, { limit: 100 });

    res.json({
      success: true,
      data: {
        room,
        messages: messages.reverse()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send message (HTTP fallback - primary is socket)
exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;
    const username = req.user.username;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ success: false, message: 'Message too long' });
    }

    const room = await ChatRoom.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Chat room not found' });
    }

    // Authorization check (skip for global)
    if (room.type !== 'global' && !room.participants.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check if room is active (for battle chats)
    if (!room.isActive) {
      return res.status(400).json({ success: false, message: 'Chat room is no longer active' });
    }

    // Create message
    const message = new Message({
      messageId: generateId('msg'),
      roomId,
      senderId: userId,
      senderUsername: username,
      content: content.trim()
    });

    // Moderate content
    message.moderate();
    await message.save();

    // Update room's last message timestamp
    room.lastMessageAt = new Date();

    // Update unread counts for private chats
    if (room.type === 'private') {
      const otherUserId = room.participants.find(p => p !== userId);
      await room.incrementUnread(otherUserId);
    }

    await room.save();

    // Emit via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${roomId}`).emit('chat:message', message);
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create battle chat room (called internally when battle starts)
exports.createBattleChatRoom = async (battleId, participants) => {
  return await ChatRoom.createBattleRoom(battleId, participants);
};

// Archive battle chat room (called internally when battle ends)
exports.archiveBattleChatRoom = async (battleId) => {
  const room = await ChatRoom.findOne({ battleId, type: 'battle' });
  if (room) {
    await room.archive();
  }
  return room;
};

module.exports = exports;
