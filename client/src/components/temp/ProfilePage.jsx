import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';


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

  const API_URL = 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

   // Wrap fetchProfileData in useCallback to avoid recreating on every render
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
      setHistory(data.history);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Failed to load profile');
      setLoading(false);
    }
  }, [token, API_URL]);

  // Fetch profile data on mount
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

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (!user) return <div className="text-center p-8">User not found</div>;

  return (
    <div className="min-h-screen p-8" style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #B0E0E6 50%, #7EC8E3 100%)' }}>
      {/* Header */}
      <div className="flex justify-end gap-4 mb-6">
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-white rounded-lg shadow hover:shadow-md font-semibold">
          Home
        </button>
        <button onClick={handleLogout} className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold">
          Logout
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6">
            {/* Avatar */}
            <div className="relative w-48 h-48 mx-auto mb-4">
              <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                {user.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-6xl font-bold">
                    {user.username[0].toUpperCase()}
                  </div>
                )}
              </div>
              <label className="absolute bottom-2 right-2 bg-blue-500 text-white p-3 rounded-full cursor-pointer hover:bg-blue-600 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} />
              </label>
            </div>

            {/* Username */}
            <div className="text-center mb-4">
              {editingUsername ? (
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="text-2xl font-bold text-center border-b-2 border-blue-500 focus:outline-none px-2"
                    maxLength="20"
                    autoFocus
                  />
                  <button onClick={saveUsername} className="text-green-600 hover:text-green-700">✓</button>
                  <button onClick={() => setEditingUsername(false)} className="text-red-600 hover:text-red-700">✕</button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-800">{user.username}</h2>
                  <button
                    onClick={() => {
                      setUsernameInput(user.username);
                      setEditingUsername(true);
                    }}
                    className="text-gray-500 hover:text-blue-600"
                  >
                    ✎
                  </button>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">ID: {user._id.slice(-8)}</p>
            </div>

            {/* Bio */}
            <div className="bg-gray-100 rounded-lg p-3">
              {editingBio ? (
                <div>
                  <textarea
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    className="w-full p-2 border-2 border-blue-500 rounded focus:outline-none resize-none"
                    rows="3"
                    maxLength="100"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={saveBio} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm">Save</button>
                    <button onClick={() => setEditingBio(false)} className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <p className="text-gray-600 text-sm flex-1">{user.bio || 'No bio yet...'}</p>
                  <button
                    onClick={() => {
                      setBioInput(user.bio || '');
                      setEditingBio(true);
                    }}
                    className="text-gray-500 hover:text-blue-600 ml-2"
                  >
                    ✎
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Ranked Elo */}
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Ranked Elo</h3>
            <p className="text-3xl font-bold text-red-600">{user.eloRating === 1000 ? 'Unranked' : user.eloRating}</p>
          </div>

          {/* Statistics */}
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Statistics</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-700 mb-2">Normal Mode:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">matches played</p>
                    <p className="text-3xl font-bold text-gray-800">{stats?.normalMatches || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">win/loss ratio</p>
                    <p className="text-3xl font-bold text-gray-800">{Math.round(stats?.normalWinRate || 0)}%</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-700 mb-2">Ranked Mode:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">matches played</p>
                    <p className="text-3xl font-bold text-gray-800">{stats?.rankedMatches || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">win/loss ratio</p>
                    <p className="text-3xl font-bold text-gray-800">{stats?.rankedWinRate || 0}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column - Your Party */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Your Party</h3>
              <button onClick={() => alert('Team builder coming soon!')} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold">
                Change
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {team?.pokemon && team.pokemon.length > 0 ? (
                team.pokemon.map((p, idx) => (
                  <div key={idx} className="bg-gray-100 rounded-xl p-4 hover:bg-gray-200 border-2 border-transparent hover:border-blue-400">
                    <img src={p.pokemon.sprite} alt={p.pokemon.name} className="w-full h-32 object-contain" />
                    <p className="text-center font-semibold text-gray-700 mt-2">{p.pokemon.name}</p>
                    <p className="text-center text-sm text-gray-500">Lvl {p.level}</p>
                  </div>
                ))
              ) : (
                <p className="col-span-2 text-center text-gray-500 py-8">No team selected. Click "Change" to build your team!</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - History */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">History</h3>
            <div className="space-y-3">
              {history && history.length > 0 ? (
                history.map((match, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl p-4 ${match.result === 'Win' ? 'bg-green-100 border-2 border-green-300' : 'bg-red-100 border-2 border-red-300'}`}
                  >
                    <h4 className={`text-2xl font-bold mb-3 ${match.result === 'Win' ? 'text-green-700' : 'text-red-700'}`}>
                      {match.result}
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-white overflow-hidden border-2 border-gray-300">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                              {user.username[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="font-semibold text-gray-700">{user.username}</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-700">vs</span>
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold border-2 border-white">
                          {match.opponent.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-700">{match.opponent.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No battle history yet. Start battling!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;