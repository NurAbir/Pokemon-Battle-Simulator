const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  sendMatchInvite,
  sendFriendRequest,
  respondToMatchInvite,
  respondToFriendRequest,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');

// All routes require authentication
router.use(protect);

// GET /api/notifications - Get user's notifications
router.get('/', getNotifications);

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', getUnreadCount);

// POST /api/notifications/match-invite - Send match invite
router.post('/match-invite', sendMatchInvite);

// POST /api/notifications/friend-request - Send friend request
router.post('/friend-request', sendFriendRequest);

// PUT /api/notifications/:notificationId/respond-match - Respond to match invite
router.put('/:notificationId/respond-match', respondToMatchInvite);

// PUT /api/notifications/:notificationId/respond-friend - Respond to friend request
router.put('/:notificationId/respond-friend', respondToFriendRequest);

// PUT /api/notifications/:notificationId/read - Mark notification as read
router.put('/:notificationId/read', markAsRead);

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', markAllAsRead);

module.exports = router;
