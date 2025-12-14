const express = require('express');
const router = express.Router();
const Ability = require('../models/Ability');

// GET /api/abilities - Get all abilities
router.get('/', async (req, res) => {
    try {
        const abilities = await Ability.find().sort({ name: 1 });
        res.json({ abilities });
    } catch (error) {
        console.error('Error fetching abilities:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;