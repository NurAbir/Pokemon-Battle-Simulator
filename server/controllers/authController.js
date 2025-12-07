const User = require('../models/User');
const Statistics = require('../models/Statistics');
const jwt = require('jsonwebtoken');
const generateId = require('../utils/generateId');

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      userId: generateId('user'),
      username,
      email,
      password
    });

    // Create initial statistics
    await Statistics.create({
      statId: generateId('stat'),
      userId: user.userId
    });

    // Generate token
    const token = generateToken(user.userId);

    res.status(201).json({
      success: true,
      token,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        eloRating: user.eloRating
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update online status
    user.isOnline = true;
    await user.save();

    // Generate token
    const token = generateToken(user.userId);

    res.json({
      success: true,
      token,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        eloRating: user.eloRating
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    req.user.isOnline = false;
    await req.user.save();
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};