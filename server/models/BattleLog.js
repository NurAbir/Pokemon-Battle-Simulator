const mongoose = require('mongoose');

// Event types for battle log entries
const EVENT_TYPES = {
  MOVE: 'MOVE',           // Move used by a Pokemon
  DAMAGE: 'DAMAGE',       // Damage dealt
  STATUS: 'STATUS',       // Status effect applied/removed
  FAINT: 'FAINT',         // Pokemon fainted
  SWITCH: 'SWITCH',       // Pokemon switched
  ABILITY: 'ABILITY',     // Ability activated
  ITEM: 'ITEM',           // Item used
  INFO: 'INFO',           // General information
  SYSTEM: 'SYSTEM',       // System message (turn start, battle start/end)
  WARNING: 'WARNING',     // Inactivity warning
  TIMEOUT: 'TIMEOUT'      // Player timed out
};

const battleLogSchema = new mongoose.Schema({
  logId: {
    type: String,
    required: true,
    unique: true
  },
  battleId: {
    type: String,
    required: true,
    ref: 'Battle',
    index: true
  },
  turn: {
    type: Number,
    required: true,
    default: 0
  },
  eventType: {
    type: String,
    required: true,
    enum: Object.values(EVENT_TYPES)
  },
  // Human-readable message for display
  message: {
    type: String,
    required: true
  },
  // Structured data for programmatic access
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Player associated with this event (if applicable)
  playerId: {
    type: String,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

// Compound index for ordered retrieval
battleLogSchema.index({ battleId: 1, createdAt: 1 });

// Static: Add a new log entry
battleLogSchema.statics.addEntry = async function(battleId, turn, eventType, message, data = {}, playerId = null) {
  const generateId = require('../utils/generateId');
  
  const log = new this({
    logId: generateId('log'),
    battleId,
    turn,
    eventType,
    message,
    data,
    playerId
  });
  
  await log.save();
  return log;
};

// Static: Get full log for a battle
battleLogSchema.statics.getLog = async function(battleId) {
  return await this.find({ battleId }).sort({ createdAt: 1 });
};

// Static: Get logs after a specific timestamp (for reconnection)
battleLogSchema.statics.getLogAfter = async function(battleId, timestamp) {
  return await this.find({
    battleId,
    createdAt: { $gt: new Date(timestamp) }
  }).sort({ createdAt: 1 });
};

// Static: Create system message
battleLogSchema.statics.systemMessage = async function(battleId, turn, message) {
  return await this.addEntry(battleId, turn, EVENT_TYPES.SYSTEM, message);
};

// Static: Create warning message
battleLogSchema.statics.warningMessage = async function(battleId, turn, playerId, secondsRemaining) {
  return await this.addEntry(
    battleId,
    turn,
    EVENT_TYPES.WARNING,
    `Warning: ${secondsRemaining} seconds remaining to make a move!`,
    { secondsRemaining },
    playerId
  );
};

// Static: Create timeout message
battleLogSchema.statics.timeoutMessage = async function(battleId, turn, playerId) {
  return await this.addEntry(
    battleId,
    turn,
    EVENT_TYPES.TIMEOUT,
    `Player timed out!`,
    {},
    playerId
  );
};

// Export event types for use in other modules
battleLogSchema.statics.EVENT_TYPES = EVENT_TYPES;

module.exports = mongoose.model('BattleLog', battleLogSchema);
