const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

// GET /api/items - Get all items
router.get('/', async (req, res) => {
    try {
        const items = await Item.find().sort({ name: 1 });
        res.json({ items });
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;