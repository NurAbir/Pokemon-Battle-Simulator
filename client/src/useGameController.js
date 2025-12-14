/* useGameController.js - The Logic Layer */
import { useState } from 'react';
import { findMatch, submitReport, fetchPokemonDeck } from './GameModel';

export const useGameController = () => {
  const [gameState, setGameState] = useState('LOGIN'); // LOGIN, SEARCHING, PLAYING
  const [currentUser, setCurrentUser] = useState('');
  const [opponent, setOpponent] = useState(null);
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [pokemonDeck, setPokemonDeck] = useState([]);

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
  };
};