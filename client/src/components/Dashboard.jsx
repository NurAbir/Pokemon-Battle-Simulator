import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socketService';
import { getUnreadCount } from '../services/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState('normal');
  const [user, setUser] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const leaderboard = [
    { username: 'DragonMaster', elo: 2450, avatar: '🐉' },
    { username: 'PikachuFan88', elo: 2380, avatar: '⚡' },
    { username: 'MewtwoKing', elo: 2315, avatar: '🔮' },
    { username: 'CharizardChamp', elo: 2290, avatar: '🔥' },
    { username: 'GyaradosLord', elo: 2265, avatar: '🌊' }
  ];

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/user/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
          setUser(result.data);
          localStorage.setItem('user', JSON.stringify(result.data));
          socketService.connect(result.data.username, token);
          socketService.joinNotificationRoom(result.data.userId);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    const fetchUnreadCount = async () => {
      try {
        const response = await getUnreadCount();
        if (response.data.success) {
          setUnreadNotifications(response.data.data.count);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUserProfile();
    fetchUnreadCount();

    const handleNewNotification = () => {
      setUnreadNotifications(prev => prev + 1);
    };

    socketService.on('newNotification', handleNewNotification);
    socketService.on('unreadNotificationCount', ({ count }) => {
      setUnreadNotifications(count);
    });

    return () => {
      socketService.off('newNotification', handleNewNotification);
    };
  }, []);

  const handleLogout = () => {
    if (user) {
      socketService.leaveNotificationRoom(user.userId);
    }
    socketService.disconnect();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <span className="logo-icon">⚔️</span>
            <h1 className="dashboard-title">Pokémon Battle Simulator</h1>
          </div>
          
          <nav className="header-buttons">
            <button className="header-button" onClick={() => navigate('/chat')}>
              💬 Chat
            </button>
            <button className="header-button" onClick={() => navigate('/friends')}>
              👥 Friends
            </button>
            <button className="header-button" onClick={() => navigate('/notifications')}>
              🔔 Notifications
              {unreadNotifications > 0 && (
                <span className="notification-badge">{unreadNotifications}</span>
              )}
            </button>
            <button className="header-button" onClick={() => navigate('/profile')}>
              👤 Profile
            </button>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="main-content">
        {/* Welcome Card */}
        <div className="welcome-card">
          <h2 className="welcome-title">Welcome back, {user?.username || 'Trainer'}! 👋</h2>
          <p className="welcome-text">Ready for your next battle?</p>
          <div className="stats-row">
            <div className="stat-box">
              <div className="stat-value">N/A</div>
              <div className="stat-label">Total Battles</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">N/A</div>
              <div className="stat-label">Win Rate</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">N/A</div>
              <div className="stat-label">ELO Rating</div>
            </div>
          </div>
        </div>

        <div className="grid-layout">
          {/* Battle Mode Selection */}
          <section className="game-section">
            <h2 className="section-title">
              <span className="title-icon">⚔️</span>
              Select Battle Mode
            </h2>
            
            <div className="mode-container">
              <button
                className={`mode-button ${selectedMode === 'normal' ? 'mode-button-active' : ''}`}
                onClick={() => setSelectedMode('normal')}
              >
                <div className="mode-icon">⚔️</div>
                <div className="mode-text">Normal Battle</div>
                <div className="mode-description">Casual matches for practice</div>
              </button>

              <button
                className={`mode-button ${selectedMode === 'ranked' ? 'mode-button-active' : ''}`}
                onClick={() => setSelectedMode('ranked')}
              >
                <div className="mode-icon">🏆</div>
                <div className="mode-text">Ranked Battle</div>
                <div className="mode-description">Competitive ELO matches</div>
              </button>
            </div>

            <div className="action-buttons">
              <button className="play-button" onClick={() => navigate('/battle')}>
                Play {selectedMode === 'ranked' ? 'Ranked' : 'Normal'}
              </button>
              
              <button className="team-builder-button" onClick={() => navigate('/team-builder')}>
                Team Builder
              </button>
            </div>
          </section>

          {/* Leaderboard */}
          <section className="leaderboard-section">
            <h2 className="section-title">
              <span className="title-icon">🏆</span>
              Top Players
            </h2>
            
            <div className="leaderboard-container">
              {leaderboard.map((player, index) => (
                <div key={index} className="leaderboard-item">
                  <div className={`rank ${
                    index === 0 ? 'rank-gold' : 
                    index === 1 ? 'rank-silver' : 
                    index === 2 ? 'rank-bronze' : ''
                  }`}>
                    #{index + 1}
                  </div>
                  
                  <div className="dashboard-avatar-wrapper">
                    <div className="avatar">{player.avatar}</div>
                  </div>
                  
                  <div className="player-info">
                    <div className="username">{player.username}</div>
                    <div className="elo">⭐ {player.elo} ELO</div>
                  </div>
                  
                  {index < 3 && (
                    <div className="rank-badge">
                      {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;