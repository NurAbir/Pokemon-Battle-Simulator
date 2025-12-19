/**
 * Database Initialization Script
 * 
 * This script ensures all MongoDB collections exist and are properly indexed.
 * Run this script:
 *   - After fresh clone: npm run db:init
 *   - After adding new models
 *   - When setting up a new environment
 * 
 * Usage:
 *   node scripts/initDatabase.js
 *   npm run db:init
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { models, getModelNames, getModelsArray } = require('../models');

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m'
};

const log = {
    info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    dim: (msg) => console.log(`${colors.dim}  ${msg}${colors.reset}`)
};

async function checkEnvironment() {
    log.info('Checking environment configuration...');
    
    if (!process.env.MONGODB_URI) {
        log.error('MONGODB_URI is not defined in .env file');
        log.dim('Please copy .env.example to .env and configure your MongoDB URI');
        log.dim('  cp .env.example .env');
        process.exit(1);
    }
    
    log.success('Environment variables loaded');
    log.dim(`MongoDB URI: ${process.env.MONGODB_URI.replace(/\/\/.*@/, '//*****@')}`);
}

async function connectDatabase() {
    log.info('Connecting to MongoDB...');
    
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        log.success(`Connected to database: ${mongoose.connection.name}`);
        return true;
    } catch (error) {
        log.error(`Failed to connect: ${error.message}`);
        
        if (error.message.includes('ECONNREFUSED')) {
            log.dim('Make sure MongoDB is running:');
            log.dim('  - Local: mongod or start MongoDB service');
            log.dim('  - Docker: docker run -d -p 27017:27017 mongo');
            log.dim('  - Atlas: Check your connection string and network access');
        }
        
        process.exit(1);
    }
}

async function initializeCollections() {
    log.info('Initializing collections...');
    
    const modelList = getModelsArray();
    const results = {
        created: [],
        existing: [],
        failed: []
    };
    
    for (const Model of modelList) {
        const modelName = Model.modelName;
        const collectionName = Model.collection.collectionName;
        
        try {
            // Check if collection exists
            const collections = await mongoose.connection.db.listCollections({ name: collectionName }).toArray();
            
            if (collections.length === 0) {
                // Create collection
                await Model.createCollection();
                results.created.push(collectionName);
                log.success(`Created collection: ${collectionName}`);
            } else {
                results.existing.push(collectionName);
                log.dim(`Collection exists: ${collectionName}`);
            }
            
            // Ensure indexes are created
            await Model.ensureIndexes();
            
        } catch (error) {
            results.failed.push({ name: collectionName, error: error.message });
            log.error(`Failed to initialize ${collectionName}: ${error.message}`);
        }
    }
    
    return results;
}

async function verifyCollections() {
    log.info('Verifying all collections...');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const modelList = getModelsArray();
    const missing = [];
    
    for (const Model of modelList) {
        const collectionName = Model.collection.collectionName;
        if (!collectionNames.includes(collectionName)) {
            missing.push(collectionName);
        }
    }
    
    if (missing.length > 0) {
        log.warn(`Missing collections: ${missing.join(', ')}`);
        return false;
    }
    
    log.success(`All ${modelList.length} collections verified`);
    return true;
}

async function printSummary(results) {
    console.log('\n' + '='.repeat(50));
    console.log('Database Initialization Summary');
    console.log('='.repeat(50));
    
    if (results.created.length > 0) {
        log.success(`Created: ${results.created.length} collections`);
        results.created.forEach(name => log.dim(`  - ${name}`));
    }
    
    if (results.existing.length > 0) {
        log.info(`Existing: ${results.existing.length} collections`);
    }
    
    if (results.failed.length > 0) {
        log.error(`Failed: ${results.failed.length} collections`);
        results.failed.forEach(item => log.dim(`  - ${item.name}: ${item.error}`));
    }
    
    console.log('='.repeat(50));
}

async function main() {
    console.log('\n🎮 Pokemon Battle Simulator - Database Initialization\n');
    
    try {
        await checkEnvironment();
        await connectDatabase();
        const results = await initializeCollections();
        await verifyCollections();
        await printSummary(results);
        
        console.log('\n' + colors.green + '✓ Database initialization complete!' + colors.reset);
        console.log(colors.dim + '  You can now start the server with: npm run dev\n' + colors.reset);
        
        process.exit(0);
    } catch (error) {
        log.error(`Initialization failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { initializeCollections, verifyCollections };
