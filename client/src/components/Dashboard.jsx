import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socketService';
import { getUnreadCount } from '../services/api';

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
    if (user) {
      socketService.leaveNotificationRoom(user.userId);
    }
    socketService.disconnect();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoSection}>
            <span style={styles.logoIcon}>⚔️</span>
            <h1 style={styles.title}>Pokémon Battle Simulator</h1>
          </div>
          
          <nav style={styles.headerButtons}>
            <button style={styles.headerButton} onClick={() => navigate('/chat')}>
              💬 Chat
            </button>
            <button style={styles.headerButton} onClick={() => navigate('/friends')}>
              👥 Friends
            </button>
            <button style={{...styles.headerButton, position: 'relative'}} onClick={() => navigate('/notifications')}>
              🔔 Notifications
              {unreadNotifications > 0 && (
                <span style={styles.notificationBadge}>{unreadNotifications}</span>
              )}
            </button>
            <button style={styles.headerButton} onClick={() => navigate('/profile')}>
              👤 Profile
            </button>
            <button style={styles.logoutButton} onClick={handleLogout}>
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main style={styles.mainContent}>
        {/* Welcome Card */}
        <div style={styles.welcomeCard}>
          <h2 style={styles.welcomeTitle}>Welcome back, {user?.username || 'Trainer'}! 👋</h2>
          <p style={styles.welcomeText}>Ready for your next battle?</p>
          <div style={styles.statsRow}>
            <div style={styles.statBox}>
              <div style={styles.statValue}>1,247</div>
              <div style={styles.statLabel}>Total Battles</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statValue}>68%</div>
              <div style={styles.statLabel}>Win Rate</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statValue}>2,156</div>
              <div style={styles.statLabel}>ELO Rating</div>
            </div>
          </div>
        </div>

        <div style={styles.gridLayout}>
          {/* Battle Mode Selection */}
          <section style={styles.gameSection}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.titleIcon}>⚔️</span>
              Select Battle Mode
            </h2>
            
            <div style={styles.modeContainer}>
              <button
                style={{
                  ...styles.modeButton,
                  ...(selectedMode === 'normal' ? styles.modeButtonActive : {})
                }}
                onClick={() => setSelectedMode('normal')}
              >
                <div style={styles.modeIcon}>⚔️</div>
                <div style={styles.modeText}>Normal Battle</div>
                <div style={styles.modeDescription}>Casual matches for practice</div>
              </button>

              <button
                style={{
                  ...styles.modeButton,
                  ...(selectedMode === 'ranked' ? styles.modeButtonActive : {})
                }}
                onClick={() => setSelectedMode('ranked')}
              >
                <div style={styles.modeIcon}>🏆</div>
                <div style={styles.modeText}>Ranked Battle</div>
                <div style={styles.modeDescription}>Competitive ELO matches</div>
              </button>
            </div>

            <div style={styles.actionButtons}>
              <button style={styles.playButton} onClick={() => navigate('/battle')}>
                Play {selectedMode === 'ranked' ? 'Ranked' : 'Normal'}
              </button>
              
              <button style={styles.teamBuilderButton} onClick={() => navigate('/team-builder')}>
                Team Builder
              </button>
            </div>
          </section>

          {/* Leaderboard */}
          <section style={styles.leaderboardSection}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.titleIcon}>🏆</span>
              Top Players
            </h2>
            
            <div style={styles.leaderboardContainer}>
              {leaderboard.map((player, index) => (
                <div key={index} style={styles.leaderboardItem}>
                  <div style={{
                    ...styles.rank,
                    ...(index === 0 && styles.rankGold),
                    ...(index === 1 && styles.rankSilver),
                    ...(index === 2 && styles.rankBronze)
                  }}>
                    #{index + 1}
                  </div>
                  
                  <div style={styles.avatarWrapper}>
                    <div style={styles.avatar}>{player.avatar}</div>
                  </div>
                  
                  <div style={styles.playerInfo}>
                    <div style={styles.username}>{player.username}</div>
                    <div style={styles.elo}>⭐ {player.elo} ELO</div>
                  </div>
                  
                  {index < 3 && (
                    <div style={styles.rankBadge}>
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

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)',
    padding: '0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '15px 0',
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    fontSize: '32px',
  },
  title: {
    color: '#ffffff',
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
  },
  headerButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  headerButton: {
    padding: '8px 20px',
    border: 'none',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.15)',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  logoutButton: {
    padding: '8px 20px',
    border: 'none',
    borderRadius: '8px',
    background: 'rgba(239, 68, 68, 0.9)',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  notificationBadge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    background: '#ec4899',
    color: '#fff',
    borderRadius: '10px',
    minWidth: '20px',
    height: '20px',
    fontSize: '11px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #7c3aed',
  },
  mainContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px 30px',
  },
  welcomeCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '40px',
    marginBottom: '30px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    textAlign: 'center',
  },
  welcomeTitle: {
    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontSize: '32px',
    margin: '0 0 10px 0',
    fontWeight: '800',
  },
  welcomeText: {
    color: '#6d28d9',
    fontSize: '18px',
    margin: '0 0 30px 0',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '20px',
    maxWidth: '700px',
    margin: '0 auto',
  },
  statBox: {
    background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
    borderRadius: '12px',
    padding: '20px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#7c3aed',
    marginBottom: '5px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#9333ea',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontWeight: '600',
  },
  gridLayout: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '30px',
    alignItems: 'start',
  },
  gameSection: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
  },
  leaderboardSection: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
  },
  sectionTitle: {
    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontSize: '22px',
    margin: '0 0 20px 0',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  titleIcon: {
    fontSize: '24px',
  },
  modeContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '25px',
  },
  modeButton: {
    padding: '25px',
    border: '2px solid #e9d5ff',
    borderRadius: '12px',
    background: '#faf5ff',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textAlign: 'center',
  },
  modeButtonActive: {
    border: '2px solid #7c3aed',
    background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
    transform: 'scale(1.02)',
    boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)',
  },
  modeIcon: {
    fontSize: '48px',
    marginBottom: '10px',
  },
  modeText: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#6d28d9',
    marginBottom: '5px',
  },
  modeDescription: {
    fontSize: '13px',
    color: '#9333ea',
  },
  actionButtons: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  playButton: {
    padding: '15px 50px',
    border: 'none',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 6px 20px rgba(124, 58, 237, 0.4)',
  },
  teamBuilderButton: {
    padding: '15px 35px',
    border: '2px solid #7c3aed',
    borderRadius: '10px',
    background: 'transparent',
    color: '#7c3aed',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  leaderboardContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  leaderboardItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
    borderRadius: '12px',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  rank: {
    fontSize: '20px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    minWidth: '50px',
  },
  rankGold: {
    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  rankSilver: {
    background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  rankBronze: {
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  avatarWrapper: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    marginRight: '15px',
    background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(124, 58, 237, 0.3)',
  },
  avatar: {
    fontSize: '26px',
  },
  playerInfo: {
    flex: 1,
  },
  username: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#6d28d9',
    marginBottom: '3px',
  },
  elo: {
    fontSize: '14px',
    color: '#9333ea',
    fontWeight: '500',
  },
  rankBadge: {
    fontSize: '24px',
    marginLeft: '10px',
  },
};

export default Dashboard;