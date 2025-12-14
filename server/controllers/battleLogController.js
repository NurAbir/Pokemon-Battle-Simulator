const BattleLog = require('../models/BattleLog');
const Battle = require('../models/Battle');

const EVENT_TYPES = BattleLog.EVENT_TYPES;

// Get battle log for a battle
exports.getBattleLog = async (req, res) => {
  try {
    const { battleId } = req.params;
    const userId = req.user.userId;

    // Verify battle exists and user is participant
    const battle = await Battle.findOne({ battleId });
    if (!battle) {
      return res.status(404).json({ success: false, message: 'Battle not found' });
    }

    if (battle.player1Id !== userId && battle.player2Id !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const logs = await BattleLog.getLog(battleId);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get logs after timestamp (for reconnection)
exports.getBattleLogAfter = async (req, res) => {
  try {
    const { battleId } = req.params;
    const { timestamp } = req.query;
    const userId = req.user.userId;

    const battle = await Battle.findOne({ battleId });
    if (!battle) {
      return res.status(404).json({ success: false, message: 'Battle not found' });
    }

    if (battle.player1Id !== userId && battle.player2Id !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const logs = await BattleLog.getLogAfter(battleId, timestamp);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// === Server-side log generation functions ===
// These are called by the battle engine, not via HTTP

// Log battle start
exports.logBattleStart = async (battleId, player1Username, player2Username) => {
  const io = global.io;
  
  const log = await BattleLog.addEntry(
    battleId,
    0,
    EVENT_TYPES.SYSTEM,
    `Battle started: ${player1Username} vs ${player2Username}!`,
    { player1Username, player2Username }
  );

  if (io) {
    io.to(`battle:${battleId}`).emit('battle:log', log);
  }

  return log;
};

// Log turn start
exports.logTurnStart = async (battleId, turn) => {
  const io = global.io;
  
  const log = await BattleLog.addEntry(
    battleId,
    turn,
    EVENT_TYPES.SYSTEM,
    `Turn ${turn} begins!`
  );

  if (io) {
    io.to(`battle:${battleId}`).emit('battle:log', log);
  }

  return log;
};

// Log move used
exports.logMove = async (battleId, turn, playerId, pokemonName, moveName, data = {}) => {
  const io = global.io;
  
  const log = await BattleLog.addEntry(
    battleId,
    turn,
    EVENT_TYPES.MOVE,
    `${pokemonName} used ${moveName}!`,
    { pokemonName, moveName, ...data },
    playerId
  );

  if (io) {
    io.to(`battle:${battleId}`).emit('battle:log', log);
  }

  return log;
};

// Log damage dealt
exports.logDamage = async (battleId, turn, targetPokemon, damage, currentHp, maxHp) => {
  const io = global.io;
  
  const log = await BattleLog.addEntry(
    battleId,
    turn,
    EVENT_TYPES.DAMAGE,
    `${targetPokemon} took ${damage} damage! (${currentHp}/${maxHp} HP)`,
    { targetPokemon, damage, currentHp, maxHp }
  );

  if (io) {
    io.to(`battle:${battleId}`).emit('battle:log', log);
  }

  return log;
};

// Log status effect
exports.logStatus = async (battleId, turn, pokemonName, status, applied = true) => {
  const io = global.io;
  
  const message = applied
    ? `${pokemonName} is now ${status}!`
    : `${pokemonName} is no longer ${status}!`;

  const log = await BattleLog.addEntry(
    battleId,
    turn,
    EVENT_TYPES.STATUS,
    message,
    { pokemonName, status, applied }
  );

  if (io) {
    io.to(`battle:${battleId}`).emit('battle:log', log);
  }

  return log;
};

// Log Pokemon fainting
exports.logFaint = async (battleId, turn, playerId, pokemonName) => {
  const io = global.io;
  
  const log = await BattleLog.addEntry(
    battleId,
    turn,
    EVENT_TYPES.FAINT,
    `${pokemonName} fainted!`,
    { pokemonName },
    playerId
  );

  if (io) {
    io.to(`battle:${battleId}`).emit('battle:log', log);
  }

  return log;
};

// Log Pokemon switch
exports.logSwitch = async (battleId, turn, playerId, fromPokemon, toPokemon) => {
  const io = global.io;
  
  const log = await BattleLog.addEntry(
    battleId,
    turn,
    EVENT_TYPES.SWITCH,
    `${fromPokemon} was withdrawn! Go, ${toPokemon}!`,
    { fromPokemon, toPokemon },
    playerId
  );

  if (io) {
    io.to(`battle:${battleId}`).emit('battle:log', log);
  }

  return log;
};

// Log ability activation
exports.logAbility = async (battleId, turn, pokemonName, abilityName, effect) => {
  const io = global.io;
  
  const log = await BattleLog.addEntry(
    battleId,
    turn,
    EVENT_TYPES.ABILITY,
    `${pokemonName}'s ${abilityName} ${effect}!`,
    { pokemonName, abilityName, effect }
  );

  if (io) {
    io.to(`battle:${battleId}`).emit('battle:log', log);
  }

  return log;
};

// Log inactivity warning
exports.logWarning = async (battleId, turn, playerId, playerUsername, secondsRemaining) => {
  const io = global.io;
  
  const log = await BattleLog.warningMessage(battleId, turn, playerId, secondsRemaining);
  log.message = `${playerUsername}: ${secondsRemaining} seconds remaining!`;
  await log.save();

  if (io) {
    io.to(`battle:${battleId}`).emit('battle:warning', log);
  }

  return log;
};

// Log timeout
exports.logTimeout = async (battleId, turn, playerId, playerUsername) => {
  const io = global.io;
  
  const log = await BattleLog.addEntry(
    battleId,
    turn,
    EVENT_TYPES.TIMEOUT,
    `${playerUsername} ran out of time!`,
    {},
    playerId
  );

  if (io) {
    io.to(`battle:${battleId}`).emit('battle:log', log);
  }

  return log;
};

// Log battle end
exports.logBattleEnd = async (battleId, turn, winnerUsername, loserUsername, reason = 'victory') => {
  const io = global.io;
  
  let message;
  switch (reason) {
    case 'forfeit':
      message = `${loserUsername} forfeited! ${winnerUsername} wins!`;
      break;
    case 'timeout':
      message = `${loserUsername} timed out! ${winnerUsername} wins!`;
      break;
    default:
      message = `${winnerUsername} defeated ${loserUsername}!`;
  }

  const log = await BattleLog.addEntry(
    battleId,
    turn,
    EVENT_TYPES.SYSTEM,
    message,
    { winnerUsername, loserUsername, reason }
  );

  if (io) {
    io.to(`battle:${battleId}`).emit('battle:end', log);
  }

  return log;
};

// Log general info
exports.logInfo = async (battleId, turn, message, data = {}) => {
  const io = global.io;
  
  const log = await BattleLog.addEntry(
    battleId,
    turn,
    EVENT_TYPES.INFO,
    message,
    data
  );

  if (io) {
    io.to(`battle:${battleId}`).emit('battle:log', log);
  }

  return log;
};

module.exports = exports;
