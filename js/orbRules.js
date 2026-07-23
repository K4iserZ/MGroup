const SPECIAL_ORB_RULES = {
  addretaliate: { allowedBasicTypes: ['attack', 'critical', 'life', 'retaliate'] },
  addshield: { allowedBasicTypes: ['attack', 'critical', 'life', 'shield'] },
  addslash: { allowedBasicTypes: ['attack', 'critical', 'life', 'slash'] },
  addstrengthen: { allowedBasicTypes: ['attack', 'critical', 'life', 'strengthen'] },
  addweaken: { allowedBasicTypes: ['attack', 'critical', 'life', 'weaken'] },
  addregenerate: { allowedBasicTypes: ['attack', 'critical', 'life', 'regenerate'] },
  speed: { allowedBasicTypes: ['attack', 'critical', 'life'] }
};

function normalizeAbilityType(abilityType = '') {
  if (!abilityType) return '';
  const cleaned = String(abilityType).trim().toLowerCase().replace(/^ability_/, '');
  const baseKey = cleaned.split('_')[0] || '';
  const aliases = {
    regen: 'regenerate',
    shieldplus: 'shield',
    shield_plus: 'shield',
    shieldp: 'shield',
    retaliateplus: 'retaliate',
    slashplus: 'slash',
    strengthenplus: 'strengthen',
    weakenplus: 'weaken',
    regenerateplus: 'regenerate'
  };
  return aliases[baseKey] || baseKey;
}

function formatOrbCategoryLabel(typeKey = '') {
  return formatAbilityLabel(typeKey);
}

