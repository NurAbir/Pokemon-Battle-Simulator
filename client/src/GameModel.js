/* GameModel.js - The Data Layer */

export const findMatch = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/users/random'); 
    if (!res.ok) throw new Error("Matchmaking failed");
    
    const user = await res.json();
    
    // This correctly assigns the MongoDB _id (the string) to the 'id' property
    return {
        ...user,
        id: user.id || user._id 
    };

  } catch (err) {
    // Fallback if API is offline
    return {
      id: Date.now(), // This ID won't exist in DB, so reports will fail gracefully
      username: "FallbackActive_API_ERROR",
      avatar: "https://i.pravatar.cc/150?u=opp",
      status: 'safe'
    };
  }
};

export const submitReport = async (targetUserId, reporterName, reason) => {
  if (!targetUserId) {
      console.error("Cannot report: Missing Target User ID");
      return null;
  }
  
  try {
    const res = await fetch(`http://localhost:5000/api/users/${targetUserId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportedBy: reporterName, reason })
    });
    return await res.json();
  } catch (err) {
    console.error("Report failed:", err);
    return null;
  }
};

// NEW: Function to fetch random Pokémon cards
export const fetchPokemonDeck = async (count = 3) => {
  try {
    const res = await fetch(`http://localhost:5000/api/pokemon/random/${count}`); 
    if (!res.ok) throw new Error("Failed to fetch Pokemon deck");
    
    const deck = await res.json();
    return deck;

  } catch (err) {
    console.error("Pokemon deck fetch error:", err);
    // Fallback deck for testing/offline mode
    return [
      { _id: '1', name: 'Bulbasaur', image: 'https://img.pokemondb.net/artwork/large/bulbasaur.jpg', rating: 'B', type: 'Plant', baseStats: { hp: 100, attack: 50 }, moves: ['Vine Whip'] },
      { _id: '2', name: 'Charmander', image: 'https://img.pokemondb.net/artwork/large/charmander.jpg', rating: 'A', type: 'Fire', baseStats: { hp: 110, attack: 60 }, moves: ['Ember'] },
      { _id: '3', name: 'Squirtle', image: 'https://img.pokemondb.net/artwork/large/squirtle.jpg', rating: 'S', type: 'Water', baseStats: { hp: 120, attack: 70 }, moves: ['Water Gun'] },
    ];
  }
};

export const updateUserStats = async (userId, win, eloChange) => {
  try {
    const res = await fetch(`http://localhost:5000/api/users/${userId}/stats`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ win, eloChange })
    });
    return await res.json();
  } catch (err) {
    console.error("Failed to update stats:", err);
    return null;
  }
};