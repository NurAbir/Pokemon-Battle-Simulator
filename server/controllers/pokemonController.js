const Pokemon = require('../models/Pokemon');
const Move = require('../models/Move');
const Ability = require('../models/Ability');

// Get all Pokemon with optional search
exports.getAllPokemon = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    
    if (search) {
      query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
    }
    
    const pokemon = await Pokemon.find(query)
      .select('pokemonId name types baseStats')
      .sort({ pokemonId: 1 });
    
    res.status(200).json({
      success: true,
      count: pokemon.length,
      data: pokemon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching Pokemon',
      error: error.message
    });
  }
};

// Get single Pokemon by ID with all details
exports.getPokemonById = async (req, res) => {
  try {
    const pokemon = await Pokemon.findOne({ pokemonId: req.params.id });
    
    if (!pokemon) {
      return res.status(404).json({
        success: false,
        message: 'Pokemon not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: pokemon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching Pokemon',
      error: error.message
    });
  }
};

// Get all moves
exports.getAllMoves = async (req, res) => {
  try {
    const moves = await Move.find()
      .select('moveId name type power accuracy')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: moves.length,
      data: moves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching moves',
      error: error.message
    });
  }
};

// Get all abilities
exports.getAllAbilities = async (req, res) => {
  try {
    const abilities = await Ability.find()
      .select('abilityId name description')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: abilities.length,
      data: abilities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching abilities',
      error: error.message
    });
  }
};