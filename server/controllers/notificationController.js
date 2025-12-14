const Notification = require('../models/Notification');
const User = require('../models/User');
const Battle = require('../models/Battle');
const generateId = require('../utils/generateId');

// Get user's notifications
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user.userId;

    const notifications = await Notification.getForUser(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true'
    });

    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      data: { notifications, unreadCount }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.userId);
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send match invite
exports.sendMatchInvite = async (req, res) => {
  try {
    const { targetUsername, battleMode = 'normal' } = req.body;
    const senderId = req.user.userId;
    const senderUsername = req.user.username;

    // Cannot invite yourself
    if (targetUsername === senderUsername) {
      return res.status(400).json({ success: false, message: 'Cannot invite yourself' });
    }

    // Find target user
    const targetUser = await User.findOne({ username: targetUsername });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check for duplicate pending invite
    const hasPending = await Notification.hasPendingNotification(
      senderId,
      targetUser.userId,
      'matchInvite'
    );
    if (hasPending) {
      return res.status(400).json({ success: false, message: 'Pending invite already exists' });
    }

    // Create notification
    const notification = await Notification.create({
      notificationId: generateId('notif'),
      recipientId: targetUser.userId,
      senderId,
      type: 'matchInvite',
      data: { battleMode, senderUsername }
    });

    // Emit via socket if user is online
    const io = req.app.get('io');
    if (io && targetUser.socketId) {
      io.to(targetUser.socketId).emit('notification:new', notification);
    }

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send friend request
exports.sendFriendRequest = async (req, res) => {
  try {
    const { targetUsername } = req.body;
    const senderId = req.user.userId;
    const senderUsername = req.user.username;

    // Cannot add yourself
    if (targetUsername === senderUsername) {
      return res.status(400).json({ success: false, message: 'Cannot add yourself as friend' });
    }

    // Find target user
    const targetUser = await User.findOne({ username: targetUsername });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if already friends
    if (req.user.friends.includes(targetUser.userId)) {
      return res.status(400).json({ success: false, message: 'Already friends' });
    }

    // Check for duplicate pending request
    const hasPending = await Notification.hasPendingNotification(
      senderId,
      targetUser.userId,
      'friendRequest'
    );
    if (hasPending) {
      return res.status(400).json({ success: false, message: 'Pending request already exists' });
    }

    // Create notification
    const notification = await Notification.create({
      notificationId: generateId('notif'),
      recipientId: targetUser.userId,
      senderId,
      type: 'friendRequest',
      data: { senderUsername }
    });

    // Emit via socket if user is online
    const io = req.app.get('io');
    if (io && targetUser.socketId) {
      io.to(targetUser.socketId).emit('notification:new', notification);
    }

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Respond to match invite
exports.respondToMatchInvite = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { accept } = req.body;
    const userId = req.user.userId;

    const notification = await Notification.findOne({ notificationId });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Verify ownership
    if (notification.recipientId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Verify type and status
    if (notification.type !== 'matchInvite' || notification.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Invalid notification' });
    }

    // Update notification status
    await notification.respond(accept);

    const sender = await User.findOne({ userId: notification.senderId });
    const io = req.app.get('io');

    // Notify sender of response
    const responseNotification = await Notification.create({
      notificationId: generateId('notif'),
      recipientId: notification.senderId,
      senderId: userId,
      type: 'matchInviteResponse',
      data: {
        accepted: accept,
        responderUsername: req.user.username,
        originalNotificationId: notificationId
      }
    });

    if (io && sender?.socketId) {
      io.to(sender.socketId).emit('notification:new', responseNotification);
    }

    // If accepted, create battle
    let battle = null;
    if (accept) {
      battle = await Battle.create({
        battleId: generateId('battle'),
        player1Id: notification.senderId,
        player2Id: userId,
        battleStatus: 'waiting'
      });

      // Notify both players to start battle
      if (io) {
        const battleData = { battleId: battle.battleId, players: [notification.senderId, userId] };
        if (sender?.socketId) io.to(sender.socketId).emit('battle:start', battleData);
        if (req.user.socketId) io.to(req.user.socketId).emit('battle:start', battleData);
      }
    }

    res.json({ success: true, data: { notification, battle } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Respond to friend request
exports.respondToFriendRequest = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { accept } = req.body;
    const userId = req.user.userId;

    const notification = await Notification.findOne({ notificationId });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Verify ownership
    if (notification.recipientId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Verify type and status
    if (notification.type !== 'friendRequest' || notification.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Invalid notification' });
    }

    // Update notification status
    await notification.respond(accept);

    const sender = await User.findOne({ userId: notification.senderId });

    // If accepted, add to friends lists
    if (accept) {
      await User.findOneAndUpdate(
        { userId },
        { $addToSet: { friends: notification.senderId } }
      );
      await User.findOneAndUpdate(
        { userId: notification.senderId },
        { $addToSet: { friends: userId } }
      );
    }

    // Notify sender of response
    const io = req.app.get('io');
    const responseNotification = await Notification.create({
      notificationId: generateId('notif'),
      recipientId: notification.senderId,
      senderId: userId,
      type: 'friendRequestResponse',
      data: {
        accepted: accept,
        responderUsername: req.user.username,
        originalNotificationId: notificationId
      }
    });

    if (io && sender?.socketId) {
      io.to(sender.socketId).emit('notification:new', responseNotification);
    }

    res.json({ success: true, data: { notification } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findOne({ notificationId });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.recipientId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await notification.markAsRead();
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user.userId, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send battle result notifications (called internally after battle ends)
exports.sendBattleResults = async (battleId, winnerId, loserId, summary) => {
  const io = global.io; // Use global io instance
  
  const winner = await User.findOne({ userId: winnerId });
  const loser = await User.findOne({ userId: loserId });

  const createResultNotification = async (recipientId, isWinner) => {
    return await Notification.create({
      notificationId: generateId('notif'),
      recipientId,
      senderId: null, // System notification
      type: 'battleResult',
      data: {
        battleId,
        winnerId,
        loserId,
        winnerUsername: winner?.username,
        loserUsername: loser?.username,
        isWinner,
        summary
      }
    });
  };

  // Create notifications for both players
  const winnerNotif = await createResultNotification(winnerId, true);
  const loserNotif = await createResultNotification(loserId, false);

  // Emit via socket if users are online
  if (io) {
    if (winner?.socketId) io.to(winner.socketId).emit('notification:new', winnerNotif);
    if (loser?.socketId) io.to(loser.socketId).emit('notification:new', loserNotif);
  }

  return { winnerNotif, loserNotif };
};

module.exports = exports;
