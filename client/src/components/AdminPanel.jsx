import React, { useState, useEffect } from 'react';
import '../styles/AdminPanel.css';
import BattleLogPanel from './BattleLogPanel'; // ← NEW IMPORT

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [pokemons, setPokemons] = useState([]);
  const [activeBattles, setActiveBattles] = useState([]); // ← NEW STATE
  const [selectedBattleLog, setSelectedBattleLog] = useState(null); // ← NEW STATE FOR MODAL
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchPokemons = async () => {
    setLoading(true);
    try {
      const listResponse = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
      const listData = await listResponse.json();

      const pokemonDetails = await Promise.all(
        listData.results.map(async (pokemon) => {
          const detailResponse = await fetch(pokemon.url);
          const detail = await detailResponse.json();

          return {
            pokemonId: detail.id.toString().padStart(3, '0'),
            name: detail.name.charAt(0).toUpperCase() + detail.name.slice(1),
            type: detail.types.map(t => 
              t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)
            ),
            baseStats: {
              hp: detail.stats[0].base_stat,
              atk: detail.stats[1].base_stat,
              def: detail.stats[2].base_stat,
              spa: detail.stats[3].base_stat,
              spd: detail.stats[4].base_stat,
              spe: detail.stats[5].base_stat
            },
            isBanned: false
          };
        })
      );

      pokemonDetails.sort((a, b) => parseInt(a.pokemonId) - parseInt(b.pokemonId));
      setPokemons(pokemonDetails);
    } catch (err) {
      console.error('Failed to fetch Pokémon from PokeAPI:', err);
      alert('Failed to load Pokémon list.');
      setPokemons([]);
    } finally {
      setLoading(false);
    }
  };

  // ← NEW: Fetch active battles
  const fetchActiveBattles = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/battles/active', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch active battles');
      const data = await res.json();
      setActiveBattles(Array.isArray(data) ? data : data.battles || []);
    } catch (err) {
      console.error(err);
      alert('Could not load live battles.');
      setActiveBattles([]);
    } finally {
      setLoading(false);
    }
  };

  // ← NEW: Fetch full log for a battle when admin clicks "View Log"
  const viewBattleLog = async (battleId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/battles/${battleId}/log`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch log');
      const { log } = await res.json();
      setSelectedBattleLog({ battleId, log });
    } catch (err) {
      alert('Failed to load battle log.');
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'game') fetchPokemons();
    if (activeTab === 'battles') fetchActiveBattles(); // ← NEW
  }, [activeTab]);

  const handleToggleBan = async (userId, currentBanStatus) => {
    const action = currentBanStatus ? 'Unban' : 'Ban';
    if (!window.confirm(`${action} this user?`)) return;

    try {
      const res = await fetch(`http://localhost:5000/api/user/${userId}/toggle-ban`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        alert(`User ${action}ned successfully.`);
        fetchUsers();
      }
    } catch (err) { alert("Action failed."); }
  };

  // Helper to format time ago
  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="admin-panel">
      <h2 className="admin-title">🛡️ Admin Command Center</h2>
      <div className="admin-tabs">
        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Trainers</button>
        <button className={activeTab === 'game' ? 'active' : ''} onClick={() => setActiveTab('game')}>Pokémon Meta</button>
        <button className={activeTab === 'battles' ? 'active' : ''} onClick={() => setActiveTab('battles')}>Live Hub</button>
      </div>

      <div className="admin-content">
        {activeTab === 'users' && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Trainer</th>
                  <th>ELO</th>
                  <th>Status</th>
                  <th>Reports</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.userId}>
                    <td>
                      <span className="username-text">{u.username}</span>
                      {u.isBanned && <span className="banned-tag">BANNED</span>}
                    </td>
                    <td>{u.eloRating}</td>
                    <td>{u.isOnline ? '🟢 Online' : '⚪ Offline'}</td>
                    <td>
                      <span title={u.reportedBy?.join(', ')}>
                        🚩 {u.reportedBy?.length || 0} reports
                      </span>
                    </td>
                    <td>
                      <button 
                        className={u.isBanned ? "unban-btn" : "ban-btn"} 
                        onClick={() => handleToggleBan(u.userId, u.isBanned)}
                      >
                        {u.isBanned ? 'Unban' : 'Ban'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'game' && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Types</th>
                  <th>Base HP</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pokemons.map(p => (
                  <tr key={p.pokemonId}>
                    <td>{p.name}</td>
                    <td>{p.type?.join(' / ') || 'Unknown'}</td>
                    <td>{p.baseStats?.hp || 0}</td>
                    <td>{p.isBanned ? '🚫 Banned' : '✅ Legal'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ← NEW: Live Hub Tab */}
       {activeTab === 'battles' && (
  <div className="table-container">
    <h3>🔴 Live Battles Monitor</h3>
    {loading && <p>Loading live battles...</p>}
    {!loading && activeBattles.length === 0 && (
      <p style={{ textAlign: 'center', color: '#888', margin: '40px' }}>
        No active battles right now. Peaceful times! ☮️
      </p>
    )}
    {!loading && activeBattles.length > 0 && (
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Battle ID</th>
            <th>Players</th>
            <th>Turn</th>
            <th>Started</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {activeBattles.map(battle => (
            <tr key={battle.battleId}>
              <td>
                <span className="status-live">🔴 LIVE</span>
              </td>
              <td>{battle.battleId.slice(0, 10)}...</td>
              <td>
                <strong>{battle.players[0]?.username || '??'}</strong>
                <span style={{ margin: '0 8px' }}>vs</span>
                <strong>{battle.players[1]?.username || '??'}</strong>
              </td>
              <td>Turn {battle.turn || 1}</td>
              <td>{timeAgo(battle.createdAt)}</td>
              <td>
                <button
                  className="btn-view-log"
                  onClick={() => viewBattleLog(battle.battleId)}
                >
                  📜 View Log
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}
      </div>

      {/* ← NEW: Battle Log Modal */}
      {selectedBattleLog && (
        <div className="modal-overlay" onClick={() => setSelectedBattleLog(null)}>
          <div className="modal large-modal" onClick={e => e.stopPropagation()}>
            <h2>Battle Log - {selectedBattleLog.battleId.slice(0, 8)}...</h2>
            <button className="modal-close" onClick={() => setSelectedBattleLog(null)}>✖</button>
            <div style={{ height: '70vh', overflowY: 'auto' }}>
              <BattleLogPanel battleLog={selectedBattleLog.log} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;