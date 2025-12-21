/* LeaderboardModel.js */
export const fetchLeaderboard = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/users/leaderboard');
    if (!res.ok) throw new Error("Failed to fetch leaderboard");
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const resetSeasonRankings = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/users/season-reset', {
      method: 'PATCH'
    });
    return await res.json();
  } catch (err) {
    console.error("Season reset failed:", err);
    return { success: false };
  }
};