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
  baseDefense: {
    type: Number,
    required: true
  },
  baseSpAttack: {
    type: Number,
    required: true
  },
  baseSpDefense: {
    type: Number,
    required: true
  },
  baseSpeed: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    default: 0
  },
  weight: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  isBanned: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Get full details
pokemonSchema.methods.getDetails = async function() {
  return {
    pokemonId: this.pokemonId,
    name: this.name,
    type: this.type,
    baseStats: {
      hp: this.baseHP,
      atk: this.baseAttack,
      def: this.baseDefense,
      spa: this.baseSpAttack,
      spd: this.baseSpDefense,
      spe: this.baseSpeed
    },
    height: this.height,
    weight: this.weight,
    description: this.description,
    isBanned: this.isBanned
  };
};

// Static method to get all Pokemon
pokemonSchema.statics.getAllPokemon = async function() {
  return this.find().sort({ pokemonId: 1 });
};

// Static method to search by name
pokemonSchema.statics.searchByName = async function(query) {
  return this.find({
    name: { $regex: query, $options: 'i' }
  }).limit(20).sort({ pokemonId: 1 });
};

module.exports = mongoose.model('Pokemon', pokemonSchema);