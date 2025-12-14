const express = require('express');
const router = express.Router();
const Pokemon = require('../models/Pokemon');

// GET /api/pokemon - Search/List Pokemon
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;
        let pokemon;

        if (search) {
            // Use the model's built-in search method
            pokemon = await Pokemon.searchByName(search);
        } else {
            // Get all Pokemon (limited to 50)
            pokemon = await Pokemon.find().limit(50).sort({ pokemonId: 1 });
        }

        // Format response with proper structure including sprite
        const formattedPokemon = pokemon.map(p => ({
            _id: p._id,
            pokemonId: p.pokemonId,
            name: p.name,
            type: p.type,
            baseStats: {
                hp: p.baseHP,
                attack: p.baseAttack,
                defense: p.baseDefense,
                specialAttack: p.baseSpAttack,
                specialDefense: p.baseSpDefense,
                speed: p.baseSpeed
            },
            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${parseInt(p.pokemonId)}.png`,
            height: p.height,
            weight: p.weight,
            description: p.description
        }));

        res.json({ pokemon: formattedPokemon });
    } catch (error) {
        console.error('Error fetching pokemon:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/pokemon/:id - Get single Pokemon by pokemonId or MongoDB _id
router.get('/:id', async (req, res) => {
    try {
        let pokemon;
        
        // Try to find by pokemonId first, then by _id
        if (req.params.id.startsWith('poke_')) {
            pokemon = await Pokemon.findOne({ pokemonId: req.params.id });
        } else {
            pokemon = await Pokemon.findById(req.params.id);
        }
        
        if (!pokemon) {
            return res.status(404).json({ message: 'Pokemon not found' });
        }

        // Format response
        const formattedPokemon = {
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
            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${parseInt(pokemon.pokemonId)}.png`,
            height: pokemon.height,
            weight: pokemon.weight,
            description: pokemon.description
        };

        res.json({ pokemon: formattedPokemon });
    } catch (error) {
        console.error('Error fetching pokemon:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;