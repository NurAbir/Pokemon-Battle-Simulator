// routes/battleRoutes.js
const express = require('express');
const router = express.Router();
const battleController = require('../controllers/battleController');
const { protect } = require('../middleware/auth');

// Add this debug logging:
console.log('battleController:', battleController);
console.log('battleController.getUserBattles:', battleController.getUserBattles);
console.log('battleController.getBattle:', battleController.getBattle);

// Get all battles for authenticated user
router.get('/my-battles', protect, battleController.getUserBattles);

// Get specific battle details
router.get('/:battleId', protect, battleController.getBattle);  // ← Line 8 is probably here

// Create new battle (usually called by matchmaking system)
router.post('/create', protect, battleController.createBattle);

// Submit action (move or switch)
router.post('/:battleId/action', protect, battleController.submitAction);

// Forfeit battle
router.post('/:battleId/forfeit', protect, battleController.forfeitBattle);

module.exports = router;