// utils/battleEngine.js
const Battle = require('../models/Battle');
const Move = require('../models/Move');
const { calculateDamage, moveHits, getEffectivenessMessage } = require('./battleCalculator');

class BattleEngine {
  
  // Create new battle
  static async createBattle(player1, player2, battleId) {
    const battle = new Battle({
      battleId,
      players: [
        {
          userId: player1.userId,
          username: player1.username,
          team: player1.team.map(p => this.initializePokemon(p)),
          activePokemonIndex: 0
        },
        {
          userId: player2.userId,
          username: player2.username,
          team: player2.team.map(p => this.initializePokemon(p)),
          activePokemonIndex: 0
        }
      ],
      status: 'active'
    });
    
    await battle.save();
    battle.addLog(`Battle started between ${player1.username} and ${player2.username}!`);
    await battle.save();
    
    return battle;
  }
  
  // Initialize Pokemon for battle
  static initializePokemon(pokemon) {
    return {
      pokemonId: pokemon.id,
      name: pokemon.name,
      nickname: pokemon.nickname || pokemon.name,
      level: pokemon.level,
      types: pokemon.types,
      currentHp: pokemon.calculatedStats.hp,
      maxHp: pokemon.calculatedStats.hp,
      stats: {
        atk: pokemon.calculatedStats.atk,
        def: pokemon.calculatedStats.def,
        spa: pokemon.calculatedStats.spa,
        spd: pokemon.calculatedStats.spd,
        spe: pokemon.calculatedStats.spe
      },
      moves: pokemon.moves,
      statusCondition: null,
      statStages: {
        atk: 0, def: 0, spa: 0, spd: 0, spe: 0,
        accuracy: 0, evasion: 0
      },
      fainted: false
    };
  }
  
