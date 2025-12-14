import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    searchPokemon, 
    getMyTeam, 
    updateTeam, 
    getMoves, 
    getAbilities, 
    getItems 
} from '../services/api';
import '../styles/TeamBuilder.css';

const TeamBuilder = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [team, setTeam] = useState([]);
    const [moves, setMoves] = useState([]);
    const [abilities, setAbilities] = useState([]);
    const [items, setItems] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [teamRes, movesRes, abilitiesRes, itemsRes] = await Promise.all([
                getMyTeam().catch(() => ({ data: { team: null } })),
                getMoves().catch(() => ({ data: { moves: [] } })),
                getAbilities().catch(() => ({ data: { abilities: [] } })),
                getItems().catch(() => ({ data: { items: [] } }))
            ]);

            if (teamRes.data.team && teamRes.data.team.teamPokemon) {
                setTeam(teamRes.data.team.teamPokemon);
            }
            setMoves(movesRes.data.moves || []);
            setAbilities(abilitiesRes.data.abilities || []);
            setItems(itemsRes.data.items || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const response = await searchPokemon(searchTerm);
            setSearchResults(response.data.pokemon || []);
        } catch (error) {
            console.error('Error searching Pokemon:', error);
            setMessage('Error searching Pokemon');
        }
    };

    const addPokemonToTeam = (pokemon) => {
        if (team.length >= 6) {
            setMessage('Team is full! Maximum 6 Pokemon allowed.');
            return;
        }

        const newPokemon = {
            pokemon: pokemon.pokemonId, // Use pokemonId string
            pokemonData: pokemon,
            level: 50,
            nature: 'Hardy',
            moves: [],
            ability: '',
            heldItem: ''
        };

        setTeam([...team, newPokemon]);
        setEditingIndex(team.length);
        setSearchResults([]);
        setSearchTerm('');
        setMessage('');
    };

    const removePokemon = (index) => {
        const newTeam = team.filter((_, i) => i !== index);
        setTeam(newTeam);
        if (editingIndex === index) setEditingIndex(null);
    };

    const updatePokemonConfig = (index, field, value) => {
        const newTeam = [...team];
        newTeam[index] = { ...newTeam[index], [field]: value };
        setTeam(newTeam);
    };

    const toggleMoveSelection = (index, moveId) => {
        const newTeam = [...team];
        const currentMoves = newTeam[index].moves || [];
        
        if (currentMoves.includes(moveId)) {
            newTeam[index].moves = currentMoves.filter(m => m !== moveId);
        } else {
            if (currentMoves.length >= 4) {
                setMessage('Maximum 4 moves per Pokemon!');
                return;
            }
            newTeam[index].moves = [...currentMoves, moveId];
        }
        setTeam(newTeam);
        setMessage('');
    };

    const saveTeam = async () => {
        if (team.length === 0) {
            setMessage('Add at least one Pokemon to your team!');
            return;
        }

        try {
            setLoading(true);
            const teamData = team.map(p => ({
                pokemon: p.pokemon, // This is pokemonId string
                level: p.level,
                nature: p.nature,
                moves: p.moves,
                ability: p.ability,
                heldItem: p.heldItem
            }));

            await updateTeam({ teamPokemon: teamData });
            setMessage('Team saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error saving team:', error);
            setMessage('Error saving team: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const getMoveById = (moveId) => {
        return moves.find(m => m.moveId === moveId || m._id === moveId);
    };

    const getAbilityById = (abilityId) => {
        return abilities.find(a => a.abilityId === abilityId || a._id === abilityId);
    };

    const getItemById = (itemId) => {
        return items.find(i => i.itemId === itemId || i._id === itemId);
    };

    return (
        <div className="teambuilder-container">
            {/* Navigation Bar */}
            <nav className="navbar">
                <h1>Pokémon Team Builder</h1>
                <div className="nav-buttons">
                    <button onClick={() => navigate('/dashboard')}>Home</button>
                    <button onClick={() => navigate('/profile')}>Profile</button>
                </div>
            </nav>

            {loading && <div className="loading">Loading...</div>}
            {message && <div className="message">{message}</div>}

            {/* Search Section */}
            <div className="search-section">
                <h2>Search Pokémon</h2>
                <form onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit">Search</button>
                </form>

                {searchResults.length > 0 && (
                    <div className="search-results">
                        {searchResults.map((pokemon) => (
                            <div key={pokemon.pokemonId} className="pokemon-card">
                                <img 
                                    src={pokemon.sprite}
                                    alt={pokemon.name}
                                    onError={(e) => {
                                        e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemonId.split('_')[1] || '1'}.png`;
                                    }}
                                />
                                <h3>{pokemon.name}</h3>
                                <p>Type: {pokemon.type.join(', ')}</p>
                                <button onClick={() => addPokemonToTeam(pokemon)}>
                                    Add to Team
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Current Team Section */}
            <div className="team-section">
                <div className="team-header">
                    <h2>Your Team ({team.length}/6)</h2>
                    <button 
                        className="save-button" 
                        onClick={saveTeam}
                        disabled={loading || team.length === 0}
                    >
                        Save Team
                    </button>
                </div>

                <div className="team-grid">
                    {team.map((pokemon, index) => (
                        <div key={index} className="team-pokemon">
                            <div className="pokemon-header">
                                <img 
                                    src={pokemon.pokemonData?.sprite}
                                    alt={pokemon.pokemonData?.name}
                                    onError={(e) => {
                                        e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemonData?.pokemonId?.split('_')[1] || '1'}.png`;
                                    }}
                                />
                                <div className="pokemon-info">
                                    <h3>{pokemon.pokemonData?.name}</h3>
                                    <p>Type: {pokemon.pokemonData?.type?.join(', ')}</p>
                                    <p className="base-stats">
                                        HP: {pokemon.pokemonData?.baseStats?.hp} | 
                                        ATK: {pokemon.pokemonData?.baseStats?.attack} | 
                                        DEF: {pokemon.pokemonData?.baseStats?.defense} | 
                                        SP.ATK: {pokemon.pokemonData?.baseStats?.specialAttack} | 
                                        SP.DEF: {pokemon.pokemonData?.baseStats?.specialDefense} | 
                                        SPD: {pokemon.pokemonData?.baseStats?.speed}
                                    </p>
                                </div>
                            </div>

                            <div className="pokemon-config">
                                <div className="config-row">
                                    <label>Level:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={pokemon.level}
                                        onChange={(e) => updatePokemonConfig(index, 'level', parseInt(e.target.value))}
                                    />
                                </div>

                                <div className="config-row">
                                    <label>Nature:</label>
                                    <input
                                        type="text"
                                        value={pokemon.nature}
                                        onChange={(e) => updatePokemonConfig(index, 'nature', e.target.value)}
                                        placeholder="e.g., Adamant, Modest"
                                    />
                                </div>

                                <div className="config-row">
                                    <label>Ability:</label>
                                    <select
                                        value={pokemon.ability}
                                        onChange={(e) => updatePokemonConfig(index, 'ability', e.target.value)}
                                    >
                                        <option value="">Select Ability</option>
                                        {abilities.map((ability) => (
                                            <option key={ability._id || ability.abilityId} value={ability.abilityId || ability._id}>
                                                {ability.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="config-row">
                                    <label>Held Item:</label>
                                    <select
                                        value={pokemon.heldItem}
                                        onChange={(e) => updatePokemonConfig(index, 'heldItem', e.target.value)}
                                    >
                                        <option value="">No Item</option>
                                        {items.map((item) => (
                                            <option key={item._id || item.itemId} value={item.itemId || item._id}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="config-row">
                                    <label>Moves ({pokemon.moves?.length || 0}/4):</label>
                                    <button 
                                        className="toggle-edit-button"
                                        onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                                    >
                                        {editingIndex === index ? 'Close' : 'Edit Moves'}
                                    </button>
                                </div>

                                {editingIndex === index && (
                                    <div className="moves-selector">
                                        {moves.map((move) => {
                                            const moveIdentifier = move.moveId || move._id;
                                            return (
                                                <label key={moveIdentifier} className="move-option">
                                                    <input
                                                        type="checkbox"
                                                        checked={pokemon.moves?.includes(moveIdentifier)}
                                                        onChange={() => toggleMoveSelection(index, moveIdentifier)}
                                                    />
                                                    <span>{move.name} ({move.type}) - Power: {move.power || 'N/A'}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="selected-moves">
                                    <strong>Selected Moves:</strong>
                                    {pokemon.moves?.length > 0 ? (
                                        <ul>
                                            {pokemon.moves.map((moveId) => {
                                                const move = getMoveById(moveId);
                                                return move ? <li key={moveId}>{move.name}</li> : null;
                                            })}
                                        </ul>
                                    ) : (
                                        <p>No moves selected</p>
                                    )}
                                </div>
                            </div>

                            <button 
                                className="remove-button" 
                                onClick={() => removePokemon(index)}
                            >
                                Remove from Team
                            </button>
                        </div>
                    ))}
                </div>

                {team.length === 0 && (
                    <p className="empty-team">Your team is empty. Search for Pokémon to add!</p>
                )}
            </div>
        </div>
    );
};

export default TeamBuilder;