const generateId = require('./generateId');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create and emit a notification
 * @param {Object} params - Notification parameters
 * @param {string} params.recipientId - Recipient user ID
 * @param {string} params.senderId - Sender user ID (null for system)
 * @param {string} params.type - Notification type
 * @param {Object} params.data - Additional data payload
 * @returns {Promise<Object>} Created notification
 */
const createNotification = async ({ recipientId, senderId = null, type, data = {} }) => {
  const notification = await Notification.create({
    notificationId: generateId('notif'),
    recipientId,
    senderId,
    type,
    data
  });

  // Emit via socket if recipient is online
  const recipient = await User.findOne({ userId: recipientId });
  if (global.io && recipient?.socketId) {
    global.io.to(recipient.socketId).emit('notification:new', notification);
  }

  return notification;
};

/**
 * Send battle result notifications to both players
 * @param {Object} params - Battle result parameters
 * @param {string} params.battleId - Battle ID
 * @param {string} params.winnerId - Winner user ID
 * @param {string} params.loserId - Loser user ID
 * @param {string} params.summary - Battle summary text
 * @returns {Promise<Object>} Both notifications
 */
const sendBattleResults = async ({ battleId, winnerId, loserId, summary }) => {
  const winner = await User.findOne({ userId: winnerId });
  const loser = await User.findOne({ userId: loserId });

  const baseData = {
    battleId,
    winnerId,
    loserId,
    winnerUsername: winner?.username,
    loserUsername: loser?.username,
    summary
  };

  const [winnerNotif, loserNotif] = await Promise.all([
    createNotification({
      recipientId: winnerId,
      type: 'battleResult',
      data: { ...baseData, isWinner: true }
    }),
    createNotification({
      recipientId: loserId,
      type: 'battleResult',
      data: { ...baseData, isWinner: false }
    })
  ]);

  return { winnerNotif, loserNotif };
};

module.exports = {
  createNotification,
  sendBattleResults
};
