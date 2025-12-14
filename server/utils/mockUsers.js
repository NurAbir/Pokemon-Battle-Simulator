const avatars = [
    "https://i.pravatar.cc/150?u=a", 
    "https://i.pravatar.cc/150?u=b", 
    "https://i.pravatar.cc/150?u=c", 
    "https://i.pravatar.cc/150?u=d"
];

const generateUser = () => {
    const isSuspicious = Math.random() < 0.3;
    const activities = ["Currently in-game", "AFK (Away)", "AFK (In-Lobby)"];
    const activity = activities[Math.floor(Math.random() * activities.length)];
    const id = Date.now() + Math.floor(Math.random() * 1000);

    return {
        name: `User #${Math.floor(100000 + Math.random() * 900000)}`,
        status: isSuspicious ? "suspicious" : "safe",
        activity,
        ping: Math.floor(Math.random() * 80) + 10,
        avatar: `https://i.pravatar.cc/150?u=${id}`,
        reportedBy: isSuspicious ? Array.from({length: Math.floor(Math.random()*3)+1}, () => avatars[Math.floor(Math.random()*avatars.length)]) : [],
        reportData: {
            Wins: Math.floor(Math.random() * 5000),
            Losses: Math.floor(Math.random() * 100),
            ELO: Math.random() > 0.9 ? "999+" : Math.floor(1000 + Math.random() * 2000),
            Playtime: `${Math.floor(Math.random() * 100)}H ${Math.floor(Math.random() * 60)}M`,
            Joined: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString()
        }
    };
};

const generateMockUsers = (count = 12) => Array.from({ length: count }, () => generateUser());

module.exports = { generateMockUsers };
