/**
 * Health Check Controller
 * 
 * Provides endpoints to verify system health, particularly database status.
 * Useful for monitoring, CI/CD pipelines, and debugging deployment issues.
 */

const mongoose = require('mongoose');
const models = require('../models');

/**
 * GET /api/health
 * Basic health check
 */
const getHealth = async (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
};

/**
 * GET /api/health/db
 * Comprehensive database health check
 */
const getDatabaseHealth = async (req, res) => {
    try {
        const dbState = mongoose.connection.readyState;
        const stateNames = ['disconnected', 'connected', 'connecting', 'disconnecting'];
        
        if (dbState !== 1) {
            return res.status(503).json({
                status: 'error',
                database: {
                    connected: false,
                    state: stateNames[dbState] || 'unknown'
                },
                message: 'Database not connected'
            });
        }

        // Get all expected collections
        const modelList = models.getModelsArray();
        const expectedCollections = modelList.map(m => ({
            name: m.collection.collectionName,
            model: m.modelName
        }));

        // Get actual collections from database
        const actualCollections = await mongoose.connection.db.listCollections().toArray();
        const actualNames = actualCollections.map(c => c.name);

        // Check which collections exist vs missing
        const collectionStatus = expectedCollections.map(expected => ({
            collection: expected.name,
            model: expected.model,
            exists: actualNames.includes(expected.name)
        }));

        const missing = collectionStatus.filter(c => !c.exists);
        const existing = collectionStatus.filter(c => c.exists);

        // Get document counts for existing collections
        const stats = await Promise.all(
            existing.map(async (c) => {
                try {
                    const count = await mongoose.connection.db.collection(c.collection).countDocuments();
                    return { ...c, documentCount: count };
                } catch (err) {
                    return { ...c, documentCount: 0, error: err.message };
                }
            })
        );

        const allCollectionsExist = missing.length === 0;

        res.json({
            status: allCollectionsExist ? 'healthy' : 'degraded',
            database: {
                connected: true,
                state: 'connected',
                name: mongoose.connection.name,
                host: mongoose.connection.host
            },
            collections: {
                total: expectedCollections.length,
                existing: existing.length,
                missing: missing.length,
                details: stats,
                missingCollections: missing.map(m => m.collection)
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * POST /api/health/db/init
 * Manually trigger collection initialization (admin use)
 */
const initializeDatabase = async (req, res) => {
    try {
        const modelList = models.getModelsArray();
        const results = [];

        for (const Model of modelList) {
            const collectionName = Model.collection.collectionName;
            
            try {
                const collections = await mongoose.connection.db
                    .listCollections({ name: collectionName })
                    .toArray();

                if (collections.length === 0) {
                    await Model.createCollection();
                    await Model.ensureIndexes();
                    results.push({ collection: collectionName, action: 'created' });
                } else {
                    await Model.ensureIndexes();
                    results.push({ collection: collectionName, action: 'indexes_synced' });
                }
            } catch (error) {
                results.push({ collection: collectionName, action: 'error', error: error.message });
            }
        }

        const created = results.filter(r => r.action === 'created').length;
        const synced = results.filter(r => r.action === 'indexes_synced').length;
        const errors = results.filter(r => r.action === 'error').length;

        res.json({
            status: errors === 0 ? 'success' : 'partial',
            summary: {
                created,
                synced,
                errors
            },
            details: results,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

module.exports = {
    getHealth,
    getDatabaseHealth,
    initializeDatabase
};
