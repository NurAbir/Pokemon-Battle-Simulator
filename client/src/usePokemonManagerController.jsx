/* PokemonManagerController.jsx - The Interface Layer */
import React from 'react';
import { PokemonModel } from './PokemonModel';
import PokemonManagerView from './PokemonManagerView';

const PokemonManagerController = () => {
  // 1. Get state and logic from the Model
  const model = PokemonModel();

  // 2. Pass everything to the View
  // The {...model} spreads the 'items' array into the view props
  return <PokemonManagerView {...model} />;
};

export default PokemonManagerController;