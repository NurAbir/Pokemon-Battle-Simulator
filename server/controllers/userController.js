const User = require('../models/User');
const Statistics = require('../models/Statistics');
const Battle = require('../models/Battle');
const Team = require('../models/Team');
const { generateId } = require('../utils/generateId');

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
// In userController.js - create a new endpoint
exports.getFullProfile = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let stats = await Statistics.findOne({ userId: req.user.userId });
    if (!stats) {
      stats = await Statistics.create({
        statId: generateId('stat'),
        userId: req.user.userId
      });
    }
    await stats.updateStats();

    const team = await Team.findOne({ userId: req.user.userId });

    const battles = await Battle.find({
      $or: [{ player1Id: req.user.userId }, { player2Id: req.user.userId }],
      battleStatus: 'completed'
    })
    .sort({ endTime: -1 })
    .limit(10);

    const formattedHistory = battles.map(battle => ({
      battleId: battle.battleId,
      result: battle.winnerId === req.user.userId ? 'Win' : 'Lose',
      opponent: battle.player1Id === req.user.userId ? battle.player2Id : battle.player1Id,
      date: battle.endTime
    }));

    res.json({
      success: true,
      data: {
        user,
        stats: {
          normalMatches: stats.totalBattles || 0,
          normalWinRate: stats.winRate || 0,
          rankedMatches: 0,
          rankedWinRate: 'N/A'
        },
        team,
        history: formattedHistory
      }
    });
  } catch (error) {
    console.error('Get full profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/user/
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// @route POST /api/user/:id/report/
exports.reportUser = async (req, res) => {
  try {
    // Support both routes: /:id/report (MongoDB _id) and /report-by-userid/:userId (custom userId)
    const id = req.params.id || req.params.userId;
    const reporter = req.body.reportedBy || req.user.username || 'Anonymous';

    if (!id) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    let user;
    if (id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
      user = await User.findById(id);
    } else {
      user = await User.findOne({ userId: id });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent self-reporting
    if (user.userId === req.user.userId) {
      return res.status(400).json({ success: false, message: 'You cannot report yourself' });
    }

    // Avoid duplicate reports from same user
    if (!user.reportedBy.includes(reporter)) {
      user.reportedBy.push(reporter);
    }

    // Auto-flag if 3+ reports
    if (user.reportedBy.length >= 3) {
      user.status = 'suspicious';
    }

    await user.save();

    res.json({ 
      success: true, 
      message: 'Report submitted successfully',
      reportsCount: user.reportedBy.length
    });
  } catch (err) {
    console.error("Report error:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route POST /api/user/:id/dismiss
exports.dismissReport = async (req, res) => {
  try {
    const { id } = req.params;
    // Find user by MongoDB _id and update status to 'safe' and clear reports
    const user = await User.findByIdAndUpdate(
      id,
      { $set: { status: 'safe', reportedBy: [] } },
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Dismiss failed:", err);
    res.status(500).json({ message: err.message });
  }
}

// @route DELETE /api/user/:id/
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    let user;
    
    // Check if ID is a MongoDB ObjectId
    if (id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
      user = await User.findByIdAndDelete(id); 
    } else {
      // Fallback: Delete by the 'userId' string defined in your schema
      user = await User.findOneAndDelete({ userId: id });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found or already banned" });
    }

    res.json({ message: "User banned successfully", user });
  } catch (err) {
    console.error("User ban failed:", err);
    res.status(500).json({ message: err.message });
  }
};


// @route GET /api/user/leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    // Corrected to match 'eloRating' field in User.js schema
    const users = await User.find().sort({ eloRating: -1 }).limit(10);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// @route PATCH /api/user/season-reset 
exports.resetSeason = async (req, res) => {
   try {
    // to be implemented 
    res.json({ message: "Season reset successful. All rankings normalized." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}