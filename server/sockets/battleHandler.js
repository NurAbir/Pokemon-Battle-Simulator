// sockets/battleHandler.js
const Battle = require('../models/Battle');
const Team = require('../models/Team');
const BattleEngine = require('../utils/battleEngine');
const { generateId } = require('../utils/generateId');

// Store active matchmaking users
const matchmakingQueue = [];
const activeBattles = new Map(); // battleId -> { room, players }

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Join matchmaking
    socket.on('joinMatchmaking', async ({ userId, teamId, username }) => {
      try {
        // Validate inputs
        if (!userId || !teamId) {
          socket.emit('error', { message: 'Missing userId or teamId' });
          return;
        }

        // Get user's team from database using teamId and userId
        const team = await Team.findOne({ _id: teamId, userId });
        
        if (!team) {
          socket.emit('error', { message: 'Team not found' });
          console.error('Team lookup failed:', { teamId, userId });
          return;
        }

        if (!team.pokemons || team.pokemons.length === 0) {
          socket.emit('error', { message: 'Team has no Pokemon' });
          return;
        }
        
        // Add to queue
        const player = {
          userId,
          socketId: socket.id,
          team: team.pokemons,
          username: username || 'Player'
        };
        
        matchmakingQueue.push(player);
        console.log(`Player ${username} joined matchmaking. Queue size: ${matchmakingQueue.length}`);
        socket.emit('matchmakingJoined');
        
        // Try to match
        if (matchmakingQueue.length >= 2) {
          const player1 = matchmakingQueue.shift();
          const player2 = matchmakingQueue.shift();
          
          // Verify both sockets still exist
          const socket1 = io.sockets.sockets.get(player1.socketId);
          const socket2 = io.sockets.sockets.get(player2.socketId);
          
          if (!socket1 || !socket2) {
            console.error('One or both sockets no longer exist');
            // Put players back in queue if sockets are gone
            if (socket1) matchmakingQueue.unshift(player1);
            if (socket2) matchmakingQueue.unshift(player2);
            return;
          }
          
          try {
            // Create battle
            const battleId = generateId('battle');
            const battle = await BattleEngine.createBattle(player1, player2, battleId);
            
            // Create room
            const room = `battle_${battleId}`;
            socket1.join(room);
            socket2.join(room);
            
            activeBattles.set(battleId, {
              room,
              players: [player1.userId, player2.userId]
            });
            
            console.log(`Battle created: ${battleId} between ${player1.username} and ${player2.username}`);
            
            // Send initial battle state
            const state1 = BattleEngine.getBattleState(battle, player1.userId);
            const state2 = BattleEngine.getBattleState(battle, player2.userId);
            
            socket1.emit('battleStart', state1);
            socket2.emit('battleStart', state2);
          } catch (battleError) {
            console.error('Battle creation error:', battleError);
            // Put players back in queue if battle creation fails
            matchmakingQueue.unshift(player1);
            matchmakingQueue.unshift(player2);
            socket1.emit('error', { message: 'Failed to create battle' });
            socket2.emit('error', { message: 'Failed to create battle' });
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
        
        const playerIndex = battle.players.findIndex(p => p.userId.toString() === userId.toString());
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
            const socket1 = io.sockets.sockets.get(
              Array.from(io.sockets.adapter.rooms.get(battleInfo.room) || [])[0]
            );
            const socket2 = io.sockets.sockets.get(
              Array.from(io.sockets.adapter.rooms.get(battleInfo.room) || [])[1]
            );
            
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
        
        const playerIndex = battle.players.findIndex(p => p.userId.toString() === userId.toString());
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
        
        const playerIndex = battle.players.findIndex(p => p.userId.toString() === userId.toString());
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
      }
      
      // Handle active battles (forfeit if in battle)
      // You might want to add logic here to handle disconnections gracefully
    });
  });
};