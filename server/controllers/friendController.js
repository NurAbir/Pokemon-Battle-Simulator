const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Notification = require('../models/Notification');
const { generateId } = require('../utils/generateId');

// Search for a user by username
exports.searchUser = async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username || username.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username must be at least 2 characters' 
      });
    }
    
    // Case-insensitive exact match
    const user = await User.findOne({ 
      username: { $regex: new RegExp(`^${username.trim()}$`, 'i') }
    }).select('userId username avatar eloRating isOnline');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User does not exist' });
    }
    
    // Don't return self
    if (user.userId === req.user.userId) {
      return res.status(400).json({ success: false, message: 'Cannot search for yourself' });
    }
    
    // Check friendship status
    const isFriend = req.user.friends?.includes(user.userId);
    
    // Check pending request status
    const pendingRequest = await FriendRequest.findPendingBetween(req.user.userId, user.userId);
    
    res.json({
      success: true,
      data: {
        userId: user.userId,
        username: user.username,
        avatar: user.avatar,
        eloRating: user.eloRating,
        isOnline: user.isOnline,
        isFriend,
        hasPendingRequest: !!pendingRequest,
        pendingRequestDirection: pendingRequest 
          ? (pendingRequest.fromUserId === req.user.userId ? 'outgoing' : 'incoming')
          : null
      }
    });
  } catch (error) {
    console.error('Search user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send friend request
exports.sendFriendRequest = async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username required' });
    }
    
    // Find target user (case-insensitive)
    const targetUser = await User.findOne({ 
      username: { $regex: new RegExp(`^${username.trim()}$`, 'i') }
    });
    
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User does not exist' });
    }
    
    // Prevent self-request
    if (targetUser.userId === req.user.userId) {
      return res.status(400).json({ success: false, message: 'Cannot send friend request to yourself' });
    }
    
    // Check if already friends
    if (req.user.friends?.includes(targetUser.userId)) {
      return res.status(400).json({ success: false, message: 'Already friends with this user' });
    }
    
    // Check for existing request (either direction)
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { fromUserId: req.user.userId, toUserId: targetUser.userId },
        { fromUserId: targetUser.userId, toUserId: req.user.userId }
      ],
      status: { $in: ['pending', 'accepted'] }
    });
    
    if (existingRequest) {
      if (existingRequest.status === 'accepted') {
        return res.status(400).json({ success: false, message: 'Already friends with this user' });
      }
      if (existingRequest.fromUserId === req.user.userId) {
        return res.status(400).json({ success: false, message: 'Friend request already sent' });
      }
      // They sent us a request - suggest accepting instead
      return res.status(400).json({ 
        success: false, 
        message: 'This user has already sent you a friend request'
      });
    }
    
    // Create friend request
    const friendRequest = await FriendRequest.create({
      requestId: generateId('freq'),
      fromUserId: req.user.userId,
      toUserId: targetUser.userId,
      status: 'pending'
    });
    
    // Create notification for recipient
    const notification = await Notification.createFriendRequest(
      req.user.userId,
      req.user.username,
      targetUser.userId,
      friendRequest.requestId
    );
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${targetUser.userId}`).emit('newNotification', notification);
    }
    
    res.status(201).json({ 
      success: true, 
      data: { 
        requestId: friendRequest.requestId,
        toUsername: targetUser.username
      }
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Friend request already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Respond to friend request
exports.respondToFriendRequest = async (req, res) => {
  try {
    const { requestId, action } = req.body;
    
    if (!requestId || !['accept', 'deny'].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Request ID and valid action (accept/deny) required' 
      });
    }
    
    const friendRequest = await FriendRequest.findOne({ requestId });
    
    if (!friendRequest) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }
    
    // Only recipient can respond
    if (friendRequest.toUserId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this request' });
    }
    
    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already responded to' });
    }
    
    const sender = await User.findOne({ userId: friendRequest.fromUserId });
    if (!sender) {
      return res.status(404).json({ success: false, message: 'Request sender no longer exists' });
    }
    
    const io = req.app.get('io');
    
    if (action === 'accept') {
      friendRequest.status = 'accepted';
      await friendRequest.save();
      
      // Add to each other's friends list
      await User.updateOne(
        { userId: req.user.userId },
        { $addToSet: { friends: sender.userId } }
      );
      await User.updateOne(
        { userId: sender.userId },
        { $addToSet: { friends: req.user.userId } }
      );
      
      // Notify sender
      const acceptNotification = await Notification.create({
        notificationId: generateId('notif'),
        recipientId: sender.userId,
        senderId: req.user.userId,
        type: 'friendRequestAccepted',
        payload: {
          username: req.user.username,
          message: `${req.user.username} accepted your friend request!`
        }
      });
      
      if (io) {
        io.to(`user_${sender.userId}`).emit('newNotification', acceptNotification);
        io.to(`user_${sender.userId}`).emit('friendAdded', { 
          userId: req.user.userId, 
          username: req.user.username 
        });
        io.to(`user_${req.user.userId}`).emit('friendAdded', { 
          userId: sender.userId, 
          username: sender.username 
        });
      }
      
      // Mark original notification as read
      await Notification.updateOne(
        { 'payload.requestId': requestId, recipientId: req.user.userId },
        { isRead: true, status: 'accepted' }
      );
      
      res.json({ 
        success: true, 
        data: { 
          action: 'accepted',
          friend: { userId: sender.userId, username: sender.username }
        }
      });
    } else {
      friendRequest.status = 'rejected';
      await friendRequest.save();
      
      // Notify sender
      const denyNotification = await Notification.create({
        notificationId: generateId('notif'),
        recipientId: sender.userId,
        senderId: req.user.userId,
        type: 'friendRequestDenied',
        payload: {
          username: req.user.username,
          message: `${req.user.username} declined your friend request.`
        }
      });
      
      if (io) {
        io.to(`user_${sender.userId}`).emit('newNotification', denyNotification);
      }
      
      // Mark original notification as read
      await Notification.updateOne(
        { 'payload.requestId': requestId, recipientId: req.user.userId },
        { isRead: true, status: 'denied' }
      );
      
      res.json({ success: true, data: { action: 'denied' } });
    }
  } catch (error) {
    console.error('Respond to friend request error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get friends list
exports.getFriends = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    
    if (!user.friends || user.friends.length === 0) {
      return res.json({ success: true, data: [] });
    }
    
    const friends = await User.find({ 
      userId: { $in: user.friends } 
    }).select('userId username avatar eloRating isOnline');
    
    res.json({ success: true, data: friends });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove friend
exports.removeFriend = async (req, res) => {
  try {
    const { friendUserId } = req.params;
    
    // Remove from both users' friends lists
    await User.updateOne(
      { userId: req.user.userId },
      { $pull: { friends: friendUserId } }
    );
    await User.updateOne(
      { userId: friendUserId },
      { $pull: { friends: req.user.userId } }
    );
    
    // Notify both via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${friendUserId}`).emit('friendRemoved', { userId: req.user.userId });
      io.to(`user_${req.user.userId}`).emit('friendRemoved', { userId: friendUserId });
    }
    
    res.json({ success: true, message: 'Friend removed' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get pending friend requests (incoming)
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      toUserId: req.user.userId,
      status: 'pending'
    }).sort({ createdAt: -1 });
    
    // Get sender info
    const requestsWithSenders = await Promise.all(
      requests.map(async (request) => {
        const sender = await User.findOne({ userId: request.fromUserId })
          .select('userId username avatar');
        return {
          requestId: request.requestId,
          from: sender,
          createdAt: request.createdAt
        };
      })
    );
    
    res.json({ success: true, data: requestsWithSenders });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
