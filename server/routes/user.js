const express = require('express');
const router = express.Router();
const { 
  getProfile, 
  updateProfile, 
  uploadAvatar, 
  getStatistics,
  getBattleHistory 
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/profile', protect, getProfile);
router.put('/update', protect, updateProfile);
router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);
router.get('/statistics', protect, getStatistics);
router.get('/history', protect, getBattleHistory);

module.exports = router;