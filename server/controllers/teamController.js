const Team = require('../models/Team');
const TeamPokemon = require('../models/TeamPokemon');
const Pokemon = require('../models/Pokemon');
const generateId = require('../utils/generateId');

// @route   GET /api/team/my-team
exports.getMyTeam = async (req, res) => {
  try {
    // Find user's team
    const team = await Team.findOne({ userId: req.user.userId });
    
    if (!team) {
      return res.status(404).json({
        message: 'No team found'
      });
    }

    // Get all Pokemon in the team
    const teamPokemon = await TeamPokemon.find({ teamId: team.teamId });
    
    // Get Pokemon details for each team member
    const teamPokemonData = await Promise.all(
      teamPokemon.map(async (tp) => {
        const pokemon = await Pokemon.findOne({ pokemonId: tp.pokemonId });
        
        if (!pokemon) {
          return null;
        }

        return {
          pokemon: tp.pokemonId, // Keep the pokemonId as identifier
          pokemonData: {
            _id: pokemon._id,
            pokemonId: pokemon.pokemonId,
            name: pokemon.name,
            type: pokemon.type,
            baseStats: {
              hp: pokemon.baseHP,
              attack: pokemon.baseAttack,
              defense: pokemon.baseDefense,
              specialAttack: pokemon.baseSpAttack,
              specialDefense: pokemon.baseSpDefense,
              speed: pokemon.baseSpeed
            },
            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${parseInt(pokemon.pokemonId)}.png`
          },
          level: tp.level,
          nature: tp.nature,
          moves: tp.moves || [],
          ability: tp.ability || '',
          heldItem: tp.item || ''
        };
      })
    );

    // Filter out any null entries
    const validTeamPokemon = teamPokemonData.filter(p => p !== null);

    res.json({
      team: {
        _id: team._id,
        teamId: team.teamId,
        name: team.name,
        teamPokemon: validTeamPokemon
      }
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ 
      message: error.message 
    });
  }
};

// @route   POST /api/team/create
exports.createTeam = async (req, res) => {
  try {
    const { name, teamPokemon } = req.body;
    
    // Check if user already has a team
    let team = await Team.findOne({ userId: req.user.userId });
    
    if (team) {
      // If team exists, update it instead
      return exports.updateTeam(req, res);
    }

    // Create new team
    const teamId = generateId('team');
    
    team = await Team.create({
      teamId,
      userId: req.user.userId,
      name: name || 'My Team'
    });

    // Add Pokemon to team if provided
    if (teamPokemon && Array.isArray(teamPokemon)) {
      for (let i = 0; i < teamPokemon.length && i < 6; i++) {
        const pokemonData = teamPokemon[i];
        
        // Get the Pokemon to find baseHP for currentHP
        const pokemon = await Pokemon.findOne({ pokemonId: pokemonData.pokemon });
        
        if (pokemon) {
          await TeamPokemon.create({
            teamPokemonId: generateId('teampoke'),
            teamId: team.teamId,
            pokemonId: pokemonData.pokemon,
            level: pokemonData.level || 50,
            nature: pokemonData.nature || 'Hardy',
            currentHP: pokemon.baseHP,
            ability: pokemonData.ability || null,
            item: pokemonData.heldItem || null,
            moves: pokemonData.moves || []
          });
        }
      }
    }

    res.status(201).json({
      message: 'Team created successfully',
      team: {
        teamId: team.teamId,
        name: team.name
      }
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ 
      message: error.message 
    });
  }
};

// @route   PUT /api/team/update
exports.updateTeam = async (req, res) => {
  try {
    const { name, teamPokemon } = req.body;
    
    // Find or create team
    let team = await Team.findOne({ userId: req.user.userId });
    
    if (!team) {
      // Create new team if doesn't exist
      const teamId = generateId('team');
      team = await Team.create({
        teamId,
        userId: req.user.userId,
        name: name || 'My Team'
      });
    } else if (name) {
      // Update team name if provided
      team.name = name;
      await team.save();
    }

    // Update Pokemon if provided
    if (teamPokemon && Array.isArray(teamPokemon)) {
      // Validate team size
      if (teamPokemon.length > 6) {
        return res.status(400).json({ 
          message: 'Team cannot exceed 6 Pokemon' 
        });
      }

      // Remove old Pokemon
      await TeamPokemon.deleteMany({ teamId: team.teamId });
      
      // Add new Pokemon
      for (let i = 0; i < teamPokemon.length; i++) {
        const pokemonData = teamPokemon[i];
        
        // Get the Pokemon to find baseHP for currentHP
        const pokemon = await Pokemon.findOne({ pokemonId: pokemonData.pokemon });
        
        if (!pokemon) {
          console.log(`Pokemon not found: ${pokemonData.pokemon}`);
          continue;
        }

        // Validate moves (max 4)
        const moves = pokemonData.moves || [];
        if (moves.length > 4) {
          return res.status(400).json({ 
            message: 'Maximum 4 moves per Pokemon' 
          });
        }

        await TeamPokemon.create({
          teamPokemonId: generateId('teampoke'),
          teamId: team.teamId,
          pokemonId: pokemon.pokemonId,
          level: pokemonData.level || 50,
          nature: pokemonData.nature || 'Hardy',
          currentHP: pokemon.baseHP,
          ability: pokemonData.ability || null,
          item: pokemonData.heldItem || null,
          moves: moves
        });
      }
    }

    res.json({
      message: 'Team updated successfully',
      team: {
        teamId: team.teamId,
        name: team.name
      }
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ 
      message: error.message 
    });
  }
};