const mongoose = require('mongoose');

const battleLogSchema = new mongoose.Schema({
  logId: {
    type: String,
    required: true,
    unique: true
  },
  battleId: {
    type: String,
    required: true,
    ref: 'Battle'
  },
  turn: {
    type: Number,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  result: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Add entry
battleLogSchema.statics.addEntry = async function(battleId, turn, action, result) {
  const log = new this({
    logId: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    battleId,
    turn,
    action,
    result
  });
  await log.save();
  return log;
};

// Get log
battleLogSchema.statics.getLog = async function(battleId) {
  return await this.find({ battleId }).sort({ turn: 1 });
};

module.exports = mongoose.model('BattleLog', battleLogSchema);
