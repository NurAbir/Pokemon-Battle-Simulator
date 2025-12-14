import { useState, useEffect, useRef } from 'react';
import socketService from '../services/socket';
import API from '../services/api';
import '../styles/BattleLogPanel.css';

const BattleLogPanel = ({ battleId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const logEndRef = useRef(null);

  // Auto-scroll to latest log
  const scrollToBottom = () => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [logs]);

  // Fetch initial log and join battle room
  useEffect(() => {
    const fetchLog = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await API.get(`/battle-log/${battleId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setLogs(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch battle log:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLog();
    socketService.emit('battle:join', battleId);

    return () => {
      socketService.emit('battle:leave', battleId);
    };
  }, [battleId]);

  // Socket listeners for real-time log updates
  useEffect(() => {
    const handleLogEntry = (entry) => {
      setLogs(prev => [...prev, entry]);
    };

    const handleWarning = (entry) => {
      setLogs(prev => [...prev, entry]);
    };

    const handleBattleEnd = (entry) => {
      setLogs(prev => [...prev, entry]);
    };

    const handleFullLog = (fullLog) => {
      setLogs(fullLog);
    };

    socketService.on('battle:log', handleLogEntry);
    socketService.on('battle:warning', handleWarning);
    socketService.on('battle:end', handleBattleEnd);
    socketService.on('battle:log:full', handleFullLog);

    return () => {
      socketService.off('battle:log', handleLogEntry);
      socketService.off('battle:warning', handleWarning);
      socketService.off('battle:end', handleBattleEnd);
      socketService.off('battle:log:full', handleFullLog);
    };
  }, []);

  // Get CSS class for log entry type
  const getLogClass = (eventType) => {
    switch (eventType) {
      case 'MOVE':
        return 'log-move';
      case 'DAMAGE':
        return 'log-damage';
      case 'STATUS':
        return 'log-status';
      case 'FAINT':
        return 'log-faint';
      case 'SWITCH':
        return 'log-switch';
      case 'ABILITY':
        return 'log-ability';
      case 'ITEM':
        return 'log-item';
      case 'WARNING':
        return 'log-warning';
      case 'TIMEOUT':
        return 'log-timeout';
      case 'SYSTEM':
        return 'log-system';
      case 'INFO':
      default:
        return 'log-info';
    }
  };

  // Get icon for log entry type
  const getLogIcon = (eventType) => {
    switch (eventType) {
      case 'MOVE':
        return '⚡';
      case 'DAMAGE':
        return '💥';
      case 'STATUS':
        return '🔮';
      case 'FAINT':
        return '💀';
      case 'SWITCH':
        return '🔄';
      case 'ABILITY':
        return '✨';
      case 'ITEM':
        return '🎒';
      case 'WARNING':
        return '⚠️';
      case 'TIMEOUT':
        return '⏰';
      case 'SYSTEM':
        return '📢';
      case 'INFO':
      default:
        return 'ℹ️';
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="battle-log-panel loading">
        <div className="log-header">Battle Log</div>
        <div className="loading-message">Loading battle log...</div>
      </div>
    );
  }

  return (
    <div className="battle-log-panel">
      <div className="log-header">
        <span>📜 Battle Log</span>
        {logs.length > 0 && (
          <span className="turn-indicator">Turn {logs[logs.length - 1]?.turn || 0}</span>
        )}
      </div>

      <div className="log-container">
        {logs.length === 0 ? (
          <div className="empty-log">Waiting for battle to start...</div>
        ) : (
          logs.map((log, index) => (
            <div
              key={log.logId || index}
              className={`log-entry ${getLogClass(log.eventType)}`}
            >
              <span className="log-icon">{getLogIcon(log.eventType)}</span>
              <div className="log-content">
                <span className="log-message">{log.message}</span>
                <span className="log-time">{formatTime(log.createdAt)}</span>
              </div>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

export default BattleLogPanel;
