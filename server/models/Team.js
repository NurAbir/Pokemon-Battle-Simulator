const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  name: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create team
teamSchema.statics.createTeam = async function(userId, name) {
  const team = new this({
    teamId: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    name
  });
  await team.save();
  return team;
};

// Edit team
teamSchema.methods.editTeam = async function(newName) {
  this.name = newName;
  this.updatedAt = new Date();
  await this.save();
};

// Validate equality (check if team is valid)
teamSchema.methods.validateEquality = async function() {
  const TeamPokemon = mongoose.model('TeamPokemon');
  const pokemons = await TeamPokemon.find({ teamId: this.teamId });
  
  // Must have exactly 6 Pokémon
  return pokemons.length === 6;
};

module.exports = mongoose.model('Team', teamSchema);
