// Battle Log Service - Server-side authoritative log generation
const BattleLog = require('../models/BattleLog');

// Get EVENT_TYPES from the model's static property
const EVENT_TYPES = BattleLog.EVENT_TYPES;

class BattleLogService {
  constructor(io) {
    this.io = io;
  }

  // Emit log entry to battle room
  emitToRoom(battleId, entry) {
    this.io.to(`battle_${battleId}`).emit('battle:log', entry);
  }

  // Create and emit a log entry
  async log(battleId, turn, eventType, message, data = {}, playerId = null) {
    const entry = await BattleLog.createEntry(battleId, turn, eventType, message, data, playerId);
    this.emitToRoom(battleId, entry);
    return entry;
  }

  // Battle lifecycle events
  async battleStart(battleId, player1, player2) {
    return this.log(battleId, 0, EVENT_TYPES.BATTLE_START, 
      `Battle started between ${player1.username} and ${player2.username}!`,
      { player1: player1.username, player2: player2.username }
    );
  }

  async battleEnd(battleId, turn, winnerId, winnerUsername, reason = 'knockout') {
    const message = reason === 'forfeit' 
      ? `${winnerUsername} wins by forfeit!`
      : reason === 'timeout'
        ? `${winnerUsername} wins by opponent timeout!`
        : `${winnerUsername} wins the battle!`;
    
    return this.log(battleId, turn, EVENT_TYPES.BATTLE_END, message, {
      winnerId,
      winnerUsername,
      reason
    });
  }

  // Turn events
  async turnStart(battleId, turn) {
    return this.log(battleId, turn, EVENT_TYPES.TURN, 
      `--- Turn ${turn} ---`,
      { turnNumber: turn }
    );
  }

  // Move events
  async moveUsed(battleId, turn, pokemon, moveName, playerId) {
    return this.log(battleId, turn, EVENT_TYPES.MOVE,
      `${pokemon} used ${moveName}!`,
      { pokemon, moveName },
      playerId
    );
  }

  async moveMissed(battleId, turn, pokemon) {
    return this.log(battleId, turn, EVENT_TYPES.MOVE,
      `${pokemon}'s attack missed!`,
      { pokemon, result: 'missed' }
    );
  }

  async moveFailed(battleId, turn, pokemon, moveName) {
    return this.log(battleId, turn, EVENT_TYPES.MOVE,
      `${pokemon} tried to use ${moveName}, but it failed!`,
      { pokemon, moveName, result: 'failed' }
    );
  }

  // Damage events
  async damageDealt(battleId, turn, target, damage, effectiveness) {
    const messages = [];
    
    if (effectiveness > 1) {
      messages.push({ type: 'super', text: "It's super effective!" });
    } else if (effectiveness < 1 && effectiveness > 0) {
      messages.push({ type: 'not-very', text: "It's not very effective..." });
    } else if (effectiveness === 0) {
      messages.push({ type: 'immune', text: "It doesn't affect the target..." });
    }

    const entries = [];
    for (const msg of messages) {
      entries.push(await this.log(battleId, turn, EVENT_TYPES.DAMAGE, msg.text, {
        target,
        damage,
        effectiveness,
        effectivenessType: msg.type
      }));
    }
    return entries;
  }

  async criticalHit(battleId, turn) {
    return this.log(battleId, turn, EVENT_TYPES.DAMAGE,
      'A critical hit!',
      { isCrit: true }
    );
  }

  // Status events
  async statusApplied(battleId, turn, pokemon, status) {
    const statusMessages = {
      'burn': `${pokemon} was burned!`,
      'freeze': `${pokemon} was frozen solid!`,
      'paralysis': `${pokemon} is paralyzed! It may be unable to move!`,
      'poison': `${pokemon} was poisoned!`,
      'badly-poison': `${pokemon} was badly poisoned!`,
      'sleep': `${pokemon} fell asleep!`,
      'confusion': `${pokemon} became confused!`
    };
    
    return this.log(battleId, turn, EVENT_TYPES.STATUS,
      statusMessages[status] || `${pokemon} was afflicted with ${status}!`,
      { pokemon, status }
    );
  }

  async statusDamage(battleId, turn, pokemon, status, damage) {
    const messages = {
      'burn': `${pokemon} is hurt by its burn!`,
      'poison': `${pokemon} is hurt by poison!`,
      'badly-poison': `${pokemon} is hurt by poison!`
    };
    
    return this.log(battleId, turn, EVENT_TYPES.STATUS,
      messages[status] || `${pokemon} took damage from ${status}!`,
      { pokemon, status, damage }
    );
  }

  // Switch events
  async pokemonWithdrawn(battleId, turn, playerName, pokemon, playerId) {
    return this.log(battleId, turn, EVENT_TYPES.SWITCH,
      `${playerName} withdrew ${pokemon}!`,
      { playerName, pokemon, action: 'withdraw' },
      playerId
    );
  }

  async pokemonSentOut(battleId, turn, playerName, pokemon, playerId) {
    return this.log(battleId, turn, EVENT_TYPES.SWITCH,
      `${playerName} sent out ${pokemon}!`,
      { playerName, pokemon, action: 'send-out' },
      playerId
    );
  }

  // Faint events
  async pokemonFainted(battleId, turn, pokemon) {
    return this.log(battleId, turn, EVENT_TYPES.FAINT,
      `${pokemon} fainted!`,
      { pokemon }
    );
  }

  // Info events
  async info(battleId, turn, message, data = {}) {
    return this.log(battleId, turn, EVENT_TYPES.INFO, message, data);
  }

  // System events
  async system(battleId, turn, message, data = {}) {
    return this.log(battleId, turn, EVENT_TYPES.SYSTEM, message, data);
  }

  // Warning events
  async inactivityWarning(battleId, turn, playerName, secondsRemaining, playerId) {
    const entry = await this.log(battleId, turn, EVENT_TYPES.WARNING,
      `⚠️ ${playerName} has ${secondsRemaining} seconds to make a move!`,
      { playerName, secondsRemaining, warningType: 'inactivity' },
      playerId
    );
    
    // Also emit dedicated warning event
    this.io.to(`battle_${battleId}`).emit('battle:warning', {
      type: 'inactivity',
      playerId,
      playerName,
      secondsRemaining,
      entry
    });
    
    return entry;
  }

  async timeoutOccurred(battleId, turn, playerName, playerId) {
    return this.log(battleId, turn, EVENT_TYPES.TIMEOUT,
      `⏰ ${playerName} ran out of time!`,
      { playerName, warningType: 'timeout' },
      playerId
    );
  }

  // Get full log for reconnection
  async getFullLog(battleId) {
    return BattleLog.getBattleLog(battleId);
  }

  // Get log entries after timestamp
  async getLogAfter(battleId, timestamp) {
    return BattleLog.getLogAfter(battleId, timestamp);
  }
}

module.exports = BattleLogService;
