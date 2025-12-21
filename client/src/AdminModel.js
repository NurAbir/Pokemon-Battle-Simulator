/* AdminModel.js - The Data Layer */
export const generateUser = (avatars) => {
  const id = Date.now() + Math.floor(Math.random() * 1000000);
  const isSuspicious = Math.random() < 0.3;
  const activities = ["Currently in-game", "AFK (Away)", "AFK (In-Lobby)"];
  
  return {
    id,
    name: `User #${Math.floor(100000 + Math.random() * 900000)}`,
    status: isSuspicious ? "suspicious" : "safe",
    activity: activities[Math.floor(Math.random() * activities.length)],
    ping: Math.floor(Math.random() * 80) + 10,
    avatar: `https://i.pravatar.cc/150?u=${id}`,
    reportedBy: isSuspicious ? Array.from({length: Math.floor(Math.random()*3)+1}, () => avatars[Math.floor(Math.random()*avatars.length)]) : [],
    reportData: {
      "Wins": Math.floor(Math.random() * 5000),
      "Losses": Math.floor(Math.random() * 100),
      "ELO": Math.random() > 0.9 ? "999+" : Math.floor(1000 + Math.random() * 2000),
      "Playtime": `${Math.floor(Math.random() * 100)}H ${Math.floor(Math.random() * 60)}M`,
      "Joined": new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString()
    }
  };
};

export const fetchInitialUsers = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/users');
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch users:', err);
    return [];
  }
};


export const banUser = async (userId) => {
    try {
        const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
            method: 'DELETE',
        });
        if (!res.ok) {
            throw new Error(`Failed to ban user. Status: ${res.status}`);
        }
        return { success: true };
    } catch (err) {
        console.error("Ban API call failed:", err);
        return { success: false, error: err.message };
    }
};

export const updateUserElo = async (userId, newElo) => {
    try {
        const res = await fetch(`http://localhost:5000/api/users/${userId}/stats`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eloChange: 0, newElo: parseInt(newElo) }) 
            // Note: Ensure your backend handles 'newElo' override in /stats route
        });
        return await res.json();
    } catch (err) {
        console.error("ELO update failed:", err);
        return null;
    }
};

export const dismissReport = async (userId) => {
    try {
        const res = await fetch(`http://localhost:5000/api/users/${userId}/dismiss`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        
        if (!res.ok) {
            throw new Error(`Failed to dismiss report. Status: ${res.status}`);
        }

        const data = await res.json();
        return data; // Returns the updated user object
    } catch (err) {
        console.error("Dismiss API call failed:", err);
        return null;
    }
};