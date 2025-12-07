const User = require('../models/User');
const Statistics = require('../models/Statistics');
const Battle = require('../models/Battle');
const generateId = require('../utils/generateId');

// @route   GET /api/user/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId }).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: user  // Changed from 'user' to 'data'
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @route   PUT /api/user/profile (UPDATED)
exports.updateProfile = async (req, res) => {
  try {
    const { username, bio } = req.body;
    
    const user = await User.findOne({ userId: req.user.userId });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    if (username) {
      // Check if username is taken
      const existingUser = await User.findOne({ 
        username, 
        userId: { $ne: req.user.userId } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      
      user.username = username;
    }
    
    if (bio !== undefined) user.bio = bio;
    
    await user.save();
    
    // Return full user object
    const updatedUser = await User.findOne({ userId: req.user.userId }).select('-password');
    
    res.json({ 
      success: true, 
      data: updatedUser  // Changed to return full user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @route   POST /api/user/avatar (NEW - alternative to upload-avatar)
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }
    
    const user = await User.findOne({ userId: req.user.userId });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();
    
    res.json({ 
      success: true, 
      data: { avatar: user.avatar }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @route   GET /api/user/stats (NEW - formatted for frontend)
exports.getStats = async (req, res) => {
  try {
    let stats = await Statistics.findOne({ userId: req.user.userId });
    
    if (!stats) {
      stats = await Statistics.create({
        statId: generateId('stat'),
        userId: req.user.userId
      });
    }
    
    await stats.updateStats();
    
    // Format response for frontend
    res.json({ 
      success: true, 
      data: {
        normalMatches: stats.totalBattles || 0,
        normalWinRate: stats.winRate || 0,
        rankedMatches: 0,
        rankedWinRate: 'N/A'
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @route   GET /api/user/history (UPDATED)
exports.getBattleHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const battles = await Battle.find({
      $or: [{ player1Id: req.user.userId }, { player2Id: req.user.userId }],
      battleStatus: 'completed'
    })
    .sort({ endTime: -1 })
    .limit(limit);
    
    // Format for frontend
    const formattedHistory = battles.map(battle => {
      const isWinner = battle.winnerId === req.user.userId;
      const opponentId = battle.player1Id === req.user.userId ? battle.player2Id : battle.player1Id;
      
      return {
        battleId: battle.battleId,
        result: isWinner ? 'Win' : 'Lose',
        opponent: opponentId, // In production, fetch opponent username
        date: battle.endTime
      };
    });
    
    res.json({ 
      success: true, 
      data: formattedHistory
    });
  } catch (error) {
    console.error('Get battle history error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};