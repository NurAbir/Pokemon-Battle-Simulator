const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Pokemon = require('../models/Pokemon');

dotenv.config();

const samplePokemon = [
  {
    pokemonId: 'pokemon_1',
    name: 'Bulbasaur',
    type: ['Grass', 'Poison'],
    baseHP: 45,
    baseAttack: 49,
    baseSpeed: 45,
    isBanned: false
  },
  {
    pokemonId: 'pokemon_4',
    name: 'Charmander',
    type: ['Fire'],
    baseHP: 39,
    baseAttack: 52,
    baseSpeed: 65,
    isBanned: false
  },
  {
    pokemonId: 'pokemon_7',
    name: 'Squirtle',
    type: ['Water'],
    baseHP: 44,
    baseAttack: 48,
    baseSpeed: 43,
    isBanned: false
  },
  {
    pokemonId: 'pokemon_25',
    name: 'Pikachu',
    type: ['Electric'],
    baseHP: 35,
    baseAttack: 55,
    baseSpeed: 90,
    isBanned: false
  },
  {
    pokemonId: 'pokemon_94',
    name: 'Gengar',
    type: ['Ghost', 'Poison'],
    baseHP: 60,
    baseAttack: 65,
    baseSpeed: 110,
    isBanned: false
  },
  {
    pokemonId: 'pokemon_6',
    name: 'Charizard',
    type: ['Fire', 'Flying'],
    baseHP: 78,
    baseAttack: 84,
    baseSpeed: 100,
    isBanned: false
  }
];

async function seedPokemon() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing Pokemon
    await Pokemon.deleteMany({});
    console.log('Cleared existing Pokemon');

    // Insert sample Pokemon
    await Pokemon.insertMany(samplePokemon);
    console.log('Sample Pokemon added successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding Pokemon:', error);
    process.exit(1);
  }
}

seedPokemon();

