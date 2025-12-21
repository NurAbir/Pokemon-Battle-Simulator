const mongoose = require('mongoose');
// Path: server/scripts/populateItems.js -> server/models/Item.js
const Item = require('../models/Item');

// Connect to MongoDB - Update this connection string to match your setup
mongoose.connect('mongodb://localhost:27017/pokemon-battle-simulator');

async function fetchAllItems() {
  const items = [];
  let heldItemsCount = 0;
  let berriesCount = 0;
  let skippedCount = 0;
  
  console.log('Fetching all Pokémon items...');
  
  try {
    // First, get the total count of items
    const initialResponse = await fetch('https://pokeapi.co/api/v2/item?limit=1');
    const initialData = await initialResponse.json();
    const totalItems = initialData.count;
    
    console.log(`Total items available: ${totalItems}`);
    
    // Fetch all items in one request
    const response = await fetch(`https://pokeapi.co/api/v2/item?limit=${totalItems}`);
    const data = await response.json();
    
    console.log(`Processing ${data.results.length} items...`);
    
    // Fetch details for each item
    for (let i = 0; i < data.results.length; i++) {
      try {
        const itemUrl = data.results[i].url;
        const itemId = itemUrl.split('/').filter(Boolean).pop();
        
        const itemResponse = await fetch(itemUrl);
        const itemDetails = await itemResponse.json();
        
        // Debug: Log category for first few items to see structure
        if (i < 5) {
          console.log(`Item ${itemDetails.name}: category = ${itemDetails.category?.name}`);
        }
        
        // Check if item is a held item or berry
        const categoryName = itemDetails.category?.name;
        const isHeldItem = categoryName === 'held-items';
        const isBerry = categoryName === 'standard-balls' ? false : itemDetails.name.includes('berry');
        
        // Also check attributes for holdable items
        const isHoldable = itemDetails.attributes?.some(attr => attr.name === 'holdable');
        
        // Skip if not a held item, berry, or holdable
        if (!isHeldItem && !isBerry && !isHoldable) {
          continue;
        }
        
        // Get English name
        const englishName = itemDetails.names.find(
          n => n.language.name === 'en'
        );
        
        // Get English effect (short effect for description)
        const englishEffect = itemDetails.effect_entries.find(
          entry => entry.language.name === 'en'
        );
        
        // Get English flavor text (description) - try different versions
        let englishFlavor = itemDetails.flavor_text_entries.find(
          entry => entry.language.name === 'en'
        );
        
        // For berries, check fling_effect if no regular effect
        let effect = englishEffect ? englishEffect.short_effect : null;
        
        // If no effect but has fling effect (common for berries), use that
        if (!effect && itemDetails.fling_effect) {
          effect = `Can be flung at target. ${itemDetails.fling_effect.name}`;
        }
        
        // If still no effect but is berry, use generic berry effect
        if (!effect && isBerry) {
          effect = 'A berry that can be held by a Pokémon.';
        }
        
        // If no flavor text, try getting it from effect entries
        if (!englishFlavor && englishEffect) {
          englishFlavor = { text: englishEffect.effect };
        }
        
        const description = englishFlavor ? englishFlavor.text.replace(/\n/g, ' ').replace(/\f/g, ' ') : null;
        
        // Skip items that don't have effect (description is optional for held items)
        if (effect) {
          items.push({
            itemId: itemId,
            name: englishName ? englishName.name : itemDetails.name,
            description: description || effect, // Use effect as description if no flavor text
            effect: effect
          });
          
          // Track counts by category
          if (isHeldItem) heldItemsCount++;
          if (isBerry) berriesCount++;
          
        } else {
          skippedCount++;
          console.log(`Skipping item ${itemId} (${itemDetails.name}) - no effect data`);
        }
        
        // Log progress every 50 items
        if ((i + 1) % 50 === 0) {
          console.log(`Processed ${i + 1}/${data.results.length} items...`);
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`Error fetching item ${i + 1}:`, error.message);
      }
    }
    
    console.log(`Finished processing ${items.length} items`);
    console.log(`  - Held items: ${heldItemsCount}`);
    console.log(`  - Berries: ${berriesCount}`);
    console.log(`  - Skipped: ${skippedCount}`);
    
  } catch (error) {
    console.error('Error fetching items list:', error);
  }
  
  return items;
}

async function populateItems() {
  try {
    console.log('Starting item population...');
    
    // Fetch all items
    const itemsData = await fetchAllItems();
    
    console.log(`\nFound ${itemsData.length} items`);
    console.log('Saving to database...');
    
    // Clear existing items (optional - remove this line to keep existing data)
    await Item.deleteMany({});
    
    // Insert all items
    const result = await Item.insertMany(itemsData);
    
    console.log(`\nSuccessfully populated ${result.length} items!`);
    
  } catch (error) {
    console.error('Error populating items:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
// Usage: node server/scripts/populateItems.js (from project root)
// Or: node scripts/populateItems.js (from server directory)
populateItems();

// node server/scripts/populateItems.js