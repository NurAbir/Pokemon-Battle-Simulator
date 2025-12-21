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
      setSearching(false);
      setBattleState(state);
      setBattleLog(state.battleLog || []);
      
      // Initialize timer state with player info
      setTurnTimer({
        turn: state.turn || 1,
        duration: 60,
        players: [
          { userId: userId, username: state.player.username, ready: false, timeRemaining: 60 },
          { userId: 'opponent', username: state.opponent.username, ready: false, timeRemaining: 60 }
        ]
      });
    });

    socketService.on('battleUpdate', (state) => {
      setBattleState(state);
      setBattleLog(state.battleLog || []);
      setSelectedMove(null);
    });

    socketService.on('playerReady', ({ playerIndex, userId: readyUserId, ready }) => {
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
      const isWinner = winner === userId;
      const message = reason === 'forfeit' 
        ? (isWinner ? 'Opponent forfeited!' : 'You forfeited.')
        : reason === 'timeout'
          ? (isWinner ? 'Opponent timed out!' : 'You timed out.')
          : (isWinner ? 'You won!' : 'You lost!');
      
      alert(message);
      setBattleState(null);
      setBattleLog(finalLog || []);
      setTurnTimer(null);
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
    if (!battleState || selectedMove) return;
    
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
    
    socketService.switchPokemon(battleState.battleId, userId, index);
    setShowSwitchMenu(false);
  };

  const handleForfeit = () => {
    if (!battleState) return;
    
    if (window.confirm('Are you sure you want to forfeit?')) {
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
            Find Battle?
          </button>
        </div>
      </div>
    );
  }

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
            🎮 {/* Replace with actual Pokemon sprite */}
          </div>
        </div>

        {/* Player Pokemon */}
        <div className="pokemon-area player">
          <div className="pokemon-sprite player-sprite">
            🎮 {/* Replace with actual Pokemon sprite */}
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
                    disabled={selectedMove !== null}
                  >
                    {move}
                  </button>
                ))}
              </div>
              <div className="action-buttons">
                <button 
                  className="btn-switch"
                  onClick={() => setShowSwitchMenu(true)}
                  disabled={selectedMove !== null}
                >
                  Switch
                </button>
                <button className="btn-forfeit" onClick={handleForfeit}>
                  Forfeit
                </button>
              </div>
            </>
          ) : (
            <div className="switch-menu">
              <h3>Choose a Pokemon</h3>
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
              <button 
                className="btn-cancel"
                onClick={() => setShowSwitchMenu(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Battle;