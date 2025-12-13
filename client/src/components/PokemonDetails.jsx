import React, { useState, useEffect } from 'react';

export default function PokemonDetails({ pokemon, onUpdate, onRemove }) {
    const [data, setData] = useState(pokemon);
    const [totalEVs, setTotalEVs] = useState(0);
    const [evError, setEvError] = useState('');
    const [natures, setNatures] = useState([]);
    const [moves, setMoves] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [calculatedStats, setCalculatedStats] = useState({});

    const MAX_EV_PER_STAT = 252;
    const MAX_TOTAL_EV = 510;

    const hiddenPowerTypes = [
        'Fighting', 'Flying', 'Poison', 'Ground', 'Rock', 'Bug',
        'Ghost', 'Steel', 'Fire', 'Water', 'Grass', 'Electric',
        'Psychic', 'Ice', 'Dragon', 'Dark'
    ];

    // Nature effects
    const natureEffects = {
        'Hardy': { plus: null, minus: null },
        'Lonely': { plus: 'atk', minus: 'def' },
        'Brave': { plus: 'atk', minus: 'spe' },
        'Adamant': { plus: 'atk', minus: 'spa' },
        'Naughty': { plus: 'atk', minus: 'spd' },
        'Bold': { plus: 'def', minus: 'atk' },
        'Docile': { plus: null, minus: null },
        'Relaxed': { plus: 'def', minus: 'spe' },
        'Impish': { plus: 'def', minus: 'spa' },
        'Lax': { plus: 'def', minus: 'spd' },
        'Timid': { plus: 'spe', minus: 'atk' },
        'Hasty': { plus: 'spe', minus: 'def' },
        'Serious': { plus: null, minus: null },
        'Jolly': { plus: 'spe', minus: 'spa' },
        'Naive': { plus: 'spe', minus: 'spd' },
        'Modest': { plus: 'spa', minus: 'atk' },
        'Mild': { plus: 'spa', minus: 'def' },
        'Quiet': { plus: 'spa', minus: 'spe' },
        'Bashful': { plus: null, minus: null },
        'Rash': { plus: 'spa', minus: 'spd' },
        'Calm': { plus: 'spd', minus: 'atk' },
        'Gentle': { plus: 'spd', minus: 'def' },
        'Sassy': { plus: 'spd', minus: 'spe' },
        'Careful': { plus: 'spd', minus: 'spa' },
        'Quirky': { plus: null, minus: null }
    };

    useEffect(() => {
        fetchGameData();
    }, []);

    useEffect(() => {
        const total = Object.values(data.evs).reduce((a, b) => a + b, 0);
        setTotalEVs(total);
        
        if (total > MAX_TOTAL_EV) {
            setEvError(`Total EVs exceed limit! Max: ${MAX_TOTAL_EV}, Current: ${total}`);
        } else {
            setEvError('');
        }
    }, [data.evs]);

    useEffect(() => {
        calculateStats();
    }, [data.level, data.evs, data.ivs, data.nature, data.baseStats]);

    const calculateStats = () => {
        const level = data.level || 50;
        const nature = natureEffects[data.nature] || { plus: null, minus: null };
        const stats = {};

        // HP calculation
        stats.hp = Math.floor(((2 * data.baseStats.hp + data.ivs.hp + Math.floor(data.evs.hp / 4)) * level) / 100) + level + 10;

        // Other stats calculation
        ['atk', 'def', 'spa', 'spd', 'spe'].forEach(stat => {
            let baseStat = Math.floor(((2 * data.baseStats[stat] + data.ivs[stat] + Math.floor(data.evs[stat] / 4)) * level) / 100) + 5;
            
            // Apply nature modifier
            if (nature.plus === stat) {
                baseStat = Math.floor(baseStat * 1.1);
            } else if (nature.minus === stat) {
                baseStat = Math.floor(baseStat * 0.9);
            }
            
            stats[stat] = baseStat;
        });

        setCalculatedStats(stats);
    };

    const fetchGameData = async () => {
        try {
            setLoading(true);

            // Fetch natures
            const naturesResponse = await fetch('https://pokeapi.co/api/v2/nature?limit=25');
            const naturesData = await naturesResponse.json();
            const naturesNames = naturesData.results.map(n => 
                n.name.charAt(0).toUpperCase() + n.name.slice(1)
            );
            setNatures(naturesNames);

            // Fetch moves (first 100)
            const movesResponse = await fetch('https://pokeapi.co/api/v2/move?limit=100');
            const movesData = await movesResponse.json();
            const movesNames = movesData.results.map(m => 
                m.name.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')
            );
            setMoves(movesNames);

            // Fetch items (first 100)
            const itemsResponse = await fetch('https://pokeapi.co/api/v2/item?limit=100');
            const itemsData = await itemsResponse.json();
            const itemsNames = itemsData.results.map(i => 
                i.name.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')
            );
            setItems(itemsNames);

            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch game data:', err);
            setNatures(['Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty']);
            setMoves(['Tackle', 'Scratch', 'Pound']);
            setItems(['Potion', 'Pokeball']);
            setLoading(false);
        }
    };

    const handleNicknameChange = (value) => {
        const updated = { ...data, nickname: value };
        setData(updated);
        onUpdate(updated);
    };

    const handleLevelChange = (value) => {
        const level = Math.min(Math.max(parseInt(value) || 1, 1), 100);
        const updated = { ...data, level };
        setData(updated);
        onUpdate(updated);
    };

    const handleGenderChange = (value) => {
        const updated = { ...data, gender: value };
        setData(updated);
        onUpdate(updated);
    };

    const handleHappinessChange = (value) => {
        const happiness = Math.min(Math.max(parseInt(value) || 0, 0), 255);
        const updated = { ...data, happiness };
        setData(updated);
        onUpdate(updated);
    };

    const handleNatureChange = (value) => {
        const updated = { ...data, nature: value };
        setData(updated);
        onUpdate(updated);
    };

    const handleAbilityChange = (value) => {
        const updated = { ...data, ability: value };
        setData(updated);
        onUpdate(updated);
    };

    const handleItemChange = (value) => {
        const updated = { ...data, item: value };
        setData(updated);
        onUpdate(updated);
    };

    const handleHiddenPowerChange = (value) => {
        const updated = { ...data, hiddenPowerType: value };
        setData(updated);
        onUpdate(updated);
    };

    const handleMoveChange = (index, value) => {
        const updated = { ...data, moves: [...data.moves] };
        updated.moves[index] = value;
        setData(updated);
        onUpdate(updated);
    };

    const handleEVChange = (stat, value) => {
        let newValue = parseInt(value) || 0;
        
        newValue = Math.min(Math.max(newValue, 0), MAX_EV_PER_STAT);
        
        const otherStats = Object.keys(data.evs)
            .filter(s => s !== stat)
            .reduce((sum, s) => sum + data.evs[s], 0);
        
        const newTotal = otherStats + newValue;
        
        if (newTotal > MAX_TOTAL_EV) {
            newValue = MAX_TOTAL_EV - otherStats;
            setEvError(`Cannot exceed total limit of ${MAX_TOTAL_EV} EVs!`);
        } else {
            setEvError('');
        }

        const updated = { ...data, evs: { ...data.evs, [stat]: newValue } };
        setData(updated);
        onUpdate(updated);
    };

    const handleIVChange = (stat, value) => {
        const newValue = Math.min(Math.max(parseInt(value) || 0, 0), 31);
        const updated = { ...data, ivs: { ...data.ivs, [stat]: newValue } };
        setData(updated);
        onUpdate(updated);
    };

    const applyEVSpread = (spread) => {
        const updated = { 
            ...data, 
            evs: { 
                hp: spread.hp || 0,
                atk: spread.atk || 0,
                def: spread.def || 0,
                spa: spread.spa || 0,
                spd: spread.spd || 0,
                spe: spread.spe || 0
            } 
        };
        setData(updated);
        onUpdate(updated);
    };

    const commonSpreads = [
        { name: '252 Atk / 252 Spe / 4 HP', spread: { atk: 252, spe: 252, hp: 4, def: 0, spa: 0, spd: 0 } },
        { name: '252 SpA / 252 Spe / 4 HP', spread: { spa: 252, spe: 252, hp: 4, def: 0, atk: 0, spd: 0 } },
        { name: '252 HP / 252 Def / 4 SpD', spread: { hp: 252, def: 252, spd: 4, atk: 0, spa: 0, spe: 0 } },
        { name: '252 HP / 252 SpD / 4 Def', spread: { hp: 252, spd: 252, def: 4, atk: 0, spa: 0, spe: 0 } },
        { name: 'Balanced 85/85/85/85/85/85', spread: { hp: 85, atk: 85, def: 85, spa: 85, spd: 85, spe: 85 } },
        { name: 'Clear EVs', spread: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } }
    ];

    const getNatureModifier = (stat) => {
        const nature = natureEffects[data.nature] || { plus: null, minus: null };
        if (nature.plus === stat) return ' ↑';
        if (nature.minus === stat) return ' ↓';
        return '';
    };

    if (loading) {
        return (
            <div className="pokemon-details-container">
                <div className="loading-message">
                    <p>Loading Pokemon data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pokemon-details-container">
            {/* Top Section - Pokemon Info */}
            <div className="pokemon-info-section">
                <div className="pokemon-header-section">
                    {data.image && (
                        <img src={data.image} alt={data.name} className="pokemon-detail-image" />
                    )}
                    <div className="pokemon-types-display">
                        {data.types && data.types.map(type => (
                            <span key={type} className={`type ${type.toLowerCase()}`}>
                                {type}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="nickname-box">
                    <label>Nickname</label>
                    <input
                        type="text"
                        value={data.nickname}
                        onChange={(e) => handleNicknameChange(e.target.value)}
                        placeholder={data.name}
                    />
                </div>

                <div className="details-grid">
                    <div className="detail-box">
                        <label>Details</label>
                        <div className="detail-inputs">
                            <div className="input-row">
                                <label>Level</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={data.level}
                                    onChange={(e) => handleLevelChange(e.target.value)}
                                />
                            </div>
                            <div className="input-row">
                                <label>Happiness</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="255"
                                    value={data.happiness}
                                    onChange={(e) => handleHappinessChange(e.target.value)}
                                />
                            </div>
                            <div className="input-row">
                                <label>Gender</label>
                                <select value={data.gender} onChange={(e) => handleGenderChange(e.target.value)}>
                                    <option value="M">Male ♂</option>
                                    <option value="F">Female ♀</option>
                                    <option value="N">Genderless</option>
                                </select>
                            </div>
                            <div className="input-row">
                                <label>Hidden Power</label>
                                <select value={data.hiddenPowerType} onChange={(e) => handleHiddenPowerChange(e.target.value)}>
                                    {hiddenPowerTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="detail-box">
                        <label>Moves</label>
                        <div className="moves-inputs">
                            {data.moves.map((move, index) => (
                                <div key={index} className="move-input">
                                    <select value={move} onChange={(e) => handleMoveChange(index, e.target.value)}>
                                        <option value="">- Select Move -</option>
                                        {moves.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="detail-box">
                        <label>Stats</label>
                        <div className="stats-display">
                            <div className="stat-bar">
                                <label>HP</label>
                                <div className="stat-bar-fill" style={{ width: `${Math.min((calculatedStats.hp / 300) * 100, 100)}%` }}>
                                    {calculatedStats.hp || 0}
                                </div>
                            </div>
                            <div className="stat-bar">
                                <label>Atk{getNatureModifier('atk')}</label>
                                <div className="stat-bar-fill" style={{ width: `${Math.min((calculatedStats.atk / 300) * 100, 100)}%` }}>
                                    {calculatedStats.atk || 0}
                                </div>
                            </div>
                            <div className="stat-bar">
                                <label>Def{getNatureModifier('def')}</label>
                                <div className="stat-bar-fill" style={{ width: `${Math.min((calculatedStats.def / 300) * 100, 100)}%` }}>
                                    {calculatedStats.def || 0}
                                </div>
                            </div>
                            <div className="stat-bar">
                                <label>SpA{getNatureModifier('spa')}</label>
                                <div className="stat-bar-fill" style={{ width: `${Math.min((calculatedStats.spa / 300) * 100, 100)}%` }}>
                                    {calculatedStats.spa || 0}
                                </div>
                            </div>
                            <div className="stat-bar">
                                <label>SpD{getNatureModifier('spd')}</label>
                                <div className="stat-bar-fill" style={{ width: `${Math.min((calculatedStats.spd / 300) * 100, 100)}%` }}>
                                    {calculatedStats.spd || 0}
                                </div>
                            </div>
                            <div className="stat-bar">
                                <label>Spe{getNatureModifier('spe')}</label>
                                <div className="stat-bar-fill" style={{ width: `${Math.min((calculatedStats.spe / 300) * 100, 100)}%` }}>
                                    {calculatedStats.spe || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="details-grid">
                    <div className="detail-box">
                        <label>Pokémon</label>
                        <input type="text" value={data.name} disabled />
                    </div>

                    <div className="detail-box">
                        <label>Item</label>
                        <select value={data.item} onChange={(e) => handleItemChange(e.target.value)}>
                            <option value="">- No Item -</option>
                            {items.map(item => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>

                    <div className="detail-box">
                        <label>Ability</label>
                        <select value={data.ability} onChange={(e) => handleAbilityChange(e.target.value)}>
                            <option value="">- Select Ability -</option>
                            {data.abilities && data.abilities.map(ability => (
                                <option key={ability} value={ability}>{ability}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* EV and Stats Section */}
            <div className="ev-stats-section">
                <div className="base-stats">
                    <h3>Base Stats</h3>
                    <div className="stats-list">
                        <div className="stat-item">
                            <label>HP</label>
                            <span>{data.baseStats.hp}</span>
                        </div>
                        <div className="stat-item">
                            <label>Atk</label>
                            <span>{data.baseStats.atk}</span>
                        </div>
                        <div className="stat-item">
                            <label>Def</label>
                            <span>{data.baseStats.def}</span>
                        </div>
                        <div className="stat-item">
                            <label>SpA</label>
                            <span>{data.baseStats.spa}</span>
                        </div>
                        <div className="stat-item">
                            <label>SpD</label>
                            <span>{data.baseStats.spd}</span>
                        </div>
                        <div className="stat-item">
                            <label>Spe</label>
                            <span>{data.baseStats.spe}</span>
                        </div>
                    </div>
                </div>

                <div className="evs-section">
                    <h3>EVs (Max: {MAX_TOTAL_EV})</h3>
                    
                    <div className="common-spreads">
                        <label>Quick Spreads:</label>
                        <div className="spreads-buttons">
                            {commonSpreads.map(spread => (
                                <button
                                    key={spread.name}
                                    className="spread-btn"
                                    onClick={() => applyEVSpread(spread.spread)}
                                    title={spread.name}
                                >
                                    {spread.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="ev-inputs">
                        {['hp', 'atk', 'def', 'spa', 'spd', 'spe'].map(stat => (
                            <div key={stat} className="ev-row">
                                <label>{stat.toUpperCase()}</label>
                                <input
                                    type="number"
                                    min="0"
                                    max={MAX_EV_PER_STAT}
                                    value={data.evs[stat]}
                                    onChange={(e) => handleEVChange(stat, e.target.value)}
                                    className={data.evs[stat] === MAX_EV_PER_STAT ? 'maxed' : ''}
                                />
                                <div className="ev-slider">
                                    <input
                                        type="range"
                                        min="0"
                                        max={MAX_EV_PER_STAT}
                                        value={data.evs[stat]}
                                        onChange={(e) => handleEVChange(stat, e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={`ev-remaining ${evError ? 'error' : totalEVs === MAX_TOTAL_EV ? 'maxed' : ''}`}>
                        <div>Total: <strong>{totalEVs}</strong> / {MAX_TOTAL_EV}</div>
                        <div>Remaining: <strong>{MAX_TOTAL_EV - totalEVs}</strong></div>
                        {evError && <div className="error-message">{evError}</div>}
                    </div>

                    <div className="ev-bar">
                        <div className="ev-bar-fill" style={{ width: `${(totalEVs / MAX_TOTAL_EV) * 100}%` }}>
                            {totalEVs > 0 && `${Math.round((totalEVs / MAX_TOTAL_EV) * 100)}%`}
                        </div>
                    </div>
                </div>

                <div className="ivs-section">
                    <h3>IVs (Max: 31)</h3>
                    <div className="iv-inputs">
                        {['hp', 'atk', 'def', 'spa', 'spd', 'spe'].map(stat => (
                            <div key={stat} className="iv-row">
                                <label>{stat.toUpperCase()}</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="31"
                                    value={data.ivs[stat]}
                                    onChange={(e) => handleIVChange(stat, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="nature-section">
                    <label>Nature:</label>
                    <select value={data.nature} onChange={(e) => handleNatureChange(e.target.value)}>
                        {natures.map(nature => (
                            <option key={nature} value={nature}>{nature}</option>
                        ))}
                    </select>
                </div>

                <button className="btn-remove" onClick={onRemove}>
                    Remove Pokémon
                </button>
            </div>
        </div>
    );
}