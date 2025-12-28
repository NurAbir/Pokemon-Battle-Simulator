const Notification = require('../models/Notification');
const User = require('../models/User');
const Team = require('../models/Team');
const { generateId } = require('../utils/generateId');

// Get notifications for authenticated user
exports.getNotifications = async (req, res) => {
  try {
    const { limit = 50, unreadOnly = false, type } = req.query;
    
    const query = { recipientId: req.user.userId };
    
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    if (type) {
      query.type = type;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipientId: req.user.userId,
      isRead: false
    });
    
    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findOne({ notificationId });
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    // Verify ownership
    if (notification.recipientId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Mark as read error:', error);
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
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send match invite
exports.sendMatchInvite = async (req, res) => {
  try {
    const { recipientUsername, teamId } = req.body;
    
    if (!recipientUsername || !teamId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Recipient username and team ID required' 
      });
    }
    
    // Prevent self-invite
    if (recipientUsername.toLowerCase() === req.user.username.toLowerCase()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot invite yourself to battle' 
      });
    }
    
    // Find recipient
    const recipient = await User.findOne({ 
      username: { $regex: new RegExp(`^${recipientUsername}$`, 'i') }
    });
    
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Verify team belongs to sender
    const team = await Team.findOne({ 
      $or: [{ teamId }, { _id: teamId }],
      userId: req.user._id
    });
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    // Check for duplicate pending invite
    const existingInvite = await Notification.findOne({
      senderId: req.user.userId,
      recipientId: recipient.userId,
      type: 'matchInvite',
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });
    
    if (existingInvite) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have a pending invite to this user' 
      });
    }
    
    // Create notification
    const notification = await Notification.createMatchInvite(
      req.user.userId,
      req.user.username,
      recipient.userId,
      teamId
    );
    
    // Emit socket event (will be handled by socket handler)
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${recipient.userId}`).emit('newNotification', notification);
    }
    
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    console.error('Send match invite error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Respond to match invite
exports.respondToMatchInvite = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { action, teamId } = req.body;
    
    if (!['accept', 'deny'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }
    
    const notification = await Notification.findOne({ notificationId });
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    // Verify ownership
    if (notification.recipientId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    if (notification.type !== 'matchInvite') {
      return res.status(400).json({ success: false, message: 'Not a match invite' });
    }
    
    if (notification.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Invite already responded to' });
    }
    
    // Check expiry
    if (notification.isExpired()) {
      notification.status = 'expired';
      await notification.save();
      return res.status(400).json({ success: false, message: 'Invite has expired' });
    }
    
    notification.status = action === 'accept' ? 'accepted' : 'denied';
    notification.isRead = true;
    await notification.save();
    
    const io = req.app.get('io');
    
    if (action === 'accept') {
      // Verify responder has a team
      if (!teamId) {
        return res.status(400).json({ success: false, message: 'Team ID required to accept battle' });
      }
      
      // Return battle setup info - actual battle creation handled by socket
      res.json({ 
        success: true, 
        data: { 
          action: 'accepted',
          senderUserId: notification.senderId,
          senderTeamId: notification.payload.teamId,
          responderTeamId: teamId
        }
      });
    } else {
      // Notify sender of denial
      const denialNotification = await Notification.create({
        notificationId: generateId('notif'),
        recipientId: notification.senderId,
        senderId: req.user.userId,
        type: 'matchInviteDenied',
        payload: {
          username: req.user.username,
          message: `${req.user.username} declined your battle invite.`
        },
        isRead: false
      });
      
      if (io) {
        io.to(`user_${notification.senderId}`).emit('newNotification', denialNotification);
      }
      
      res.json({ success: true, data: { action: 'denied' } });
    }
  } catch (error) {
    console.error('Respond to match invite error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findOne({ notificationId });
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    if (notification.recipientId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    await notification.deleteOne();
    
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
