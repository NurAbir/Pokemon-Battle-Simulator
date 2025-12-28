const Battle = require('../models/Battle');
const Team = require('../models/Team');
const User = require('../models/User');
const BattleEngine = require('../utils/battleEngine');
const BattleLogService = require('../utils/battleLogService');
const TurnTimerManager = require('../utils/turnTimerManager');
const BattleLog = require('../models/BattleLog');
const Notification = require('../models/Notification');
const { createBattleChat, archiveBattleChat } = require('./chatHandler');

// Generate unique battle ID
function generateId(prefix = 'id') {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${prefix}_${timestamp}${randomStr}`;
}

// Store active matchmaking users
const matchmakingQueue = [];
const activeBattles = new Map(); // battleId -> { room, players, timerData }

// Module-level services (initialized in module.exports)
let battleLogService = null;
let turnTimerManager = null;

// Helper: Send battle result notifications to both players
async function sendBattleResultNotifications(io, battle) {
  try {
    const player1 = battle.players[0];
    const player2 = battle.players[1];
    const winnerId = battle.winner;
    
    const winnerUsername = winnerId === player1.userId ? player1.username : player2.username;
    const loserUsername = winnerId === player1.userId ? player2.username : player1.username;
    
    // Create summary from battle log (last few entries)
    const summary = battle.battleLog.slice(-5).join(' | ');
    
    // Notification for player 1
    const notif1 = await Notification.createBattleResult(player1.userId, {
      battleId: battle.battleId,
      winner: winnerId,
      winnerUsername,
      loserUsername,
      isWinner: winnerId === player1.userId,
      opponentUsername: player2.username,
      summary
    });
    
    // Notification for player 2
    const notif2 = await Notification.createBattleResult(player2.userId, {
      battleId: battle.battleId,
      winner: winnerId,
      winnerUsername,
      loserUsername,
      isWinner: winnerId === player2.userId,
      opponentUsername: player1.username,
      summary
    });
    
    // Emit to both players (persisted even if offline)
    io.to(`user_${player1.userId}`).emit('newNotification', notif1);
    io.to(`user_${player2.userId}`).emit('newNotification', notif2);
    
    console.log('Battle result notifications sent');
  } catch (error) {
    console.error('Error sending battle result notifications:', error);
  }
}

// Handle player timeout - player loses by timeout
async function handlePlayerTimeout(io, battleId, timedOutUserId) {
  try {
    const battle = await Battle.findOne({ battleId, status: 'active' });
    if (!battle) return;
    
    const timedOutPlayerIndex = battle.players.findIndex(p => p.userId === timedOutUserId);
    if (timedOutPlayerIndex === -1) return;
    
    const winnerIndex = 1 - timedOutPlayerIndex;
    const winner = battle.players[winnerIndex];
    
    battle.status = 'completed';
    battle.winner = winner.userId;
    await battle.save();
    
    // Log battle end via service
    await battleLogService.battleEnd(battleId, battle.turn, winner.userId, winner.username, 'timeout');
    
    const battleInfo = activeBattles.get(battleId);
    if (battleInfo) {
      const fullLog = await battleLogService.getFullLog(battleId);
      
      io.to(battleInfo.room).emit('battleEnd', {
        winner: battle.winner,
        reason: 'timeout',
        battleLog: fullLog
      });
      
      // Send notifications
      await sendBattleResultNotifications(io, battle);
      
      // Archive chat
      await archiveBattleChat(io, battleId, battle.winner, winner.username);
      
      // Cleanup
      turnTimerManager.endBattle(battleId);
      activeBattles.delete(battleId);
    }
  } catch (error) {
    console.error('Timeout handling error:', error);
  }
}

module.exports = (io) => {
  // Initialize services
  battleLogService = new BattleLogService(io);
  turnTimerManager = new TurnTimerManager(io, battleLogService);
  
  // Set log service on battle engine
  BattleEngine.setLogService(battleLogService);

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Join matchmaking
    socket.on('joinMatchmaking', async ({ userId, teamId, username }) => {
      try {
        console.log('=== MATCHMAKING REQUEST ===');
        console.log('Received:', { userId, teamId, username });
        
        // Validate inputs
        if (!userId || !teamId) {
          socket.emit('error', { message: 'Missing userId or teamId' });
          return;
        }

        // STEP 1: Find user by custom userId to get MongoDB _id
        const user = await User.findOne({ userId: userId });
        if (!user) {
          console.error('User not found:', userId);
          socket.emit('error', { message: 'User not found' });
          return;
        }
        
        console.log('Found user:', { 
          customUserId: user.userId, 
          mongoId: user._id,
          username: user.username 
        });

        // STEP 2: Find team using MongoDB _id
        let team = null;
        
        // Try by teamId field first (if it exists)
        if (teamId.startsWith('team_')) {
          team = await Team.findOne({ 
            teamId: teamId,
            userId: user._id  // Use MongoDB ObjectId
          });
          console.log('Query by teamId field:', team ? 'FOUND' : 'NOT FOUND');
        }
        
        // If not found, try by MongoDB _id
        if (!team) {
          try {
            team = await Team.findOne({
              _id: teamId,
              userId: user._id  // Use MongoDB ObjectId
            });
            console.log('Query by _id:', team ? 'FOUND' : 'NOT FOUND');
          } catch (e) {
            console.log('_id query failed:', e.message);
          }
        }
        
        if (!team) {
          console.error('Team not found for user');
          socket.emit('error', { 
            message: 'Team not found or does not belong to you'
          });
          return;
        }

        console.log('Found team:', {
          _id: team._id,
          teamId: team.teamId,
          name: team.name,
          pokemonCount: team.pokemons?.length
        });

        // STEP 3: Validate and filter team Pokemon
        if (!team.pokemons || team.pokemons.length === 0) {
          socket.emit('error', { message: 'Team has no Pokemon' });
          return;
        }

        // Filter out null/undefined Pokemon
        const validPokemon = team.pokemons.filter(p => p !== null && p !== undefined);
        
        console.log('Pokemon validation:', {
          total: team.pokemons.length,
          valid: validPokemon.length,
          invalid: team.pokemons.length - validPokemon.length
        });

        if (validPokemon.length === 0) {
          socket.emit('error', { message: 'Team has no valid Pokemon' });
          return;
        }

        // Log first Pokemon structure for debugging
        console.log('Sample Pokemon:', JSON.stringify(validPokemon[0], null, 2));
        
        console.log('✓ Team validated successfully');
        
        // STEP 4: Add to matchmaking queue (use CUSTOM userId for battle system)
        const player = {
          userId: userId,  // Use custom userId string for consistency
          socketId: socket.id,
          team: validPokemon,  // Use filtered Pokemon
          username: username || user.username || 'Player'
        };
        
        matchmakingQueue.push(player);
        console.log(`✓ Player ${player.username} joined queue. Size: ${matchmakingQueue.length}`);
        socket.emit('matchmakingJoined');
        
        // STEP 5: Try to match players
        if (matchmakingQueue.length >= 2) {
          const player1 = matchmakingQueue.shift();
          const player2 = matchmakingQueue.shift();
          
          console.log('Attempting to match:', player1.username, 'vs', player2.username);
          
          // Verify both sockets still exist
          const socket1 = io.sockets.sockets.get(player1.socketId);
          const socket2 = io.sockets.sockets.get(player2.socketId);
          
          if (!socket1 || !socket2) {
            console.error('One or both sockets disconnected');
            if (socket1) matchmakingQueue.unshift(player1);
            if (socket2) matchmakingQueue.unshift(player2);
            return;
          }
          
          try {
            // Create battle
            const battleId = generateId('battle');
            console.log('Creating battle:', battleId);
            
            const battle = await BattleEngine.createBattle(player1, player2, battleId);
            
            // Create socket room
            const room = `battle_${battleId}`;
            socket1.join(room);
            socket2.join(room);
            
            activeBattles.set(battleId, {
              room,
              players: [player1.userId, player2.userId]
            });
            
            console.log(`✓ Battle created: ${battleId}`);
            
            // Initialize turn timer
            turnTimerManager.startBattle(battleId, [
              { userId: player1.userId, username: player1.username },
              { userId: player2.userId, username: player2.username }
            ]);
            
            // Create battle chat room
            await createBattleChat(io, battleId, player1.userId, player2.userId);
            
            // Send initial battle state to both players
            const state1 = BattleEngine.getBattleState(battle, player1.userId);
            const state2 = BattleEngine.getBattleState(battle, player2.userId);
            
            // Get full log for initial state
            const fullLog = await battleLogService.getFullLog(battleId);
            state1.battleLog = fullLog;
            state2.battleLog = fullLog;
            
            socket1.emit('battleStart', state1);
            socket2.emit('battleStart', state2);
            
            // Start turn timer
            turnTimerManager.startTurn(battleId, 1, async (timedOutUserId, timedOutUsername) => {
              await handlePlayerTimeout(io, battleId, timedOutUserId);
            });
            
            console.log('✓ Battle states sent to both players');
          } catch (battleError) {
            console.error('Battle creation error:', battleError);
            // Return players to queue
            matchmakingQueue.unshift(player1);
            matchmakingQueue.unshift(player2);
            socket1.emit('error', { message: 'Failed to create battle: ' + battleError.message });
            socket2.emit('error', { message: 'Failed to create battle: ' + battleError.message });
          }
        }
      } catch (error) {
        console.error('Matchmaking error:', error);
        socket.emit('error', { message: 'Matchmaking failed: ' + error.message });
      }
    });
    
    // Leave matchmaking
    socket.on('leaveMatchmaking', ({ userId }) => {
      const index = matchmakingQueue.findIndex(p => p.userId === userId);
      if (index !== -1) {
        matchmakingQueue.splice(index, 1);
        console.log(`Player left queue. Size: ${matchmakingQueue.length}`);
        socket.emit('matchmakingLeft');
      }
    });
    
    // Select move
    socket.on('selectMove', async ({ battleId, userId, moveName }) => {
      try {
        console.log('=== MOVE SELECTED ===');
        console.log('Battle ID:', battleId);
        console.log('User ID:', userId);
        console.log('Move:', moveName);
        
        const battle = await Battle.findOne({ battleId, status: 'active' });
        if (!battle) {
          console.error('Battle not found or not active');
          socket.emit('error', { message: 'Battle not found' });
          return;
        }
        
        // Compare userId as strings
        const playerIndex = battle.players.findIndex(p => p.userId === userId);
        if (playerIndex === -1) {
          console.error('Player not in battle');
          socket.emit('error', { message: 'Not in this battle' });
          return;
        }
        
        console.log('Player index:', playerIndex);
        console.log('Current turn:', battle.turn);
        
        // Validate move
        const activePokemon = battle.players[playerIndex].team[battle.players[playerIndex].activePokemonIndex];
        if (!activePokemon.moves.includes(moveName)) {
          console.error('Invalid move:', moveName, 'Available:', activePokemon.moves);
          socket.emit('error', { message: 'Invalid move' });
          return;
        }
        
        // Set selected move
        battle.players[playerIndex].selectedMove = moveName;
        battle.players[playerIndex].ready = true;
        await battle.save();
        
        console.log('Move saved, player ready');
        
        // Mark player ready in timer
        turnTimerManager.markReady(battleId, userId);
        
        const battleInfo = activeBattles.get(battleId);
        if (battleInfo) {
          io.to(battleInfo.room).emit('playerReady', { 
            playerIndex,
            userId,
            ready: true 
          });
        }
        
        // Check if both players ready
        const bothReady = battle.players.every(p => p.ready);
        console.log('Both players ready:', bothReady);
        
        if (bothReady) {
          console.log('Processing turn...');
          
          // Log turn start
          await battleLogService.turnStart(battleId, battle.turn);
          
          // Process turn
          const updatedBattle = await BattleEngine.processTurn(battle);
          
          console.log('Turn processed, battle status:', updatedBattle.status);
          
          // Get full log
          const fullLog = await battleLogService.getFullLog(battleId);
          console.log('Battle log entries:', fullLog.length);
          
          // Send updated state to both players
          const state1 = BattleEngine.getBattleState(updatedBattle, battle.players[0].userId);
          const state2 = BattleEngine.getBattleState(updatedBattle, battle.players[1].userId);
          state1.battleLog = fullLog;
          state2.battleLog = fullLog;
          
          if (battleInfo) {
            const sockets = Array.from(io.sockets.adapter.rooms.get(battleInfo.room) || []);
            const socket1 = io.sockets.sockets.get(sockets[0]);
            const socket2 = io.sockets.sockets.get(sockets[1]);
            
            if (socket1 && socket2) {
              console.log('Sending battle updates to both players');
              socket1.emit('battleUpdate', state1);
              socket2.emit('battleUpdate', state2);
            } else {
              console.error('One or both sockets not found');
            }
          }
          
          // Check if battle ended
          if (updatedBattle.status === 'completed') {
            console.log('Battle completed, winner:', updatedBattle.winner);
            if (battleInfo) {
              io.to(battleInfo.room).emit('battleEnd', {
                winner: updatedBattle.winner,
                battleLog: fullLog
              });
              
              // Send battle result notifications
              await sendBattleResultNotifications(io, updatedBattle);
              
              // Archive battle chat
              const winnerUsername = updatedBattle.players.find(p => p.userId === updatedBattle.winner)?.username;
              await archiveBattleChat(io, battleId, updatedBattle.winner, winnerUsername);
              
              // Cleanup
              turnTimerManager.endBattle(battleId);
              activeBattles.delete(battleId);
            }
          } else {
            // Start timer for next turn
            turnTimerManager.startTurn(battleId, updatedBattle.turn, async (timedOutUserId) => {
              await handlePlayerTimeout(io, battleId, timedOutUserId);
            });
          }
        }
      } catch (error) {
        console.error('Move selection error:', error);
        socket.emit('error', { message: 'Failed to select move: ' + error.message });
      }
    });
    
    // Switch Pokemon
    // Switch Pokemon - REPLACE THE EXISTING switchPokemon HANDLER
socket.on('switchPokemon', async ({ battleId, userId, pokemonIndex }) => {
  try {
    const battle = await Battle.findOne({ battleId, status: 'active' });
    if (!battle) {
      socket.emit('error', { message: 'Battle not found' });
      return;
    }
    
    // Compare userId as strings
    const playerIndex = battle.players.findIndex(p => p.userId === userId);
    if (playerIndex === -1) {
      socket.emit('error', { message: 'Not in this battle' });
      return;
    }
    
    const player = battle.players[playerIndex];
    const targetPokemon = player.team[pokemonIndex];
    
    if (!targetPokemon || targetPokemon.fainted) {
      socket.emit('error', { message: 'Cannot switch to that Pokemon' });
      return;
    }
    
    // Set switch target
    player.switchTo = pokemonIndex;
    player.ready = true;
    
    // Check if this is a forced switch
    const isForcedSwitch = player.needsForcedSwitch;
    
    await battle.save();
    
    // Mark player ready in timer
    turnTimerManager.markReady(battleId, userId);
    
    const battleInfo = activeBattles.get(battleId);
    if (battleInfo) {
      io.to(battleInfo.room).emit('playerReady', { 
        playerIndex,
        userId,
        ready: true 
      });
    }
    
    // If forced switch, process immediately without waiting for opponent
    if (isForcedSwitch) {
      console.log('Processing forced switch for player', playerIndex);
      
      // Process the turn (which will handle the forced switch)
      const updatedBattle = await BattleEngine.processTurn(battle);
      
      // Get full log
      const fullLog = await battleLogService.getFullLog(battleId);
      
      const state1 = BattleEngine.getBattleState(updatedBattle, battle.players[0].userId);
      const state2 = BattleEngine.getBattleState(updatedBattle, battle.players[1].userId);
      state1.battleLog = fullLog;
      state2.battleLog = fullLog;
      
      if (battleInfo) {
        const sockets = Array.from(io.sockets.adapter.rooms.get(battleInfo.room) || []);
        const socket1 = io.sockets.sockets.get(sockets[0]);
        const socket2 = io.sockets.sockets.get(sockets[1]);
        
        if (socket1 && socket2) {
          socket1.emit('battleUpdate', state1);
          socket2.emit('battleUpdate', state2);
        }
      }
      
      if (updatedBattle.status === 'completed') {
        if (battleInfo) {
          io.to(battleInfo.room).emit('battleEnd', {
            winner: updatedBattle.winner,
            battleLog: fullLog
          });
          
          // Send battle result notifications
          await sendBattleResultNotifications(io, updatedBattle);
          
          // Archive battle chat
          const winnerUsername = updatedBattle.players.find(p => p.userId === updatedBattle.winner)?.username;
          await archiveBattleChat(io, battleId, updatedBattle.winner, winnerUsername);
          
          // Cleanup
          turnTimerManager.endBattle(battleId);
          activeBattles.delete(battleId);
        }
      } else {
        // Start timer for next turn
        turnTimerManager.startTurn(battleId, updatedBattle.turn, async (timedOutUserId) => {
          await handlePlayerTimeout(io, battleId, timedOutUserId);
        });
      }
      
      return; // Exit early - forced switch handled
    }
    
    // Normal switch - check if both players ready
    if (battle.players.every(p => p.ready)) {
      // Log turn start
      await battleLogService.turnStart(battleId, battle.turn);
      
      const updatedBattle = await BattleEngine.processTurn(battle);
      
      // Get full log
      const fullLog = await battleLogService.getFullLog(battleId);
      
      const state1 = BattleEngine.getBattleState(updatedBattle, battle.players[0].userId);
      const state2 = BattleEngine.getBattleState(updatedBattle, battle.players[1].userId);
      state1.battleLog = fullLog;
      state2.battleLog = fullLog;
      
      if (battleInfo) {
        const sockets = Array.from(io.sockets.adapter.rooms.get(battleInfo.room) || []);
        const socket1 = io.sockets.sockets.get(sockets[0]);
        const socket2 = io.sockets.sockets.get(sockets[1]);
        
        if (socket1 && socket2) {
          socket1.emit('battleUpdate', state1);
          socket2.emit('battleUpdate', state2);
        }
      }
      
      if (updatedBattle.status === 'completed') {
        if (battleInfo) {
          io.to(battleInfo.room).emit('battleEnd', {
            winner: updatedBattle.winner,
            battleLog: fullLog
          });
          
          // Send battle result notifications
          await sendBattleResultNotifications(io, updatedBattle);
          
          // Archive battle chat
          const winnerUsername = updatedBattle.players.find(p => p.userId === updatedBattle.winner)?.username;
          await archiveBattleChat(io, battleId, updatedBattle.winner, winnerUsername);
          
          // Cleanup
          turnTimerManager.endBattle(battleId);
          activeBattles.delete(battleId);
        }
      } else {
        // Start timer for next turn
        turnTimerManager.startTurn(battleId, updatedBattle.turn, async (timedOutUserId) => {
          await handlePlayerTimeout(io, battleId, timedOutUserId);
        });
      }
    }
  } catch (error) {
    console.error('Switch error:', error);
    socket.emit('error', { message: 'Failed to switch Pokemon' });
  }
});
    
    // Forfeit battle
    socket.on('forfeit', async ({ battleId, userId }) => {
      try {
        const battle = await Battle.findOne({ battleId });
        if (!battle) return;
        
        // Compare userId as strings
        const playerIndex = battle.players.findIndex(p => p.userId === userId);
        if (playerIndex === -1) return;
        
        const winner = battle.players[1 - playerIndex];
        battle.status = 'completed';
        battle.winner = winner.userId;
        await battle.save();
        
        // Log forfeit via service
        await battleLogService.system(battleId, battle.turn, 
          `${battle.players[playerIndex].username} forfeited the battle!`
        );
        await battleLogService.battleEnd(battleId, battle.turn, winner.userId, winner.username, 'forfeit');
        
        const battleInfo = activeBattles.get(battleId);
        if (battleInfo) {
          const fullLog = await battleLogService.getFullLog(battleId);
          
          io.to(battleInfo.room).emit('battleEnd', {
            winner: battle.winner,
            reason: 'forfeit',
            battleLog: fullLog
          });
          
          // Send battle result notifications
          await sendBattleResultNotifications(io, battle);
          
          // Archive battle chat
          await archiveBattleChat(io, battleId, battle.winner, winner.username);
          
          // Cleanup
          turnTimerManager.endBattle(battleId);
          activeBattles.delete(battleId);
        }
      } catch (error) {
        console.error('Forfeit error:', error);
      }
    });
    
    // Reconnect to battle - replay log
    socket.on('rejoinBattle', async ({ battleId, userId, lastLogTimestamp }) => {
      try {
        const battle = await Battle.findOne({ battleId });
        if (!battle) {
          socket.emit('error', { message: 'Battle not found' });
          return;
        }
        
        const playerIndex = battle.players.findIndex(p => p.userId === userId);
        if (playerIndex === -1) {
          socket.emit('error', { message: 'Not a participant of this battle' });
          return;
        }
        
        // Join battle room
        socket.join(`battle_${battleId}`);
        
        // Get log entries (full or after timestamp)
        let logEntries;
        if (lastLogTimestamp) {
          logEntries = await battleLogService.getLogAfter(battleId, lastLogTimestamp);
        } else {
          logEntries = await battleLogService.getFullLog(battleId);
        }
        
        // Get current state
        const state = BattleEngine.getBattleState(battle, userId);
        state.battleLog = await battleLogService.getFullLog(battleId);
        
        // Get timer state
        const timerState = turnTimerManager.getTimerState(battleId);
        
        // Send rejoin data
        socket.emit('battleRejoin', {
          state,
          logReplay: logEntries,
          timerState,
          isReconnect: true
        });
      } catch (error) {
        console.error('Rejoin error:', error);
        socket.emit('error', { message: 'Failed to rejoin battle' });
      }
    });
    
    // Disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Remove from matchmaking queue
      const queueIndex = matchmakingQueue.findIndex(p => p.socketId === socket.id);
      if (queueIndex !== -1) {
        matchmakingQueue.splice(queueIndex, 1);
        console.log(`Player removed from queue. Size: ${matchmakingQueue.length}`);
      }
      
      // Note: Timer will handle timeout if player doesn't reconnect
    });
  });
};