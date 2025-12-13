const mongoose = require('mongoose');

const teamPokemonSchema = new mongoose.Schema({
  teamPokemonId: {
    type: String,
    required: true,
    unique: true
  },
  teamId: {
    type: String,
    required: true,
    ref: 'Team'
  },
  pokemonId: {
    type: String,
    required: true,
    ref: 'Pokemon'
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    default: 50
  },
  nature: {
    type: String,
    required: true,
    default: 'Hardy'
  },
  currentHP: {
    type: Number,
    required: true
  }
}, { timestamps: true });

// Assign moves (relationship with Move through another collection)
teamPokemonSchema.methods.assignMoves = async function(moveIds) {
  // Logic to assign moves to this Pokémon
  console.log(`Assigning moves ${moveIds} to ${this.teamPokemonId}`);
};

// Ability status
teamPokemonSchema.methods.abilityStatus = async function() {
  // Check ability status
  return { active: true };
};

// Assign items
teamPokemonSchema.methods.assignItems = async function(itemId) {
  // Logic to assign item to this Pokémon
  console.log(`Assigning item ${itemId} to ${this.teamPokemonId}`);
};

module.exports = mongoose.model('TeamPokemon', teamPokemonSchema);
