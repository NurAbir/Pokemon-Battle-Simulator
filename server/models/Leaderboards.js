const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  leaderboardId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  ranking: {
    type: Number,
    required: true
  },
  losses: {
    type: Number,
    default: 0
  },
  wins: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Update rankings
leaderboardSchema.methods.updateRanking = async function() {
  const allEntries = await this.constructor.find().sort({ wins: -1, losses: 1 });
  for (let i = 0; i < allEntries.length; i++) {
    allEntries[i].ranking = i + 1;
    await allEntries[i].save();
  }
};

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
