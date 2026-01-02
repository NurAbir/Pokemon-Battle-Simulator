import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socketService';
import {
  searchUser,
  getFriends,
  sendFriendRequest,
  removeFriend
} from '../services/api';
import '../styles/friendFinder.css';

const FriendFinder = () => {
  const navigate = useNavigate();
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [searching, setSearching] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('search'); // search, friends

  // Fetch friends list
  const fetchFriends = useCallback(async () => {
    try {
      setLoadingFriends(true);
      const response = await getFriends();
      if (response.data.success) {
        setFriends(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    } finally {
      setLoadingFriends(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // Socket listeners for friend updates
  useEffect(() => {
    const handleFriendAdded = (data) => {
      setFriends(prev => [...prev, data]);
    };

    const handleFriendRemoved = (data) => {
      setFriends(prev => prev.filter(f => f.userId !== data.userId));
    };

    const handleUserOnline = (data) => {
      setFriends(prev => 
        prev.map(f => f.userId === data.userId ? { ...f, isOnline: true } : f)
      );
    };

    const handleUserOffline = (data) => {
      setFriends(prev => 
        prev.map(f => f.userId === data.userId ? { ...f, isOnline: false } : f)
      );
    };

    socketService.on('friendAdded', handleFriendAdded);
    socketService.on('friendRemoved', handleFriendRemoved);
    socketService.on('userOnline', handleUserOnline);
    socketService.on('userOffline', handleUserOffline);

    return () => {
      socketService.off('friendAdded', handleFriendAdded);
      socketService.off('friendRemoved', handleFriendRemoved);
      socketService.off('userOnline', handleUserOnline);
      socketService.off('userOffline', handleUserOffline);
    };
  }, []);

  // Search for user
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchUsername.trim() || searchUsername.trim().length < 2) {
      setSearchError('Username must be at least 2 characters');
      return;
    }

    try {
      setSearching(true);
      setSearchError(null);
      setSearchResult(null);
      setSuccessMessage(null);

      const response = await searchUser(searchUsername.trim());
      
      if (response.data.success) {
        setSearchResult(response.data.data);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setSearchError('User does not exist');
      } else if (err.response?.status === 400) {
        setSearchError(err.response.data.message);
      } else {
        setSearchError('Search failed. Please try again.');
      }
    } finally {
      setSearching(false);
    }
  };

  // Send friend request
  const handleSendRequest = async () => {
    if (!searchResult) return;

    try {
      setSendingRequest(true);
      setSearchError(null);

      const response = await sendFriendRequest({ username: searchResult.username });
      
      if (response.data.success) {
        setSuccessMessage(`Friend request sent to ${searchResult.username}!`);
        setSearchResult(prev => ({ ...prev, hasPendingRequest: true, pendingRequestDirection: 'outgoing' }));
      }
    } catch (err) {
      setSearchError(err.response?.data?.message || 'Failed to send request');
    } finally {
      setSendingRequest(false);
    }
  };

  // Remove friend
  const handleRemoveFriend = async (friendUserId, friendUsername) => {
    if (!window.confirm(`Remove ${friendUsername} from friends?`)) return;

    try {
      await removeFriend(friendUserId);
      setFriends(prev => prev.filter(f => f.userId !== friendUserId));
    } catch (err) {
      console.error('Failed to remove friend:', err);
    }
  };

  // Start chat with friend
  const handleStartChat = (friendUserId) => {
    navigate('/chat', { state: { privateChatWith: friendUserId } });
  };

  // Invite to battle
  const handleBattleInvite = (friendUsername) => {
    navigate('/notifications', { state: { inviteUser: friendUsername } });
  };

  // Render search result action button
  const renderSearchAction = () => {
    if (!searchResult) return null;

    if (searchResult.isFriend) {
      return (
        <div className="friend-action-buttons">
          <button
            className="btn-message"
            onClick={() => handleStartChat(searchResult.userId)}
            title="Send Message"
          >
            💬 Message
          </button>
          <span className="status-text friend">✓ Friends</span>
        </div>
      );
    }

    if (searchResult.hasPendingRequest) {
      if (searchResult.pendingRequestDirection === 'outgoing') {
        return <span className="status-text pending">Request Pending</span>;
      }
      return (
        <button 
          className="btn-accept-incoming"
          onClick={() => navigate('/notifications')}
        >
          View Request
        </button>
      );
    }

    return (
      <button
        className="btn-send-request"
        onClick={handleSendRequest}
        disabled={sendingRequest}
      >
        {sendingRequest ? 'Sending...' : 'Send Friend Request'}
      </button>
    );
  };

  return (
    <div className="friend-finder">
      <div className="friend-finder-header">
        <h2>Friends</h2>
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          Back to Dashboard
        </button>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          Find Friends
        </button>
        <button
          className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          My Friends ({friends.length})
        </button>
      </div>

      {activeTab === 'search' && (
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Enter username to search..."
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn-search" disabled={searching}>
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {searchError && <div className="search-error">{searchError}</div>}
          {successMessage && <div className="search-success">{successMessage}</div>}

          {searchResult && (
            <div className="search-result">
              <div className="user-card">
                <img
                  src={searchResult.avatar || 'https://hwchamber.co.uk/wp-content/uploads/2022/04/avatar-placeholder.gif'}
                  alt={searchResult.username}
                  className="user-avatar"
                />
                <div className="user-info">
                  <h3>{searchResult.username}</h3>
                  <p>ELO: {searchResult.eloRating}</p>
                  <span className={`online-status ${searchResult.isOnline ? 'online' : 'offline'}`}>
                    {searchResult.isOnline ? '● Online' : '○ Offline'}
                  </span>
                </div>
                <div className="user-actions">
                  {renderSearchAction()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'friends' && (
        <div className="friends-section">
          {loadingFriends ? (
            <div className="loading">Loading friends...</div>
          ) : friends.length === 0 ? (
            <div className="empty-friends">
              <p>You haven't added any friends yet.</p>
              <p>Search for users to add them as friends!</p>
            </div>
          ) : (
            <div className="friends-list">
              {friends.map(friend => (
                <div key={friend.userId} className="friend-card">
                  <img
                    src={friend.avatar || 'https://hwchamber.co.uk/wp-content/uploads/2022/04/avatar-placeholder.gif'}
                    alt={friend.username}
                    className="friend-avatar"
                  />
                  <div className="friend-info">
                    <h3>{friend.username}</h3>
                    <p>ELO: {friend.eloRating}</p>
                    <span className={`online-status ${friend.isOnline ? 'online' : 'offline'}`}>
                      {friend.isOnline ? '● Online' : '○ Offline'}
                    </span>
                  </div>
                  <div className="friend-actions">
                    <button
                      className="btn-chat"
                      onClick={() => handleStartChat(friend.userId)}
                      title="Start Chat"
                    >
                      💬
                    </button>
                    <button
                      className="btn-battle"
                      onClick={() => handleBattleInvite(friend.username)}
                      title="Invite to Battle"
                    >
                      ⚔️
                    </button>
                    <button
                      className="btn-remove"
                      onClick={() => handleRemoveFriend(friend.userId, friend.username)}
                      title="Remove Friend"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FriendFinder;