const express = require('express');
const router = express.Router();
const { 
  getProfile, 
  getFullProfile,
  updateProfile, 
  uploadAvatar, 
  getStats,
  getBattleHistory, 
  getAllUsers,
  reportUser,
  dismissReport,
  deleteUser,
  getLeaderboard,
  resetSeason
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getAllUsers);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);  // Changed from /update
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);  // Added this
router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);  // Keep for compatibility
router.get('/stats', protect, getStats);  // Changed from /statistics
router.get('/statistics', protect, getStats);  // Keep for compatibility
router.get('/history', protect, getBattleHistory);
router.post('/:id/report', protect, reportUser);
router.post('/report-by-userid/:userId', protect, reportUser);
router.post('/:id/dismiss', protect, dismissReport);
router.delete('/:id', protect, deleteUser);
router.get('/leaderboard', protect, getLeaderboard);
router.patch('/season-reset', protect, resetSeason);


module.exports = router;