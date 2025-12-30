// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const connectDB = require('./config/database');
const battleHandler = require('./sockets/battleHandler');
const notificationHandler = require('./sockets/notificationHandler');
const chatHandler = require('./sockets/chatHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize app
const app = express();
const server = http.createServer(app);

// Trust proxy (IMPORTANT for Render)
app.set('trust proxy', 1);

// Allowed origins
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000'
].filter(Boolean);

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io available to routes
app.set('io', io);

// CORS Configuration (HTTP)
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const teamRoutes = require('./routes/team');
const battleRoutes = require('./routes/battleRoutes');
const notificationRoutes = require('./routes/notification');
const friendRoutes = require('./routes/friend');
const chatRoutes = require('./routes/chat');

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// --------------------
// SOCKET.IO HANDLERS
// --------------------
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  notificationHandler(io, socket);
  chatHandler(io, socket);
  battleHandler(io, socket);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// --------------------
// SERVE FRONTEND (SPA)
// --------------------
app.use(express.static(path.join(__dirname, 'client', 'build')));

// API 404 (ONLY for API routes)
app.use('/api/{*splat}', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// SPA fallback (CRITICAL FIX)
app.get('*', (req, res) => {
  res.sendFile(
    path.join(__dirname, 'client', 'build', 'index.html')
  );
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Socket.IO server ready');
});

module.exports = { io };
