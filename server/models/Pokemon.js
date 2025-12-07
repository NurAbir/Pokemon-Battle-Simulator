const mongoose = require('mongoose');

const pokemonSchema = new mongoose.Schema({
  pokemonId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: [String],
    required: true
  },
  baseHP: {
    type: Number,
    required: true
  },
  baseAttack: {
    type: Number,
    required: true
  },
  baseSpeed: {
    type: Number,
    required: true
  },
  isBanned: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Get details
pokemonSchema.methods.getDetails = async function() {
  return {
    id: this.pokemonId,
    name: this.name,
    type: this.type,
    stats: {
      hp: this.baseHP,
      attack: this.baseAttack,
      speed: this.baseSpeed
    },
    isBanned: this.isBanned
  };
};

module.exports = mongoose.model('Pokemon', pokemonSchema);