function formatAbilityLabel(abilityType = '') {
  const normalized = normalizeAbilityType(abilityType.replace(/^add/, ''));
  if (!normalized) return 'Ability';
  return normalized.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function buildAbilityDisplayEntries(baseAbilityType = '', specialType = '', baseValue = 0, addedValue = 0) {
  const entries = [];
  if (baseAbilityType) {
    entries.push({ label: formatAbilityLabel(baseAbilityType), value: baseValue });
  }
  if (specialType && !['speed'].includes(specialType) && addedValue) {
    entries.push({ label: formatAbilityLabel(specialType.replace(/^add/, '')), value: addedValue });
  }
  return entries;
}

function getAllowedBasicOrbTypes(specialType = '', baseAbilityType = '') {
  const baseTypes = ['attack', 'critical', 'life'];
  if (baseAbilityType) baseTypes.push(baseAbilityType);
  if (specialType && SPECIAL_ORB_RULES[specialType]) {
    return Array.from(new Set([...baseTypes, ...SPECIAL_ORB_RULES[specialType].allowedBasicTypes]));
  }
  return Array.from(new Set(baseTypes));
}

function getBasicOrbCategoryGroups(orbData = {}, specialType = '', baseAbilityType = '') {
  const allowedTypes = getAllowedBasicOrbTypes(specialType, baseAbilityType);
  const groups = [];
  Object.entries(orbData.basic || {}).forEach(([typeKey, orbs]) => {
    if (!Array.isArray(orbs) || orbs.length === 0) return;
    if (!allowedTypes.includes(typeKey)) return;
    groups.push({
      typeKey,
      label: formatOrbCategoryLabel(typeKey),
      orbs
    });
  });
  return groups;
}

function getOrbType(entry = {}) {
  const explicitType = entry?.orb?.type || entry?.type || '';
  if (explicitType) return explicitType;
  const category = entry?.orb?.category || entry?.category || '';
  return category.replace(/^basic_/, '');
}

function getOrbValue(entry = {}) {
  return Number(entry?.orb?.value ?? entry?.value ?? 0) || 0;
}

function getMultiplierFromOrbs(orbs = []) {
  if (!Array.isArray(orbs) || orbs.length === 0) return 1;
  const totalValue = orbs.reduce((sum, entry) => sum + getOrbValue(entry), 0);
  return 1 + (totalValue / 100);
}

function toSafeNumber(value) {
  return Number(Number(value).toFixed(10));
}

function calculateScaledAbilityValue(baseValue, baseAttack, currentAttack) {
  if (!baseAttack || !currentAttack) return 0;
  return toSafeNumber((baseValue / baseAttack) * currentAttack);
}

function applyOrbEffectsToStats(stats = {}, selectedOrbs = [], context = {}) {
  const next = { ...stats };
  const basicOrbs = selectedOrbs.filter(entry => entry.kind === 'basic');
  const specialOrbs = selectedOrbs.filter(entry => entry.kind === 'special');
  const specialEffect = specialOrbs[0];
  const specialType = specialEffect?.orb?.type || '';
  const baseAbilityType = context?.baseAbilityType || '';
  const allowedTypes = getAllowedBasicOrbTypes(specialType, baseAbilityType);

  const attackOrbs = basicOrbs.filter(entry => ['attack', 'critical'].includes(getOrbType(entry)));
  const lifeOrbs = basicOrbs.filter(entry => getOrbType(entry) === 'life');
  const abilityOrbs = basicOrbs.filter(entry => {
    const type = getOrbType(entry);
    return ['regenerate', 'retaliate', 'shield', 'slash', 'strengthen', 'weaken'].includes(type) && allowedTypes.includes(type);
  });

  const attackMultiplier = getMultiplierFromOrbs(attackOrbs);
  const lifeMultiplier = getMultiplierFromOrbs(lifeOrbs);
  const extraAbilityValue = specialType && !['speed'].includes(specialType)
    ? (specialEffect?.orb?.value || 0) + abilityOrbs.reduce((sum, entry) => sum + getOrbValue(entry), 0)
    : abilityOrbs.reduce((sum, entry) => sum + getOrbValue(entry), 0);

  const baseAtk1 = next.atk1F || 0;
  const baseAtk2 = next.atk2F || 0;
  const baseLife = next.lifeF || 0;
  const baseAtk1Ability = next.atk1AbilityF || 0;
  const baseAtk2Ability = next.atk2AbilityF || 0;
  const baseSpeed = next.speedF || 0;

  next.atk1F = Math.round(baseAtk1 * attackMultiplier);
  next.atk2F = Math.round(baseAtk2 * attackMultiplier);
  next.lifeF = Math.round(baseLife * lifeMultiplier);

  const recalculatedBaseAtk1Ability = calculateScaledAbilityValue(baseAtk1Ability, baseAtk1, next.atk1F);
  let recalculatedBaseAtk2Ability = calculateScaledAbilityValue(baseAtk2Ability, baseAtk2, next.atk2F);

  next.atk1BaseAbilityF = toSafeNumber(recalculatedBaseAtk1Ability);
  next.atk2BaseAbilityF = toSafeNumber(recalculatedBaseAtk2Ability);

  const atk1Added = toSafeNumber((next.atk1F / 100) * extraAbilityValue);
  const atk2Added = (next.atk2F && next.atk2F > 0) 
    ? toSafeNumber((next.atk2F / 100) * extraAbilityValue) 
    : 0;

  next.atk1AddedAbilityF = atk1Added;
  next.atk2AddedAbilityF = atk2Added;
  next.atk1TotalAbilityF = toSafeNumber(next.atk1BaseAbilityF + next.atk1AddedAbilityF);
  next.atk2TotalAbilityF = toSafeNumber(next.atk2BaseAbilityF + next.atk2AddedAbilityF);
  next.atk1AbilityF = next.atk1TotalAbilityF;
  next.atk2AbilityF = next.atk2TotalAbilityF;

  if (specialType === 'speed') {
    next.speedF = Number((baseSpeed * (1 + ((specialEffect?.orb?.value || 0) / 100))).toFixed(2));
  } else {
    next.speedF = baseSpeed;
  }

  return next;
}

export {
  normalizeAbilityType,
  formatAbilityLabel,
  formatOrbCategoryLabel,
  buildAbilityDisplayEntries,
  getAllowedBasicOrbTypes,
  getBasicOrbCategoryGroups,
  applyOrbEffectsToStats
};
