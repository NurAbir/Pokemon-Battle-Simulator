// utils/battleEngine.js
const Battle = require('../models/Battle');
const Move = require('../models/Move');
const { 
  calculateDamage, 
  moveHits, 
  ohkoHits,
  getEffectivenessMessage,
  applyStatChanges,
  getStatChangeMessage,
  getMoveData,
  getMultiHitCount
} = require('./battleCalculator');

class BattleEngine {
  static setLogService(logService) {
    this.logService = logService;
  }

  static async createBattle(player1, player2, battleId) {
    try {
      console.log('Creating battle with players:', {
        player1: player1.username,
        player2: player2.username,
        team1Count: player1.team?.length,
        team2Count: player2.team?.length
      });

      if (!player1.team || player1.team.length === 0) {
        throw new Error(`Player ${player1.username} has no Pokemon`);
      }
      if (!player2.team || player2.team.length === 0) {
        throw new Error(`Player ${player2.username} has no Pokemon`);
      }

      const battle = new Battle({
        battleId,
        players: [
          {
            userId: player1.userId,
            username: player1.username,
            team: player1.team.map(p => this.initializePokemon(p)),
            activePokemonIndex: 0,
            needsForcedSwitch: false
          },
          {
            userId: player2.userId,
            username: player2.username,
            team: player2.team.map(p => this.initializePokemon(p)),
            activePokemonIndex: 0,
            needsForcedSwitch: false
          }
        ],
        status: 'active'
      });
      
      await battle.save();
      
      if (this.logService) {
        await this.logService.battleStart(battleId, player1, player2);
        
        const p1Active = battle.players[0].team[0];
        const p2Active = battle.players[1].team[0];
        await this.logService.info(battleId, 0, 
          `${player1.username}'s ${p1Active.nickname} vs ${player2.username}'s ${p2Active.nickname}!`
        );
      } else {
        battle.addLog(`Battle started between ${player1.username} and ${player2.username}!`);
        const p1Active = battle.players[0].team[0];
        const p2Active = battle.players[1].team[0];
        battle.addLog(`${player1.username}'s ${p1Active.nickname} vs ${player2.username}'s ${p2Active.nickname}!`);
        await battle.save();
      }
      
      console.log('✓ Battle created successfully:', battleId);
      return battle;
    } catch (error) {
      console.error('Battle creation error:', error);
      throw error;
    }
  }
  
  static initializePokemon(pokemon) {
    try {
      if (!pokemon) {
        console.error('Pokemon is null or undefined');
        throw new Error('Pokemon data is missing');
      }

      console.log('Initializing Pokemon:', {
        id: pokemon.id,
        name: pokemon.name,
        hasCalculatedStats: !!pokemon.calculatedStats,
        hasBaseStats: !!pokemon.baseStats
      });

      const stats = pokemon.calculatedStats || pokemon.stats || pokemon.baseStats;
      
      if (!stats) {
        console.error('Pokemon missing stats:', pokemon);
        throw new Error(`Pokemon ${pokemon.name || 'unknown'} is missing stats`);
      }

      return {
        pokemonId: pokemon.id || pokemon.pokemonId || pokemon._id,
        name: pokemon.name || 'Unknown',
        nickname: pokemon.nickname || pokemon.name || 'Unknown',
        level: pokemon.level || 50,
        types: pokemon.types || ['Normal'],
        currentHp: stats.hp || 100,
        maxHp: stats.hp || 100,
        stats: {
          atk: stats.atk || stats.attack || 50,
          def: stats.def || stats.defense || 50,
          spa: stats.spa || stats.spAttack || stats.specialAttack || 50,
          spd: stats.spd || stats.spDefense || stats.specialDefense || 50,
          spe: stats.spe || stats.speed || 50
        },
        moves: pokemon.moves || [],
        statusCondition: null,
        statStages: {
          atk: 0, def: 0, spa: 0, spd: 0, spe: 0,
          accuracy: 0, evasion: 0
        },
        fainted: false
      };
    } catch (error) {
      console.error('Error initializing Pokemon:', error, pokemon);
      throw error;
    }
  }
  
