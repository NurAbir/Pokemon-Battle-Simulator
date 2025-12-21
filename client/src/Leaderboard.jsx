/* Leaderboard.jsx */
import React from 'react';
import { Trophy, Medal, Star, RotateCcw } from 'lucide-react';
import { useLeaderboardController } from './useLeaderboardController';

export default function Leaderboard() {
  const { rankings, loading, handleNewSeason } = useLeaderboardController();

  return (
    <div className="bg-gray-900/50 border border-amber-500/30 rounded-xl p-6 text-amber-100">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="text-yellow-500" size={32} />
        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Global Leaderboard</h2>
      </div>

      <button 
        onClick={handleNewSeason}
        className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-black text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all"
    >
        <RotateCcw size={14} />
        Start New Season
    </button>

      {loading ? <div className="animate-pulse">Accessing Data-Stream...</div> : (
        <div className="space-y-2">
          {rankings.map((user, index) => (
            <div key={user._id} className="flex items-center justify-between bg-black/40 p-3 border-l-4 border-amber-600">
              <div className="flex items-center gap-4">
                <span className="font-mono text-amber-500/50 w-6">#{index + 1}</span>
                <img src={user.avatar} className="w-8 h-8 rounded-full border border-amber-500" alt="" />
                <span className="font-bold">{user.username}</span>
              </div>
              <div className="flex gap-6 font-mono">
                <span className="text-green-500">{user.reportData?.Wins || 0} Wins</span>
                <span className="text-amber-400 font-bold">{user.reportData?.ELO || 1000} ELO</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}