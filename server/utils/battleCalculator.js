// utils/battleCalculator.js

// Type effectiveness chart
const TYPE_CHART = {
  Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
  Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying: { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
  Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Fairy: { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 }
};

// Stat stage multipliers
const STAT_STAGE_MULTIPLIERS = {
  '-6': 2/8, '-5': 2/7, '-4': 2/6, '-3': 2/5, '-2': 2/4, '-1': 2/3,
  '0': 1,
  '1': 3/2, '2': 4/2, '3': 5/2, '4': 6/2, '5': 7/2, '6': 8/2
};

// Calculate type effectiveness
function getTypeEffectiveness(moveType, defenderTypes) {
  let effectiveness = 1;
  
  for (const defenderType of defenderTypes) {
    if (TYPE_CHART[moveType] && TYPE_CHART[moveType][defenderType] !== undefined) {
      effectiveness *= TYPE_CHART[moveType][defenderType];
    }
  }
  
  return effectiveness;
}

// Check if move gets STAB
function hasSTAB(moveType, attackerTypes) {
  return attackerTypes.includes(moveType);
}

// Calculate critical hit
function isCriticalHit() {
  // Base critical hit rate is 1/24 (~4.17%)
  return Math.random() < (1/24);
}

// Check move accuracy
function moveHits(accuracy, attackerAccStage = 0, defenderEvaStage = 0) {
  if (accuracy === 100) return true;
  
  // Calculate accuracy with stages
  let accMod = STAT_STAGE_MULTIPLIERS[attackerAccStage.toString()];
  let evaMod = STAT_STAGE_MULTIPLIERS[defenderEvaStage.toString()];
  
  let finalAccuracy = accuracy * accMod / evaMod;
  
  return Math.random() * 100 < finalAccuracy;
}

// Get modified stat with stages
function getModifiedStat(baseStat, stage) {
  return Math.floor(baseStat * STAT_STAGE_MULTIPLIERS[stage.toString()]);
}

// Main damage calculation
function calculateDamage(attacker, defender, move) {
  const level = attacker.level;
  const power = move.power;
  
  // Determine if physical or special
  const isPhysical = move.category === 'physical';
  const attackStat = isPhysical ? 
    getModifiedStat(attacker.stats.atk, attacker.statStages.atk) : 
    getModifiedStat(attacker.stats.spa, attacker.statStages.spa);
  const defenseStat = isPhysical ? 
    getModifiedStat(defender.stats.def, defender.statStages.def) : 
    getModifiedStat(defender.stats.spd, defender.statStages.spd);
  
  // Base damage calculation
  let damage = Math.floor((2 * level / 5 + 2) * power * attackStat / defenseStat / 50) + 2;
  
  // Critical hit (1.5x in modern gens)
  const isCrit = isCriticalHit();
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
  
  // Burn halves physical damage
  if (attacker.statusCondition === 'burn' && isPhysical) {
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
  getEffectivenessMessage,
  isCriticalHit,
  hasSTAB
};