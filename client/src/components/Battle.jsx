// client/src/components/Battle.jsx
import React, { useState, useEffect, useCallback } from 'react';
import socketService from '../services/socketService';
import BattleLogPanel from './BattleLogPanel';
import '../styles/battle.css';

const Battle = () => {
  const userId = localStorage.getItem('userId');
  const teamId = localStorage.getItem('selectedTeamId');
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
  
  const [battleState, setBattleState] = useState(null);
  const [searching, setSearching] = useState(false);
  const [selectedMove, setSelectedMove] = useState(null);
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [battleLog, setBattleLog] = useState([]);
  const [turnTimer, setTurnTimer] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [spriteErrors, setSpriteErrors] = useState({ player: false, opponent: false });

  // Helper function to get Pokemon ID from name
  const getPokemonId = (pokemon) => {
    // If pokemonId exists, use it
    if (pokemon.pokemonId) return pokemon.pokemonId;
    
    // Map of Pokemon names to their Pokedex numbers
    const pokemonNameToId = {
      'bulbasaur': 1, 'ivysaur': 2, 'venusaur': 3,
      'charmander': 4, 'charmeleon': 5, 'charizard': 6,
      'squirtle': 7, 'wartortle': 8, 'blastoise': 9,
      'caterpie': 10, 'metapod': 11, 'butterfree': 12,
      'weedle': 13, 'kakuna': 14, 'beedrill': 15,
      'pidgey': 16, 'pidgeotto': 17, 'pidgeot': 18,
      'rattata': 19, 'raticate': 20, 'spearow': 21,
      'fearow': 22, 'ekans': 23, 'arbok': 24,
      'pikachu': 25, 'raichu': 26, 'sandshrew': 27,
      'sandslash': 28, 'nidoran-f': 29, 'nidorina': 30,
      'nidoqueen': 31, 'nidoran-m': 32, 'nidorino': 33,
      'nidoking': 34, 'clefairy': 35, 'clefable': 36,
      'vulpix': 37, 'ninetales': 38, 'jigglypuff': 39,
      'wigglytuff': 40, 'zubat': 41, 'golbat': 42,
      'oddish': 43, 'gloom': 44, 'vileplume': 45,
      'paras': 46, 'parasect': 47, 'venonat': 48,
      'venomoth': 49, 'diglett': 50, 'dugtrio': 51,
      'meowth': 52, 'persian': 53, 'psyduck': 54,
      'golduck': 55, 'mankey': 56, 'primeape': 57,
      'growlithe': 58, 'arcanine': 59, 'poliwag': 60,
      'poliwhirl': 61, 'poliwrath': 62, 'abra': 63,
      'kadabra': 64, 'alakazam': 65, 'machop': 66,
      'machoke': 67, 'machamp': 68, 'bellsprout': 69,
      'weepinbell': 70, 'victreebel': 71, 'tentacool': 72,
      'tentacruel': 73, 'geodude': 74, 'graveler': 75,
      'golem': 76, 'ponyta': 77, 'rapidash': 78,
      'slowpoke': 79, 'slowbro': 80, 'magnemite': 81,
      'magneton': 82, 'farfetchd': 83, 'doduo': 84,
      'dodrio': 85, 'seel': 86, 'dewgong': 87,
      'grimer': 88, 'muk': 89, 'shellder': 90,
      'cloyster': 91, 'gastly': 92, 'haunter': 93,
      'gengar': 94, 'onix': 95, 'drowzee': 96,
      'hypno': 97, 'krabby': 98, 'kingler': 99,
      'voltorb': 100, 'electrode': 101, 'exeggcute': 102,
      'exeggutor': 103, 'cubone': 104, 'marowak': 105,
      'hitmonlee': 106, 'hitmonchan': 107, 'lickitung': 108,
      'koffing': 109, 'weezing': 110, 'rhyhorn': 111,
      'rhydon': 112, 'chansey': 113, 'tangela': 114,
      'kangaskhan': 115, 'horsea': 116, 'seadra': 117,
      'goldeen': 118, 'seaking': 119, 'staryu': 120,
      'starmie': 121, 'mr-mime': 122, 'scyther': 123,
      'jynx': 124, 'electabuzz': 125, 'magmar': 126,
      'pinsir': 127, 'tauros': 128, 'magikarp': 129,
      'gyarados': 130, 'lapras': 131, 'ditto': 132,
      'eevee': 133, 'vaporeon': 134, 'jolteon': 135,
      'flareon': 136, 'porygon': 137, 'omanyte': 138,
      'omastar': 139, 'kabuto': 140, 'kabutops': 141,
      'aerodactyl': 142, 'snorlax': 143, 'articuno': 144,
      'zapdos': 145, 'moltres': 146, 'dratini': 147,
      'dragonair': 148, 'dragonite': 149, 'mewtwo': 150,
      'mew': 151
    };
    
    const name = pokemon.name?.toLowerCase() || '';
    return pokemonNameToId[name] || 1; // Default to Bulbasaur if not found
  };

  // Handle new log entry
  const handleBattleLog = useCallback((entry) => {
    setBattleLog(prev => [...prev, entry]);
  }, []);

  // Handle timer updates
  const handleTimerUpdate = useCallback((data) => {
    setTurnTimer(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        players: prev.players.map(p => 
          p.userId === data.userId 
            ? { ...p, timeRemaining: data.timeRemaining }
            : p
        )
      };
    });
  }, []);

  // Handle timer start
  const handleTimerStart = useCallback((data) => {
    setTurnTimer({
      turn: data.turn,
      duration: data.duration,
      players: [] // Will be populated from battle state
    });
    setShowWarning(false);
  }, []);

