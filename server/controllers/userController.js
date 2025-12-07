const User = require('../models/User');
const Statistics = require('../models/Statistics');
const Battle = require('../models/Battle');

// @route   GET /api/user/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId }).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/user/update
exports.updateProfile = async (req, res) => {
  try {
    const { username, bio } = req.body;
    
    const user = await User.findOne({ userId: req.user.userId });
    
    if (username) user.username = username;
    if (bio !== undefined) user.bio = bio;
    
    await user.save();
    
    res.json({ success: true, user: { username: user.username, bio: user.bio } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/user/upload-avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const user = await User.findOne({ userId: req.user.userId });
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();
    
    res.json({ success: true, avatar: user.avatar });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/user/statistics
exports.getStatistics = async (req, res) => {
  try {
    let stats = await Statistics.findOne({ userId: req.user.userId });
    
    if (!stats) {
      stats = await Statistics.create({
        statId: generateId('stat'),
        userId: req.user.userId
      });
    }
    
    await stats.updateStats();
    
    res.json({ success: true, statistics: stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/user/history
exports.getBattleHistory = async (req, res) => {
  try {
    const battles = await Battle.find({
      $or: [{ player1Id: req.user.userId }, { player2Id: req.user.userId }],
      battleStatus: 'completed'
    })
    .sort({ endTime: -1 })
    .limit(10)
    .populate('player1Id player2Id', 'username avatar');
    
    res.json({ success: true, history: battles });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};