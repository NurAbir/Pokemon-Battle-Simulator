const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getChatHistory,
  getGlobalChat,
  getPrivateChat,
  getPrivateChats,
  getBattleChat,
  sendMessage
} = require('../controllers/chatController');

// All routes require authentication
router.use(protect);

// GET /api/chat/global - Get global chat room and history
router.get('/global', getGlobalChat);

// GET /api/chat/private - Get user's private chat list
router.get('/private', getPrivateChats);

// GET /api/chat/private/:targetUsername - Get or create private chat with user
router.get('/private/:targetUsername', getPrivateChat);

// GET /api/chat/battle/:battleId - Get battle chat room
router.get('/battle/:battleId', getBattleChat);

// GET /api/chat/room/:roomId - Get chat history for any room
router.get('/room/:roomId', getChatHistory);

// POST /api/chat/room/:roomId/message - Send message (HTTP fallback)
router.post('/room/:roomId/message', sendMessage);

module.exports = router;
