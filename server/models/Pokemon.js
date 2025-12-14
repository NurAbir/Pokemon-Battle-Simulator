const mongoose = require('mongoose');

const PokemonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // e.g., 'Fire', 'Plant', 'Cosmic'
  rating: { type: String, enum: ['S', 'A', 'B', 'C', 'D'], required: true },
  image: { type: String, default: 'https://img.pokemondb.net/artwork/large/bulbasaur.jpg' },
  moves: [String], // Array of strings like ['Flamethrower', 'Scratch']
  baseStats: {
    hp: { type: Number, default: 100 },
    attack: { type: Number, default: 50 }
  }
});

module.exports = mongoose.model('Pokemon', PokemonSchema);