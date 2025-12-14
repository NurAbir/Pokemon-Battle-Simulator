/* Game.jsx - The Presentation Layer */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, ShieldAlert, User, Play, RotateCcw, LogIn, Zap, Heart } from 'lucide-react';
import { useGameController } from './useGameController';

const PokemonCard = ({ pokemon }) => {
  if (!pokemon) return null;
  
  const getRatingColor = (r) => {
      switch (r) {
          case 'S': return 'text-purple-400';
          case 'A': return 'text-yellow-400';
          case 'B': return 'text-blue-400';
          default: return 'text-gray-400';
      }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="bg-gray-900/80 border border-gray-800 rounded-xl p-3 min-w-[150px] shadow-lg"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xl font-black font-mono ${getRatingColor(pokemon.rating)}`}>{pokemon.rating}</span>
        <span className="text-[10px] text-blue-400 uppercase tracking-widest">{pokemon.type}</span>
      </div>
      <img src={pokemon.image} alt={pokemon.name} className="w-full h-16 object-contain bg-black/40 rounded-lg p-1 mb-2" />
      <h4 className="text-sm font-bold font-mono text-white mb-2">{pokemon.name}</h4>
      <div className="flex gap-3 text-[10px] font-mono text-gray-400">
        <span className="flex items-center gap-1"><Heart size={10} className="text-red-500"/> {pokemon.baseStats?.hp || 0}</span>
        <span className="flex items-center gap-1"><Zap size={10} className="text-yellow-500"/> {pokemon.baseStats?.attack || 0}</span>
      </div>
    </motion.div>
  );
};

export default function Game() {
  const { 
    gameState, currentUser, opponent, isReporting, reportSuccess,
    handleLogin, handleReport, findNewMatch,
    pokemonDeck 
  } = useGameController();
  
  const [inputName, setInputName] = useState('');

  return (
    <div className="min-h-screen bg-neutral-900 text-amber-500 font-mono flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0.9)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>

      <div className="w-full max-w-md z-10">

<div className="mb-8 flex justify-center">
            <img 
                src="/images/logo.png" 
                alt="Game Logo" 
                // Added styling for a cyberpunk/scifi look
                className="h-16 object-contain filter drop-shadow-[0_0_10px_rgba(255,165,0,0.5)]" 
            />
        </div>
        
        {/* --- STATE: LOGIN --- */}
        {gameState === 'LOGIN' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-black/80 border border-amber-600/30 p-8 rounded-xl shadow-[0_0_30px_rgba(217,119,6,0.1)]"
          >
            <h1 className="text-3xl font-black mb-6 flex items-center gap-2 tracking-tighter text-amber-500">
              <Crosshair /> POKE BATTLE
            </h1>
            <input 
              type="text" 
              placeholder="(ENTER USER _ID TO LOG-IN...)"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="w-full bg-neutral-800 border border-amber-900/50 text-amber-100 p-4 rounded mb-4 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
            <button 
              onClick={() => handleLogin(inputName)}
              className="w-full bg-amber-600 hover:bg-amber-500 text-black font-bold p-4 rounded uppercase tracking-widest transition-all flex justify-center items-center gap-2"
            >
              <LogIn size={18} /> Connect to Server
            </button>
          </motion.div>
        )}

        {/* --- STATE: SEARCHING --- */}
        {gameState === 'SEARCHING' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="inline-block p-6 rounded-full border-4 border-amber-500/30 border-t-amber-500 animate-spin mb-6"></div>
            <h2 className="text-xl text-amber-500/80 animate-pulse">SEARCHING FOR OPPONENT...</h2>
          </motion.div>
        )}

        {/* --- STATE: PLAYING --- */}
        {gameState === 'PLAYING' && opponent && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900/90 border-2 border-amber-600/50 rounded-xl overflow-hidden relative"
          >
            {/* HUD Header */}
            <div className="bg-amber-900/20 p-4 flex justify-between items-center border-b border-amber-600/30">
              <span className="flex items-center gap-2 text-sm font-bold"><User size={16}/> {currentUser}</span>
              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">LIVE MATCH</span>
            </div>

            {/* Match Area */}
            <div className="p-8 flex flex-col items-center">
              <div className="relative mb-6">
                <img src={opponent.avatar || opponent.username} alt="enemy" className="w-32 h-32 rounded-lg border-4 border-red-500/50" />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs px-3 py-1 font-bold rounded uppercase">
                  Enemy
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">{opponent.username || opponent.name}</h2>
              <p className="text-amber-500/60 text-sm mb-8">Level 42 • K/D 2.4</p>

             <div className="space-y-3">
                <h3 className="text-sm uppercase font-bold text-amber-400">Your Active Squad:</h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {pokemonDeck.map(p => <PokemonCard key={p._id} pokemon={p} />)}
                </div>
            </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 w-full">
                <button 
                  onClick={handleReport}
                  disabled={reportSuccess}
                  className={`p-3 rounded font-bold text-sm uppercase flex items-center justify-center gap-2 transition-all border
                    ${reportSuccess 
                      ? 'bg-green-600/20 border-green-500 text-green-400' 
                      : 'bg-red-900/20 border-red-500/50 text-red-400 hover:bg-red-900/40 hover:border-red-400'
                    }`}
                >
                  {reportSuccess ? 'Report Sent' : <><ShieldAlert size={18}/> Report Player</>}
                </button>
                
                <button 
                  onClick={findNewMatch}
                  className="p-3 bg-amber-600/20 border border-amber-500/50 text-amber-500 rounded font-bold text-sm uppercase flex items-center justify-center gap-2 hover:bg-amber-600/40 transition-all"
                >
                  <RotateCcw size={18}/> New Match
                </button>
              </div>
            </div>
            
            {/* Feedback Toast */}
            <AnimatePresence>
                {reportSuccess && (
                    <motion.div 
                        initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                        className="absolute bottom-4 left-0 right-0 mx-auto w-max bg-green-500 text-black font-bold px-4 py-2 rounded shadow-lg"
                    >
                        REPORT SUBMITTED TO ADMIN
                    </motion.div>
                )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}