const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['global', 'private', 'battle'],
    index: true
  },
  // For private chats: array of two user IDs
  // For battle chats: array of participant user IDs
  // For global: empty array (all users can participate)
  participants: [{
    type: String,
    ref: 'User'
  }],
  // Reference to battle for battle chats
  battleId: {
    type: String,
    ref: 'Battle',
    default: null
  },
  // Track unread counts per user for private chats
  unreadCounts: {
    type: Map,
    of: Number,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastMessageAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Indexes for efficient queries
chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ type: 1, isActive: 1 });
chatRoomSchema.index({ battleId: 1 });

// Find or create private chat between two users
chatRoomSchema.statics.findOrCreatePrivate = async function(userId1, userId2) {
  const generateId = require('../utils/generateId');
  const sortedIds = [userId1, userId2].sort();
  
  let room = await this.findOne({
    type: 'private',
    participants: { $all: sortedIds, $size: 2 }
  });
  
  if (!room) {
    room = await this.create({
      roomId: generateId('room'),
      type: 'private',
      participants: sortedIds,
      unreadCounts: { [userId1]: 0, [userId2]: 0 }
    });
  }
  
  return room;
};

// Get or create global chat room
chatRoomSchema.statics.getGlobalRoom = async function() {
  const generateId = require('../utils/generateId');
  
  let room = await this.findOne({ type: 'global' });
  
  if (!room) {
    room = await this.create({
      roomId: 'global_chat',
      type: 'global',
      participants: []
    });
  }
  
  return room;
};

// Create battle chat room
chatRoomSchema.statics.createBattleRoom = async function(battleId, participants) {
  const generateId = require('../utils/generateId');
  
  return await this.create({
    roomId: generateId('battle_room'),
    type: 'battle',
    battleId,
    participants,
    isActive: true
  });
};

// Archive battle chat room
chatRoomSchema.methods.archive = async function() {
  this.isActive = false;
  return await this.save();
};

// Reset unread count for user
chatRoomSchema.methods.resetUnread = async function(userId) {
  this.unreadCounts.set(userId, 0);
  return await this.save();
};

// Increment unread count for user
chatRoomSchema.methods.incrementUnread = async function(userId) {
  const current = this.unreadCounts.get(userId) || 0;
  this.unreadCounts.set(userId, current + 1);
  return await this.save();
};

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
