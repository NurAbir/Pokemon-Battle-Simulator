import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socket';
import API from '../services/api';
import '../styles/NotificationBoard.css';

const NotificationBoard = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Socket listener for new notifications
  useEffect(() => {
    fetchNotifications();

    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    socketService.on('notification:new', handleNewNotification);

    return () => {
      socketService.off('notification:new', handleNewNotification);
    };
  }, [fetchNotifications]);

  // Handle match invite response
  const handleMatchInviteResponse = async (notificationId, accept) => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.put(
        `/notifications/${notificationId}/respond-match`,
        { accept },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.notificationId === notificationId
              ? { ...n, status: accept ? 'accepted' : 'denied', isRead: true }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        // If accepted, navigate to battle
        if (accept && response.data.data.battle) {
          onClose();
          navigate(`/battle/${response.data.data.battle.battleId}`);
        }
      }
    } catch (error) {
      console.error('Failed to respond to match invite:', error);
    }
  };

  // Handle friend request response
  const handleFriendRequestResponse = async (notificationId, accept) => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.put(
        `/notifications/${notificationId}/respond-friend`,
        { accept },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setNotifications(prev =>
          prev.map(n =>
            n.notificationId === notificationId
              ? { ...n, status: accept ? 'accepted' : 'denied', isRead: true }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to respond to friend request:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await API.put(
        `/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications(prev =>
        prev.map(n =>
          n.notificationId === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await API.put(
        '/notifications/read-all',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Render notification content based on type
  const renderNotificationContent = (notification) => {
    const { type, data, status } = notification;

    switch (type) {
      case 'matchInvite':
        return (
          <div className="notification-content">
            <p><strong>{data.senderUsername}</strong> invited you to a {data.battleMode} battle!</p>
            {status === 'pending' && (
              <div className="notification-actions">
                <button
                  className="btn-accept"
                  onClick={() => handleMatchInviteResponse(notification.notificationId, true)}
                >
                  Accept
                </button>
                <button
                  className="btn-deny"
                  onClick={() => handleMatchInviteResponse(notification.notificationId, false)}
                >
                  Deny
                </button>
              </div>
            )}
            {status !== 'pending' && (
              <span className={`status-badge ${status}`}>{status}</span>
            )}
          </div>
        );

      case 'friendRequest':
        return (
          <div className="notification-content">
            <p><strong>{data.senderUsername}</strong> wants to be your friend!</p>
            {status === 'pending' && (
              <div className="notification-actions">
                <button
                  className="btn-accept"
                  onClick={() => handleFriendRequestResponse(notification.notificationId, true)}
                >
                  Accept
                </button>
                <button
                  className="btn-deny"
                  onClick={() => handleFriendRequestResponse(notification.notificationId, false)}
                >
                  Deny
                </button>
              </div>
            )}
            {status !== 'pending' && (
              <span className={`status-badge ${status}`}>{status}</span>
            )}
          </div>
        );

      case 'matchInviteResponse':
        return (
          <div className="notification-content">
            <p>
              <strong>{data.responderUsername}</strong>{' '}
              {data.accepted ? 'accepted' : 'declined'} your battle invite
            </p>
          </div>
        );

      case 'friendRequestResponse':
        return (
          <div className="notification-content">
            <p>
              <strong>{data.responderUsername}</strong>{' '}
              {data.accepted ? 'accepted' : 'declined'} your friend request
            </p>
          </div>
        );

      case 'battleResult':
        return (
          <div className="notification-content">
            <p className={data.isWinner ? 'result-win' : 'result-loss'}>
              {data.isWinner ? '🏆 Victory!' : '💔 Defeat'}
            </p>
            <p>
              {data.isWinner
                ? `You defeated ${data.loserUsername}!`
                : `You lost to ${data.winnerUsername}`}
            </p>
            {data.summary && <p className="battle-summary">{data.summary}</p>}
          </div>
        );

      case 'system':
        return (
          <div className="notification-content">
            <p>{data.message}</p>
          </div>
        );

      default:
        return <p>Unknown notification type</p>;
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'matchInvite':
      case 'matchInviteResponse':
        return '⚔️';
      case 'friendRequest':
      case 'friendRequestResponse':
        return '👥';
      case 'battleResult':
        return '🎮';
      default:
        return '🔔';
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

  if (!isOpen) return null;

  return (
    <div className="notification-board-overlay" onClick={onClose}>
      <div className="notification-board" onClick={(e) => e.stopPropagation()}>
        <div className="notification-header">
          <h3>Notifications {unreadCount > 0 && <span className="badge">{unreadCount}</span>}</h3>
          <div className="header-actions">
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={markAllAsRead}>
                Mark all read
              </button>
            )}
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="notification-list">
          {loading ? (
            <div className="loading">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="empty">No notifications yet</div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.notificationId}
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => !notification.isRead && markAsRead(notification.notificationId)}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-body">
                  {renderNotificationContent(notification)}
                  <span className="notification-time">
                    {formatTime(notification.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationBoard;
