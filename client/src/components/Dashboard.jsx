import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState('normal');
  const [user, setUser] = useState(null);

  // Placeholder leaderboard data
  const leaderboard = [
    { username: 'DragonMaster', elo: 2450, avatar: 'https://hwchamber.co.uk/wp-content/uploads/2022/04/avatar-placeholder.gif' },
    { username: 'PikachuFan88', elo: 2380, avatar: 'https://hwchamber.co.uk/wp-content/uploads/2022/04/avatar-placeholder.gif' },
    { username: 'MewtwoKing', elo: 2315, avatar: 'https://hwchamber.co.uk/wp-content/uploads/2022/04/avatar-placeholder.gif' },
    { username: 'CharizardChamp', elo: 2290, avatar: 'https://hwchamber.co.uk/wp-content/uploads/2022/04/avatar-placeholder.gif' },
    { username: 'GyaradosLord', elo: 2265, avatar: 'https://hwchamber.co.uk/wp-content/uploads/2022/04/avatar-placeholder.gif' }
  ];

  useEffect(() => {
    // Fetch user profile
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();
        if (result.success) {
          setUser(result.data); // Changed from setUser(data) to setUser(result.data)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleTeamBuilder = () => {
    navigate('/team-builder');
  };

  const handlePlay = () => {
    navigate('/battle');
  };

  return (
    <div style={styles.container}>
      {/* Header with buttons */}
      <div style={styles.header}>
        <h1 style={styles.title}>Pokémon Battle Simulator</h1>
        <div style={styles.headerButtons}>
          <button 
            style={styles.headerButton}
            onClick={handleProfile}
            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            Profile
          </button>
          <button 
            style={{...styles.headerButton, ...styles.logoutButton}}
            onClick={handleLogout}
            onMouseOver={(e) => e.target.style.background = 'rgba(239, 68, 68, 1)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.8)'}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={styles.mainContent}>
        {/* Welcome Message */}
        {user && (
          <div style={styles.welcomeSection}>
            <h2 style={styles.welcomeTitle}>Welcome back, {user.username}! 👋</h2>
            <p style={styles.welcomeText}>Ready for your next battle?</p>
          </div>
        )}

        {/* Mode Selection and Play Section */}
        <div style={styles.gameSection}>
          <h2 style={styles.sectionTitle}>Select Battle Mode</h2>
          
          <div style={styles.modeContainer}>
            <button
              style={{
                ...styles.modeButton,
                ...(selectedMode === 'normal' ? styles.modeButtonActive : {})
              }}
              onClick={() => setSelectedMode('normal')}
            >
              <div style={styles.modeIcon}>⚔️</div>
              <div style={styles.modeText}>Normal</div>
              <div style={styles.modeDescription}>Casual battle for practice</div>
            </button>

            <button
              style={{
                ...styles.modeButton,
                ...(selectedMode === 'ranked' ? styles.modeButtonActive : {})
              }}
              onClick={() => setSelectedMode('ranked')}
            >
              <div style={styles.modeIcon}>🏆</div>
              <div style={styles.modeText}>Ranked</div>
              <div style={styles.modeDescription}>Competitive battles with ELO</div>
            </button>
          </div>

          <div style={styles.actionButtons}>
            <button 
              style={styles.playButton}
              onClick={handlePlay}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              Play {selectedMode === 'ranked' ? 'Ranked' : 'Normal'}
            </button>
            
            <button 
              style={styles.teamBuilderButton}
              onClick={handleTeamBuilder}
              onMouseOver={(e) => {
                e.target.style.background = '#667eea';
                e.target.style.color = '#ffffff';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#667eea';
              }}
            >
              Team Builder
            </button>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div style={styles.leaderboardSection}>
          <h2 style={styles.sectionTitle}>Top Players</h2>
          <div style={styles.leaderboardContainer}>
            {leaderboard.map((player, index) => (
              <div key={index} style={styles.leaderboardItem}>
                <div style={styles.rank}>#{index + 1}</div>
                <img 
                  src={player.avatar || 'https://via.placeholder.com/50/6B46C1/ffffff?text=?'} 
                  alt={player.username}
                  style={styles.avatar}
                />
                <div style={styles.playerInfo}>
                  <div style={styles.username}>{player.username}</div>
                  <div style={styles.elo}>{player.elo} ELO</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '40px',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '15px',
    backdropFilter: 'blur(10px)',
  },
  title: {
    color: '#ffffff',
    margin: 0,
    fontSize: '28px',
    fontWeight: '700',
  },
  headerButtons: {
    display: 'flex',
    gap: '15px',
  },
  headerButton: {
    padding: '10px 25px',
    border: 'none',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  logoutButton: {
    background: 'rgba(239, 68, 68, 0.8)',
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  welcomeSection: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '30px 40px',
    marginBottom: '30px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    textAlign: 'center',
  },
  welcomeTitle: {
    color: '#5B21B6',
    fontSize: '32px',
    margin: '0 0 10px 0',
    fontWeight: '700',
  },
  welcomeText: {
    color: '#6B7280',
    fontSize: '18px',
    margin: 0,
  },
  gameSection: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '40px',
    marginBottom: '30px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
  },
  sectionTitle: {
    color: '#5B21B6',
    fontSize: '24px',
    marginTop: 0,
    marginBottom: '25px',
    fontWeight: '700',
  },
  modeContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  modeButton: {
    padding: '30px',
    border: '3px solid #E0E7FF',
    borderRadius: '15px',
    background: '#F9FAFB',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
  },
  modeButtonActive: {
    border: '3px solid #6B46C1',
    background: 'linear-gradient(135deg, #EDE9FE 0%, #DBEAFE 100%)',
    transform: 'scale(1.05)',
    boxShadow: '0 8px 25px rgba(107, 70, 193, 0.3)',
  },
  modeIcon: {
    fontSize: '48px',
    marginBottom: '10px',
  },
  modeText: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: '8px',
  },
  modeDescription: {
    fontSize: '14px',
    color: '#6B7280',
  },
  actionButtons: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  playButton: {
    padding: '18px 60px',
    border: 'none',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
  },
  teamBuilderButton: {
    padding: '18px 40px',
    border: '2px solid #667eea',
    borderRadius: '12px',
    background: 'transparent',
    color: '#667eea',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  leaderboardSection: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
  },
  leaderboardContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  leaderboardItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '20px',
    background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    border: '2px solid transparent',
  },
  rank: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#6B46C1',
    minWidth: '50px',
  },
  avatar: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    marginRight: '20px',
    border: '3px solid #667eea',
  },
  playerInfo: {
    flex: 1,
  },
  username: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: '4px',
  },
  elo: {
    fontSize: '14px',
    color: '#6B7280',
    fontWeight: '500',
  },
};

export default Dashboard;