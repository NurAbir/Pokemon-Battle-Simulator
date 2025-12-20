import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/teamBuilder.css';
import PokemonSelector from './PokemonSelector';
import PokemonDetails from './PokemonDetails';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/teams';

export default function TeamBuilder() {
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [selectedPokemonIndex, setSelectedPokemonIndex] = useState(null);
    const [showNewTeamModal, setShowNewTeamModal] = useState(false);
    const [showPokemonSelector, setShowPokemonSelector] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState(''); // ADDED THIS LINE

    // Default pokemon structure
    const defaultPokemon = {
        id: null,
        name: '',
        nickname: '',
        level: 50,
        gender: 'M',
        happiness: 255,
        nature: 'Serious',
        ability: '',
        item: '',
        hiddenPowerType: 'Dark',
        moves: ['', '', '', ''],
        baseStats: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        calculatedStats: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        types: [],
        abilities: [],
        image: ''
    };

    const calculateStat = (base, iv, ev, level, nature, stat, natureName) => {
        if (stat === 'hp') {
            return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
        } else {
            let baseStat = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
            
            const natures = {
                'Lonely': { increased: 'atk', decreased: 'def' },
                'Brave': { increased: 'atk', decreased: 'spe' },
                'Adamant': { increased: 'atk', decreased: 'spa' },
                'Naughty': { increased: 'atk', decreased: 'spd' },
                'Bold': { increased: 'def', decreased: 'atk' },
                'Relaxed': { increased: 'def', decreased: 'spe' },
                'Impish': { increased: 'def', decreased: 'spa' },
                'Lax': { increased: 'def', decreased: 'spd' },
                'Timid': { increased: 'spe', decreased: 'atk' },
                'Hasty': { increased: 'spe', decreased: 'def' },
                'Jolly': { increased: 'spe', decreased: 'spa' },
                'Naive': { increased: 'spe', decreased: 'spd' },
                'Modest': { increased: 'spa', decreased: 'atk' },
                'Mild': { increased: 'spa', decreased: 'def' },
                'Quiet': { increased: 'spa', decreased: 'spe' },
                'Rash': { increased: 'spa', decreased: 'spd' },
                'Calm': { increased: 'spd', decreased: 'atk' },
                'Gentle': { increased: 'spd', decreased: 'def' },
                'Sassy': { increased: 'spd', decreased: 'spe' },
                'Careful': { increased: 'spd', decreased: 'spa' }
            };

            const natureEffect = natures[natureName];
            if (natureEffect) {
                if (natureEffect.increased === stat) {
                    baseStat = Math.floor(baseStat * 1.1);
                } else if (natureEffect.decreased === stat) {
                    baseStat = Math.floor(baseStat * 0.9);
                }
            }
            
            return baseStat;
        }
    };

    const calculateAllStats = (pokemon) => {
        return {
            hp: calculateStat(pokemon.baseStats.hp, pokemon.ivs.hp, pokemon.evs.hp, pokemon.level, 'hp', pokemon.nature),
            atk: calculateStat(pokemon.baseStats.atk, pokemon.ivs.atk, pokemon.evs.atk, pokemon.level, 'atk', pokemon.nature),
            def: calculateStat(pokemon.baseStats.def, pokemon.ivs.def, pokemon.evs.def, pokemon.level, 'def', pokemon.nature),
            spa: calculateStat(pokemon.baseStats.spa, pokemon.ivs.spa, pokemon.evs.spa, pokemon.level, 'spa', pokemon.nature),
            spd: calculateStat(pokemon.baseStats.spd, pokemon.ivs.spd, pokemon.evs.spd, pokemon.level, 'spd', pokemon.nature),
            spe: calculateStat(pokemon.baseStats.spe, pokemon.ivs.spe, pokemon.evs.spe, pokemon.level, 'spe', pokemon.nature)
        };
    };

    // Fetch teams from database
    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeams(response.data);
        } catch (error) {
            console.error('Error fetching teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveTeamToDatabase = async (teamData) => {
        try {
            const token = localStorage.getItem('token');
            if (teamData._id) {
                await axios.put(`${API_URL}/${teamData._id}`, teamData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (error) {
            console.error('Error saving team:', error);
        }
    };

    // ADDED THIS FUNCTION
    const handleManualSave = async () => {
        if (!selectedTeam) return;
        
        try {
            setSaveStatus('saving');
            const currentTeam = teams.find(t => t._id === selectedTeam);
            await saveTeamToDatabase(currentTeam);
            localStorage.setItem('selectedTeamId', selectedTeam);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(''), 2000);
        } catch (error) {
            console.error('Error saving team:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(''), 2000);
        }
    };

    const handleCreateTeam = async () => {
        if (newTeamName.trim()) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.post(API_URL, 
                    { name: newTeamName },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setTeams([...teams, response.data]);
                setSelectedTeam(response.data._id);
                setNewTeamName('');
                setShowNewTeamModal(false);
            } catch (error) {
                console.error('Error creating team:', error);
            }
        }
    };

    const handleDeleteTeam = async (teamId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/${teamId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeams(teams.filter(t => t._id !== teamId));
            if (selectedTeam === teamId) {
                setSelectedTeam(null);
            }
        } catch (error) {
            console.error('Error deleting team:', error);
        }
    };

    const handleSlotClick = (index) => {
        setSelectedPokemonIndex(index);
        const currentTeam = teams.find(t => t._id === selectedTeam);
        if (!currentTeam?.pokemons[index]) {
            setShowPokemonSelector(true);
        }
    };

    const handleAddPokemon = async (pokemon) => {
        if (selectedTeam && selectedPokemonIndex !== null) {
            const updatedTeams = teams.map(t => {
                if (t._id === selectedTeam) {
                    const newPokemons = [...t.pokemons];
                    const newPokemon = { 
                        ...defaultPokemon, 
                        ...pokemon,
                        nickname: pokemon.name
                    };
                    newPokemon.calculatedStats = calculateAllStats(newPokemon);
                    newPokemons[selectedPokemonIndex] = newPokemon;
                    return { ...t, pokemons: newPokemons };
                }
                return t;
            });
            setTeams(updatedTeams);
            const updatedTeam = updatedTeams.find(t => t._id === selectedTeam);
            await saveTeamToDatabase(updatedTeam);
            setShowPokemonSelector(false);
        }
    };

    const handleUpdatePokemon = async (pokemonData) => {
        if (selectedTeam && selectedPokemonIndex !== null) {
            const updatedTeams = teams.map(t => {
                if (t._id === selectedTeam) {
                    const newPokemons = [...t.pokemons];
                    pokemonData.calculatedStats = calculateAllStats(pokemonData);
                    newPokemons[selectedPokemonIndex] = pokemonData;
                    return { ...t, pokemons: newPokemons };
                }
                return t;
            });
            setTeams(updatedTeams);
            const updatedTeam = updatedTeams.find(t => t._id === selectedTeam);
            await saveTeamToDatabase(updatedTeam);
        }
    };

    const handleRemovePokemon = async (index) => {
        const updatedTeams = teams.map(t => {
            if (t._id === selectedTeam) {
                const newPokemons = [...t.pokemons];
                newPokemons[index] = null;
                return { ...t, pokemons: newPokemons };
            }
            return t;
        });
        setTeams(updatedTeams);
        const updatedTeam = updatedTeams.find(t => t._id === selectedTeam);
        await saveTeamToDatabase(updatedTeam);
        setSelectedPokemonIndex(null);
    };

    const currentTeam = teams.find(t => t._id === selectedTeam);
    const selectedPokemon = currentTeam?.pokemons[selectedPokemonIndex];

    return (
        <div className="team-builder-page">
            <Link to="/dashboard" className="home-btn">← Home</Link>

            <div className="team-builder-wrapper">
                {/* Left Sidebar - Teams */}
                <div className="teams-sidebar">
                    <h2>Teams</h2>
                    <button className="btn-create-team" onClick={() => setShowNewTeamModal(true)}>
                        + New Team
                    </button>

                    <div className="teams-list">
                        {loading ? (
                            <p className="no-teams">Loading...</p>
                        ) : teams.length === 0 ? (
                            <p className="no-teams">No teams yet. Create one!</p>
                        ) : (
                            teams.map(team => (
                                <div
                                    key={team._id}
                                    className={`team-item ${selectedTeam === team._id ? 'active' : ''}`}
                                >
                                    <div
                                        className="team-name"
                                        onClick={() => setSelectedTeam(team._id)}
                                    >
                                        {team.name}
                                    </div>
                                    <button
                                        className="btn-delete"
                                        onClick={() => handleDeleteTeam(team._id)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Content */}
                {selectedTeam ? (
                    <div className="team-editor">
                        <h1>{currentTeam?.name}</h1>
                        
                        {/* ADDED SAVE BUTTON */}
                        <button 
                            className={`btn-save-teams ${saveStatus}`}
                            onClick={handleManualSave}
                            disabled={!selectedTeam}
                        >
                            {saveStatus === 'saving' ? 'Saving...' : 
                             saveStatus === 'saved' ? '✓ Saved!' : 
                             saveStatus === 'error' ? '✗ Error' : 
                             'Save Team'}
                        </button>

                        {/* Pokemon List */}
                        <div className="pokemon-list">
                            {currentTeam?.pokemons.map((pokemon, index) => {
                                const stats = pokemon?.calculatedStats;
                                return (
                                    <div
                                        key={index}
                                        className={`pokemon-row ${
                                            selectedPokemonIndex === index ? 'selected' : ''
                                        } ${!pokemon ? 'empty' : ''}`}
                                        onClick={() => handleSlotClick(index)}
                                    >
                                        {pokemon ? (
                                            <>
                                                <div className="pokemon-row-info">
                                                    <span className="ou-label">OU</span>
                                                    <span className="pokemon-name">{pokemon.nickname || pokemon.name}</span>
                                                    {pokemon.gender && pokemon.gender !== 'N' && (
                                                        <span className={`gender ${pokemon.gender === 'M' ? 'male' : 'female'}`}>
                                                            {pokemon.gender === 'M' ? '♂' : '♀'}
                                                        </span>
                                                    )}
                                                    {pokemon.ability && (
                                                        <span className="ability">{pokemon.ability}</span>
                                                    )}
                                                    {pokemon.item && (
                                                        <span className="item">{pokemon.item}</span>
                                                    )}
                                                </div>
                                                <div className="pokemon-row-stats">
                                                    <span>HP {stats?.hp || 0}</span>
                                                    <span>Atk {stats?.atk || 0}</span>
                                                    <span>Def {stats?.def || 0}</span>
                                                    <span>SpA {stats?.spa || 0}</span>
                                                    <span>SpD {stats?.spd || 0}</span>
                                                    <span>Spe {stats?.spe || 0}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <span className="empty-slot">Empty Slot - Click to Add Pokémon</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pokemon Details Editor */}
                        {selectedPokemon ? (
                            <PokemonDetails
                                pokemon={selectedPokemon}
                                onUpdate={handleUpdatePokemon}
                                onRemove={() => handleRemovePokemon(selectedPokemonIndex)}
                            />
                        ) : (
                            <div className="no-selection">
                                <p>Select an empty slot above to add a Pokémon</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="no-team-selected">
                        <p>Create or select a team to get started</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showNewTeamModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Create New Team</h2>
                        <input
                            type="text"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            placeholder="Team name..."
                            onKeyPress={(e) => e.key === 'Enter' && handleCreateTeam()}
                            autoFocus
                        />
                        <div className="modal-buttons">
                            <button className="btn-primary" onClick={handleCreateTeam}>
                                Create
                            </button>
                            <button
                                className="btn-secondary"
                                onClick={() => setShowNewTeamModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPokemonSelector && (
                <PokemonSelector
                    onSelect={handleAddPokemon}
                    onClose={() => setShowPokemonSelector(false)}
                />
            )}
        </div>
    );
}