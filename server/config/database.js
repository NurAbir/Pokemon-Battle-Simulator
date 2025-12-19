const mongoose = require('mongoose');

// Import all models to ensure they're registered with Mongoose
// This is critical for collection auto-creation on fresh environments
const models = require('../models');

const connectDB = async () => {
  try {
    // Validate environment
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI is not defined!');
      console.error('   Please copy .env.example to .env and configure your settings:');
      console.error('   copy .env.example .env (Windows)');
      console.error('   cp .env.example .env (Linux/Mac)');
      process.exit(1);
    }

    // Remove deprecated options - they're no longer needed in Mongoose 6+
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);

    // Initialize collections on startup
    await initializeCollections();

  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Troubleshooting tips:');
      console.error('   - Make sure MongoDB is running');
      console.error('   - Check if the connection string in .env is correct');
      console.error('   - For local MongoDB: mongod or start MongoDB service');
      console.error('   - For Docker: docker run -d -p 27017:27017 mongo');
    }
    
    process.exit(1);
  }
};

/**
 * Initialize all collections on startup
 * This ensures collections exist even before first document write
 */
const initializeCollections = async () => {
  console.log('Initializing database collections...');
  
  const modelList = models.getModelsArray();
  let created = 0;
  let existing = 0;
  
  for (const Model of modelList) {
    const collectionName = Model.collection.collectionName;
    
    try {
      // Check if collection exists
      const collections = await mongoose.connection.db
        .listCollections({ name: collectionName })
        .toArray();
      
      if (collections.length === 0) {
        await Model.createCollection();
        created++;
      } else {
        existing++;
      }
      
      // Ensure indexes are synced
      await Model.ensureIndexes();
      
    } catch (error) {
      // Log but don't fail - some collections might have special requirements
      console.warn(`⚠ Could not initialize ${collectionName}: ${error.message}`);
    }
  }
  
  console.log(`✓ Collections initialized: ${created} created, ${existing} existing`);
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error(`Mongoose connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection closed due to app termination');
  process.exit(0);
});

module.exports = connectDB;