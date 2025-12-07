const mongoose = require('mongoose');

const battleSchema = new mongoose.Schema({
  battleId: {
    type: String,
    required: true,
    unique: true
  },
  player1Id: {
    type: String,
    required: true,
    ref: 'User'
  },
  player2Id: {
    type: String,
    required: true,
    ref: 'User'
  },
  battleStatus: {
    type: String,
    required: true,
    enum: ['waiting', 'in_progress', 'completed', 'forfeited'],
    default: 'waiting'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  winnerId: {
    type: String,
    default: null,
    ref: 'User'
  }
}, { timestamps: true });

// Start battle
battleSchema.methods.startBattle = async function() {
  this.battleStatus = 'in_progress';
  this.startTime = new Date();
  await this.save();
};

// Execute turn
battleSchema.methods.executeTurn = async function(playerId, moveId) {
  // Battle logic here
  console.log(`Player ${playerId} used move ${moveId}`);
};

// End battle
battleSchema.methods.endBattle = async function(winnerId) {
  this.battleStatus = 'completed';
  this.endTime = new Date();
  this.winnerId = winnerId;
  await this.save();
  
  // Update statistics for both players
  const Statistics = mongoose.model('Statistics');
  await Statistics.findOneAndUpdate(
    { userId: this.player1Id },
    { $inc: { totalBattles: 1 } }
  );
  await Statistics.findOneAndUpdate(
    { userId: this.player2Id },
    { $inc: { totalBattles: 1 } }
  );
};

// Forfeit
battleSchema.methods.forfeit = async function(playerId) {
  this.battleStatus = 'forfeited';
  this.endTime = new Date();
  this.winnerId = playerId === this.player1Id ? this.player2Id : this.player1Id;
  await this.save();
};

module.exports = mongoose.model('Battle', battleSchema);
