const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: ['battle', 'friend_request', 'system', 'achievement']
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Send notification
notificationSchema.methods.sendNotification = async function() {
  // Logic to send notification (e.g., via WebSocket, email, etc.)
  console.log(`Notification sent to user ${this.userId}: ${this.message}`);
};

module.exports = mongoose.model('Notification', notificationSchema);