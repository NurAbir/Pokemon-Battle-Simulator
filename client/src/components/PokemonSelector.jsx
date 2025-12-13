import React, { useState, useEffect } from 'react';

export default function PokemonSelector({ onSelect, onClose }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [pokemons, setPokemons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPokemons();
    }, []);

    const fetchPokemons = async () => {
        try {
            setLoading(true);
            // Fetch list of first 151 Pokémon
            const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
            const data = await response.json();
            
            // Fetch detailed data for each Pokémon
            const pokemonDetails = await Promise.all(
                data.results.map(async (pokemon) => {
                    const detailResponse = await fetch(pokemon.url);
                    const detail = await detailResponse.json();
                    
                    return {
                        id: detail.id,
                        name: detail.name.charAt(0).toUpperCase() + detail.name.slice(1),
                        types: detail.types.map(t => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)),
                        image: detail.sprites.other['official-artwork'].front_default || detail.sprites.front_default,
                        baseStats: {
                            hp: detail.stats[0].base_stat,
                            atk: detail.stats[1].base_stat,
                            def: detail.stats[2].base_stat,
                            spa: detail.stats[3].base_stat,
                            spd: detail.stats[4].base_stat,
                            spe: detail.stats[5].base_stat
                        },
                        abilities: detail.abilities.map(a => 
                            a.ability.name.split('-').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')
                        ),
                        moves: detail.moves.slice(0, 4).map(m => 
                            m.move.name.split('-').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')
                        )
                    };
                })
            );
            
            setPokemons(pokemonDetails);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch Pokémon data');
            setLoading(false);
        }
    };

    const filteredPokemons = pokemons.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="modal-overlay">
            <div className="modal pokemon-selector-modal">
                <h2>Select Pokémon</h2>
                <input
                    type="text"
                    placeholder="Search Pokémon..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />

                {loading && (
                    <div className="loading-message">
                        <p>Loading Pokémon data...</p>
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        <p>{error}</p>
                        <button onClick={fetchPokemons}>Retry</button>
                    </div>
                )}

                {!loading && !error && (
                    <div className="pokemon-selection-grid">
                        {filteredPokemons.map(pokemon => (
                            <div
                                key={pokemon.id}
                                className={`pokemon-selection-card ${selectedPokemon?.id === pokemon.id ? 'selected' : ''}`}
                                onClick={() => setSelectedPokemon(pokemon)}
                            >
                                <img 
                                    src={pokemon.image} 
                                    alt={pokemon.name}
                                    className="pokemon-image"
                                />
                                <h4>{pokemon.name}</h4>
                                <p className="types">
                                    {pokemon.types.map(type => (
                                        <span key={type} className={`type ${type.toLowerCase()}`}>
                                            {type}
                                        </span>
                                    ))}
                                </p>
                                <p className="abilities">
                                    <strong>Abilities:</strong> {pokemon.abilities.join(', ')}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && !error && filteredPokemons.length === 0 && (
                    <div className="no-results">
                        <p>No Pokémon found matching "{searchTerm}"</p>
                    </div>
                )}

                <div className="modal-buttons">
                    <button
                        className="btn-primary"
                        onClick={() => selectedPokemon && onSelect(selectedPokemon)}
                        disabled={!selectedPokemon}
                    >
                        Select
                    </button>
                    <button className="btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}