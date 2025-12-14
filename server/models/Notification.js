const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    required: true,
    unique: true
  },
  recipientId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  senderId: {
    type: String,
    ref: 'User',
    default: null // null for system notifications
  },
  type: {
    type: String,
    required: true,
    enum: ['matchInvite', 'friendRequest', 'battleResult', 'matchInviteResponse', 'friendRequestResponse', 'system'],
    index: true
  },
  // Flexible payload for different notification types
  data: {
    // matchInvite: { battleMode: 'ranked'|'normal' }
    // friendRequest: {}
    // battleResult: { battleId, winnerId, loserId, summary }
    // matchInviteResponse: { accepted: boolean, originalNotificationId }
    // friendRequestResponse: { accepted: boolean, originalNotificationId }
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'denied', 'expired'],
    default: 'pending'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: null // null means no expiration
  }
}, { timestamps: true });

// Compound indexes for efficient queries
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ senderId: 1, recipientId: 1, type: 1 });

// Check for duplicate pending notification
notificationSchema.statics.hasPendingNotification = async function(senderId, recipientId, type) {
  const existing = await this.findOne({
    senderId,
    recipientId,
    type,
    status: 'pending'
  });
  return !!existing;
};

// Get unread count for user
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ recipientId: userId, isRead: false });
};

// Get notifications for user with pagination
notificationSchema.statics.getForUser = async function(userId, options = {}) {
  const { page = 1, limit = 20, unreadOnly = false } = options;
  const query = { recipientId: userId };
  
  if (unreadOnly) {
    query.isRead = false;
  }

  return await this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Mark as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  return await this.save();
};

// Respond to notification (accept/deny)
notificationSchema.methods.respond = async function(accepted) {
  this.status = accepted ? 'accepted' : 'denied';
  this.isRead = true;
  return await this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);