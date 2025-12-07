const express = require('express');
const router = express.Router();
const { 
  getMyTeam,
  createTeam,
  updateTeam
} = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

router.get('/my-team', protect, getMyTeam);
router.post('/create', protect, createTeam);
router.put('/update', protect, updateTeam);

module.exports = router;