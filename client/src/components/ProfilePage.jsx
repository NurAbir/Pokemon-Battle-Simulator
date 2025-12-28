import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [team, setTeam] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const navigate = useNavigate();

  const API_URL = `${process.env.REACT_APP_API_URL}/api`;
  const token = localStorage.getItem('token');
  
  
  const fetchProfileData = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch profile');

      const data = await response.json();
      
      setUser(data.data);
      setStats(data.stats);
      setTeam(data.team);
      setHistory(data.history || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Failed to load profile');
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      alert('Please login first!');
      navigate('/login');
      return;
    }

    fetchProfileData();
  }, [token, navigate, fetchProfileData]);

  const uploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5242880) {
      alert('Image size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch(`${API_URL}/user/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload avatar');

      const result = await response.json();
      setUser({ ...user, avatar: result.data.avatar });
      alert('Avatar uploaded successfully!');
    } catch (error) {
      alert('Failed to upload avatar: ' + error.message);
    }
  };

  const saveUsername = async () => {
    if (!usernameInput.trim()) {
      alert('Username cannot be empty');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: usernameInput })
      });

      if (!response.ok) throw new Error('Failed to update username');

      const result = await response.json();
      setUser(result.data);
      setEditingUsername(false);
      alert('Username updated successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  const saveBio = async () => {
    try {
      const response = await fetch(`${API_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bio: bioInput })
      });

      if (!response.ok) throw new Error('Failed to update bio');

      const result = await response.json();
      setUser(result.data);
      setEditingBio(false);
      alert('Bio updated successfully!');
    } catch (error) {
      alert('Failed to update bio: ' + error.message);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  if (loading) return <div className="loading-container">Loading...</div>;
  if (!user) return <div className="loading-container">User not found</div>;

  return (
    <div className="profile-page">
      {/* Header Navigation */}
      <header className="profile-header">
        <div className="header-spacer"></div>
        <nav className="header-nav">
          <button className="nav-btn home-btn" onClick={() => navigate('/dashboard')}>Home</button>
          <button className="nav-btn logout-btn" onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <div className="profile-container">
        {/* Left Section - Profile Info */}
        <div className="profile-left">
          {/* Avatar Section */}
          <div className="avatar-section">
            <div className="avatar-wrapper">
              <img 
                   src={user.avatar ? `${process.env.REACT_APP_API_URL}${user.avatar}` : 'https://hwchamber.co.uk/wp-content/uploads/2022/04/avatar-placeholder.gif'} 
                   alt="Profile" 
                   className="avatar-img"
              />
              <label htmlFor="avatar-upload" className="avatar-upload-label">
                📷
              </label>
              <input 
                id="avatar-upload"
                type="file" 
                accept="image/*" 
                onChange={uploadAvatar}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Username Section */}
          <div className="info-section">
            <div className="info-field">
              <div className="field-label">Username</div>
              {!editingUsername ? (
                <div className="field-display">
                  <p className="field-value">{user.username}</p>
                  <button 
                    className="edit-btn"
                    onClick={() => {
                      setEditingUsername(true);
                      setUsernameInput(user.username);
                    }}
                  >
                    ✏️
                  </button>
                </div>
              ) : (
                <div className="field-edit">
                  <input 
                    type="text" 
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="edit-input"
                    placeholder="Enter username"
                  />
                  <div className="edit-buttons">
                    <button className="save-btn" onClick={saveUsername}>Save</button>
                    <button className="cancel-btn" onClick={() => setEditingUsername(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bio Section */}
          <div className="info-section">
            <div className="info-field">
              <div className="field-label">Bio</div>
              {!editingBio ? (
                <div className="field-display">
                  <p className="field-value">{user.bio || 'No bio added yet...'}</p>
                  <button 
                    className="edit-btn"
                    onClick={() => {
                      setEditingBio(true);
                      setBioInput(user.bio || '');
                    }}
                  >
                    ✏️
                  </button>
                </div>
              ) : (
                <div className="field-edit">
                  <textarea 
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    className="edit-textarea"
                    placeholder="Enter your bio"
                  />
                  <div className="edit-buttons">
                    <button className="save-btn" onClick={saveBio}>Save</button>
                    <button className="cancel-btn" onClick={() => setEditingBio(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ranked Elo */}
          <div className="elo-section">
            <div className="elo-label">Ranked Elo</div>
            <div className="elo-status">
              {user.elo ? `${user.elo} ELO` : 'Unranked'}
            </div>
          </div>
        </div>

        {/* Middle Section - Team */}
        <div className="profile-middle">
          <h2 className="section-title">Your Party</h2>
          <div className="team-grid">
            {team && team.length > 0 ? (
              team.map((pokemon, index) => (
                <div key={index} className="pokemon-card">
                  <img 
                    src={pokemon.image || 'https://via.placeholder.com/120'} 
                    alt={pokemon.name}
                    className="pokemon-img"
                  />
                </div>
              ))
            ) : (
              <p className="no-team-text">No team created yet</p>
            )}
          </div>

          <button 
            className="change-team-btn"
            onClick={() => navigate('/team-builder')}
          >
            Change
          </button>
        </div>

        {/* Right Section - Stats & History */}
        <div className="profile-right">
          {/* Statistics */}
          <div className="stats-section">
            <h3 className="stats-title">Statistics</h3>
            
            <div className="stat-mode">
              <div className="stat-mode-title">Normal Mode</div>
              <div className="stat-row">
                <span className="stat-label">Matches Played</span>
                <span className="stat-value">{stats?.normalMatches || 0}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Win Rate</span>
                <span className="stat-value">{stats?.normalWinrate || '0%'}</span>
              </div>
            </div>

            <div className="stat-mode">
              <div className="stat-mode-title">Ranked Mode</div>
              <div className="stat-row">
                <span className="stat-label">Matches Played</span>
                <span className="stat-value">{stats?.rankedMatches || 0}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Win Rate</span>
                <span className="stat-value">{stats?.rankedWinrate || '0%'}</span>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="history-section">
            <h3 className="history-title">History</h3>
            <div className="history-list">
              {history && history.length > 0 ? (
                history.slice(0, 5).map((battle, index) => (
                  <div key={index} className={`history-item ${battle.result.toLowerCase()}`}>
                    <div className="battle-result">{battle.result}</div>
                    <div className="battle-opponent">{battle.opponent}</div>
                    <div className="battle-date">{new Date(battle.date).toLocaleDateString()}</div>
                  </div>
                ))
              ) : (
                <p className="no-history-text">No battle history yet</p>
              )}
            </div>

            <button 
              className="view-history-btn"
              onClick={() => navigate('/history')}
            >
              View Full History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;