const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  searchUser,
  sendFriendRequest,
  respondToFriendRequest,
  getFriends,
  removeFriend,
  getPendingRequests
} = require('../controllers/friendController');

// All routes require authentication
router.use(protect);

// GET /api/friends/search?username= - Search for a user
router.get('/search', searchUser);

// GET /api/friends - Get friends list
router.get('/', getFriends);

// GET /api/friends/pending - Get pending friend requests
router.get('/pending', getPendingRequests);

// POST /api/friends/request - Send friend request
router.post('/request', sendFriendRequest);

// POST /api/friends/respond - Respond to friend request
router.post('/respond', respondToFriendRequest);

// DELETE /api/friends/:friendUserId - Remove a friend
router.delete('/:friendUserId', removeFriend);

module.exports = router;
