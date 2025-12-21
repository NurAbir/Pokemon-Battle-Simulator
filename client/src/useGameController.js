/* useGameController.js - The Logic Layer */
import { useState } from 'react';
import { findMatch, submitReport, fetchPokemonDeck, updateUserStats } from './GameModel';

export const useGameController = () => {
  const [gameState, setGameState] = useState('LOGIN'); // LOGIN, SEARCHING, PLAYING
  const [currentUser, setCurrentUser] = useState('');
  const [opponent, setOpponent] = useState(null);
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [pokemonDeck, setPokemonDeck] = useState([]);
  const [battleResult, setBattleResult] = useState(null); // { result: 'WIN'|'LOSS', eloGain: number }

  const handleLogin = (username) => {
    if (!username) return;
    setCurrentUser(username);
    setGameState('SEARCHING');
    
    // Simulate matchmaking delay
    setTimeout(async () => {
      const match = await findMatch();
      setOpponent(match);
      setGameState('PLAYING');
    }, 2000);
  };

const startBattle = async () => {
    // Update status to 'battling' so admins can see it
    await fetch(`http://localhost:5000/api/users/${currentUser}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }, // Add this header
        body: JSON.stringify({ status: 'battling' })
    });
    // 1. Simulate Battle Logic
    const isWin = Math.random() > 0.5;
    const eloChange = isWin ? 20 : -15;

    // 2. Update Backend
    await updateUserStats(currentUser, isWin, eloChange);

    // 3. Set UI State
    setBattleResult({
      result: isWin ? 'VICTORY' : 'DEFEAT',
      eloGain: eloChange
    });
    setGameState('SUMMARY');
  };

  const handleReport = async () => {
    if (!opponent) return;
    setIsReporting(true);
    
    // Send real report to backend
    await submitReport(opponent.id, currentUser, "Cheating/Hacking");
    
    setIsReporting(false);
    setReportSuccess(true);
    
    // Reset success message after 3 seconds
    setTimeout(() => setReportSuccess(false), 3000);
  };

const findNewMatch = () => {
    setGameState('SEARCHING');
    setReportSuccess(false);
    setOpponent(null);
    setPokemonDeck([]); // Clear deck on new match search
    setTimeout(async () => {
      const match = await findMatch();
      // Fetch the Pokemon deck on finding a new match
      const deck = await fetchPokemonDeck(); 
      setOpponent(match);
      setPokemonDeck(deck); // Set the deck
      setGameState('PLAYING');
    }, 2000);
  };

  return {
    gameState,
    currentUser,
    opponent,
    isReporting,
    reportSuccess,
    handleLogin,
    handleReport,
    findNewMatch,
    pokemonDeck,
    battleResult,
    startBattle,
  };
};