import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/teamBuilder.css';
import PokemonSelector from './PokemonSelector';
import PokemonDetails from './PokemonDetails';

export default function TeamBuilder() {
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [selectedPokemonIndex, setSelectedPokemonIndex] = useState(null);
    const [showNewTeamModal, setShowNewTeamModal] = useState(false);
    const [showPokemonSelector, setShowPokemonSelector] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');

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
        types: [],
        abilities: [],
        image: ''
    };

    const calculateStat = (base, iv, ev, level, nature, stat) => {
        if (stat === 'hp') {
            return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
        } else {
            let baseStat = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
            // Apply nature (simplified - you can add full nature logic)
            return baseStat;
        }
    };

    const handleCreateTeam = () => {
        if (newTeamName.trim()) {
            const newTeam = {
                id: Math.max(...teams.map(t => t.id), 0) + 1,
                name: newTeamName,
                pokemons: Array(6).fill(null)
            };
            setTeams([...teams, newTeam]);
            setSelectedTeam(newTeam.id);
            setNewTeamName('');
            setShowNewTeamModal(false);
        }
    };

    const handleDeleteTeam = (teamId) => {
        setTeams(teams.filter(t => t.id !== teamId));
        if (selectedTeam === teamId) {
            setSelectedTeam(null);
        }
    };

    const handleSlotClick = (index) => {
        setSelectedPokemonIndex(index);
        const currentTeam = teams.find(t => t.id === selectedTeam);
        if (!currentTeam?.pokemons[index]) {
            setShowPokemonSelector(true);
        }
    };

    const handleAddPokemon = (pokemon) => {
        if (selectedTeam && selectedPokemonIndex !== null) {
            const updatedTeams = teams.map(t => {
                if (t.id === selectedTeam) {
                    const newPokemons = [...t.pokemons];
                    newPokemons[selectedPokemonIndex] = { 
                        ...defaultPokemon, 
                        ...pokemon,
                        nickname: pokemon.name
                    };
                    return { ...t, pokemons: newPokemons };
                }
                return t;
            });
            setTeams(updatedTeams);
            setShowPokemonSelector(false);
        }
    };

    const handleUpdatePokemon = (pokemonData) => {
        if (selectedTeam && selectedPokemonIndex !== null) {
            const updatedTeams = teams.map(t => {
                if (t.id === selectedTeam) {
                    const newPokemons = [...t.pokemons];
                    newPokemons[selectedPokemonIndex] = pokemonData;
                    return { ...t, pokemons: newPokemons };
                }
                return t;
            });
            setTeams(updatedTeams);
        }
    };

    const handleRemovePokemon = (index) => {
        const updatedTeams = teams.map(t => {
            if (t.id === selectedTeam) {
                const newPokemons = [...t.pokemons];
                newPokemons[index] = null;
                return { ...t, pokemons: newPokemons };
            }
            return t;
        });
        setTeams(updatedTeams);
        setSelectedPokemonIndex(null);
    };

    const currentTeam = teams.find(t => t.id === selectedTeam);
    const selectedPokemon = currentTeam?.pokemons[selectedPokemonIndex];

    const getCalculatedStats = (pokemon) => {
        if (!pokemon || !pokemon.baseStats) return { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
        
        return {
            hp: calculateStat(pokemon.baseStats.hp, pokemon.ivs.hp, pokemon.evs.hp, pokemon.level, pokemon.nature, 'hp'),
            atk: calculateStat(pokemon.baseStats.atk, pokemon.ivs.atk, pokemon.evs.atk, pokemon.level, pokemon.nature, 'atk'),
            def: calculateStat(pokemon.baseStats.def, pokemon.ivs.def, pokemon.evs.def, pokemon.level, pokemon.nature, 'def'),
            spa: calculateStat(pokemon.baseStats.spa, pokemon.ivs.spa, pokemon.evs.spa, pokemon.level, pokemon.nature, 'spa'),
            spd: calculateStat(pokemon.baseStats.spd, pokemon.ivs.spd, pokemon.evs.spd, pokemon.level, pokemon.nature, 'spd'),
            spe: calculateStat(pokemon.baseStats.spe, pokemon.ivs.spe, pokemon.evs.spe, pokemon.level, pokemon.nature, 'spe')
        };
    };

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
                        {teams.length === 0 ? (
                            <p className="no-teams">No teams yet. Create one!</p>
                        ) : (
                            teams.map(team => (
                                <div
                                    key={team.id}
                                    className={`team-item ${selectedTeam === team.id ? 'active' : ''}`}
                                >
                                    <div
                                        className="team-name"
                                        onClick={() => setSelectedTeam(team.id)}
                                    >
                                        {team.name}
                                    </div>
                                    <button
                                        className="btn-delete"
                                        onClick={() => handleDeleteTeam(team.id)}
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

                        {/* Pokemon List */}
                        <div className="pokemon-list">
                            {currentTeam?.pokemons.map((pokemon, index) => {
                                const stats = pokemon ? getCalculatedStats(pokemon) : null;
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