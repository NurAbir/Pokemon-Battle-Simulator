const mongoose = require('mongoose');

const statisticsSchema = new mongoose.Schema({
  statId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  totalBattles: {
    type: Number,
    default: 0
  },
  losses: {
    type: Number,
    default: 0
  },
  winRate: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Update statistics
statisticsSchema.methods.updateStats = async function() {
  const Battle = mongoose.model('Battle');
  const battles = await Battle.find({
    $or: [{ player1Id: this.userId }, { player2Id: this.userId }]
  });
  
  this.totalBattles = battles.length;
  const wins = battles.filter(b => b.winnerId === this.userId).length;
  this.losses = this.totalBattles - wins;
  this.winRate = this.totalBattles > 0 ? (wins / this.totalBattles) * 100 : 0;
  
  await this.save();
};

module.exports = mongoose.model('Statistics', statisticsSchema);