  // Process turn
  static async processTurn(battle) {
    const player1 = battle.players[0];
    const player2 = battle.players[1];
    
    // Handle switches first
    const actions = [];
    
    if (player1.switchTo !== undefined && player1.switchTo !== null) {
      actions.push({ player: 0, type: 'switch', priority: 6 });
    } else if (player1.selectedMove) {
      actions.push({ player: 0, type: 'move', priority: 0 });
    }
    
    if (player2.switchTo !== undefined && player2.switchTo !== null) {
      actions.push({ player: 1, type: 'switch', priority: 6 });
    } else if (player2.selectedMove) {
      actions.push({ player: 1, type: 'move', priority: 0 });
    }
    
    // Sort by priority (switches first), then by speed
    actions.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      
      const speedA = battle.players[a.player].team[battle.players[a.player].activePokemonIndex].stats.spe;
      const speedB = battle.players[b.player].team[battle.players[b.player].activePokemonIndex].stats.spe;
      
      if (speedA !== speedB) return speedB - speedA;
      return Math.random() - 0.5; // Speed tie
    });
    
    // Execute actions
    for (const action of actions) {
      if (action.type === 'switch') {
        await this.executeSwitch(battle, action.player);
      } else if (action.type === 'move') {
        await this.executeMove(battle, action.player);
      }
      
      // Check if battle ended
      if (battle.checkBattleEnd()) {
        await battle.save();
        return battle;
      }
    }
    
    // Reset selections and increment turn
    battle.players[0].selectedMove = null;
    battle.players[0].switchTo = null;
    battle.players[0].ready = false;
    battle.players[1].selectedMove = null;
    battle.players[1].switchTo = null;
    battle.players[1].ready = false;
    battle.turn += 1;
    
    await battle.save();
    return battle;
  }
  
  // Execute switch
  static async executeSwitch(battle, playerIndex) {
    const player = battle.players[playerIndex];
    const oldPokemon = player.team[player.activePokemonIndex];
    const newIndex = player.switchTo;
    const newPokemon = player.team[newIndex];
    
    if (newPokemon.fainted) {
      battle.addLog(`${player.username} tried to switch to ${newPokemon.nickname}, but it has fainted!`);
      return;
    }
    
    player.activePokemonIndex = newIndex;
    battle.addLog(`${player.username} withdrew ${oldPokemon.nickname}!`);
    battle.addLog(`${player.username} sent out ${newPokemon.nickname}!`);
  }
  
  // Execute move
  static async executeMove(battle, playerIndex) {
    const attacker = battle.players[playerIndex];
    const defender = battle.players[1 - playerIndex];
    
    const attackingPokemon = attacker.team[attacker.activePokemonIndex];
    const defendingPokemon = defender.team[defender.activePokemonIndex];
    
    // Check if Pokemon fainted
    if (attackingPokemon.fainted) {
      return;
    }
    
    // Get move data
    const move = await Move.findOne({ name: attacker.selectedMove });
    if (!move) {
      battle.addLog(`${attackingPokemon.nickname} tried to use ${attacker.selectedMove}, but it failed!`);
      return;
    }
    
    battle.addLog(`${attackingPokemon.nickname} used ${move.name}!`);
    
    // Check accuracy
    if (!moveHits(move.accuracy, attackingPokemon.statStages.accuracy, defendingPokemon.statStages.evasion)) {
      battle.addLog(`${attackingPokemon.nickname}'s attack missed!`);
      return;
    }
    
    // Calculate damage
    if (move.category !== 'status') {
      const result = calculateDamage(attackingPokemon, defendingPokemon, move);
      
      // Apply damage
      defendingPokemon.currentHp = Math.max(0, defendingPokemon.currentHp - result.damage);
      
      // Log results
      if (result.isCrit) {
        battle.addLog("A critical hit!");
      }
      
      const effMsg = getEffectivenessMessage(result.typeEffectiveness);
      if (effMsg) {
        battle.addLog(effMsg);
      }
      
      // Check if fainted
      if (defendingPokemon.currentHp === 0) {
        defendingPokemon.fainted = true;
        battle.addLog(`${defendingPokemon.nickname} fainted!`);
        
        // Check if player has any Pokemon left
        const hasAvailable = defender.team.some(p => !p.fainted);
        if (!hasAvailable) {
          battle.status = 'completed';
          battle.winner = attacker.userId;
          battle.addLog(`${attacker.username} wins the battle!`);
        }
      }
    }
  }
  
  // Get battle state for client
  static getBattleState(battle, userId) {
    const playerIndex = battle.players.findIndex(p => p.userId.toString() === userId.toString());
    const opponentIndex = 1 - playerIndex;
    
    if (playerIndex === -1) return null;
    
    return {
      battleId: battle.battleId,
      turn: battle.turn,
      status: battle.status,
      winner: battle.winner,
      player: {
        username: battle.players[playerIndex].username,
        activePokemon: battle.players[playerIndex].team[battle.players[playerIndex].activePokemonIndex],
        team: battle.players[playerIndex].team.map(p => ({
          name: p.name,
          nickname: p.nickname,
          currentHp: p.currentHp,
          maxHp: p.maxHp,
          fainted: p.fainted
        }))
      },
      opponent: {
        username: battle.players[opponentIndex].username,
        activePokemon: {
          name: battle.players[opponentIndex].team[battle.players[opponentIndex].activePokemonIndex].name,
          nickname: battle.players[opponentIndex].team[battle.players[opponentIndex].activePokemonIndex].nickname,
          currentHp: battle.players[opponentIndex].team[battle.players[opponentIndex].activePokemonIndex].currentHp,
          maxHp: battle.players[opponentIndex].team[battle.players[opponentIndex].activePokemonIndex].maxHp,
          types: battle.players[opponentIndex].team[battle.players[opponentIndex].activePokemonIndex].types,
          level: battle.players[opponentIndex].team[battle.players[opponentIndex].activePokemonIndex].level
        },
        team: battle.players[opponentIndex].team.map(p => ({
          name: p.name,
          nickname: p.nickname,
          fainted: p.fainted
        }))
      },
      battleLog: battle.battleLog.slice(-10) // Last 10 messages
    };
  }
}

module.exports = BattleEngine;