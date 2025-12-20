// controllers/teamController.js
const Team = require('../models/Team');
const mongoose = require('mongoose'); // ADD THIS LINE

// Calculate final stats
const calculateStat = (base, iv, ev, level, nature, stat, natureName) => {
    if (stat === 'hp') {
        return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
    } else {
        let baseStat = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
        
        // Nature multipliers
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

// Get all teams for a user
exports.getTeams = async (req, res) => {
    try {
        const teams = await Team.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(teams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create new team
exports.createTeam = async (req, res) => {
    try {
        const team = new Team({
            name: req.body.name,
            teamId: new mongoose.Types.ObjectId(), // ADD THIS LINE - Generates unique teamId
            userId: req.user.id,
            pokemons: Array(6).fill(null)
        });

        const newTeam = await team.save();
        res.status(201).json(newTeam);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update team
exports.updateTeam = async (req, res) => {
    try {
        const team = await Team.findOne({ _id: req.params.id, userId: req.user.id });
        
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        if (req.body.name) team.name = req.body.name;
        
        if (req.body.pokemons) {
            // Calculate stats for each pokemon
            team.pokemons = req.body.pokemons.map(pokemon => {
                if (pokemon && pokemon.baseStats) {
                    pokemon.calculatedStats = calculateAllStats(pokemon);
                }
                return pokemon;
            });
        }

        const updatedTeam = await team.save();
        res.json(updatedTeam);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete team
exports.deleteTeam = async (req, res) => {
    try {
        const team = await Team.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        res.json({ message: 'Team deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single team
exports.getTeam = async (req, res) => {
    try {
        const team = await Team.findOne({ _id: req.params.id, userId: req.user.id });
        
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        res.json(team);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};