// utils/battleEngine.js
const Battle = require('../models/Battle');
const Move = require('../models/Move');
const { calculateDamage, moveHits, getEffectivenessMessage } = require('./battleCalculator');

class BattleEngine {
  // Set log service (called from battleHandler)
  static setLogService(logService) {
    this.logService = logService;
  }

  // Create new battle
  static async createBattle(player1, player2, battleId) {
    try {
      console.log('Creating battle with players:', {
        player1: player1.username,
        player2: player2.username,
        team1Count: player1.team?.length,
        team2Count: player2.team?.length
      });

      // Validate teams
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
      
      // Use log service if available
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
  
  // Initialize Pokemon for battle
  static initializePokemon(pokemon) {
    try {
      // Check if pokemon is null or undefined
      if (!pokemon) {
        console.error('Pokemon is null or undefined');
        throw new Error('Pokemon data is missing');
      }

      // Log the pokemon structure to debug
      console.log('Initializing Pokemon:', {
        id: pokemon.id,
        name: pokemon.name,
        hasCalculatedStats: !!pokemon.calculatedStats,
        hasBaseStats: !!pokemon.baseStats
      });

      // Handle different possible data structures
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
  
  // Normalize move name to kebab-case (database format)
  static normalizeMoveName(moveName) {
    if (!moveName) return '';
    // Convert "Thunder Shock" or "Thunder shock" to "thunder-shock"
    return moveName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-');
  }

  // Execute move
  static async executeMove(battle, playerIndex) {
    const attacker = battle.players[playerIndex];
    const defender = battle.players[1 - playerIndex];
    
    const attackingPokemon = attacker.team[attacker.activePokemonIndex];
    const defendingPokemon = defender.team[defender.activePokemonIndex];
    
    console.log('=== EXECUTING MOVE ===');
    console.log('Attacker:', attackingPokemon.nickname, 'HP:', attackingPokemon.currentHp);
    console.log('Defender:', defendingPokemon.nickname, 'HP:', defendingPokemon.currentHp);
    console.log('Selected move:', attacker.selectedMove);
    
    // Check if Pokemon fainted
    if (attackingPokemon.fainted) {
      console.log('Attacker has fainted, skipping move');
      return;
    }
    
    console.log('Searching for move:', attacker.selectedMove);
    
    // Normalize move name to match database format (kebab-case)
    const normalizedMoveName = this.normalizeMoveName(attacker.selectedMove);
    console.log('Normalized to:', normalizedMoveName);
    
    // Get move data - try normalized name first, then original
    let move = await Move.findOne({ name: normalizedMoveName });
    if (!move) {
      // Fallback: try case-insensitive search
      move = await Move.findOne({ 
        name: { $regex: new RegExp(`^${normalizedMoveName}$`, 'i') } 
      });
    }
    
    console.log('Match result:', move ? 'FOUND' : 'NOT FOUND');
    
    if (!move) {
      const allMoves = await Move.find().limit(10);
      console.log('\n=== MOVES IN DATABASE ===');
      allMoves.forEach(m => {
        console.log(`- "${m.name}" (${m.type}, ${m.category}, power: ${m.power})`);
      });
      console.log('=========================\n');
      
      console.error(`Move not found: "${attacker.selectedMove}" (normalized: "${normalizedMoveName}")`);
      
      if (this.logService) {
        await this.logService.moveFailed(battle.battleId, battle.turn, attackingPokemon.nickname, attacker.selectedMove);
      } else {
        battle.addLog(`${attackingPokemon.nickname} tried to use ${attacker.selectedMove}, but it failed!`);
      }
      return;
    }
    
    console.log('Move found:', move.name, 'Power:', move.power, 'Type:', move.type, 'Category:', move.category);
    
    if (this.logService) {
      await this.logService.moveUsed(battle.battleId, battle.turn, attackingPokemon.nickname, move.name, attacker.userId);
    } else {
      battle.addLog(`${attackingPokemon.nickname} used ${move.name}!`);
    }
    
    // Check accuracy
    const hits = moveHits(move.accuracy, attackingPokemon.statStages.accuracy, defendingPokemon.statStages.evasion);
    console.log('Accuracy check:', hits);
    
    if (!hits) {
      const missMsg = `${attackingPokemon.nickname}'s attack missed!`;
      console.log(missMsg);
      
      if (this.logService) {
        await this.logService.moveMissed(battle.battleId, battle.turn, attackingPokemon.nickname);
      } else {
        battle.addLog(missMsg);
      }
      return;
    }
    
    // Calculate damage
    if (move.category !== 'status') {
      console.log('Calculating damage...');
      console.log('Attacker stats:', attackingPokemon.stats);
      console.log('Defender stats:', defendingPokemon.stats);
      
      const result = calculateDamage(attackingPokemon, defendingPokemon, move);
      
      console.log('Damage result:', result);
      
      // Apply damage
      const oldHp = defendingPokemon.currentHp;
      defendingPokemon.currentHp = Math.max(0, defendingPokemon.currentHp - result.damage);
      
      console.log(`HP: ${oldHp} -> ${defendingPokemon.currentHp} (Damage: ${result.damage})`);
      
      // Log results
      if (result.isCrit) {
        if (this.logService) {
          await this.logService.criticalHit(battle.battleId, battle.turn);
        } else {
          battle.addLog("A critical hit!");
        }
      }
      
      // Effectiveness message
      if (this.logService) {
        await this.logService.damageDealt(battle.battleId, battle.turn, defendingPokemon.nickname, result.damage, result.typeEffectiveness);
      } else {
        const effMsg = getEffectivenessMessage(result.typeEffectiveness);
        if (effMsg) {
          battle.addLog(effMsg);
        }
      }
      
      // Check if fainted
      if (defendingPokemon.currentHp === 0) {
        defendingPokemon.fainted = true;
        const faintMsg = `${defendingPokemon.nickname} fainted!`;
        console.log(faintMsg);
        
        if (this.logService) {
          await this.logService.pokemonFainted(battle.battleId, battle.turn, defendingPokemon.nickname);
        } else {
          battle.addLog(faintMsg);
        }
        
        // Check if player has any Pokemon left
        const hasAvailable = defender.team.some(p => !p.fainted);
        console.log('Defender has available Pokemon:', hasAvailable);
        
        if (!hasAvailable) {
          battle.status = 'completed';
          battle.winner = attacker.userId;
          const winMsg = `${attacker.username} wins the battle!`;
          console.log(winMsg);
          
          if (this.logService) {
            await this.logService.battleEnd(battle.battleId, battle.turn, attacker.userId, attacker.username, 'knockout');
          } else {
            battle.addLog(winMsg);
          }
        }
      }
    } else {
      console.log('Status move - no damage calculation');
      if (this.logService) {
        await this.logService.info(battle.battleId, battle.turn, `${attackingPokemon.nickname} used a status move!`);
      } else {
        battle.addLog(`${attackingPokemon.nickname} used a status move!`);
      }
    }
    
    console.log('=== MOVE EXECUTION COMPLETE ===');
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