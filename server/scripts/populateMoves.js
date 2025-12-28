const mongoose = require('mongoose');
// Path: server/scripts/populateMoves.js -> server/models/Move.js
const Move = require('../models/Move');

// Connect to MongoDB - Update this connection string to match your setup
mongoose.connect('mongodb://localhost:27017/pokemon-battle-simulator');

async function fetchPokemonMoves() {
  const moves = new Map();
  let processedCount = 0;
  let skippedCount = 0;
  
  console.log('Fetching moves from first 151 Pokémon...');
  
  // Fetch first 151 Pokémon
  for (let i = 1; i <= 151; i++) {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`);
      const pokemon = await response.json();
      
      // Extract moves from this Pokémon
      for (const moveData of pokemon.moves) {
        const moveUrl = moveData.move.url;
        const moveId = moveUrl.split('/').filter(Boolean).pop();
        
        // Only fetch if we haven't seen this move before
        if (!moves.has(moveId)) {
          const moveResponse = await fetch(moveUrl);
          const moveDetails = await moveResponse.json();
          
          // Get move category (physical/special/status)
          const damageClass = moveDetails.damage_class?.name;
          
          // Skip if no valid damage class
          if (!damageClass || !['physical', 'special', 'status'].includes(damageClass)) {
            skippedCount++;
            continue;
          }
          
          // Get power (null for status moves becomes 0)
          const power = moveDetails.power || 0;
          
          // Get accuracy (null means it always hits, set to 100)
          const accuracy = moveDetails.accuracy || 100;
          
          moves.set(moveId, {
            moveId: moveId,
            name: moveDetails.name,
            type: moveDetails.type?.name || 'normal',
            power: power,
            accuracy: accuracy,
            category: damageClass
          });
          
          processedCount++;
        }
      }
      
      console.log(`Processed Pokémon ${i}/151: ${pokemon.name}`);
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error fetching Pokémon ${i}:`, error.message);
    }
  }
  
  console.log(`\nFinished processing ${processedCount} unique moves`);
  console.log(`Skipped ${skippedCount} invalid moves`);
  
  return Array.from(moves.values());
}

async function populateMoves() {
  try {
    console.log('Starting move population...');
    
    // Fetch all moves from first 151 Pokémon
    const movesData = await fetchPokemonMoves();
    
    console.log(`\nFound ${movesData.length} unique moves`);
    console.log('Saving to database...');
    
    // Clear existing moves (optional - remove this line to keep existing data)
    await Move.deleteMany({});
    
    // Insert all moves
    const result = await Move.insertMany(movesData);
    
    console.log(`\nSuccessfully populated ${result.length} moves!`);
    
    // Show breakdown by category
    const physical = result.filter(m => m.category === 'physical').length;
    const special = result.filter(m => m.category === 'special').length;
    const status = result.filter(m => m.category === 'status').length;
    
    console.log(`  - Physical moves: ${physical}`);
    console.log(`  - Special moves: ${special}`);
    console.log(`  - Status moves: ${status}`);
    
  } catch (error) {
    console.error('Error populating moves:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
// Usage: node server/scripts/populateMoves.js (from project root)
// Or: node scripts/populateMoves.js (from server directory)
populateMoves();

// node server/scripts/populateMoves.js