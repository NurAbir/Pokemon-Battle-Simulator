// client/src/components/Battle.jsx
import React, { useState, useEffect } from 'react';
import socketService from '../services/socketService';
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
    });

    socketService.on('battleUpdate', (state) => {
      setBattleState(state);
      setBattleLog(state.battleLog || []);
      setSelectedMove(null);
    });

    socketService.on('playerReady', ({ playerIndex }) => {
      console.log(`Player ${playerIndex} is ready`);
    });

    socketService.on('battleEnd', ({ winner, reason, battleLog }) => {
      alert(winner === userId ? 'You won!' : 'You lost!');
      setBattleState(null);
      setBattleLog(battleLog || []);
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
      socketService.removeAllListeners('error');
    };
  }, [userId, username, token]);

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
          <h1>Join Matchmaking</h1>
          <button onClick={handleJoinMatchmaking} className="btn-primary">
            Play
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
            <img 
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/pokemon/${battleState.opponent.activePokemon.pokemonId}.png`}
              alt={battleState.opponent.activePokemon.name}
              onError={(e) => e.target.src = '🎮'}
            />
          </div>
        </div>

        {/* Player Pokemon */}
        <div className="pokemon-area player">
          <div className="pokemon-sprite player-sprite">
            <img 
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/pokemon/${battleState.player.activePokemon.pokemonId}.png`}
              alt={battleState.player.activePokemon.name}
              onError={(e) => e.target.src = '🎮'}
            />
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

        {/* Battle Log */}
        <div className="battle-log">
          {battleLog.map((log, index) => (
            <div key={index} className="log-entry">
              {log.message}
            </div>
          ))}
        </div>

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