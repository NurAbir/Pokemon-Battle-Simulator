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

// Hardcoded special move data (for first 100 moves)
const MOVE_DATA = {
  // Status moves with stat changes
  'swords-dance': { statChanges: { atk: 2 }, target: 'self' },
  'whirlwind': { forceSwitch: true },
  'leer': { statChanges: { def: -1 }, target: 'opponent' },
  'growl': { statChanges: { atk: -1 }, target: 'opponent' },
  'tail-whip': { statChanges: { def: -1 }, target: 'opponent' },
  'string-shot': { statChanges: { spe: -2 }, target: 'opponent' },
  'sand-attack': { statChanges: { accuracy: -1 }, target: 'opponent' },
  'double-team': { statChanges: { evasion: 1 }, target: 'self' },
  'harden': { statChanges: { def: 1 }, target: 'self' },
  'withdraw': { statChanges: { def: 1 }, target: 'self' },
  'defense-curl': { statChanges: { def: 1 }, target: 'self' },
  'growth': { statChanges: { spa: 1, atk: 1 }, target: 'self' },
  'smokescreen': { statChanges: { accuracy: -1 }, target: 'opponent' },
  'minimize': { statChanges: { evasion: 2 }, target: 'self' },
  'screech': { statChanges: { def: -2 }, target: 'opponent' },
  'acid-armor': { statChanges: { def: 2 }, target: 'self' },
  'agility': { statChanges: { spe: 2 }, target: 'self' },
  'barrier': { statChanges: { def: 2 }, target: 'self' },
  
  // OHKO moves
  'guillotine': { ohko: true },
  'horn-drill': { ohko: true },
  'fissure': { ohko: true },
  
  // Multi-hit moves (2-5 hits)
  'double-slap': { multihit: { min: 2, max: 5 } },
  'comet-punch': { multihit: { min: 2, max: 5 } },
  'fury-attack': { multihit: { min: 2, max: 5 } },
  'pin-missile': { multihit: { min: 2, max: 5 } },
  'spike-cannon': { multihit: { min: 2, max: 5 } },
  'barrage': { multihit: { min: 2, max: 5 } },
  
  // Fixed multi-hit moves
  'double-kick': { multihit: { min: 2, max: 2 } },
  'twineedle': { multihit: { min: 2, max: 2 } },
  'bonemerang': { multihit: { min: 2, max: 2 } },
  
  // Priority moves
  'quick-attack': { priority: 1 },
  'counter': { priority: -5 }, // Negative priority
  
  // Recoil moves
  'take-down': { recoil: 0.25 },
  'double-edge': { recoil: 0.33 },
  'submission': { recoil: 0.25 },
};

// Get special move data
function getMoveData(moveName) {
  const normalized = normalizeString(moveName);
  return MOVE_DATA[normalized] || {};
}

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
  const currentStages = pokemon.statStages || { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, accuracy: 0, evasion: 0 };
  const updatedStages = { ...currentStages };
  
  for (const [stat, change] of Object.entries(statChanges)) {
    const normalizedStat = normalizeString(stat);
    
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
function getStatChangeMessage(pokemonName, statChanges) {
  const statNames = {
    atk: 'Attack',
    def: 'Defense',
    spa: 'Sp. Atk',
    spd: 'Sp. Def',
    spe: 'Speed',
    accuracy: 'accuracy',
    evasion: 'evasiveness'
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
      messages.push(`${pokemonName}'s ${statName} rose${amount}!`);
    } else {
      messages.push(`${pokemonName}'s ${statName} fell${amount}!`);
    }
  }
  
  return messages;
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
  const critRates = {
    0: 1/24,
    1: 1/8,
    2: 1/2,
    3: 1
  };
  
  const rate = critRates[Math.min(critStage, 3)] || critRates[0];
  return Math.random() < rate;
}

// Check OHKO move hits (level-based accuracy)
function ohkoHits(attackerLevel, defenderLevel) {
  if (attackerLevel < defenderLevel) return false;
  const accuracy = 30 + (attackerLevel - defenderLevel);
  return Math.random() * 100 < accuracy;
}

