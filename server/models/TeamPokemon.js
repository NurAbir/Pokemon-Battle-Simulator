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
  },
  ability: {
    type: String,
    default: null
  },
  item: {
    type: String,
    ref: 'Item',
    default: null
  },
  moves: [{
    type: String,
    ref: 'Move'
  }],
  evs: {
    hp: { type: Number, default: 0 },
    attack: { type: Number, default: 0 },
    defense: { type: Number, default: 0 },
    spAtk: { type: Number, default: 0 },
    spDef: { type: Number, default: 0 },
    speed: { type: Number, default: 0 }
  },
  ivs: {
    hp: { type: Number, default: 31 },
    attack: { type: Number, default: 31 },
    defense: { type: Number, default: 31 },
    spAtk: { type: Number, default: 31 },
    spDef: { type: Number, default: 31 },
    speed: { type: Number, default: 31 }
  }
}, { timestamps: true });

// Assign moves to this Pokémon (validate max 4 moves)
teamPokemonSchema.methods.assignMoves = async function(moveIds) {
  if (!Array.isArray(moveIds)) {
    throw new Error('moveIds must be an array');
  }
  
  if (moveIds.length > 4) {
    throw new Error('A Pokémon can only have a maximum of 4 moves');
  }

  const Move = mongoose.model('Move');
  
  // Validate all moves exist
  const validMoves = await Move.find({ moveId: { $in: moveIds } });
  if (validMoves.length !== moveIds.length) {
    throw new Error('One or more moves do not exist');
  }

  this.moves = moveIds;
  await this.save();
  
  return {
    message: 'Moves assigned successfully',
    moves: moveIds
  };
};

// Get ability status and validate it exists for the pokemon
teamPokemonSchema.methods.abilityStatus = async function() {
  if (!this.ability) {
    return { active: false, error: 'No ability assigned' };
  }

  const Pokemon = mongoose.model('Pokemon');
  const pokemon = await Pokemon.findOne({ pokemonId: this.pokemonId });
  
  if (!pokemon) {
    return { active: false, error: 'Pokémon not found' };
  }

  // Check if ability is valid for this pokemon
  const abilityExists = pokemon.abilities && pokemon.abilities.includes(this.ability);
  
  return {
    active: abilityExists,
    ability: this.ability,
    valid: abilityExists,
    message: abilityExists ? 'Ability is valid' : 'Ability not valid for this Pokémon'
  };
};

// Assign item to this Pokémon
teamPokemonSchema.methods.assignItems = async function(itemId) {
  if (!itemId) {
    this.item = null;
    await this.save();
    return { message: 'Item removed' };
  }

  const Item = mongoose.model('Item');
  
  // Validate item exists
  const item = await Item.findOne({ itemId });
  if (!item) {
    throw new Error('Item does not exist');
  }

  this.item = itemId;
  await this.save();
  
  return {
    message: 'Item assigned successfully',
    item: item.name
  };
};

module.exports = mongoose.model('TeamPokemon', teamPokemonSchema);
