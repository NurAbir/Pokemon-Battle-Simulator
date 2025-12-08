const socketIo = require('socket.io');

const initializeSocket = (httpServer) => {
  const io = socketIo(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    // Verify token here with auth logic
    // For now, just pass through is enough
    socket.userId = socket.handshake.auth.userId;
    next();
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user-specific room for targeted notifications
    socket.join(`user_${socket.userId}`);

    // Listen for client requesting notification updates
    socket.on('request_notifications', async (data) => {
      // Handled by the REST API
      socket.emit('notifications_update', data);
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      socket.leave(`user_${socket.userId}`);
    });
  });

  return io;
};

module.exports = initializeSocket;
