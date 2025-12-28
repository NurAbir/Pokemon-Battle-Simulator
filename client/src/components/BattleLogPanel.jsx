import { useEffect, useRef } from 'react';
import '../styles/battleLog.css';

// Event type icons
const EVENT_ICONS = {
  MOVE: '⚔️',
  DAMAGE: '💥',
  STATUS: '🔮',
  FAINT: '💀',
  SWITCH: '🔄',
  INFO: 'ℹ️',
  SYSTEM: '⚙️',
  TURN: '🔢',
  WARNING: '⚠️',
  TIMEOUT: '⏰',
  BATTLE_START: '🎮',
  BATTLE_END: '🏆'
};

const BattleLogPanel = ({ battleLog = [], turnTimer = null, userId }) => {
  const logEndRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [battleLog]);

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Get CSS class for event type
  const getEventClass = (eventType) => {
    const classMap = {
      MOVE: 'log-move',
      DAMAGE: 'log-damage',
      STATUS: 'log-status',
      FAINT: 'log-faint',
      SWITCH: 'log-switch',
      INFO: 'log-info',
      SYSTEM: 'log-system',
      TURN: 'log-turn',
      WARNING: 'log-warning',
      TIMEOUT: 'log-timeout',
      BATTLE_START: 'log-battle-start',
      BATTLE_END: 'log-battle-end'
    };
    return classMap[eventType] || 'log-info';
  };

  // Format timer display
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer class based on remaining time
  const getTimerClass = (remaining) => {
    if (remaining <= 10) return 'timer-critical';
    if (remaining <= 30) return 'timer-warning';
    return 'timer-normal';
  };

  return (
    <div className="battle-log-panel">
      {/* Turn Timer Display */}
      {turnTimer && (
        <div className="turn-timer">
          <div className="timer-header">
            <span className="turn-indicator">Turn {turnTimer.turn}</span>
            <span className="timer-duration">{formatTimer(turnTimer.duration)}</span>
          </div>
          <div className="timer-players">
            {turnTimer.players.map(player => (
              <div 
                key={player.userId} 
                className={`timer-player ${player.ready ? 'ready' : ''} ${player.userId === userId ? 'self' : ''}`}
              >
                <span className="player-name">{player.username}</span>
                {player.ready ? (
                  <span className="ready-indicator">✓ Ready</span>
                ) : (
                  <span className={`time-remaining ${getTimerClass(player.timeRemaining)}`}>
                    {formatTimer(player.timeRemaining)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Battle Log */}
      <div className="log-container" ref={containerRef}>
        <div className="log-header">
          <span>Battle Log</span>
        </div>
        <div className="log-entries">
          {battleLog.length === 0 ? (
            <div className="log-empty">Waiting for battle events...</div>
          ) : (
            battleLog.map((entry, index) => (
              <div 
                key={entry.entryId || index} 
                className={`log-entry ${getEventClass(entry.eventType)}`}
              >
                <span className="log-icon">{EVENT_ICONS[entry.eventType] || '•'}</span>
                <span className="log-message">{entry.message}</span>
                <span className="log-time">{formatTime(entry.timestamp)}</span>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
};

export default BattleLogPanel;
