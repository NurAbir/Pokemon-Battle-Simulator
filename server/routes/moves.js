const express = require('express');
const router = express.Router();
const Move = require('../models/Move');

// GET /api/moves - Get all moves
router.get('/', async (req, res) => {
    try {
        const moves = await Move.find().sort({ name: 1 }); // Sort alphabetically
        res.json({ moves });
    } catch (error) {
        console.error('Error fetching moves:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;