// Check move accuracy
function moveHits(accuracy, attackerAccStage = 0, defenderEvaStage = 0) {
  if (accuracy === null || accuracy === undefined) return true;
  
  attackerAccStage = clampStatStage(attackerAccStage);
  defenderEvaStage = clampStatStage(defenderEvaStage);
  
  let accMod = STAT_STAGE_MULTIPLIERS[attackerAccStage.toString()];
  let evaMod = STAT_STAGE_MULTIPLIERS[defenderEvaStage.toString()];
  
  let finalAccuracy = Math.min(100, accuracy * accMod / evaMod);
  
  return Math.random() * 100 < finalAccuracy;
}

// Get modified stat with stages
function getModifiedStat(baseStat, stage, isCrit = false, isAttacker = true) {
  stage = clampStatStage(stage);
  
  let effectiveStage = stage;
  
  if (isCrit) {
    if (isAttacker && stage < 0) {
      effectiveStage = 0;
    } else if (!isAttacker && stage > 0) {
      effectiveStage = 0;
    }
  }
  
  return Math.floor(baseStat * STAT_STAGE_MULTIPLIERS[effectiveStage.toString()]);
}

// Determine number of hits for multi-hit move
function getMultiHitCount(multihitData) {
  if (!multihitData) return 1;
  
  const { min, max } = multihitData;
  
  // Fixed hit count (like Double Kick always hits 2x)
  if (min === max) return min;
  
  // 2-5 hit moves: 35% for 2, 35% for 3, 15% for 4, 15% for 5
  const roll = Math.random() * 100;
  if (roll < 35) return 2;
  if (roll < 70) return 3;
  if (roll < 85) return 4;
  return 5;
}

// Main damage calculation
function calculateDamage(attacker, defender, move, options = {}) {
  const {
    isCritOverride = null,
    weatherBoost = 1
  } = options;
  
  const moveData = getMoveData(move.name);
  
  // Handle OHKO moves
  if (moveData.ohko) {
    const hits = ohkoHits(attacker.level, defender.level);
    if (hits) {
      return {
        damage: defender.currentHp,
        isOHKO: true,
        typeEffectiveness: 1,
        hasSTAB: false,
        isCrit: false
      };
    } else {
      return {
        damage: 0,
        missed: true,
        isOHKO: true,
        typeEffectiveness: 1,
        hasSTAB: false,
        isCrit: false
      };
    }
  }
  
  const level = attacker.level;
  const power = move.power;
  const category = normalizeString(move.category);
  const isPhysical = category === 'physical';
  
  const isCrit = isCritOverride !== null ? isCritOverride : isCriticalHit(move.critStage || 0);
  
  const attackerStages = attacker.statStages || { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  const defenderStages = defender.statStages || { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  
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
  
  const randomFactor = (Math.floor(Math.random() * 16) + 85) / 100;
  damage = Math.floor(damage * randomFactor);
  
  if (hasSTAB(move.type, attacker.types)) {
    damage = Math.floor(damage * 1.5);
  }
  
  const typeEffectiveness = getTypeEffectiveness(move.type, defender.types);
  damage = Math.floor(damage * typeEffectiveness);
  
  if (weatherBoost !== 1) {
    damage = Math.floor(damage * weatherBoost);
  }
  
  const status = normalizeString(attacker.statusCondition);
  if (status === 'burn' && isPhysical) {
    damage = Math.floor(damage / 2);
  }
  
  damage = Math.max(1, damage);
  
  // Calculate recoil if applicable
  let recoilDamage = 0;
  if (moveData.recoil) {
    recoilDamage = Math.max(1, Math.floor(damage * moveData.recoil));
  }
  
  return {
    damage,
    isCrit,
    typeEffectiveness,
    hasSTAB: hasSTAB(move.type, attacker.types),
    recoilDamage
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
  getTypeEffectiveness,
  moveHits,
  ohkoHits,
  getEffectivenessMessage,
  isCriticalHit,
  hasSTAB,
  getModifiedStat,
  applyStatChanges,
  getStatChangeMessage,
  clampStatStage,
  getMoveData,
  getMultiHitCount
};