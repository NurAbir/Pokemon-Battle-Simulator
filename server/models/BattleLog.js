const mongoose = require('mongoose');

// Event types for battle log entries
const EVENT_TYPES = {
  MOVE: 'MOVE',
  DAMAGE: 'DAMAGE',
  STATUS: 'STATUS',
  FAINT: 'FAINT',
  SWITCH: 'SWITCH',
  INFO: 'INFO',
  SYSTEM: 'SYSTEM',
  TURN: 'TURN',
  WARNING: 'WARNING',
  TIMEOUT: 'TIMEOUT',
  BATTLE_START: 'BATTLE_START',
  BATTLE_END: 'BATTLE_END'
};

const battleLogEntrySchema = new mongoose.Schema({
  entryId: {
    type: String,
    required: true,
    index: true
  },
  battleId: {
    type: String,
    required: true,
    index: true
  },
  turn: {
    type: Number,
    required: true,
    default: 0
  },
  eventType: {
    type: String,
    enum: Object.values(EVENT_TYPES),
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  playerId: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { 
  timestamps: false,
  versionKey: false
});

// Compound index for efficient queries
battleLogEntrySchema.index({ battleId: 1, timestamp: 1 });
battleLogEntrySchema.index({ battleId: 1, turn: 1 });

// Static: Generate unique entry ID
battleLogEntrySchema.statics.generateEntryId = function() {
  return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Static: Create and save a log entry
battleLogEntrySchema.statics.createEntry = async function(battleId, turn, eventType, message, data = {}, playerId = null) {
  const entry = new this({
    entryId: this.generateEntryId(),
    battleId,
    turn,
    eventType,
    message,
    data,
    playerId
  });
  await entry.save();
  return entry.toJSON();
};

// Static: Get full battle log
battleLogEntrySchema.statics.getBattleLog = async function(battleId) {
  return this.find({ battleId }).sort({ timestamp: 1 }).lean();
};

// Static: Get log entries after a specific timestamp (for reconnection)
battleLogEntrySchema.statics.getLogAfter = async function(battleId, afterTimestamp) {
  return this.find({ 
    battleId, 
    timestamp: { $gt: new Date(afterTimestamp) } 
  }).sort({ timestamp: 1 }).lean();
};

// Static: Get recent entries
battleLogEntrySchema.statics.getRecentEntries = async function(battleId, limit = 20) {
  return this.find({ battleId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean()
    .then(entries => entries.reverse());
};

// Export event types for use elsewhere
battleLogEntrySchema.statics.EVENT_TYPES = EVENT_TYPES;

module.exports = mongoose.model('BattleLog', battleLogEntrySchema);
