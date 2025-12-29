import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socketService';
import { getUnreadCount } from '../services/api';
import AdminPanel from './AdminPanel';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState('normal');
  const [user, setUser] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  // --- LEADERBOARD LOGIC (Maintained) ---
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/user/leaderboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setLeaderboard(data);
      } catch (error) {
        console.error('Leaderboard fetch failed:', error);
      }
    };
    fetchLeaderboard();
  }, []);

  // --- USER PROFILE & NOTIFICATION LOGIC (Restored from Dashboard_1) ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/user/profile', {
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
    if (user) socketService.leaveNotificationRoom(user.userId);
    socketService.disconnect();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <span className="logo-icon">⚔️</span>
            <h1 className="dashboard-title">Pokémon Battle Simulator</h1>
          </div>
          
          <nav className="header-buttons">
            <button className="header-button" onClick={() => navigate('/chat')}>💬 Chat</button>
            <button className="header-button" onClick={() => navigate('/friends')}>👥 Friends</button>
            <button className="header-button" onClick={() => navigate('/notifications')}>
              🔔 Notifications
              {unreadNotifications > 0 && <span className="notification-badge">{unreadNotifications}</span>}
            </button>

            {/* Admin Panel Button (Positioned between Notifications and Profile) */}
            {user?.isAdmin && (
               <button 
                 onClick={() => setShowAdminModal(true)}
                 className="header-button admin-btn"
               >
                 🛡️ Admin Panel
               </button>
             )}

            <button className="header-button" onClick={() => navigate('/profile')}>👤 Profile</button>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </nav>
        </div>
      </header>

      {/* Admin Modal (Maintained Logic) */}
      {showAdminModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <button className="modal-close" onClick={() => setShowAdminModal(false)}>×</button>
            <AdminPanel />
          </div>
        </div>
      )}

      <main className="main-content">
        {/* Welcome Card (Restored UI) */}
        <div className="welcome-card">
          <h2 className="welcome-title">Welcome back, {user?.username || 'Trainer'}! 👋</h2>
          <p className="welcome-text">Ready for your next battle?</p>
          <div className="stats-row">
            <div className="stat-box">
              <div className="stat-value">{user?.totalBattles || 0}</div>
              <div className="stat-label">Total Battles</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{user?.winRate || '0%'}</div>
              <div className="stat-label">Win Rate</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{user?.eloRating || 1000}</div>
              <div className="stat-label">ELO Rating</div>
            </div>
          </div>
        </div>

        <div className="grid-layout">
          {/* Battle Mode Selection (Restored Detailed UI) */}
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

          {/* Leaderboard Section (Maintained Structure) */}
          <section className="leaderboard-section">
            <h2 className="section-title">🏆 Top Players</h2>
            <div className="leaderboard-container">
              {leaderboard.map((player, index) => (
                <div key={index} className="leaderboard-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="username">{player.username}</span>
                  <span className="elo">⭐ {player.eloRating}</span>
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