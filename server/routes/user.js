const express = require('express');
const router = express.Router();
const { 
  getProfile, 
  updateProfile, 
  uploadAvatar, 
  getStats,
  getBattleHistory 
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);  // Changed from /update
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);  // Added this
router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);  // Keep for compatibility
router.get('/stats', protect, getStats);  // Changed from /statistics
router.get('/statistics', protect, getStats);  // Keep for compatibility
router.get('/history', protect, getBattleHistory);


module.exports = router;