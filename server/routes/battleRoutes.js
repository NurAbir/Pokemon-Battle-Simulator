// routes/battleRoutes.js
const express = require('express');
const router = express.Router();
const battleController = require('../controllers/battleController');
const { protect } = require('../middleware/auth');
const { admin: isAdmin } = require('../middleware/auth'); // ← FIX: alias admin → isAdmin

// Debug
console.log('battleController:', Object.keys(battleController)); // This will now show all functions

router.get('/active', protect, isAdmin, battleController.getActiveBattles);
router.get('/:battleId/log', protect, isAdmin, battleController.getBattleLog);

// Rest of routes...
router.get('/my-battles', protect, battleController.getUserBattles);
router.get('/:battleId', protect, battleController.getBattle);
router.post('/create', protect, battleController.createBattle);
router.post('/:battleId/action', protect, battleController.submitAction);
router.post('/:battleId/forfeit', protect, battleController.forfeitBattle);

module.exports = router;