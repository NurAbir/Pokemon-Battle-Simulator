import React, { useState, useEffect } from 'react';
import '../styles/TeamBuilder.css';

const TeamBuilder = () => {
  const [allPokemon, setAllPokemon] = useState([]);
  const [allMoves, setAllMoves] = useState([]);
  const [allAbilities, setAllAbilities] = useState([]);
  const [team, setTeam] = useState([]);
  const [teamName, setTeamName] = useState('My Team');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [editingPokemon, setEditingPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token'); // Adjust based on your auth setup
      
      // Fetch Pokemon, moves, abilities, and existing team
      const [pokemonRes, movesRes, abilitiesRes, teamRes] = await Promise.all([
        fetch('/api/pokemon', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/moves', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/abilities', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/team/my-team', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const pokemonData = await pokemonRes.json();
      const movesData = await movesRes.json();
      const abilitiesData = await abilitiesRes.json();
      
      setAllPokemon(pokemonData.data || []);
      setAllMoves(movesData.data || []);
      setAllAbilities(abilitiesData.data || []);

      // Load existing team if available
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        if (teamData.success && teamData.data) {
          setTeam(teamData.data.pokemon || []);
          setTeamName(teamData.data.teamName || 'My Team');
        }
      }

      setLoading(false);
    } catch (err) {
      setError('Failed to load data: ' + err.message);
      setLoading(false);
    }
  };

  // Search Pokemon
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      fetchInitialData();
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/pokemon?search=${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setAllPokemon(data.data || []);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  // Add Pokemon to team
  const addPokemonToTeam = (pokemon) => {
    if (team.length >= 6) {
      setError('Team is full! Maximum 6 Pokemon allowed.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const newMember = {
      pokemonId: pokemon.pokemonId,
      name: pokemon.name,
      types: pokemon.types,
      baseStats: pokemon.baseStats,
      selectedMoves: [],
      selectedAbility: null
    };

    setTeam([...team, newMember]);
    setSelectedSlot(null);
  };

  // Remove Pokemon from team
  const removePokemon = (index) => {
    setTeam(team.filter((_, i) => i !== index));
  };

  // Open move/ability editor
  const openEditor = (index) => {
    setEditingPokemon(index);
  };

  // Toggle move selection
  const toggleMove = (move) => {
    if (editingPokemon === null) return;

    const updatedTeam = [...team];
    const pokemon = updatedTeam[editingPokemon];
    
    const moveIndex = pokemon.selectedMoves.findIndex(m => m.moveId === move.moveId);
    
    if (moveIndex > -1) {
      // Remove move
      pokemon.selectedMoves.splice(moveIndex, 1);
    } else {
      // Add move (max 4)
      if (pokemon.selectedMoves.length < 4) {
        pokemon.selectedMoves.push({
          moveId: move.moveId,
          name: move.name,
          type: move.type,
          power: move.power,
          accuracy: move.accuracy
        });
      } else {
        setError('Maximum 4 moves per Pokemon!');
        setTimeout(() => setError(null), 3000);
        return;
      }
    }
    
    setTeam(updatedTeam);
  };

  // Select ability
  const selectAbility = (ability) => {
    if (editingPokemon === null) return;

    const updatedTeam = [...team];
    updatedTeam[editingPokemon].selectedAbility = {
      abilityId: ability.abilityId,
      name: ability.name,
      description: ability.description
    };
    setTeam(updatedTeam);
  };

  // Save team
  const saveTeam = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Check if team exists, use update or create endpoint accordingly
      const endpoint = team.length > 0 ? '/api/team/update' : '/api/team/create';
      //const method = 'POST'; // Both use POST, but update uses PUT
      
      const response = await fetch(endpoint, {
        method: team.length > 0 ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          teamName,
          pokemon: team
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage('Team saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.message || 'Failed to save team');
        setTimeout(() => setError(null), 3000);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Error saving team: ' + err.message);
      setTimeout(() => setError(null), 3000);
      setLoading(false);
    }
  };

  // Clear team
  const clearTeam = () => {
    if (window.confirm('Are you sure you want to clear your entire team?')) {
      setTeam([]);
    }
  };

  if (loading && allPokemon.length === 0) {
    return <div className="loading">Loading Team Builder...</div>;
  }

  return (
    <div className="team-builder">
      <header className="team-builder-header">
        <h1>Team Builder</h1>
        <input
          type="text"
          className="team-name-input"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Team Name"
        />
      </header>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="team-builder-content">
        {/* Current Team Display */}
        <div className="team-section">
          <div className="section-header">
            <h2>Your Team ({team.length}/6)</h2>
            <div className="team-actions">
              <button onClick={saveTeam} className="btn-save" disabled={loading}>
                Save Team
              </button>
              <button onClick={clearTeam} className="btn-clear">
                Clear Team
              </button>
            </div>
          </div>

          <div className="team-slots">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="team-slot">
                {team[index] ? (
                  <div className="team-member">
                    <div className="pokemon-header">
                      <h3>{team[index].name}</h3>
                      <button
                        onClick={() => removePokemon(index)}
                        className="btn-remove"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="pokemon-types">
                      {team[index].types.map((type, i) => (
                        <span key={i} className={`type-badge type-${type.toLowerCase()}`}>
                          {type}
                        </span>
                      ))}
                    </div>

                    <div className="pokemon-stats">
                      <div className="stat">HP: {team[index].baseStats.baseHP}</div>
                      <div className="stat">Atk: {team[index].baseStats.baseAttack}</div>
                      <div className="stat">Def: {team[index].baseStats.baseDefense}</div>
                      <div className="stat">SpA: {team[index].baseStats.baseSpAttack}</div>
                      <div className="stat">SpD: {team[index].baseStats.baseSpDefense}</div>
                      <div className="stat">Spe: {team[index].baseStats.baseSpeed}</div>
                    </div>

                    <div className="pokemon-moves">
                      <strong>Moves ({team[index].selectedMoves.length}/4):</strong>
                      {team[index].selectedMoves.map((move, i) => (
                        <div key={i} className="move-item">{move.name}</div>
                      ))}
                    </div>

                    <div className="pokemon-ability">
                      <strong>Ability:</strong>
                      {team[index].selectedAbility ? (
                        <div className="ability-item">{team[index].selectedAbility.name}</div>
                      ) : (
                        <div className="ability-item none">None selected</div>
                      )}
                    </div>

                    <button
                      onClick={() => openEditor(index)}
                      className="btn-edit"
                    >
                      Edit Moves & Ability
                    </button>
                  </div>
                ) : (
                  <div
                    className="empty-slot"
                    onClick={() => setSelectedSlot(index)}
                  >
                    <span className="plus-icon">+</span>
                    <p>Add Pokemon</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pokemon Selection Panel */}
        {selectedSlot !== null && (
          <div className="selection-panel">
            <div className="panel-header">
              <h2>Select a Pokemon</h2>
              <button
                onClick={() => setSelectedSlot(null)}
                className="btn-close"
              >
                ×
              </button>
            </div>

            <input
              type="text"
              className="search-input"
              placeholder="Search Pokemon..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />

            <div className="pokemon-grid">
              {allPokemon.map((pokemon) => (
                <div
                  key={pokemon.pokemonId}
                  className="pokemon-card"
                  onClick={() => addPokemonToTeam(pokemon)}
                >
                  <h4>{pokemon.name}</h4>
                  <div className="pokemon-types">
                    {pokemon.types.map((type, i) => (
                      <span key={i} className={`type-badge type-${type.toLowerCase()}`}>
                        {type}
                      </span>
                    ))}
                  </div>
                  <div className="pokemon-stats-mini">
                    <span>HP: {pokemon.baseStats.baseHP}</span>
                    <span>Atk: {pokemon.baseStats.baseAttack}</span>
                    <span>Def: {pokemon.baseStats.baseDefense}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Move & Ability Editor */}
        {editingPokemon !== null && (
          <div className="editor-panel">
            <div className="panel-header">
              <h2>Edit {team[editingPokemon].name}</h2>
              <button
                onClick={() => setEditingPokemon(null)}
                className="btn-close"
              >
                ×
              </button>
            </div>

            <div className="editor-content">
              <div className="editor-section">
                <h3>Select Moves (Max 4)</h3>
                <div className="moves-grid">
                  {allMoves.map((move) => {
                    const isSelected = team[editingPokemon].selectedMoves.some(
                      m => m.moveId === move.moveId
                    );
                    return (
                      <div
                        key={move.moveId}
                        className={`move-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleMove(move)}
                      >
                        <div className="move-name">{move.name}</div>
                        <div className="move-details">
                          <span className={`type-badge type-${move.type.toLowerCase()}`}>
                            {move.type}
                          </span>
                          <span>Pow: {move.power || '-'}</span>
                          <span>Acc: {move.accuracy || '-'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="editor-section">
                <h3>Select Ability</h3>
                <div className="abilities-list">
                  {allAbilities.map((ability) => {
                    const isSelected = team[editingPokemon].selectedAbility?.abilityId === ability.abilityId;
                    return (
                      <div
                        key={ability.abilityId}
                        className={`ability-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => selectAbility(ability)}
                      >
                        <div className="ability-name">{ability.name}</div>
                        <div className="ability-description">{ability.description}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamBuilder;