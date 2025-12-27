// utils/battleCalculator.js

// Type effectiveness chart
const TYPE_CHART = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

// Stat stage multipliers
const STAT_STAGE_MULTIPLIERS = {
  '-6': 2/8, '-5': 2/7, '-4': 2/6, '-3': 2/5, '-2': 2/4, '-1': 2/3,
  '0': 1,
  '1': 3/2, '2': 4/2, '3': 5/2, '4': 6/2, '5': 7/2, '6': 8/2
};

// Normalize string to lowercase for case-insensitive comparison
function normalizeString(str) {
  return str ? str.toLowerCase().trim() : '';
}

// Clamp stat stage between -6 and +6
function clampStatStage(stage) {
  return Math.max(-6, Math.min(6, stage));
}

// Apply stat stage changes (for moves like Sword Dance, Dragon Dance, etc.)
function applyStatChanges(pokemon, statChanges) {
  // statChanges should be an object like { atk: 2, spe: 1 }
  // Ensure statStages exists
  const currentStages = pokemon.statStages || { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  const updatedStages = { ...currentStages };
  
  for (const [stat, change] of Object.entries(statChanges)) {
    const normalizedStat = normalizeString(stat);
    
    // Initialize if doesn't exist
    if (updatedStages[normalizedStat] === undefined) {
      updatedStages[normalizedStat] = 0;
    }
    
    updatedStages[normalizedStat] = clampStatStage(updatedStages[normalizedStat] + change);
  }
  
  return {
    ...pokemon,
    statStages: updatedStages
  };
}

// Get stat stage change message
function getStatChangeMessage(statChanges) {
  const statNames = {
    atk: 'Attack',
    def: 'Defense',
    spa: 'Sp. Atk',
    spd: 'Sp. Def',
    spe: 'Speed'
  };
  
  const messages = [];
  
  for (const [stat, change] of Object.entries(statChanges)) {
    const normalizedStat = normalizeString(stat);
    const statName = statNames[normalizedStat] || stat;
    
    if (change === 0) continue;
    
    let amount;
    if (Math.abs(change) === 1) amount = '';
    else if (Math.abs(change) === 2) amount = ' sharply';
    else if (Math.abs(change) >= 3) amount = ' drastically';
    
    if (change > 0) {
      messages.push(`${statName} rose${amount}!`);
    } else {
      messages.push(`${statName} fell${amount}!`);
    }
  }
  
  return messages.join(' ');
}

// Calculate type effectiveness
function getTypeEffectiveness(moveType, defenderTypes) {
  let effectiveness = 1;
  const normalizedMoveType = normalizeString(moveType);
  
  for (const defenderType of defenderTypes) {
    const normalizedDefenderType = normalizeString(defenderType);
    if (TYPE_CHART[normalizedMoveType] && TYPE_CHART[normalizedMoveType][normalizedDefenderType] !== undefined) {
      effectiveness *= TYPE_CHART[normalizedMoveType][normalizedDefenderType];
    }
  }
  
  return effectiveness;
}

// Check if move gets STAB
function hasSTAB(moveType, attackerTypes) {
  const normalizedMoveType = normalizeString(moveType);
  return attackerTypes.some(type => normalizeString(type) === normalizedMoveType);
}

// Calculate critical hit
function isCriticalHit(critStage = 0) {
  // Critical hit rates based on stage
  const critRates = {
    0: 1/24,   // ~4.17%
    1: 1/8,    // 12.5%
    2: 1/2,    // 50%
    3: 1       // 100%
  };
  
  const rate = critRates[Math.min(critStage, 3)] || critRates[0];
  return Math.random() < rate;
}

// Check move accuracy
function moveHits(accuracy, attackerAccStage = 0, defenderEvaStage = 0) {
  if (accuracy === null || accuracy === undefined) return true; // Moves that never miss
  
  // Clamp stages
  attackerAccStage = clampStatStage(attackerAccStage);
  defenderEvaStage = clampStatStage(defenderEvaStage);
  
  // Calculate accuracy with stages
  let accMod = STAT_STAGE_MULTIPLIERS[attackerAccStage.toString()];
  let evaMod = STAT_STAGE_MULTIPLIERS[defenderEvaStage.toString()];
  
  let finalAccuracy = Math.min(100, accuracy * accMod / evaMod);
  
  return Math.random() * 100 < finalAccuracy;
}

// Get modified stat with stages (for critical hits, ignores unfavorable stages)
function getModifiedStat(baseStat, stage, isCrit = false, isAttacker = true) {
  // Clamp stage between -6 and +6
  stage = clampStatStage(stage);
  
  let effectiveStage = stage;
  
  // Critical hits ignore unfavorable stat changes
  if (isCrit) {
    if (isAttacker && stage < 0) {
      effectiveStage = 0; // Ignore negative attack stages
    } else if (!isAttacker && stage > 0) {
      effectiveStage = 0; // Ignore positive defense stages
    }
  }
  
  return Math.floor(baseStat * STAT_STAGE_MULTIPLIERS[effectiveStage.toString()]);
}

// Main damage calculation
function calculateDamage(attacker, defender, move, options = {}) {
  const {
    isCritOverride = null, // For testing specific scenarios
    weatherBoost = 1 // Can pass 1.5 for boosted, 0.5 for reduced, 1 for neutral
  } = options;
  
  const level = attacker.level;
  const power = move.power;
  
  // Determine if physical or special (normalize to lowercase)
  const category = normalizeString(move.category);
  const isPhysical = category === 'physical';
  
  // Check for critical hit
  const isCrit = isCritOverride !== null ? isCritOverride : isCriticalHit(move.critStage || 0);
  
  // Ensure stat stages exist with default values
  const attackerStages = attacker.statStages || { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  const defenderStages = defender.statStages || { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  
  // Get modified stats (critical hits ignore unfavorable stages)
  const attackStat = isPhysical ? 
    getModifiedStat(attacker.stats.atk, attackerStages.atk, isCrit, true) : 
    getModifiedStat(attacker.stats.spa, attackerStages.spa, isCrit, true);
  const defenseStat = isPhysical ? 
    getModifiedStat(defender.stats.def, defenderStages.def, isCrit, false) : 
    getModifiedStat(defender.stats.spd, defenderStages.spd, isCrit, false);
  
  // Base damage calculation
  let damage = Math.floor((2 * level / 5 + 2) * power * attackStat / defenseStat / 50) + 2;
  
  // Critical hit (1.5x in modern gens)
  if (isCrit) {
    damage = Math.floor(damage * 1.5);
  }
  
  // Random factor (85% to 100%)
  const randomFactor = (Math.floor(Math.random() * 16) + 85) / 100;
  damage = Math.floor(damage * randomFactor);
  
  // STAB (1.5x)
  if (hasSTAB(move.type, attacker.types)) {
    damage = Math.floor(damage * 1.5);
  }
  
  // Type effectiveness
  const typeEffectiveness = getTypeEffectiveness(move.type, defender.types);
  damage = Math.floor(damage * typeEffectiveness);
  
  // Weather modifier (applied after type effectiveness)
  if (weatherBoost !== 1) {
    damage = Math.floor(damage * weatherBoost);
  }
  
  // Burn halves physical damage (applied near the end)
  const status = normalizeString(attacker.statusCondition);
  if (status === 'burn' && isPhysical) {
    damage = Math.floor(damage / 2);
  }
  
  // Minimum damage is 1
  damage = Math.max(1, damage);
  
  return {
    damage,
    isCrit,
    typeEffectiveness,
    hasSTAB: hasSTAB(move.type, attacker.types)
  };
}

// Calculate damage range (useful for showing min-max damage)
function calculateDamageRange(attacker, defender, move, options = {}) {
  const damages = [];
  
  // Ensure stat stages exist with default values
  const attackerStages = attacker.statStages || { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  const defenderStages = defender.statStages || { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  
  // Calculate for all 16 random rolls
  for (let i = 0; i < 16; i++) {
    const level = attacker.level;
    const power = move.power;
    const category = normalizeString(move.category);
    const isPhysical = category === 'physical';
    const isCrit = options.isCritOverride !== null ? options.isCritOverride : false;
    
    const attackStat = isPhysical ? 
      getModifiedStat(attacker.stats.atk, attackerStages.atk, isCrit, true) : 
      getModifiedStat(attacker.stats.spa, attackerStages.spa, isCrit, true);
    const defenseStat = isPhysical ? 
      getModifiedStat(defender.stats.def, defenderStages.def, isCrit, false) : 
      getModifiedStat(defender.stats.spd, defenderStages.spd, isCrit, false);
    
    let damage = Math.floor((2 * level / 5 + 2) * power * attackStat / defenseStat / 50) + 2;
    
    if (isCrit) {
      damage = Math.floor(damage * 1.5);
    }
    
    const randomFactor = (85 + i) / 100;
    damage = Math.floor(damage * randomFactor);
    
    if (hasSTAB(move.type, attacker.types)) {
      damage = Math.floor(damage * 1.5);
    }
    
    const typeEffectiveness = getTypeEffectiveness(move.type, defender.types);
    damage = Math.floor(damage * typeEffectiveness);
    
    if (options.weatherBoost && options.weatherBoost !== 1) {
      damage = Math.floor(damage * weatherBoost);
    }
    
    const status = normalizeString(attacker.statusCondition);
    if (status === 'burn' && isPhysical) {
      damage = Math.floor(damage / 2);
    }
    
    damage = Math.max(1, damage);
    damages.push(damage);
  }
  
  return {
    min: Math.min(...damages),
    max: Math.max(...damages),
    damages
  };
}

// Get effectiveness message
function getEffectivenessMessage(effectiveness) {
  if (effectiveness === 0) return "It doesn't affect the opponent!";
  if (effectiveness < 1) return "It's not very effective...";
  if (effectiveness > 1) return "It's super effective!";
  return "";
}

module.exports = {
  calculateDamage,
  calculateDamageRange,
  getTypeEffectiveness,
  moveHits,
  getEffectivenessMessage,
  isCriticalHit,
  hasSTAB,
  getModifiedStat,
  applyStatChanges,
  getStatChangeMessage,
  clampStatStage
};