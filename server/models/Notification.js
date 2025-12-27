const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    required: true,
    unique: true,
    index: true
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
    default: null
  },
  type: {
    type: String,
    required: true,
    enum: ['matchInvite', 'friendRequest', 'battleResult', 'friendRequestAccepted', 'friendRequestDenied', 'matchInviteAccepted', 'matchInviteDenied', 'system']
  },
  // Flexible payload for different notification types
  payload: {
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
    default: null
  }
}, { 
  timestamps: true 
});

// Index for efficient querying
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1 });

// Check if notification is expired
notificationSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Mark as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  return this.save();
};

// Static: create match invite notification
notificationSchema.statics.createMatchInvite = async function(senderId, senderUsername, recipientId, teamId) {
  const { generateId } = require('../utils/generateId');
  return this.create({
    notificationId: generateId('notif'),
    recipientId,
    senderId,
    type: 'matchInvite',
    payload: {
      senderUsername,
      teamId,
      message: `${senderUsername} has invited you to a battle!`
    },
    expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry
  });
};

// Static: create friend request notification
notificationSchema.statics.createFriendRequest = async function(senderId, senderUsername, recipientId, requestId) {
  const { generateId } = require('../utils/generateId');
  return this.create({
    notificationId: generateId('notif'),
    recipientId,
    senderId,
    type: 'friendRequest',
    payload: {
      senderUsername,
      requestId,
      message: `${senderUsername} sent you a friend request!`
    }
  });
};

// Static: create battle result notification
notificationSchema.statics.createBattleResult = async function(recipientId, battleData) {
  const { generateId } = require('../utils/generateId');
  return this.create({
    notificationId: generateId('notif'),
    recipientId,
    senderId: null,
    type: 'battleResult',
    payload: {
      battleId: battleData.battleId,
      winner: battleData.winner,
      winnerUsername: battleData.winnerUsername,
      loserUsername: battleData.loserUsername,
      isWinner: battleData.isWinner,
      summary: battleData.summary,
      message: battleData.isWinner 
        ? `You won the battle against ${battleData.opponentUsername}!` 
        : `You lost the battle against ${battleData.opponentUsername}.`
    }
  });
};

module.exports = mongoose.model('Notification', notificationSchema);