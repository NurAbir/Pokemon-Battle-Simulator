const Team = require('../models/Team');
const TeamPokemon = require('../models/TeamPokemon');
const Pokemon = require('../models/Pokemon');

// @route   GET /api/team/my-team
exports.getMyTeam = async (req, res) => {
  try {
    // Find user's team
    const team = await Team.findOne({ userId: req.user.userId });
    
    if (!team) {
      return res.json({
        success: true,
        data: {
          teamId: null,
          name: 'No Team',
          pokemon: []
        }
      });
    }

    // Get all Pokemon in the team
    const teamPokemon = await TeamPokemon.find({ teamId: team.teamId });
    
    // Get Pokemon details for each team member
    const pokemonDetails = await Promise.all(
      teamPokemon.map(async (tp) => {
        const pokemon = await Pokemon.findOne({ pokemonId: tp.pokemonId });
        return {
          teamPokemonId: tp.teamPokemonId,
          level: tp.level,
          nature: tp.nature,
          currentHP: tp.currentHP,
          pokemon: {
            pokemonId: pokemon?.pokemonId,
            name: pokemon?.name || 'Unknown',
            type: pokemon?.type || [],
            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon?.pokemonId?.split('_')[1] || '1'}.png`
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        teamId: team.teamId,
        name: team.name,
        pokemon: pokemonDetails
      }
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @route   POST /api/team/create
exports.createTeam = async (req, res) => {
  try {
    const { name, pokemonIds } = req.body;
    
    // Create team
    const generateId = require('../utils/generateId');
    const teamId = generateId('team');
    
    const team = await Team.create({
      teamId,
      userId: req.user.userId,
      name: name || 'My Team'
    });

    // Add Pokemon to team if provided
    if (pokemonIds && pokemonIds.length > 0) {
      for (let i = 0; i < pokemonIds.length && i < 6; i++) {
        const pokemon = await Pokemon.findOne({ pokemonId: pokemonIds[i] });
        if (pokemon) {
          await TeamPokemon.create({
            teamPokemonId: generateId('teampoke'),
            teamId: team.teamId,
            pokemonId: pokemon.pokemonId,
            level: 50,
            nature: 'Hardy',
            currentHP: pokemon.baseHP
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @route   PUT /api/team/update
exports.updateTeam = async (req, res) => {
  try {
    const { teamId, name, pokemonIds } = req.body;
    
    const team = await Team.findOne({ teamId, userId: req.user.userId });
    
    if (!team) {
      return res.status(404).json({ 
        success: false,
        message: 'Team not found' 
      });
    }

    if (name) {
      team.name = name;
      await team.save();
    }

    if (pokemonIds) {
      // Remove old Pokemon
      await TeamPokemon.deleteMany({ teamId: team.teamId });
      
      // Add new Pokemon
      const generateId = require('../utils/generateId');
      for (let i = 0; i < pokemonIds.length && i < 6; i++) {
        const pokemon = await Pokemon.findOne({ pokemonId: pokemonIds[i] });
        if (pokemon) {
          await TeamPokemon.create({
            teamPokemonId: generateId('teampoke'),
            teamId: team.teamId,
            pokemonId: pokemon.pokemonId,
            level: 50,
            nature: 'Hardy',
            currentHP: pokemon.baseHP
          });
        }
      }
    }

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

