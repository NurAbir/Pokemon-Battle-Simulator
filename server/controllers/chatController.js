const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const User = require('../models/User');

// Get or create global chat room
exports.getGlobalChat = async (req, res) => {
  try {
    const room = await ChatRoom.getGlobalRoom();
    const messages = await Message.getRoomMessages(room.roomId, 50);
    
    res.json({
      success: true,
      data: {
        room: {
          roomId: room.roomId,
          type: room.type
        },
        messages: messages.reverse() // Chronological order
      }
    });
  } catch (error) {
    console.error('Get global chat error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get or create private chat with another user
exports.getPrivateChat = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify target user exists
    const targetUser = await User.findOne({ userId }).select('userId username');
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const room = await ChatRoom.getPrivateRoom(req.user.userId, userId);
    const messages = await Message.getRoomMessages(room.roomId, 50);
    
    // Mark messages as read
    await Message.updateMany(
      { roomId: room.roomId, senderId: { $ne: req.user.userId } },
      { $addToSet: { readBy: req.user.userId } }
    );
    
    res.json({
      success: true,
      data: {
        room: {
          roomId: room.roomId,
          type: room.type,
          participant: targetUser
        },
        messages: messages.reverse()
      }
    });
  } catch (error) {
    console.error('Get private chat error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get battle chat room
exports.getBattleChat = async (req, res) => {
  try {
    const { battleId } = req.params;
    
    const room = await ChatRoom.getBattleRoom(battleId);
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Battle chat not found' });
    }
    
    // Verify user is participant
    if (!room.isParticipant(req.user.userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    const messages = await Message.getRoomMessages(room.roomId, 100);
    
    res.json({
      success: true,
      data: {
        room: {
          roomId: room.roomId,
          type: room.type,
          battleId: room.battleId
        },
        messages: messages.reverse()
      }
    });
  } catch (error) {
    console.error('Get battle chat error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get chat history with pagination
exports.getChatHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, before } = req.query;
    
    const room = await ChatRoom.findOne({ roomId });
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Chat room not found' });
    }
    
    // Verify access
    if (!room.isParticipant(req.user.userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    const beforeDate = before ? new Date(before) : null;
    const messages = await Message.getRoomMessages(
      roomId, 
      parseInt(limit), 
      beforeDate
    );
    
    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user's private chat list
exports.getPrivateChatList = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({
      type: 'private',
      participants: req.user.userId
    }).sort({ lastActivity: -1 });
    
    const chatList = await Promise.all(
      rooms.map(async (room) => {
        // Get the other participant
        const otherUserId = room.participants.find(p => p !== req.user.userId);
        const otherUser = await User.findOne({ userId: otherUserId })
          .select('userId username avatar isOnline');
        
        // Get last message
        const [lastMessage] = await Message.find({ roomId: room.roomId })
          .sort({ createdAt: -1 })
          .limit(1)
          .lean();
        
        // Get unread count
        const unreadCount = await Message.countUnread(room.roomId, req.user.userId);
        
        return {
          roomId: room.roomId,
          participant: otherUser,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            senderUsername: lastMessage.senderUsername,
            createdAt: lastMessage.createdAt
          } : null,
          unreadCount,
          lastActivity: room.lastActivity
        };
      })
    );
    
    res.json({ success: true, data: chatList });
  } catch (error) {
    console.error('Get private chat list error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark room messages as read
exports.markRoomAsRead = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await ChatRoom.findOne({ roomId });
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Chat room not found' });
    }
    
    if (!room.isParticipant(req.user.userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    await Message.updateMany(
      { roomId, senderId: { $ne: req.user.userId } },
      { $addToSet: { readBy: req.user.userId } }
    );
    
    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark room as read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
