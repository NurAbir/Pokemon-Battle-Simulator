const express = require('express');
const router = express.Router();
const pokemonController = require('../controllers/pokemonController');
const teamController = require('../controllers/teamController');
// Assuming you have an auth middleware
const { protect } = require('../middleware/auth'); // Adjust path as needed

// Pokemon routes
router.get('/pokemon', pokemonController.getAllPokemon);
router.get('/pokemon/:id', pokemonController.getPokemonById);

// Move routes
router.get('/moves', pokemonController.getAllMoves);

// Ability routes
router.get('/abilities', pokemonController.getAllAbilities);

// Team routes (all protected - require authentication)
router.get('/team', protect, teamController.getUserTeam);
router.post('/team', protect, teamController.saveTeam);
router.delete('/team', protect, teamController.deleteTeam);
router.put('/team/clear', protect, teamController.clearTeam);

module.exports = router;