const handleReport = async () => {
  if (!battleState?.opponent?.userId) {
    alert("Cannot report: opponent not loaded yet.");
    return;
  }

  if (window.confirm("Report opponent for misconduct? This will flag them for admin review.")) {
    const token = localStorage.getItem('token');
    const reporterName = localStorage.getItem('username') || 'Anonymous';

    try {
      const res = await fetch(`http://localhost:5000/api/user/report-by-userid/${battleState.opponent.userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reportedBy: reporterName })
      });

      if (res.ok) {
        alert("Opponent reported successfully. Thank you.");
      } else {
        const data = await res.json();
        alert("Failed to report: " + (data.message || "Server error"));
      }
    } catch (err) {
      console.error("Report error:", err);
      alert("Network error while reporting.");
    }
  }
};

  // Handle warnings
  const handleBattleWarning = useCallback((data) => {
    setShowWarning(true);
    // Flash warning effect
    setTimeout(() => setShowWarning(false), 3000);
  }, []);

  // Handle timeout
  const handleBattleTimeout = useCallback((data) => {
    // Timeout will trigger battleEnd
  }, []);

  useEffect(() => {
    // Connect to socket
    socketService.connect(username, token);

    // Set up event listeners
    socketService.on('matchmakingJoined', () => {
      setSearching(true);
    });

    socketService.on('battleStart', (state) => {
      console.log('Battle started:', state);
      setSearching(false);
      setBattleState(state);
      setBattleLog(state.battleLog || []);
      
      // Initialize timer state with player info
      setTurnTimer({
        turn: state.turn || 1,
        duration: 120,
        players: [
          { userId: userId, username: state.player.username, ready: false, timeRemaining: 120 },
          { userId: 'opponent', username: state.opponent.username, ready: false, timeRemaining: 120 }
        ]
      });
    });

    socketService.on('battleUpdate', (state) => {
      console.log('Battle update:', state);
      setBattleState(state);
      setBattleLog(state.battleLog || []);
      setSelectedMove(null);
    });

    socketService.on('playerReady', ({ playerIndex, userId: readyUserId, ready }) => {
      console.log(`Player ${playerIndex} is ready`);
      setTurnTimer(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map(p => 
            (playerIndex === 0 && p.userId === userId) || 
            (playerIndex === 1 && p.userId !== userId)
              ? { ...p, ready: true }
              : p
          )
        };
      });
    });

    socketService.on('battleEnd', ({ winner, reason, battleLog: finalLog }) => {
      console.log('Battle ended:', { winner, reason });
      const isWinner = winner === userId;
      const message = reason === 'forfeit' 
        ? (isWinner ? 'Opponent forfeited!' : 'You forfeited.')
        : reason === 'timeout'
          ? (isWinner ? 'Opponent timed out!(Win)' : 'You timed out.(Loss)')
          : (isWinner ? 'You won!' : 'You lost!');
      
      alert(message);
      setBattleState(null);
      setBattleLog(finalLog || []);
      setTurnTimer(null);
      setSearching(false);
    });

    // Battle log events
    socketService.on('battle:log', handleBattleLog);
    socketService.on('battle:timerStart', handleTimerStart);
    socketService.on('battle:timerUpdate', handleTimerUpdate);
    socketService.on('battle:warning', handleBattleWarning);
    socketService.on('battle:timeout', handleBattleTimeout);

    socketService.on('battleRejoin', ({ state, logReplay, timerState, isReconnect }) => {
      setBattleState(state);
      setBattleLog(state.battleLog || []);
      if (timerState) {
        setTurnTimer(timerState);
      }
    });

    socketService.on('error', ({ message }) => {
      console.error('Socket error:', message);
      alert(`Error: ${message}`);
    });

    return () => {
      socketService.removeAllListeners('matchmakingJoined');
      socketService.removeAllListeners('battleStart');
      socketService.removeAllListeners('battleUpdate');
      socketService.removeAllListeners('playerReady');
      socketService.removeAllListeners('battleEnd');
      socketService.removeAllListeners('battle:log');
      socketService.removeAllListeners('battle:timerStart');
      socketService.removeAllListeners('battle:timerUpdate');
      socketService.removeAllListeners('battle:warning');
      socketService.removeAllListeners('battle:timeout');
      socketService.removeAllListeners('battleRejoin');
      socketService.removeAllListeners('error');
    };
  }, [userId, username, token, handleBattleLog, handleTimerUpdate, handleTimerStart, handleBattleWarning, handleBattleTimeout]);

  // Reset sprite errors when Pokemon change
  useEffect(() => {
    if (battleState) {
      console.log('Opponent Pokemon Data:', battleState.opponent.activePokemon);
      console.log('Player Pokemon Data:', battleState.player.activePokemon);
      setSpriteErrors({ player: false, opponent: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleState?.player?.activePokemon?.name, battleState?.opponent?.activePokemon?.name]);

  // Auto-open switch menu if forced switch is needed
  useEffect(() => {
    if (battleState?.needsForcedSwitch) {
      setShowSwitchMenu(true);
      setSelectedMove(null); // Clear any selected move
    }
  }, [battleState?.needsForcedSwitch]);

  const handleJoinMatchmaking = () => {
    if (!userId || !teamId) {
      alert('Please select a team first');
      return;
    }
    socketService.joinMatchmaking(userId, teamId, username);
  };

  const handleLeaveMatchmaking = () => {
    socketService.leaveMatchmaking(userId);
    setSearching(false);
  };

  const handleSelectMove = (moveName) => {
    if (!battleState || selectedMove || battleState.needsForcedSwitch) return;
    
    console.log('Selecting move:', moveName);
    setSelectedMove(moveName);
    socketService.selectMove(battleState.battleId, userId, moveName);
  };

  const handleSwitchPokemon = (index) => {
    if (!battleState) return;
    
    const pokemon = battleState.player.team[index];
    if (pokemon.fainted) {
      alert('Cannot switch to a fainted Pokemon!');
      return;
    }
    
    console.log('Switching to Pokemon:', index);
    socketService.switchPokemon(battleState.battleId, userId, index);
    setShowSwitchMenu(false);
  };

  const handleForfeit = () => {
    if (!battleState) return;
    
    if (window.confirm('Are you sure you want to forfeit?')) {
      console.log('Forfeiting battle:', battleState.battleId);
      socketService.forfeit(battleState.battleId, userId);
    }
  };

  const getHpPercentage = (current, max) => {
    return (current / max) * 100;
  };

  const getHpColor = (percentage) => {
    if (percentage > 50) return '#4ade80';
    if (percentage > 25) return '#fbbf24';
    return '#ef4444';
  };

  if (searching) {
    return (
      <div className="battle-container">
        <div className="searching">
          <h2>Searching for opponent...</h2>
          <div className="spinner"></div>
          <button onClick={handleLeaveMatchmaking} className="btn-cancel">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (!battleState) {
    return (
      <div className="battle-container">
        <div className="matchmaking">
          <h1>Battle Arena</h1>
          <button onClick={handleJoinMatchmaking} className="btn-primary">
            Find Battle
          </button>
        </div>
      </div>
    );
  }

  const isForcedSwitch = battleState.needsForcedSwitch;

  return (
    <div className="battle-container">
      <div className="battle-screen">
        {/* Opponent Pokemon */}
        <div className="pokemon-area opponent">
          <div className="pokemon-info">
            <div className="pokemon-name">
              {battleState.opponent.activePokemon.nickname}
              <span className="pokemon-level">
                Lv.{battleState.opponent.activePokemon.level}
              </span>
            </div>
            <div className="hp-bar">
              <div 
                className="hp-fill"
                style={{
                  width: `${getHpPercentage(
                    battleState.opponent.activePokemon.currentHp,
                    battleState.opponent.activePokemon.maxHp
                  )}%`,
                  backgroundColor: getHpColor(
                    getHpPercentage(
                      battleState.opponent.activePokemon.currentHp,
                      battleState.opponent.activePokemon.maxHp
                    )
                  )
                }}
              />
            </div>
            <div className="hp-text">
              {battleState.opponent.activePokemon.currentHp} / {battleState.opponent.activePokemon.maxHp}
            </div>
          </div>
          <div className="pokemon-sprite opponent-sprite">
            {!spriteErrors.opponent ? (
              <img 
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getPokemonId(battleState.opponent.activePokemon)}.png`}
                alt={battleState.opponent.activePokemon.name}
                onError={(e) => {
                  console.error('Failed to load opponent sprite:', battleState.opponent.activePokemon);
                  console.error('Attempted URL:', e.target.src);
                  setSpriteErrors(prev => ({ ...prev, opponent: true }));
                }}
              />
            ) : (
              <div style={{ fontSize: '64px' }}>🎮</div>
            )}
          </div>
        </div>

        {/* Player Pokemon */}
        <div className="pokemon-area player">
          <div className="pokemon-sprite player-sprite">
            {!spriteErrors.player ? (
              <img 
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${getPokemonId(battleState.player.activePokemon)}.png`}
                alt={battleState.player.activePokemon.name}
                onError={(e) => {
                  console.error('Failed to load player sprite:', battleState.player.activePokemon);
                  console.error('Attempted URL:', e.target.src);
                  setSpriteErrors(prev => ({ ...prev, player: true }));
                }}
              />
            ) : (
              <div style={{ fontSize: '64px' }}>🎮</div>
            )}
          </div>
          <div className="pokemon-info">
            <div className="pokemon-name">
              {battleState.player.activePokemon.nickname}
              <span className="pokemon-level">
                Lv.{battleState.player.activePokemon.level}
              </span>
            </div>
            <div className="hp-bar">
              <div 
                className="hp-fill"
                style={{
                  width: `${getHpPercentage(
                    battleState.player.activePokemon.currentHp,
                    battleState.player.activePokemon.maxHp
                  )}%`,
                  backgroundColor: getHpColor(
                    getHpPercentage(
                      battleState.player.activePokemon.currentHp,
                      battleState.player.activePokemon.maxHp
                    )
                  )
                }}
              />
            </div>
            <div className="hp-text">
              {battleState.player.activePokemon.currentHp} / {battleState.player.activePokemon.maxHp}
            </div>
          </div>
        </div>

        {/* Battle Log Panel */}
        <BattleLogPanel 
          battleLog={battleLog}
          turnTimer={turnTimer}
          userId={userId}
        />

        {/* Warning Overlay */}
        {showWarning && (
          <div className="warning-overlay">
            <div className="warning-content">
              ⚠️ Time is running out! Make your move!
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="battle-controls">
          {!showSwitchMenu ? (
            <>
              <div className="moves-grid">
                {battleState.player.activePokemon.moves.map((move, index) => (
                  <button
                    key={index}
                    className={`move-button ${selectedMove === move ? 'selected' : ''}`}
                    onClick={() => handleSelectMove(move)}
                    disabled={selectedMove !== null || isForcedSwitch}
                  >
                    {move}
                  </button>
                ))}
              </div>
              <div className="action-buttons">
                <button 
                  className="btn-switch"
                  onClick={() => setShowSwitchMenu(true)}
                  disabled={selectedMove !== null || isForcedSwitch}
                >
                  Switch
                </button>
                <button className="btn-forfeit" onClick={handleForfeit}>
                  Forfeit
                </button>
<button className="btn-report" onClick={handleReport}>🚩 Report Opponent</button>
              </div>
            </>
          ) : (
            <div className="switch-menu">
              <h3>{isForcedSwitch ? 'Choose your next Pokémon!' : 'Choose a Pokemon'}</h3>
              <div className="team-grid">
                {battleState.player.team.map((pokemon, index) => (
                  <button
                    key={index}
                    className={`team-button ${pokemon.fainted ? 'fainted' : ''}`}
                    onClick={() => handleSwitchPokemon(index)}
                    disabled={pokemon.fainted}
                  >
                    <div>{pokemon.nickname}</div>
                    <div className="team-hp">
                      {pokemon.currentHp}/{pokemon.maxHp}
                    </div>
                  </button>
                ))}
              </div>
              {!isForcedSwitch && (
                <button 
                  className="btn-cancel"
                  onClick={() => setShowSwitchMenu(false)}
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BattleSummaryModal = ({ data, onExit }) => {
  if (!data) return null;
  const isWinner = data.winner === localStorage.getItem('userId');

  return (
    <div className="summary-overlay">
      <div className={`summary-card ${isWinner ? 'win' : 'lose'}`}>
        <div className="summary-header">
          <h2>{isWinner ? '🏆 VICTORY!' : '💀 DEFEAT'}</h2>
          <p>{data.reason}</p>
        </div>
        
        <div className="summary-body">
          <div className="elo-change">
            <span className="elo-label">ELO ADJUSTMENT</span>
            <span className={`elo-value ${isWinner ? 'plus' : 'minus'}`}>
              {isWinner ? '+' : ''}{data.eloChange}
            </span>
          </div>
          
          <div className="summary-stats">
            <p><strong>Total Turns:</strong> {data.turns}</p>
            <p><strong>Winner:</strong> {data.winnerUsername}</p>
          </div>
        </div>

        <button className="summary-exit" onClick={onExit}>Return to Dashboard</button>
      </div>
    </div>
  );
};

export default Battle;