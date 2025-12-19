// models/Team.js
const mongoose = require('mongoose');

const pokemonSchema = new mongoose.Schema({
    id: Number,
    name: String,
    nickname: String,
    level: { type: Number, default: 50 },
    gender: { type: String, enum: ['M', 'F', 'N'], default: 'M' },
    happiness: { type: Number, default: 255 },
    nature: { type: String, default: 'Serious' },
    ability: String,
    item: String,
    hiddenPowerType: { type: String, default: 'Dark' },
    moves: [String],
    baseStats: {
        hp: Number,
        atk: Number,
        def: Number,
        spa: Number,
        spd: Number,
        spe: Number
    },
    evs: {
        hp: { type: Number, default: 0 },
        atk: { type: Number, default: 0 },
        def: { type: Number, default: 0 },
        spa: { type: Number, default: 0 },
        spd: { type: Number, default: 0 },
        spe: { type: Number, default: 0 }
    },
    ivs: {
        hp: { type: Number, default: 31 },
        atk: { type: Number, default: 31 },
        def: { type: Number, default: 31 },
        spa: { type: Number, default: 31 },
        spd: { type: Number, default: 31 },
        spe: { type: Number, default: 31 }
    },
    calculatedStats: {
        hp: Number,
        atk: Number,
        def: Number,
        spa: Number,
        spd: Number,
        spe: Number
    },
    types: [String],
    abilities: [String],
    image: String
});

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pokemons: [pokemonSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('Team', teamSchema);