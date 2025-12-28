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

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io available to routes
app.set('io', io);

// CORS Configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const teamRoutes = require('./routes/team');
const battleRoutes = require('./routes/battleRoutes');
const notificationRoutes = require('./routes/notification');
const friendRoutes = require('./routes/friend');
const chatRoutes = require('./routes/chat');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/chat', chatRoutes);

// Initialize socket handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Register notification socket events
  notificationHandler(io, socket);
  
  // Register chat socket events
  chatHandler(io, socket);
});

// Initialize battle handler (has its own io.on('connection'))
battleHandler(io);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
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
  console.log(`Socket.IO server ready for connections`);
});

module.exports = { io };