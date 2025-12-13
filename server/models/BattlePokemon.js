const mongoose = require('mongoose');

const battlePokemonSchema = new mongoose.Schema({
  battlePokemonId: {
    type: String,
    required: true,
    unique: true
  },
  battleId: {
    type: String,
    required: true,
    ref: 'Battle'
  },
  teamPokemonId: {
    type: String,
    required: true,
    ref: 'TeamPokemon'
  },
  currentHP: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['healthy', 'paralyzed', 'burned', 'poisoned', 'frozen', 'asleep', 'fainted'],
    default: 'healthy'
  },
  isActive: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Take damage
battlePokemonSchema.methods.takeDamage = async function(damage) {
  this.currentHP = Math.max(0, this.currentHP - damage);
  if (this.currentHP === 0) {
    this.status = 'fainted';
    this.isActive = false;
  }
  await this.save();
};

// Use move
battlePokemonSchema.methods.useMove = async function(moveId, targetPokemonId) {
  const Move = mongoose.model('Move');
  const move = await Move.findOne({ moveId });
  
  if (!move) {
    throw new Error('Move not found');
  }
  
  // Calculate damage and apply effects
  const damage = move.power; // Simplified damage calculation
  const targetPokemon = await this.constructor.findOne({ battlePokemonId: targetPokemonId });
  
  if (targetPokemon) {
    await targetPokemon.takeDamage(damage);
  }
  
  return { moveUsed: move.name, damage };
};

// Apply status
battlePokemonSchema.methods.applyStatus = async function(statusEffect) {
  this.status = statusEffect;
  await this.save();
};

// Restore HP
battlePokemonSchema.methods.restoreHP = async function(amount) {
  const TeamPokemon = mongoose.model('TeamPokemon');
  const teamPokemon = await TeamPokemon.findOne({ teamPokemonId: this.teamPokemonId });
  const Pokemon = mongoose.model('Pokemon');
  const pokemon = await Pokemon.findOne({ pokemonId: teamPokemon.pokemonId });
  
  this.currentHP = Math.min(pokemon.baseHP, this.currentHP + amount);
  await this.save();
};

module.exports = mongoose.model('BattlePokemon', battlePokemonSchema);

