const Team = require('../models/Team');

// Get user's team
exports.getMyTeam = async (req, res) => {
  try {
    const team = await Team.findOne({ userId: req.user._id });
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'No team found for this user'
      });
    }
    
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching team',
      error: error.message
    });
  }
};

// Create new team
exports.createTeam = async (req, res) => {
  try {
    const { teamName, pokemon } = req.body;
    
    // Check if user already has a team
    const existingTeam = await Team.findOne({ userId: req.user._id });
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'You already have a team. Use update endpoint to modify it.'
      });
    }
    
    // Validate pokemon array
    if (!pokemon || !Array.isArray(pokemon)) {
      return res.status(400).json({
        success: false,
        message: 'Pokemon array is required'
      });
    }
    
    if (pokemon.length > 6) {
      return res.status(400).json({
        success: false,
        message: 'Team cannot have more than 6 Pokemon'
      });
    }
    
    // Validate each pokemon has max 4 moves
    for (let p of pokemon) {
      if (p.selectedMoves && p.selectedMoves.length > 4) {
        return res.status(400).json({
          success: false,
          message: 'Each Pokemon cannot have more than 4 moves'
        });
      }
    }
    
    // Create new team
    const team = await Team.create({
      userId: req.user._id,
      teamName: teamName || 'My Team',
      pokemon
    });
    
    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating team',
      error: error.message
    });
  }
};

// Update existing team
exports.updateTeam = async (req, res) => {
  try {
    const { teamName, pokemon } = req.body;
    
    // Find existing team
    let team = await Team.findOne({ userId: req.user._id });
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'No team found. Use create endpoint first.'
      });
    }
    
    // Validate pokemon array if provided
    if (pokemon) {
      if (!Array.isArray(pokemon)) {
        return res.status(400).json({
          success: false,
          message: 'Pokemon must be an array'
        });
      }
      
      if (pokemon.length > 6) {
        return res.status(400).json({
          success: false,
          message: 'Team cannot have more than 6 Pokemon'
        });
      }
      
      // Validate each pokemon has max 4 moves
      for (let p of pokemon) {
        if (p.selectedMoves && p.selectedMoves.length > 4) {
          return res.status(400).json({
            success: false,
            message: 'Each Pokemon cannot have more than 4 moves'
          });
        }
      }
      
      team.pokemon = pokemon;
    }
    
    if (teamName) {
      team.teamName = teamName;
    }
    
    await team.save();
    
    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating team',
      error: error.message
    });
  }
};

// Delete user's team
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findOneAndDelete({ userId: req.user._id });
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'No team found to delete'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting team',
      error: error.message
    });
  }
};

// Clear team (remove all pokemon but keep team)
exports.clearTeam = async (req, res) => {
  try {
    const team = await Team.findOne({ userId: req.user._id });
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'No team found'
      });
    }
    
    team.pokemon = [];
    await team.save();
    
    res.status(200).json({
      success: true,
      message: 'Team cleared successfully',
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing team',
      error: error.message
    });
  }
};