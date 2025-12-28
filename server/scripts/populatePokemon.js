const mongoose = require('mongoose');
const Pokemon = require('../models/Pokemon');

// Connect to MongoDB - Update this connection string to match your setup
mongoose.connect('mongodb://localhost:27017/pokemon-battle-simulator');

async function fetchFirst151Pokemon() {
  const pokemons = [];
  
  console.log('Fetching first 151 Pokémon from PokeAPI...');
  
  // Fetch first 151 Pokémon
  for (let i = 1; i <= 151; i++) {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`);
      const pokemonData = await response.json();
      
      // Fetch species data for additional info
      const speciesResponse = await fetch(pokemonData.species.url);
      const speciesData = await speciesResponse.json();
      
      // Extract types
      const types = pokemonData.types.map(t => t.type.name);
      
      // Extract base stats
      const stats = {};
      pokemonData.stats.forEach(stat => {
        const statName = stat.stat.name;
        stats[statName] = stat.base_stat;
      });
      
      // Get English description
      const description = speciesData.flavor_text_entries
        .find(entry => entry.language.name === 'en')?.flavor_text
        .replace(/\f/g, ' ') || 'No description available';
      
      pokemons.push({
        pokemonId: pokemonData.id.toString().padStart(3, '0'),
        name: pokemonData.name,
        type: types,
        baseHP: stats.hp,
        baseAttack: stats.attack,
        baseDefense: stats.defense,
        baseSpAttack: stats['special-attack'],
        baseSpDefense: stats['special-defense'],
        baseSpeed: stats.speed,
        height: pokemonData.height,
        weight: pokemonData.weight,
        description: description
      });
      
      console.log(`✓ ${i}/151: ${pokemonData.name.toUpperCase()} (${types.join('/')}) - HP:${stats.hp} ATK:${stats.attack} DEF:${stats.defense} SPA:${stats['special-attack']} SPD:${stats['special-defense']} SPE:${stats.speed}`);
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 150));
      
    } catch (error) {
      console.error(`✗ Error fetching Pokémon ${i}:`, error.message);
    }
  }
  
  return pokemons;
}

async function populatePokemon() {
  try {
    console.log('═══════════════════════════════════════════');
    console.log('  POKÉMON DATABASE POPULATION SCRIPT');
    console.log('═══════════════════════════════════════════\n');
    
    // Drop the entire collection to remove old indexes
    try {
      await mongoose.connection.dropCollection('Pokemons');
      console.log('✓ Dropped old collection and indexes\n');
    } catch (err) {
      console.log('ℹ No existing collection to drop\n');
    }
    
    // Fetch all 151 Pokémon
    const pokemonData = await fetchFirst151Pokemon();
    
    console.log(`\n═══════════════════════════════════════════`);
    console.log(`  Found ${pokemonData.length} Pokémon`);
    console.log('  Saving to database...');
    console.log('═══════════════════════════════════════════\n');
    
    // Insert all Pokémon
    const result = await Pokemon.insertMany(pokemonData);
    
    console.log(`✓ Successfully populated ${result.length} Pokémon!\n`);
    
    // Show statistics
    console.log('═══════════════════════════════════════════');
    console.log('  DATABASE STATISTICS');
    console.log('═══════════════════════════════════════════\n');
    
    // Type distribution
    const typeCount = {};
    result.forEach(p => {
      p.type.forEach(type => {
        typeCount[type] = (typeCount[type] || 0) + 1;
      });
    });
    
    console.log('Type Distribution:');
    Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`  ${type.padEnd(10)} : ${count}`);
      });
    
  } catch (error) {
    console.error('\n✗ Error populating Pokémon:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
// Usage: node server/scripts/populatePokemon.js (from project root)
// Or: node scripts/populatePokemon.js (from server directory)
populatePokemon();

// node server/scripts/populatePokemon.js