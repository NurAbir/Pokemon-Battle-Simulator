const mongoose = require('mongoose');
const Ability = require('../models/Ability');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pokemon-battle-simulator');

async function fetchPokemonAbilities() {
  const abilities = new Map();
  
  console.log('Fetching abilities from first 151 Pokémon...');
  
  // Fetch first 151 Pokémon
  for (let i = 1; i <= 151; i++) {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`);
      const pokemon = await response.json();
      
      // Extract abilities from this Pokémon
      for (const abilityData of pokemon.abilities) {
        const abilityUrl = abilityData.ability.url;
        const abilityId = abilityUrl.split('/').filter(Boolean).pop();
        
        // Only fetch if we haven't seen this ability before
        if (!abilities.has(abilityId)) {
          const abilityResponse = await fetch(abilityUrl);
          const abilityDetails = await abilityResponse.json();
          
          // Get English description
          const englishEffect = abilityDetails.effect_entries.find(
            entry => entry.language.name === 'en'
          );
          
          abilities.set(abilityId, {
            abilityId: abilityId,
            name: abilityDetails.name,
            description: englishEffect ? englishEffect.effect : 'No description available'
          });
        }
      }
      
      console.log(`Processed Pokémon ${i}/151: ${pokemon.name}`);
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error fetching Pokémon ${i}:`, error.message);
    }
  }
  
  return Array.from(abilities.values());
}

async function populateAbilities() {
  try {
    console.log('Starting ability population...');
    
    // Fetch all abilities from first 151 Pokémon
    const abilitiesData = await fetchPokemonAbilities();
    
    console.log(`\nFound ${abilitiesData.length} unique abilities`);
    console.log('Saving to database...');
    
    // Clear existing abilities (optional)
    await Ability.deleteMany({});
    
    // Insert all abilities
    const result = await Ability.insertMany(abilitiesData);
    
    console.log(`\nSuccessfully populated ${result.length} abilities!`);
    
  } catch (error) {
    console.error('Error populating abilities:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
populateAbilities();

// node server/scripts/populateAbilities.js