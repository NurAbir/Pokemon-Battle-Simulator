import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socketService';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  respondToMatchInvite,
  deleteNotification
} from '../services/api';
import { respondToFriendRequest } from '../services/api';
import '../styles/notifications.css';

const NotificationBoard = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, matchInvite, friendRequest, battleResult
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [respondingTo, setRespondingTo] = useState(null);

  // Removed unused 'user' variable (line 25)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter === 'unread') params.unreadOnly = 'true';
      else if (filter !== 'all') params.type = filter;
      
      const response = await getNotifications(params);
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (err) {
      setError('Failed to load notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Fetch user teams for battle acceptance
  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/teams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTeams(data.data);
        if (data.data.length > 0) {
          setSelectedTeam(data.data[0].teamId || data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchTeams();
  }, [fetchNotifications]);

  // Socket listener for real-time notifications
  useEffect(() => {
    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
    };

    socketService.on('newNotification', handleNewNotification);

    return () => {
      socketService.off('newNotification', handleNewNotification);
    };
  }, []);

  // Mark notification as read
  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.notificationId === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Handle match invite response
  const handleMatchInviteResponse = async (notificationId, action) => {
    try {
      setRespondingTo(notificationId);
      
      if (action === 'accept' && !selectedTeam) {
        setError('Please select a team first');
        return;
      }
      
      const response = await respondToMatchInvite(notificationId, {
        action,
        teamId: action === 'accept' ? selectedTeam : undefined
      });
      
      if (response.data.success) {
        if (action === 'accept') {
          // Navigate to battle or trigger battle flow
          navigate('/battle', { 
            state: { 
              battleSetup: response.data.data 
            }
          });
        } else {
          // Update notification status
          setNotifications(prev =>
            prev.map(n => n.notificationId === notificationId 
              ? { ...n, status: 'denied', isRead: true } 
              : n
            )
          );
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to respond');
    } finally {
      setRespondingTo(null);
    }
  };

  // Handle friend request response
  const handleFriendRequestResponse = async (notificationId, requestId, action) => {
    try {
      setRespondingTo(notificationId);
      
      const response = await respondToFriendRequest({ requestId, action });
      
      if (response.data.success) {
        setNotifications(prev =>
          prev.map(n => n.notificationId === notificationId 
            ? { ...n, status: action === 'accept' ? 'accepted' : 'denied', isRead: true } 
            : n
          )
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to respond');
    } finally {
      setRespondingTo(null);
    }
  };

  // Delete notification
  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.notificationId !== notificationId));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  // Get notification icon
  const getIcon = (type) => {
    switch (type) {
      case 'matchInvite': return '⚔️';
      case 'friendRequest': return '👋';
      case 'battleResult': return '🏆';
      case 'friendRequestAccepted': return '✅';
      case 'friendRequestDenied': return '❌';
      case 'matchInviteAccepted': return '🎮';
      case 'matchInviteDenied': return '🚫';
      default: return '📢';
    }
  };

  // Render notification content based on type
  const renderNotificationContent = (notification) => {
    const { type, payload, status } = notification;
    
    switch (type) {
      case 'matchInvite':
        return (
          <div className="notification-content">
            <p>{payload.message}</p>
            {status === 'pending' && (
              <div className="notification-actions">
                <select 
                  value={selectedTeam || ''} 
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="team-select"
                >
                  {teams.map(team => (
                    <option key={team.teamId || team._id} value={team.teamId || team._id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <button
                  className="btn-accept"
                  onClick={() => handleMatchInviteResponse(notification.notificationId, 'accept')}
                  disabled={respondingTo === notification.notificationId}
                >
                  Accept
                </button>
                <button
                  className="btn-deny"
                  onClick={() => handleMatchInviteResponse(notification.notificationId, 'deny')}
                  disabled={respondingTo === notification.notificationId}
                >
                  Deny
                </button>
              </div>
            )}
            {status !== 'pending' && (
              <span className={`status-badge status-${status}`}>{status}</span>
            )}
          </div>
        );
      
      case 'friendRequest':
        return (
          <div className="notification-content">
            <p>{payload.message}</p>
            {status === 'pending' && (
              <div className="notification-actions">
                <button
                  className="btn-accept"
                  onClick={() => handleFriendRequestResponse(
                    notification.notificationId, 
                    payload.requestId, 
                    'accept'
                  )}
                  disabled={respondingTo === notification.notificationId}
                >
                  Accept
                </button>
                <button
                  className="btn-deny"
                  onClick={() => handleFriendRequestResponse(
                    notification.notificationId, 
                    payload.requestId, 
                    'deny'
                  )}
                  disabled={respondingTo === notification.notificationId}
                >
                  Deny
                </button>
              </div>
            )}
            {status !== 'pending' && (
              <span className={`status-badge status-${status}`}>{status}</span>
            )}
          </div>
        );
      
      case 'battleResult':
        return (
          <div className="notification-content">
            <p>{payload.message}</p>
            <div className="battle-result-summary">
              <span className={payload.isWinner ? 'result-win' : 'result-loss'}>
                {payload.isWinner ? '🎉 Victory!' : '😔 Defeat'}
              </span>
              {payload.summary && <p className="battle-summary">{payload.summary}</p>}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="notification-content">
            <p>{payload?.message || 'Notification'}</p>
          </div>
        );
    }
  };

  return (
    <div className="notification-board">
      <div className="notification-header">
        <h2>Notifications</h2>
        <div className="notification-controls">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="matchInvite">Battle Invites</option>
            <option value="friendRequest">Friend Requests</option>
            <option value="battleResult">Battle Results</option>
          </select>
          <button onClick={handleMarkAllRead} className="btn-mark-all">
            Mark All Read
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn-back">
            Back
          </button>
        </div>
      </div>

      {error && <div className="notification-error">{error}</div>}

      {loading ? (
        <div className="notification-loading">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="notification-empty">No notifications</div>
      ) : (
        <div className="notification-list">
          {notifications.map(notification => (
            <div
              key={notification.notificationId}
              className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
              onClick={() => !notification.isRead && handleMarkRead(notification.notificationId)}
            >
              <div className="notification-icon">{getIcon(notification.type)}</div>
              <div className="notification-body">
                <div className="notification-type">{notification.type.replace(/([A-Z])/g, ' $1').trim()}</div>
                {renderNotificationContent(notification)}
                <div className="notification-time">{formatTime(notification.createdAt)}</div>
              </div>
              <button
                className="btn-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(notification.notificationId);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationBoard;