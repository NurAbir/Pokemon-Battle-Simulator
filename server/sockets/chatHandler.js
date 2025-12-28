const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const User = require('../models/User');

// Rate limiting: userId -> { lastMessage: timestamp, messageCount: number }
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 10000; // 10 seconds
const MAX_MESSAGES_PER_WINDOW = 10;

function checkRateLimit(userId) {
  const now = Date.now();
  const userLimit = rateLimits.get(userId);
  
  if (!userLimit || now - userLimit.lastMessage > RATE_LIMIT_WINDOW) {
    rateLimits.set(userId, { lastMessage: now, messageCount: 1 });
    return true;
  }
  
  if (userLimit.messageCount >= MAX_MESSAGES_PER_WINDOW) {
    return false;
  }
  
  userLimit.messageCount++;
  userLimit.lastMessage = now;
  return true;
}

module.exports = (io, socket) => {
  // Join a chat room
  socket.on('joinChatRoom', async ({ roomId, userId }) => {
    try {
      if (!roomId || !userId) return;
      
      const room = await ChatRoom.findOne({ roomId });
      if (!room) {
        socket.emit('chatError', { message: 'Chat room not found' });
        return;
      }
      
      // Verify authorization (global chat allows everyone)
      if (!room.isParticipant(userId)) {
        socket.emit('chatError', { message: 'Not authorized to join this room' });
        return;
      }
      
      socket.join(`chat_${roomId}`);
      console.log(`User ${userId} joined chat room ${roomId}`);
      
      // Mark messages as read
      await Message.updateMany(
        { roomId, senderId: { $ne: userId } },
        { $addToSet: { readBy: userId } }
      );
    } catch (error) {
      console.error('Join chat room error:', error);
      socket.emit('chatError', { message: 'Failed to join room' });
    }
  });
  
  // Leave a chat room
  socket.on('leaveChatRoom', ({ roomId }) => {
    if (!roomId) return;
    socket.leave(`chat_${roomId}`);
    console.log(`Socket left chat room ${roomId}`);
  });
  
  // Send a message
  socket.on('sendMessage', async ({ roomId, userId, content }) => {
    try {
      if (!roomId || !userId || !content) {
        socket.emit('chatError', { message: 'Missing required fields' });
        return;
      }
      
      // Validate content
      const trimmedContent = content.trim();
      if (!trimmedContent || trimmedContent.length > 1000) {
        socket.emit('chatError', { message: 'Invalid message content' });
        return;
      }
      
      // Rate limit check
      if (!checkRateLimit(userId)) {
        socket.emit('chatError', { message: 'Sending messages too fast. Please wait.' });
        return;
      }
      
      const room = await ChatRoom.findOne({ roomId });
      if (!room) {
        socket.emit('chatError', { message: 'Chat room not found' });
        return;
      }
      
      // Verify authorization
      if (!room.isParticipant(userId)) {
        socket.emit('chatError', { message: 'Not authorized to send messages here' });
        return;
      }
      
      // Check if room is archived (battle chats)
      if (room.isArchived) {
        socket.emit('chatError', { message: 'This chat has ended' });
        return;
      }
      
      // Get user info
      const user = await User.findOne({ userId }).select('username');
      if (!user) {
        socket.emit('chatError', { message: 'User not found' });
        return;
      }
      
      // Create message
      const message = await Message.createMessage(
        roomId,
        userId,
        user.username,
        trimmedContent
      );
      
      // Update room activity
      await room.updateActivity();
      
      // Broadcast to room
      io.to(`chat_${roomId}`).emit('newMessage', {
        messageId: message.messageId,
        roomId: message.roomId,
        senderId: message.senderId,
        senderUsername: message.senderUsername,
        content: message.content,
        messageType: message.messageType,
        createdAt: message.createdAt
      });
      
      // For private chats, notify offline participants
      if (room.type === 'private') {
        const otherUserId = room.participants.find(p => p !== userId);
        // Emit to their notification room (they'll receive it if online)
        io.to(`user_${otherUserId}`).emit('newPrivateMessage', {
          roomId,
          senderUsername: user.username,
          preview: trimmedContent.substring(0, 50)
        });
      }
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('chatError', { message: 'Failed to send message' });
    }
  });
  
  // Start typing indicator
  socket.on('startTyping', ({ roomId, userId, username }) => {
    if (!roomId || !userId) return;
    socket.to(`chat_${roomId}`).emit('userTyping', { userId, username });
  });
  
  // Stop typing indicator
  socket.on('stopTyping', ({ roomId, userId }) => {
    if (!roomId || !userId) return;
    socket.to(`chat_${roomId}`).emit('userStoppedTyping', { userId });
  });
  
  // Mark messages as read
  socket.on('markMessagesRead', async ({ roomId, userId }) => {
    try {
      if (!roomId || !userId) return;
      
      await Message.updateMany(
        { roomId, senderId: { $ne: userId } },
        { $addToSet: { readBy: userId } }
      );
      
      // Notify other participants that messages were read
      socket.to(`chat_${roomId}`).emit('messagesRead', { roomId, userId });
    } catch (error) {
      console.error('Mark messages read error:', error);
    }
  });
};

// Helper function to create and broadcast a battle chat room
module.exports.createBattleChat = async (io, battleId, player1Id, player2Id) => {
  try {
    const room = await ChatRoom.createBattleRoom(battleId, player1Id, player2Id);
    
    // Notify both players
    io.to(`user_${player1Id}`).emit('battleChatCreated', { 
      roomId: room.roomId, 
      battleId 
    });
    io.to(`user_${player2Id}`).emit('battleChatCreated', { 
      roomId: room.roomId, 
      battleId 
    });
    
    // Send system message
    await Message.createSystemMessage(room.roomId, 'Battle has started! Good luck to both trainers!');
    
    return room;
  } catch (error) {
    console.error('Create battle chat error:', error);
    return null;
  }
};

// Helper function to archive battle chat
module.exports.archiveBattleChat = async (io, battleId, winnerId, winnerUsername) => {
  try {
    const room = await ChatRoom.getBattleRoom(battleId);
    if (!room) return;
    
    // Send final system message
    await Message.createSystemMessage(
      room.roomId, 
      `Battle ended! ${winnerUsername} wins!`
    );
    
    // Archive the room
    await room.archive();
    
    // Notify participants
    io.to(`chat_${room.roomId}`).emit('battleChatEnded', { 
      roomId: room.roomId,
      winnerId,
      winnerUsername
    });
  } catch (error) {
    console.error('Archive battle chat error:', error);
  }
};
