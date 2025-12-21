const Battle = require('../models/Battle');
const Team = require('../models/Team');
const User = require('../models/User');
const BattleEngine = require('../utils/battleEngine');

// Generate unique battle ID
function generateId(prefix = 'id') {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${prefix}_${timestamp}${randomStr}`;
}

// Store active matchmaking users
const matchmakingQueue = [];
const activeBattles = new Map(); // battleId -> { room, players }

module.exports = (io) => {
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
            
            // Send initial battle state to both players
            const state1 = BattleEngine.getBattleState(battle, player1.userId);
            const state2 = BattleEngine.getBattleState(battle, player2.userId);
            
            socket1.emit('battleStart', state1);
            socket2.emit('battleStart', state2);
            
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
        
        // Set selected move
        battle.players[playerIndex].selectedMove = moveName;
        battle.players[playerIndex].ready = true;
        await battle.save();
        
        const battleInfo = activeBattles.get(battleId);
        if (battleInfo) {
          io.to(battleInfo.room).emit('playerReady', { 
            playerIndex,
            ready: true 
          });
        }
        
        // Check if both players ready
        if (battle.players.every(p => p.ready)) {
          // Process turn
          const updatedBattle = await BattleEngine.processTurn(battle);
          
          // Send updated state to both players
          const state1 = BattleEngine.getBattleState(updatedBattle, battle.players[0].userId);
          const state2 = BattleEngine.getBattleState(updatedBattle, battle.players[1].userId);
          
          if (battleInfo) {
            const sockets = Array.from(io.sockets.adapter.rooms.get(battleInfo.room) || []);
            const socket1 = io.sockets.sockets.get(sockets[0]);
            const socket2 = io.sockets.sockets.get(sockets[1]);
            
            if (socket1 && socket2) {
              socket1.emit('battleUpdate', state1);
              socket2.emit('battleUpdate', state2);
            }
          }
          
          // Check if battle ended
          if (updatedBattle.status === 'completed') {
            if (battleInfo) {
              io.to(battleInfo.room).emit('battleEnd', {
                winner: updatedBattle.winner,
                battleLog: updatedBattle.battleLog
              });
              
              activeBattles.delete(battleId);
            }
          }
        }
      } catch (error) {
        console.error('Move selection error:', error);
        socket.emit('error', { message: 'Failed to select move' });
      }
    });
    
    // Switch Pokemon
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
        
        const targetPokemon = battle.players[playerIndex].team[pokemonIndex];
        if (!targetPokemon || targetPokemon.fainted) {
          socket.emit('error', { message: 'Cannot switch to that Pokemon' });
          return;
        }
        
        // Set switch target
        battle.players[playerIndex].switchTo = pokemonIndex;
        battle.players[playerIndex].ready = true;
        await battle.save();
        
        const battleInfo = activeBattles.get(battleId);
        if (battleInfo) {
          io.to(battleInfo.room).emit('playerReady', { 
            playerIndex,
            ready: true 
          });
        }
        
        // Check if both players ready
        if (battle.players.every(p => p.ready)) {
          const updatedBattle = await BattleEngine.processTurn(battle);
          
          const state1 = BattleEngine.getBattleState(updatedBattle, battle.players[0].userId);
          const state2 = BattleEngine.getBattleState(updatedBattle, battle.players[1].userId);
          
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
                battleLog: updatedBattle.battleLog
              });
              
              activeBattles.delete(battleId);
            }
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
        
        battle.status = 'completed';
        battle.winner = battle.players[1 - playerIndex].userId;
        battle.addLog(`${battle.players[playerIndex].username} forfeited the battle!`);
        await battle.save();
        
        const battleInfo = activeBattles.get(battleId);
        if (battleInfo) {
          io.to(battleInfo.room).emit('battleEnd', {
            winner: battle.winner,
            reason: 'forfeit',
            battleLog: battle.battleLog
          });
          
          activeBattles.delete(battleId);
        }
      } catch (error) {
        console.error('Forfeit error:', error);
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
      
      // TODO: Handle active battles - consider forfeiting on disconnect
    });
  });
};