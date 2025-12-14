const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const generateId = require('./generateId');

/**
 * Create and broadcast a chat message
 * @param {Object} params - Message parameters
 * @param {string} params.roomId - Chat room ID
 * @param {string} params.senderId - Sender user ID
 * @param {string} params.senderUsername - Sender username
 * @param {string} params.content - Message content
 * @param {boolean} params.isSystem - Is system message
 * @returns {Promise<Object>} Created message
 */
const sendMessage = async ({ roomId, senderId, senderUsername, content, isSystem = false }) => {
  const message = new Message({
    messageId: generateId('msg'),
    roomId,
    senderId,
    senderUsername,
    content,
    isSystem
  });

  if (!isSystem) {
    message.moderate();
  }
  
  await message.save();

  // Update room
  const room = await ChatRoom.findOne({ roomId });
  if (room) {
    room.lastMessageAt = new Date();
    
    // Update unread for private chats
    if (room.type === 'private') {
      const otherUserId = room.participants.find(p => p !== senderId);
      if (otherUserId) {
        await room.incrementUnread(otherUserId);
      }
    }
    await room.save();
  }

  // Broadcast via socket
  if (global.io) {
    global.io.to(`chat:${roomId}`).emit('chat:message', message);
  }

  return message;
};

/**
 * Create a battle chat room
 * @param {string} battleId - Battle ID
 * @param {string[]} participants - Array of participant user IDs
 * @returns {Promise<Object>} Created chat room
 */
const createBattleChatRoom = async (battleId, participants) => {
  return await ChatRoom.createBattleRoom(battleId, participants);
};

/**
 * Archive a battle chat room when battle ends
 * @param {string} battleId - Battle ID
 * @returns {Promise<Object|null>} Archived room or null
 */
const archiveBattleChatRoom = async (battleId) => {
  const room = await ChatRoom.findOne({ battleId, type: 'battle' });
  if (room) {
    await room.archive();

    // Send system message
    await sendMessage({
      roomId: room.roomId,
      senderId: 'system',
      senderUsername: 'System',
      content: 'Battle has ended. This chat is now archived.',
      isSystem: true
    });
  }
  return room;
};

/**
 * Send a system message to a chat room
 * @param {string} roomId - Chat room ID
 * @param {string} content - Message content
 * @returns {Promise<Object>} Created message
 */
const sendSystemMessage = async (roomId, content) => {
  return await sendMessage({
    roomId,
    senderId: 'system',
    senderUsername: 'System',
    content,
    isSystem: true
  });
};

module.exports = {
  sendMessage,
  createBattleChatRoom,
  archiveBattleChatRoom,
  sendSystemMessage
};
