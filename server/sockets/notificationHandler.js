const Notification = require('../models/Notification');
const User = require('../models/User');

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map();

module.exports = (io, socket) => {
  // User joins their notification room
  socket.on('joinNotificationRoom', async ({ userId }) => {
    if (!userId) return;
    
    const room = `user_${userId}`;
    socket.join(room);
    
    // Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    
    // Update user online status
    await User.updateOne({ userId }, { isOnline: true });
    
    // Broadcast online status to friends
    const user = await User.findOne({ userId }).select('friends username');
    if (user?.friends) {
      user.friends.forEach(friendId => {
        io.to(`user_${friendId}`).emit('userOnline', { 
          userId, 
          username: user.username 
        });
      });
    }
    
    // Send unread notification count
    const unreadCount = await Notification.countDocuments({
      recipientId: userId,
      isRead: false
    });
    socket.emit('unreadNotificationCount', { count: unreadCount });
    
    console.log(`User ${userId} joined notification room`);
  });
  
  // User leaves notification room
  socket.on('leaveNotificationRoom', async ({ userId }) => {
    if (!userId) return;
    
    const room = `user_${userId}`;
    socket.leave(room);
    
    // Remove from online tracking
    if (onlineUsers.has(userId)) {
      onlineUsers.get(userId).delete(socket.id);
      if (onlineUsers.get(userId).size === 0) {
        onlineUsers.delete(userId);
        
        // Update user offline status
        await User.updateOne({ userId }, { isOnline: false });
        
        // Broadcast offline status to friends
        const user = await User.findOne({ userId }).select('friends username');
        if (user?.friends) {
          user.friends.forEach(friendId => {
            io.to(`user_${friendId}`).emit('userOffline', { 
              userId, 
              username: user.username 
            });
          });
        }
      }
    }
    
    console.log(`User ${userId} left notification room`);
  });
  
  // Handle disconnect - clean up user rooms
  socket.on('disconnect', async () => {
    // Find and remove user from online tracking
    for (const [userId, sockets] of onlineUsers.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          await User.updateOne({ userId }, { isOnline: false });
          
          const user = await User.findOne({ userId }).select('friends username');
          if (user?.friends) {
            user.friends.forEach(friendId => {
              io.to(`user_${friendId}`).emit('userOffline', { 
                userId, 
                username: user.username 
              });
            });
          }
        }
        break;
      }
    }
  });
};

// Export helper to check if user is online
module.exports.isUserOnline = (userId) => {
  return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
};

// Export helper to get online users map
module.exports.getOnlineUsers = () => onlineUsers;
