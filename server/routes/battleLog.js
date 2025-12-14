const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getBattleLog,
  getBattleLogAfter
} = require('../controllers/battleLogController');

// All routes require authentication
router.use(protect);

// GET /api/battle-log/:battleId - Get full battle log
router.get('/:battleId', getBattleLog);

// GET /api/battle-log/:battleId/after - Get logs after timestamp (for reconnection)
router.get('/:battleId/after', getBattleLogAfter);

module.exports = router;
