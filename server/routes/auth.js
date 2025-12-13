const express = require('express');
const router = express.Router();
const {
  signup,
  register,
  login,
  logout,
  forgotPassword,
  verifyCode,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/signup', signup);
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-code', verifyCode);
router.post('/reset-password', resetPassword);

// Protected routes
router.post('/logout', protect, logout);

module.exports = router;