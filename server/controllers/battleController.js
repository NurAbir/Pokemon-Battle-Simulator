// controllers/battleController.js
const Battle = require('../models/Battle');
const Team = require('../models/Team');
const { v4: uuidv4 } = require('uuid');

// Get all battles for a user
exports.getUserBattles = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const battles = await Battle.find({
      'players.userId': userId
    }).sort({ createdAt: -1 }).limit(20);

    res.json({
      success: true,
      battles: battles.map(battle => ({
        battleId: battle.battleId,
        status: battle.status,
        turn: battle.turn,
        winner: battle.winner,
        createdAt: battle.createdAt,
        opponent: battle.players.find(p => p.userId.toString() !== userId)?.username
      }))
    });
  } catch (error) {
    console.error('Get user battles error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get specific battle details
exports.getBattle = async (req, res) => {
  try {
    const { battleId } = req.params;
    const userId = req.user.id;

    const battle = await Battle.findOne({ battleId });

    if (!battle) {
      return res.status(404).json({ success: false, message: 'Battle not found' });
    }

    // Check if user is part of this battle
    const isPlayer = battle.players.some(p => p.userId.toString() === userId);
    if (!isPlayer) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({
      success: true,
      battle: formatBattleState(battle, userId)
    });
  } catch (error) {
    console.error('Get battle error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create a new battle (used by matchmaking)
exports.createBattle = async (req, res) => {
  try {
    const { player1, player2, team1Id, team2Id } = req.body;

    // Fetch both teams
    const team1 = await Team.findById(team1Id).populate('userId');
    const team2 = await Team.findById(team2Id).populate('userId');

    if (!team1?.userId || !team2?.userId) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!team1 || !team2) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team1.pokemon.length === 0 || team2.pokemon.length === 0) {
      return res.status(400).json({ success: false, message: 'Teams must have at least one Pokemon' });
    }

    // Create battle
    const battleId = uuidv4();
    const battle = new Battle({
      battleId,
      players: [
        {
          _id: team1.userId._id.toString(),
          userId: player1,
          username: team1.userId.username,
          team: team1.pokemon.map(p => createBattlePokemon(p)),
          activePokemonIndex: 0,
          ready: false
        },
        {
          _id: team2.userId._id.toString(),
          userId: player2,
          username: team2.userId.username,
          team: team2.pokemon.map(p => createBattlePokemon(p)),
          activePokemonIndex: 0,
          ready: false
        }
      ],
      status: 'active',
      turn: 1,
      battleLog: []
    });

    battle.addLog('Battle started!');
    battle.addLog(`${team1.userId.username}'s ${battle.players[0].team[0].nickname} vs ${team2.userId.username}'s ${battle.players[1].team[0].nickname}!`);

    await battle.save();

    res.json({
      success: true,
      battle: {
        battleId: battle.battleId,
        status: battle.status
      }
    });
  } catch (error) {
    console.error('Create battle error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Submit move action
exports.submitAction = async (req, res) => {
  try {
    const { battleId } = req.params;
    const userId = req.user.id;
    const { action, move, switchTo } = req.body;

    const battle = await Battle.findOne({ battleId, status: 'active' });

    if (!battle) {
      return res.status(404).json({ success: false, message: 'Battle not found or ended' });
    }

    const playerIndex = battle.players.findIndex(p => p.userId.toString() === userId);
    if (playerIndex === -1) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const player = battle.players[playerIndex];

    // Validate action
    if (action === 'move') {
      const activePokemon = battle.getActivePokemon(playerIndex);
      if (!activePokemon.moves.includes(move)) {
        return res.status(400).json({ success: false, message: 'Invalid move' });
      }
      player.selectedMove = move;
    } else if (action === 'switch') {
      if (switchTo < 0 || switchTo >= player.team.length) {
        return res.status(400).json({ success: false, message: 'Invalid Pokemon index' });
      }
      if (player.team[switchTo].fainted) {
        return res.status(400).json({ success: false, message: 'Cannot switch to fainted Pokemon' });
      }
      player.switchTo = switchTo;
    }

    player.ready = true;
    await battle.save();

    res.json({
      success: true,
      message: 'Action submitted',
      ready: player.ready
    });
  } catch (error) {
    console.error('Submit action error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getActiveBattles = async (req, res) => {
  try {
    const battles = await Battle.find({ status: 'active' })
      .select('battleId players.username turn createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      battles: battles.map(b => ({
        battleId: b.battleId,
        players: b.players,
        turn: b.turn || 1,
        createdAt: b.createdAt
      }))
    });
  } catch (error) {
    console.error('Get active battles error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getBattleLog = async (req, res) => {
  try {
    const { battleId } = req.params;

    const battleExists = await Battle.findOne({ battleId });
    if (!battleExists) {
      return res.status(404).json({ success: false, message: 'Battle not found' });
    }

    const log = await require('../models/BattleLog').getBattleLog(battleId);

    res.json({
      success: true,
      log
    });
  } catch (error) {
    console.error('Get battle log error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch log' });
  }
};


exports.getActiveBattles = async (req, res) => {
  const battles = await Battle.find({ status: 'active' })
    .select('battleId players.username turn createdAt')
    .lean();
  res.json({ success: true, battles });
};

exports.getBattleLog = async (req, res) => {
  const { battleId } = req.params;
  const log = await BattleLog.getBattleLog(battleId);
  res.json({ success: true, log });
};


// Forfeit battle
exports.forfeitBattle = async (req, res) => {
  try {
    const { battleId } = req.params;
    const userId = req.user.id;

    const battle = await Battle.findOne({ battleId, status: 'active' });

    if (!battle) {
      return res.status(404).json({ success: false, message: 'Battle not found' });
    }

    const playerIndex = battle.players.findIndex(p => p.userId.toString() === userId);
    if (playerIndex === -1) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    battle.status = 'completed';
    battle.winner = battle.players[1 - playerIndex].userId;
    battle.addLog(`${battle.players[playerIndex].username} forfeited!`);
    battle.addLog(`${battle.players[1 - playerIndex].username} wins!`);

    await battle.save();

    res.json({
      success: true,
      message: 'Battle forfeited',
      winner: battle.winner
    });
  } catch (error) {
    console.error('Forfeit battle error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Helper function to create battle Pokemon from team Pokemon
function createBattlePokemon(pokemon) {
  return {
    pokemonId: pokemon.pokemonId,
    name: pokemon.name,
    nickname: pokemon.nickname,
    level: pokemon.level,
    types: pokemon.types,
    currentHp: pokemon.stats.hp,
    maxHp: pokemon.stats.hp,
    stats: {
      atk: pokemon.stats.atk,
      def: pokemon.stats.def,
      spa: pokemon.stats.spa,
      spd: pokemon.stats.spd,
      spe: pokemon.stats.spe
    },
    moves: pokemon.moves,
    statusCondition: null,
    statStages: {
      atk: 0,
      def: 0,
      spa: 0,
      spd: 0,
      spe: 0,
      accuracy: 0,
      evasion: 0
    },
    fainted: false
  };
}

// Helper function to format battle state for client
function formatBattleState(battle, userId) {
  const playerIndex = battle.players.findIndex(p => p.userId.toString() === userId);
  const opponentIndex = 1 - playerIndex;

  return {
    battleId: battle.battleId,
    status: battle.status,
    turn: battle.turn,
    player: {
      username: battle.players[playerIndex].username,
      activePokemon: battle.getActivePokemon(playerIndex),
      team: battle.players[playerIndex].team,
      ready: battle.players[playerIndex].ready
    },
    opponent: {
      userId: battle.players[opponentIndex].userId,        // Keep custom userId if needed elsewhere
      _id: battle.players[opponentIndex]._id,
      username: battle.players[opponentIndex].username,
      activePokemon: battle.getActivePokemon(opponentIndex),
      team: battle.players[opponentIndex].team.map(p => ({
        nickname: p.nickname,
        currentHp: p.currentHp,
        maxHp: p.maxHp,
        fainted: p.fainted
      })),
      ready: battle.players[opponentIndex].ready
    },
    battleLog: battle.battleLog.slice(-10), // Last 10 messages
    winner: battle.winner
  };
}

// ADMIN: Get all currently active battles
exports.getActiveBattles = async (req, res) => {
  try {
    const battles = await Battle.find({ status: 'active' })
      .select('battleId players.username turn createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = battles.map(b => ({
      battleId: b.battleId,
      players: b.players.map(p => ({ username: p.username })),
      turn: b.turn || 1,
      createdAt: b.createdAt
    }));

    res.json({ success: true, battles: formatted });
  } catch (error) {
    console.error('getActiveBattles error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ADMIN: Get full battle log
exports.getBattleLog = async (req, res) => {
  try {
    const { battleId } = req.params;

    // Verify battle exists
    const battle = await Battle.findOne({ battleId });
    if (!battle) {
      return res.status(404).json({ success: false, message: 'Battle not found' });
    }

    const BattleLog = require('../models/BattleLog');
    const log = await BattleLog.getBattleLog(battleId);

    res.json({ success: true, log });
  } catch (error) {
    console.error('getBattleLog error:', error);
    res.status(500).json({ success: false, message: 'Failed to load log' });
  }
};