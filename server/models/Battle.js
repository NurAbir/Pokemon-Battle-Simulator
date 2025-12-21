// models/Battle.js
const mongoose = require('mongoose');

const battlePokemonSchema = new mongoose.Schema({
  pokemonId: { type: Number, required: true },
  name: { type: String, required: true },
  nickname: { type: String, required: true },
  level: { type: Number, required: true },
  types: [String],
  currentHp: { type: Number, required: true },
  maxHp: { type: Number, required: true },
  stats: {
    atk: Number,
    def: Number,
    spa: Number,
    spd: Number,
    spe: Number
  },
  moves: [String],
  statusCondition: { type: String, default: null },
  statStages: {
    atk: { type: Number, default: 0 },
    def: { type: Number, default: 0 },
    spa: { type: Number, default: 0 },
    spd: { type: Number, default: 0 },
    spe: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    evasion: { type: Number, default: 0 }
  },
  fainted: { type: Boolean, default: false }
});

const playerSchema = new mongoose.Schema({
  userId: { 
    type: String,  // CHANGED: Use String instead of ObjectId
    required: true 
  },
  username: { type: String, required: true },
  team: [battlePokemonSchema],
  activePokemonIndex: { type: Number, default: 0 },
  selectedMove: { type: String, default: null },
  switchTo: { type: Number, default: null },
  ready: { type: Boolean, default: false }
});

const battleSchema = new mongoose.Schema({
  battleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  players: {
    type: [playerSchema],
    validate: {
      validator: function(v) {
        return v.length === 2;
      },
      message: 'Battle must have exactly 2 players'
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'forfeit'],
    default: 'active'
  },
  turn: { type: Number, default: 1 },
  winner: { 
    type: String,  // CHANGED: Use String instead of ObjectId
    default: null 
  },
  battleLog: [String]
}, {
  timestamps: true
});

// Helper method to add log entry
battleSchema.methods.addLog = function(message) {
  this.battleLog.push(message);
};

// Helper method to get active Pokemon for a player
battleSchema.methods.getActivePokemon = function(playerIndex) {
  const player = this.players[playerIndex];
  return player.team[player.activePokemonIndex];
};

// Helper method to check if battle has ended
battleSchema.methods.checkBattleEnd = function() {
  for (let i = 0; i < 2; i++) {
    const player = this.players[i];
    const hasAlivePokemon = player.team.some(p => !p.fainted);
    
    if (!hasAlivePokemon) {
      this.status = 'completed';
      this.winner = this.players[1 - i].userId;
      this.addLog(`${this.players[1 - i].username} wins the battle!`);
      return true;
    }
  }
  return false;
};

// Add indexes for better query performance
battleSchema.index({ 'players.userId': 1 });
battleSchema.index({ status: 1 });
battleSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Battle', battleSchema);