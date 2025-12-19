// routes/teams.js
const express = require('express');
const router = express.Router();

// Debug logging
console.log('Loading team routes...');

const teamController = require('../controllers/teamController');
console.log('teamController:', teamController);

const { protect } = require('../middleware/auth');
console.log('protect function:', protect);

// All routes require authentication
if (typeof protect === 'function') {
  router.use(protect);
} else {
  console.error('ERROR: protect is not a function!');
}

// GET all teams
router.get('/', teamController.getTeams);

// GET single team
router.get('/:id', teamController.getTeam);

// POST create team
router.post('/', teamController.createTeam);

// PUT update team
router.put('/:id', teamController.updateTeam);

// DELETE team
router.delete('/:id', teamController.deleteTeam);

module.exports = router;