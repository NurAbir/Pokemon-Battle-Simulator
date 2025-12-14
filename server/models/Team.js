const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  pokemonId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  types: [{
    type: String
  }],
  baseStats: {
    baseHP: Number,
    baseAttack: Number,
    baseDefense: Number,
    baseSpAttack: Number,
    baseSpDefense: Number,
    baseSpeed: Number
  },
  selectedMoves: [{
    moveId: String,
    name: String,
    type: String,
    power: Number,
    accuracy: Number
  }],
  selectedAbility: {
    abilityId: String,
    name: String,
    description: String
  }
});

const teamSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One team per user
  },
  teamName: {
    type: String,
    default: 'My Team'
  },
  pokemon: [teamMemberSchema]
}, {
  timestamps: true
});

// Validate team has max 6 pokemon
teamSchema.pre('save', function(next) {
  if (this.pokemon.length > 6) {
    next(new Error('Team cannot have more than 6 Pokemon'));
  }
  next();
});

module.exports = mongoose.model('Team', teamSchema);