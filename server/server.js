/* server.js */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/users');
const pokemonRoutes = require('./routes/pokemon');

const User = require('./models/User'); 
const { generateMockUsers } = require('./utils/mockUsers'); 

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes - Mount the updated router here
app.use('/api/users', userRoutes);
app.use('/api/pokemon', pokemonRoutes);

// Database Seeder Route
app.get('/populate', async (req, res) => {
    try {
        try {
            await mongoose.connection.db.dropCollection('users'); 
        } catch (e) {
            if (e.code !== 26) console.log('Drop error:', e);
        }

        const mockData = generateMockUsers(12);
        await User.insertMany(mockData);
        res.json({ message: 'Database populated successfully!', count: mockData.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// MongoDB Connection
// Note: Replace with your actual connection string if different
mongoose.connect(process.env.MONGODB_URI)

    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});