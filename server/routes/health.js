/**
 * Health Check Routes
 * 
 * Routes for monitoring system and database health.
 * 
 * GET  /api/health      - Basic health check
 * GET  /api/health/db   - Database health with collection status
 * POST /api/health/db/init - Manual collection initialization
 */

const express = require('express');
const router = express.Router();
const {
    getHealth,
    getDatabaseHealth,
    initializeDatabase
} = require('../controllers/healthController');

// Basic health check
router.get('/', getHealth);

// Database health check
router.get('/db', getDatabaseHealth);

// Manual database initialization (useful for debugging)
router.post('/db/init', initializeDatabase);

module.exports = router;
