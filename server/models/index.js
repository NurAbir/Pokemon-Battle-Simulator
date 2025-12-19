/**
 * Models Index - Central export for all Mongoose models
 * 
 * This file ensures all models are registered with Mongoose
 * regardless of which routes/controllers are accessed first.
 * 
 * Import this file at server startup to guarantee all collections
 * are available for initialization.
 */

const Ability = require('./Ability');
const Admin = require('./Admin');
const Battle = require('./Battle');
const BattleLog = require('./BattleLog');
const BattlePokemon = require('./BattlePokemon');
const ChatRoom = require('./ChatRoom');
const Item = require('./Item');
const Leaderboards = require('./Leaderboards');
const Message = require('./Message');
const Move = require('./Move');
const Notification = require('./Notification');
const Pokemon = require('./Pokemon');
const Statistics = require('./Statistics');
const Team = require('./Team');
const TeamPokemon = require('./TeamPokemon');
const User = require('./User');

// Export all models
const models = {
    Ability,
    Admin,
    Battle,
    BattleLog,
    BattlePokemon,
    ChatRoom,
    Item,
    Leaderboards,
    Message,
    Move,
    Notification,
    Pokemon,
    Statistics,
    Team,
    TeamPokemon,
    User
};

// Helper to get all model names
const getModelNames = () => Object.keys(models);

// Helper to get all models as array
const getModelsArray = () => Object.values(models);

module.exports = {
    ...models,
    models,
    getModelNames,
    getModelsArray
};
