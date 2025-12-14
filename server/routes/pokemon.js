/* routes/pokemon.js */
const express = require('express');
const router = express.Router();
const Pokemon = require('../models/Pokemon');

// 1. GET All Pokemon
router.get('/', async (req, res) => {
  try {
    const data = await Pokemon.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. POST Add New Pokemon
router.post('/', async (req, res) => {
  try {
    const { name, type, rating, image, moves } = req.body;
    
    // Simple validation
    if (!name || !type || !rating) {
      return res.status(400).json({ message: "Name, Type, and Rating are required" });
    }

    const newPokemon = new Pokemon({
      name,
      type,
      rating,
      image: image || `https://img.pokemondb.net/artwork/large/${name.toLowerCase()}.jpg`, // Fallback to auto-guess URL
      moves: moves ? moves.split(',').map(m => m.trim()) : [] // Handle CSV string input
    });

    const savedPokemon = await newPokemon.save();
    res.status(201).json(savedPokemon);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 3. DELETE Pokemon
router.delete('/:id', async (req, res) => {
  try {
    const result = await Pokemon.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. PUT Update Pokemon (NEW)
router.put('/:id', async (req, res) => {
  try {
    const { name, type, rating, image, moves, baseStats } = req.body;
    
    const updateData = {
        name,
        type,
        rating,
        image,
        // Convert comma-separated string back to array if needed
        moves: Array.isArray(moves) ? moves : (moves ? moves.split(',').map(m => m.trim()) : []),
        baseStats
    };

    const updatedPokemon = await Pokemon.findByIdAndUpdate(
        req.params.id, 
        updateData, 
        { new: true } 
    );

    if (!updatedPokemon) return res.status(404).json({ message: "Entity not found" });
    res.json(updatedPokemon);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 5. GET Random Pokemon
router.get('/random/:count', async (req, res) => {
  try {
    // Default to fetching 3 cards if no count is specified
    const count = parseInt(req.params.count) || 3; 
    
    // Use MongoDB's $sample operator for efficient random selection
    const randomPokemon = await Pokemon.aggregate([{ $sample: { size: count } }]);
    
    if (!randomPokemon || randomPokemon.length === 0) {
      return res.status(404).json({ message: "No Pokemon found in database" });
    }

    res.json(randomPokemon); 
  } catch (err) {
    console.error("Random Pokemon fetch error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;