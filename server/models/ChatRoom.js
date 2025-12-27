const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['global', 'private', 'battle']
  },
  // For private chats: array of two user IDs
  // For battle chats: array of two player IDs
  // For global: empty array
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
  // Track when room was last active
  lastActivity: {
    type: Date,
    default: Date.now
  },
  // For battle chats - whether the room is archived
  isArchived: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Index for finding private chats between users
chatRoomSchema.index({ type: 1, participants: 1 });
chatRoomSchema.index({ battleId: 1 });

// Update last activity timestamp
chatRoomSchema.methods.updateActivity = async function() {
  this.lastActivity = new Date();
  return this.save();
};

// Archive the room (for battle chats)
chatRoomSchema.methods.archive = async function() {
  this.isArchived = true;
  return this.save();
};

// Check if user is participant
chatRoomSchema.methods.isParticipant = function(userId) {
  if (this.type === 'global') return true;
  return this.participants.includes(userId);
};

// Static: find or create global chat room
chatRoomSchema.statics.getGlobalRoom = async function() {
  const { generateId } = require('../utils/generateId');
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

// Static: find or create private chat between two users
chatRoomSchema.statics.getPrivateRoom = async function(userId1, userId2) {
  const { generateId } = require('../utils/generateId');
  
  // Sort IDs to ensure consistent lookup
  const participants = [userId1, userId2].sort();
  
  let room = await this.findOne({
    type: 'private',
    participants: { $all: participants, $size: 2 }
  });
  
  if (!room) {
    room = await this.create({
      roomId: generateId('chat'),
      type: 'private',
      participants
    });
  }
  
  return room;
};

// Static: create battle chat room
chatRoomSchema.statics.createBattleRoom = async function(battleId, player1Id, player2Id) {
  const { generateId } = require('../utils/generateId');
  return this.create({
    roomId: generateId('bchat'),
    type: 'battle',
    battleId,
    participants: [player1Id, player2Id]
  });
};

// Static: get battle room by battleId
chatRoomSchema.statics.getBattleRoom = async function(battleId) {
  return this.findOne({ type: 'battle', battleId, isArchived: false });
};

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
