const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    unique: true
  },
  battleId: {
    type: String,
    required: true,
    ref: 'Battle'
  },
  senderId: {
    type: String,
    required: true,
    ref: 'User'
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Send message
chatSchema.methods.sendMessage = async function() {
  console.log(`Message from ${this.senderId}: ${this.message}`);
};

// Moderate message
chatSchema.methods.moderateMessage = async function() {
  // Check for inappropriate content
  const inappropriateWords = ['badword1', 'badword2'];
  for (let word of inappropriateWords) {
    if (this.message.toLowerCase().includes(word)) {
      this.message = '[Message removed by moderator]';
      await this.save();
      return false;
    }
  }
  return true;
};

module.exports = mongoose.model('Chat', chatSchema);