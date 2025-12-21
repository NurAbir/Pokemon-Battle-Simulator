/* useLeaderboardController.js */
import { useState, useEffect } from 'react';
import { fetchLeaderboard, resetSeasonRankings } from './LeaderboardModel';

export const useLeaderboardController = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshLeaderboard = async () => {
    setLoading(true);
    const data = await fetchLeaderboard();
    setRankings(data);
    setLoading(false);
  };

  useEffect(() => {
    refreshLeaderboard();
    const interval = setInterval(refreshLeaderboard, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleNewSeason = async () => {
    if (window.confirm("Are you sure? This resets ALL player ratings to 1000.")) {
      const result = await resetSeasonRankings();
      if (result) refreshLeaderboard();
    }
  };

  return { rankings, loading, refreshLeaderboard, handleNewSeason };
};