const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true
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
  // For system messages (player joined, left, etc.)
  isSystem: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Index for efficient message retrieval
messageSchema.index({ roomId: 1, createdAt: -1 });

// Get messages for a room with pagination
messageSchema.statics.getForRoom = async function(roomId, options = {}) {
  const { limit = 50, before = null } = options;
  const query = { roomId };
  
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }
  
  return await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Filter inappropriate content
messageSchema.methods.moderate = function() {
  const inappropriateWords = ['badword1', 'badword2']; // Extend as needed
  let moderated = false;
  
  for (const word of inappropriateWords) {
    if (this.content.toLowerCase().includes(word)) {
      this.content = '[Message removed by moderator]';
      moderated = true;
      break;
    }
  }
  
  return moderated;
};

module.exports = mongoose.model('Message', messageSchema);
