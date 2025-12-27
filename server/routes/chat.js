const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getGlobalChat,
  getPrivateChat,
  getBattleChat,
  getChatHistory,
  getPrivateChatList,
  markRoomAsRead
} = require('../controllers/chatController');

// All routes require authentication
router.use(protect);

// GET /api/chat/global - Get global chat room and messages
router.get('/global', getGlobalChat);

// GET /api/chat/private - Get list of private chats
router.get('/private', getPrivateChatList);

// GET /api/chat/private/:userId - Get or create private chat with user
router.get('/private/:userId', getPrivateChat);

// GET /api/chat/battle/:battleId - Get battle chat room
router.get('/battle/:battleId', getBattleChat);

// GET /api/chat/history/:roomId - Get chat history with pagination
router.get('/history/:roomId', getChatHistory);

// PUT /api/chat/:roomId/read - Mark room messages as read
router.put('/:roomId/read', markRoomAsRead);

module.exports = router;
