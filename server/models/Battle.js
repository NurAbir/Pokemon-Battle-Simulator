// models/Battle.js
const mongoose = require('mongoose');

const battlePokemonSchema = new mongoose.Schema({
  pokemonId: String,
  name: String,
  nickname: String,
  level: Number,
  types: [String],
  currentHp: Number,
  maxHp: Number,
  stats: {
    atk: Number,
    def: Number,
    spa: Number,
    spd: Number,
    spe: Number
  },
  moves: [String],
  statusCondition: {
    type: String,
    enum: ['burn', 'paralysis', 'poison', 'sleep', 'freeze', null],
    default: null
  },
  statStages: {
    atk: { type: Number, default: 0, min: -6, max: 6 },
    def: { type: Number, default: 0, min: -6, max: 6 },
    spa: { type: Number, default: 0, min: -6, max: 6 },
    spd: { type: Number, default: 0, min: -6, max: 6 },
    spe: { type: Number, default: 0, min: -6, max: 6 },
    accuracy: { type: Number, default: 0, min: -6, max: 6 },
    evasion: { type: Number, default: 0, min: -6, max: 6 }
  },
  fainted: { type: Boolean, default: false }
});

const playerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: String,
  team: [battlePokemonSchema],
  activePokemonIndex: { type: Number, default: 0 },
  selectedMove: String,
  selectedTarget: Number,
  switchTo: Number,
  ready: { type: Boolean, default: false }
});

const battleSchema = new mongoose.Schema({
  battleId: {
    type: String,
    required: true,
    unique: true
  },
  players: [playerSchema],
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed'],
    default: 'waiting'
  },
  turn: { type: Number, default: 1 },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  battleLog: [{
    turn: Number,
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add log entry
battleSchema.methods.addLog = function(message) {
  this.battleLog.push({
    turn: this.turn,
    message: message,
    timestamp: new Date()
  });
};

// Get active Pokemon for a player
battleSchema.methods.getActivePokemon = function(playerIndex) {
  const player = this.players[playerIndex];
  return player.team[player.activePokemonIndex];
};

// Check if battle is over
battleSchema.methods.checkBattleEnd = function() {
  for (let i = 0; i < this.players.length; i++) {
    const allFainted = this.players[i].team.every(p => p.fainted);
    if (allFainted) {
      this.status = 'completed';
      this.winner = this.players[1 - i].userId;
      return true;
    }
  }
  return false;
};

module.exports = mongoose.model('Battle', battleSchema);