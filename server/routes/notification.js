const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  sendMatchInvite,
  respondToMatchInvite,
  deleteNotification
} = require('../controllers/notificationController');

// All routes require authentication
router.use(protect);

// GET /api/notifications - Get user's notifications
router.get('/', getNotifications);

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', getUnreadCount);

// PUT /api/notifications/:notificationId/read - Mark single notification as read
router.put('/:notificationId/read', markAsRead);

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', markAllAsRead);

// POST /api/notifications/match-invite - Send a match invite
router.post('/match-invite', sendMatchInvite);

// POST /api/notifications/:notificationId/respond-match - Respond to match invite
router.post('/:notificationId/respond-match', respondToMatchInvite);

// DELETE /api/notifications/:notificationId - Delete notification
router.delete('/:notificationId', deleteNotification);

module.exports = router;