  static async processTurn(battle) {
    const player1 = battle.players[0];
    const player2 = battle.players[1];
    
    // Check if either player needs a forced switch
    if (player1.needsForcedSwitch || player2.needsForcedSwitch) {
      console.log('Waiting for forced switch...');
      
      // Handle forced switches
      if (player1.needsForcedSwitch && player1.switchTo !== undefined && player1.switchTo !== null) {
        await this.executeSwitch(battle, 0);
        player1.needsForcedSwitch = false;
        player1.switchTo = null;
      }
      
      if (player2.needsForcedSwitch && player2.switchTo !== undefined && player2.switchTo !== null) {
        await this.executeSwitch(battle, 1);
        player2.needsForcedSwitch = false;
        player2.switchTo = null;
      }
      
      // If both have switched or only one needed to switch, reset and continue
      if (!player1.needsForcedSwitch && !player2.needsForcedSwitch) {
        player1.selectedMove = null;
        player1.ready = false;
        player2.selectedMove = null;
        player2.ready = false;
        battle.turn += 1;
      }
      
      await battle.save();
      return battle;
    }
    
    const actions = [];
    
    if (player1.switchTo !== undefined && player1.switchTo !== null) {
      actions.push({ player: 0, type: 'switch', priority: 6 });
    } else if (player1.selectedMove) {
      const move1 = await Move.findOne({ name: this.normalizeMoveName(player1.selectedMove) });
      const moveData1 = getMoveData(move1?.name || player1.selectedMove);
      actions.push({ 
        player: 0, 
        type: 'move', 
        priority: moveData1.priority || 0 
      });
    }
    
    if (player2.switchTo !== undefined && player2.switchTo !== null) {
      actions.push({ player: 1, type: 'switch', priority: 6 });
    } else if (player2.selectedMove) {
      const move2 = await Move.findOne({ name: this.normalizeMoveName(player2.selectedMove) });
      const moveData2 = getMoveData(move2?.name || player2.selectedMove);
      actions.push({ 
        player: 1, 
        type: 'move', 
        priority: moveData2.priority || 0 
      });
    }
    
    // Sort by priority, then speed, then random
    actions.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      
      const pokemonA = battle.players[a.player].team[battle.players[a.player].activePokemonIndex];
      const pokemonB = battle.players[b.player].team[battle.players[b.player].activePokemonIndex];
      
      const stagesA = pokemonA.statStages || { spe: 0 };
      const stagesB = pokemonB.statStages || { spe: 0 };
      
      // Apply speed stages
      const speedMultA = stagesA.spe >= 0 ? (2 + stagesA.spe) / 2 : 2 / (2 - stagesA.spe);
      const speedMultB = stagesB.spe >= 0 ? (2 + stagesB.spe) / 2 : 2 / (2 - stagesB.spe);
      
      const speedA = Math.floor(pokemonA.stats.spe * speedMultA);
      const speedB = Math.floor(pokemonB.stats.spe * speedMultB);
      
      if (speedA !== speedB) return speedB - speedA;
      return Math.random() - 0.5;
    });
    
    // Execute actions
    for (const action of actions) {
      // Skip if Pokemon fainted
      const actingPokemon = battle.players[action.player].team[battle.players[action.player].activePokemonIndex];
      if (actingPokemon.fainted) {
        console.log(`${actingPokemon.nickname} has fainted, skipping action`);
        continue;
      }
      
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
      
      // Check if opponent needs forced switch
      const opponentIndex = 1 - action.player;
      const opponent = battle.players[opponentIndex];
      const opponentActive = opponent.team[opponent.activePokemonIndex];
      
      if (opponentActive.fainted) {
        const hasAvailable = opponent.team.some(p => !p.fainted);
        
        if (hasAvailable) {
          opponent.needsForcedSwitch = true;
          
          if (this.logService) {
            await this.logService.info(battle.battleId, battle.turn,
              `${opponent.username} must switch Pokemon!`);
          } else {
            battle.addLog(`${opponent.username} must switch Pokemon!`);
          }
          
          // Save and return - wait for switch
          await battle.save();
          return battle;
        }
      }
    }
    
    // Reset selections and increment turn only if no forced switches
    if (!player1.needsForcedSwitch && !player2.needsForcedSwitch) {
      player1.selectedMove = null;
      player1.switchTo = null;
      player1.ready = false;
      player2.selectedMove = null;
      player2.switchTo = null;
      player2.ready = false;
      battle.turn += 1;
    }
    
    await battle.save();
    return battle;
  }
  
  static async executeSwitch(battle, playerIndex) {
    const player = battle.players[playerIndex];
    const oldPokemon = player.team[player.activePokemonIndex];
    const newIndex = player.switchTo;
    const newPokemon = player.team[newIndex];
    
    if (newPokemon.fainted) {
      if (this.logService) {
        await this.logService.info(battle.battleId, battle.turn,
          `${player.username} tried to switch to ${newPokemon.nickname}, but it has fainted!`
        );
      } else {
        battle.addLog(`${player.username} tried to switch to ${newPokemon.nickname}, but it has fainted!`);
      }
      return;
    }
    
    player.activePokemonIndex = newIndex;
    
    if (this.logService) {
      await this.logService.pokemonWithdrawn(battle.battleId, battle.turn, player.username, oldPokemon.nickname, player.userId);
      await this.logService.pokemonSentOut(battle.battleId, battle.turn, player.username, newPokemon.nickname, player.userId);
    } else {
      battle.addLog(`${player.username} withdrew ${oldPokemon.nickname}!`);
      battle.addLog(`${player.username} sent out ${newPokemon.nickname}!`);
    }
  }
  
  static normalizeMoveName(moveName) {
    if (!moveName) return '';
    return moveName.toLowerCase().trim().replace(/\s+/g, '-');
  }

  static async executeMove(battle, playerIndex) {
    const attacker = battle.players[playerIndex];
    const defender = battle.players[1 - playerIndex];
    
    const attackingPokemon = attacker.team[attacker.activePokemonIndex];
    const defendingPokemon = defender.team[defender.activePokemonIndex];
    
    console.log('=== EXECUTING MOVE ===');
    console.log('Attacker:', attackingPokemon.nickname, 'HP:', attackingPokemon.currentHp);
    console.log('Defender:', defendingPokemon.nickname, 'HP:', defendingPokemon.currentHp);
    
    if (attackingPokemon.fainted) {
      console.log('Attacker has fainted, skipping move');
      return;
    }
    
    const normalizedMoveName = this.normalizeMoveName(attacker.selectedMove);
    let move = await Move.findOne({ name: normalizedMoveName });
    
    if (!move) {
      move = await Move.findOne({ 
        name: { $regex: new RegExp(`^${normalizedMoveName}$`, 'i') } 
      });
    }
    
    if (!move) {
      console.error(`Move not found: "${attacker.selectedMove}"`);
      
      if (this.logService) {
        await this.logService.moveFailed(battle.battleId, battle.turn, attackingPokemon.nickname, attacker.selectedMove);
      } else {
        battle.addLog(`${attackingPokemon.nickname} tried to use ${attacker.selectedMove}, but it failed!`);
      }
      return;
    }
    
    const moveData = getMoveData(move.name);
    console.log('Move data:', { name: move.name, power: move.power, category: move.category, special: moveData });
    
    if (this.logService) {
      await this.logService.moveUsed(battle.battleId, battle.turn, attackingPokemon.nickname, move.name, attacker.userId);
    } else {
      battle.addLog(`${attackingPokemon.nickname} used ${move.name}!`);
    }
    
    // Handle status moves
    if (move.category === 'status' || move.category === 'Status') {
      await this.handleStatusMove(battle, move, moveData, attackingPokemon, defendingPokemon, attacker, defender);
      return;
    }
    
    // Handle OHKO moves
    if (moveData.ohko) {
      const hits = ohkoHits(attackingPokemon.level, defendingPokemon.level);
      
      if (!hits) {
        if (this.logService) {
          await this.logService.moveMissed(battle.battleId, battle.turn, attackingPokemon.nickname);
        } else {
          battle.addLog(`${attackingPokemon.nickname}'s attack missed!`);
        }
        return;
      }
      
      defendingPokemon.currentHp = 0;
      
      if (this.logService) {
        await this.logService.info(battle.battleId, battle.turn, "It's a one-hit KO!");
        await this.logService.pokemonFainted(battle.battleId, battle.turn, defendingPokemon.nickname);
      } else {
        battle.addLog("It's a one-hit KO!");
        battle.addLog(`${defendingPokemon.nickname} fainted!`);
      }
      
      defendingPokemon.fainted = true;
      await this.checkBattleEnd(battle, attacker, defender);
      return;
    }
    
    // Check accuracy for damaging moves
    const hits = moveHits(move.accuracy, attackingPokemon.statStages.accuracy, defendingPokemon.statStages.evasion);
    
    if (!hits) {
      if (this.logService) {
        await this.logService.moveMissed(battle.battleId, battle.turn, attackingPokemon.nickname);
      } else {
        battle.addLog(`${attackingPokemon.nickname}'s attack missed!`);
      }
      return;
    }
    
    // Handle multi-hit moves
    const hitCount = getMultiHitCount(moveData.multihit);
    let totalDamage = 0;
    let lastResult = null;
    
    for (let i = 0; i < hitCount; i++) {
      if (defendingPokemon.currentHp <= 0) break;
      
      const result = calculateDamage(attackingPokemon, defendingPokemon, move);
      lastResult = result;
      
      const oldHp = defendingPokemon.currentHp;
      defendingPokemon.currentHp = Math.max(0, defendingPokemon.currentHp - result.damage);
      totalDamage += result.damage;
      
      console.log(`Hit ${i + 1}/${hitCount}: ${result.damage} damage (${oldHp} -> ${defendingPokemon.currentHp})`);
    }
    
    // Log multi-hit
    if (hitCount > 1) {
      if (this.logService) {
        await this.logService.info(battle.battleId, battle.turn, `Hit ${hitCount} time(s)!`);
      } else {
        battle.addLog(`Hit ${hitCount} time(s)!`);
      }
    }
    
    // Log crit and effectiveness
    if (lastResult.isCrit) {
      if (this.logService) {
        await this.logService.criticalHit(battle.battleId, battle.turn);
      } else {
        battle.addLog("A critical hit!");
      }
    }
    
    if (this.logService) {
      await this.logService.damageDealt(battle.battleId, battle.turn, defendingPokemon.nickname, totalDamage, lastResult.typeEffectiveness);
    } else {
      const effMsg = getEffectivenessMessage(lastResult.typeEffectiveness);
      if (effMsg) battle.addLog(effMsg);
    }
    
    // Handle recoil damage
    if (lastResult.recoilDamage > 0) {
      attackingPokemon.currentHp = Math.max(0, attackingPokemon.currentHp - lastResult.recoilDamage);
      
      if (this.logService) {
        await this.logService.info(battle.battleId, battle.turn, 
          `${attackingPokemon.nickname} was hit by recoil!`);
      } else {
        battle.addLog(`${attackingPokemon.nickname} was hit by recoil!`);
      }
      
      if (attackingPokemon.currentHp === 0) {
        attackingPokemon.fainted = true;
        if (this.logService) {
          await this.logService.pokemonFainted(battle.battleId, battle.turn, attackingPokemon.nickname);
        } else {
          battle.addLog(`${attackingPokemon.nickname} fainted!`);
        }
      }
    }
    
    // Check if defender fainted
    if (defendingPokemon.currentHp === 0) {
      defendingPokemon.fainted = true;
      
      if (this.logService) {
        await this.logService.pokemonFainted(battle.battleId, battle.turn, defendingPokemon.nickname);
      } else {
        battle.addLog(`${defendingPokemon.nickname} fainted!`);
      }
      
      await this.checkBattleEnd(battle, attacker, defender);
    }
  }
  
  static async handleStatusMove(battle, move, moveData, attackingPokemon, defendingPokemon, attacker, defender) {
    // Check if move hits
    const hits = moveHits(move.accuracy, attackingPokemon.statStages.accuracy, defendingPokemon.statStages.evasion);
    
    if (!hits) {
      if (this.logService) {
        await this.logService.moveMissed(battle.battleId, battle.turn, attackingPokemon.nickname);
      } else {
        battle.addLog(`${attackingPokemon.nickname}'s attack missed!`);
      }
      return;
    }
    
    // Apply stat changes
    if (moveData.statChanges) {
      const target = moveData.target === 'self' ? attackingPokemon : defendingPokemon;
      const targetName = moveData.target === 'self' ? attackingPokemon.nickname : defendingPokemon.nickname;
      
      // Apply the changes
      const updated = applyStatChanges(target, moveData.statChanges);
      Object.assign(target, updated);
      
      // Get and log messages
      const messages = getStatChangeMessage(targetName, moveData.statChanges);
      
      for (const message of messages) {
        if (this.logService) {
          await this.logService.info(battle.battleId, battle.turn, message);
        } else {
          battle.addLog(message);
        }
      }
    } else {
      // Generic status move message
      if (this.logService) {
        await this.logService.info(battle.battleId, battle.turn, 
          `${attackingPokemon.nickname} used a status move!`);
      } else {
        battle.addLog(`${attackingPokemon.nickname} used a status move!`);
      }
    }
  }
  
  static async checkBattleEnd(battle, attacker, defender) {
    const hasAvailable = defender.team.some(p => !p.fainted);
    
    if (!hasAvailable) {
      battle.status = 'completed';
      battle.winner = attacker.userId;
      
      if (this.logService) {
        await this.logService.battleEnd(battle.battleId, battle.turn, attacker.userId, attacker.username, 'knockout');
      } else {
        battle.addLog(`${attacker.username} wins the battle!`);
      }
    }
  }
  
  static getBattleState(battle, userId) {
    const playerIndex = battle.players.findIndex(p => p.userId.toString() === userId.toString());
    const opponentIndex = 1 - playerIndex;
    
    if (playerIndex === -1) return null;
    
    const player = battle.players[playerIndex];
    const opponent = battle.players[opponentIndex];
    
    return {
      battleId: battle.battleId,
      turn: battle.turn,
      status: battle.status,
      winner: battle.winner,
      needsForcedSwitch: player.needsForcedSwitch || false,
      player: {
        username: player.username,
        activePokemon: player.team[player.activePokemonIndex],
        team: player.team.map(p => ({
          name: p.name,
          nickname: p.nickname,
          currentHp: p.currentHp,
          maxHp: p.maxHp,
          fainted: p.fainted,
          statStages: p.statStages
        }))
      },
      opponent: {
        username: opponent.username,
        activePokemon: {
          name: opponent.team[opponent.activePokemonIndex].name,
          nickname: opponent.team[opponent.activePokemonIndex].nickname,
          currentHp: opponent.team[opponent.activePokemonIndex].currentHp,
          maxHp: opponent.team[opponent.activePokemonIndex].maxHp,
          types: opponent.team[opponent.activePokemonIndex].types,
          level: opponent.team[opponent.activePokemonIndex].level,
          fainted: opponent.team[opponent.activePokemonIndex].fainted
        },
        team: opponent.team.map(p => ({
          name: p.name,
          nickname: p.nickname,
          fainted: p.fainted
        }))
      },
      battleLog: battle.battleLog.slice(-10)
    };
  }
}

module.exports = BattleEngine;