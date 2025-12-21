const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  roomId: {
    type: String,
    required: true,
    ref: 'ChatRoom',
    index: true
  },
  senderId: {
    type: String,
    required: true,
    ref: 'User'
  },
  senderUsername: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  // For tracking read status in private chats
  readBy: [{
    type: String,
    ref: 'User'
  }],
  // Message type for future extensibility (text, system, etc.)
  messageType: {
    type: String,
    enum: ['text', 'system'],
    default: 'text'
  }
}, { 
  timestamps: true 
});

// Index for fetching messages in a room
messageSchema.index({ roomId: 1, createdAt: -1 });

// Check if message was read by user
messageSchema.methods.isReadBy = function(userId) {
  return this.readBy.includes(userId);
};

// Mark as read by user
messageSchema.methods.markReadBy = async function(userId) {
  if (!this.readBy.includes(userId)) {
    this.readBy.push(userId);
    return this.save();
  }
  return this;
};

// Static: create a text message
messageSchema.statics.createMessage = async function(roomId, senderId, senderUsername, content) {
  const { generateId } = require('../utils/generateId');
  return this.create({
    messageId: generateId('msg'),
    roomId,
    senderId,
    senderUsername,
    content,
    readBy: [senderId]
  });
};

// Static: create system message
messageSchema.statics.createSystemMessage = async function(roomId, content) {
  const { generateId } = require('../utils/generateId');
  return this.create({
    messageId: generateId('msg'),
    roomId,
    senderId: 'system',
    senderUsername: 'System',
    content,
    messageType: 'system',
    readBy: []
  });
};

// Static: get messages for a room with pagination
messageSchema.statics.getRoomMessages = async function(roomId, limit = 50, before = null) {
  const query = { roomId };
  if (before) {
    query.createdAt = { $lt: before };
  }
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Static: count unread messages for user in a room
messageSchema.statics.countUnread = async function(roomId, userId) {
  return this.countDocuments({
    roomId,
    readBy: { $ne: userId },
    senderId: { $ne: userId }
  });
};

module.exports = mongoose.model('Message', messageSchema);
