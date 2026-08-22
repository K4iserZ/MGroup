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
  
  // Garantiza buscar con o sin el prefijo "add" en SPECIAL_ORB_RULES
  const cleanSpecialKey = specialType.startsWith('add') ? specialType : `add${specialType}`;
  const rule = SPECIAL_ORB_RULES[specialType] || SPECIAL_ORB_RULES[cleanSpecialKey];

  if (rule) {
    return Array.from(new Set([...baseTypes, ...rule.allowedBasicTypes]));
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
  // 1. Si la entrada viene del selector/grupo
  if (entry?.groupKey) return entry.groupKey;
  if (entry?.category) return entry.category.replace(/^(basic_|special_)/, '');

  // 2. Si viene dentro del objeto orb
  const category = entry?.orb?.category || '';
  if (category) return category.replace(/^(basic_|special_)/, '');

  const explicitType = entry?.orb?.type || entry?.type || '';
  // Si explicitType es solo numérico (ej: "01"), ignorarlo y buscar alternativas
  if (explicitType && isNaN(explicitType)) return explicitType;

  return '';
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

  // Helper de normalización para asegurar MATCH perfecto
  const normalizeType = (t) => {
    if (!t) return '';
    let str = String(t).toLowerCase().trim();
    
    // Limpieza de prefijos comunes
    if (str.startsWith('special_add')) str = str.replace('special_add', '');
    if (str.startsWith('special_')) str = str.replace('special_', '');
    if (str.startsWith('basic_')) str = str.replace('basic_', '');
    if (str.startsWith('add')) str = str.replace('add', '');

    // Mapeo de alias a claves estándar
    if (str === 'drain life' || str === 'drain' || str === 'regenerate') return 'regenerate';
    if (str === 'wound' || str === 'slash') return 'slash';
    if (str === 'boost' || str === 'strengthen') return 'strengthen';
    if (str === 'curse' || str === 'weaken') return 'weaken';

    return str;
  };

  // Extraer el tipo del orbe especial
  const rawSpecialType = 
    specialEffect?.specialGroupKey || 
    specialEffect?.groupKey ||
    specialEffect?.orb?.category || 
    specialEffect?.orb?.specialType ||
    specialEffect?.type || '';

  const specialType = normalizeType(rawSpecialType);
  const baseAbilityType = normalizeType(context?.baseAbilityType || stats.baseAbilityType || stats.ability1Name);

  // Obtener los orbes permitidos
  const rawAllowed = getAllowedBasicOrbTypes(specialType, baseAbilityType);
  const allowedTypes = Array.isArray(rawAllowed) ? rawAllowed.map(normalizeType) : [];

  // Helper interno para el tipo de un orbe básico
  const getEntryType = (entry) => {
    const raw = 
      entry?.groupKey || 
      entry?.category ||
      getOrbType(entry) || 
      entry?.orb?.category || '';
    return normalizeType(raw);
  };

  const attackOrbs = basicOrbs.filter(entry => ['attack', 'critical'].includes(getEntryType(entry)));
  const lifeOrbs = basicOrbs.filter(entry => getEntryType(entry) === 'life');
  
  // Filtrar orbes básicos de habilidad válidos y permitidos
  const abilityOrbs = basicOrbs.filter(entry => {
    const type = getEntryType(entry);
    const validAbilities = ['regenerate', 'retaliate', 'shield', 'slash', 'strengthen', 'weaken'];
    
    const isAllowed = allowedTypes.length === 0 || allowedTypes.includes(type);
    return validAbilities.includes(type) && isAllowed;
  });

  const attackMultiplier = getMultiplierFromOrbs(attackOrbs);
  const lifeMultiplier = getMultiplierFromOrbs(lifeOrbs);

  // --- PORCENTAJES DE HABILIDAD ---
  // 1. Porcentaje de orbes básicos que potencian la HABILIDAD BASE
  const baseAbilityPct = abilityOrbs
    .filter(entry => getEntryType(entry) === baseAbilityType)
    .reduce((sum, entry) => sum + getOrbValue(entry), 0);

  // 2. Porcentaje de orbes básicos que potencian la HABILIDAD AGREGADA (Especial)
  const addedAbilityPctFromBasic = abilityOrbs
    .filter(entry => Boolean(specialType) && getEntryType(entry) === specialType)
    .reduce((sum, entry) => sum + getOrbValue(entry), 0);

  // 3. Porcentaje total para la habilidad agregada
  const isSpeedSpecial = specialType === 'speed' || String(rawSpecialType).includes('speed');
  const specialOrbValue = (specialType && !isSpeedSpecial) ? (specialEffect?.orb?.value || 0) : 0;
  const addedAbilityValue = specialOrbValue + addedAbilityPctFromBasic;

  const baseAtk1 = next.atk1F || 0;
  const baseAtk2 = next.atk2F || 0;
  const baseLife = next.lifeF || 0;
  const baseAtk1Ability = next.atk1AbilityF || 0;
  const baseAtk2Ability = next.atk2AbilityF || 0;
  const baseSpeed = next.speedF || 0;

  next.atk1F = Math.round(baseAtk1 * attackMultiplier);
  next.atk2F = Math.round(baseAtk2 * attackMultiplier);
  next.lifeF = Math.round(baseLife * lifeMultiplier);

  // ---------------------------------------------------------------------------
  // 1. CÁLCULO DE HABILIDAD BASE (Respeta si el mutante la tiene nativa en Atk 2)
  // ---------------------------------------------------------------------------
  const hasBaseAbilityInAtk2 = next.appliesTo === 'both' || (Boolean(next.ability2Name) && next.ability2Name !== '');

  const recalculatedBaseAtk1Ability = calculateScaledAbilityValue(baseAtk1Ability, baseAtk1, next.atk1F);
  const recalculatedBaseAtk2Ability = hasBaseAbilityInAtk2 
    ? calculateScaledAbilityValue(baseAtk2Ability, baseAtk2, next.atk2F) 
    : 0;

  const baseAbilityBonusFromAtk1 = Math.round((next.atk1F / 100) * baseAbilityPct);
  const baseAbilityBonusFromAtk2 = (hasBaseAbilityInAtk2 && next.atk2F > 0) 
    ? Math.round((next.atk2F / 100) * baseAbilityPct) 
    : 0;

  next.atk1BaseAbilityF = toSafeNumber(recalculatedBaseAtk1Ability + baseAbilityBonusFromAtk1);
  next.atk2BaseAbilityF = hasBaseAbilityInAtk2 
    ? toSafeNumber(recalculatedBaseAtk2Ability + baseAbilityBonusFromAtk2) 
    : 0;

  // ---------------------------------------------------------------------------
  // 2. CÁLCULO DE HABILIDAD AGREGADA (Orbe Especial -> Aplica a AMBOS ataques)
  // ---------------------------------------------------------------------------
  const atk1Added = toSafeNumber((next.atk1F / 100) * addedAbilityValue);
  const atk2Added = (next.atk2F && next.atk2F > 0) 
    ? toSafeNumber((next.atk2F / 100) * addedAbilityValue) 
    : 0;

  next.atk1AddedAbilityF = atk1Added;
  next.atk2AddedAbilityF = atk2Added;

  // Totales
  next.atk1TotalAbilityF = toSafeNumber(next.atk1BaseAbilityF + next.atk1AddedAbilityF);
  next.atk2TotalAbilityF = toSafeNumber(next.atk2BaseAbilityF + next.atk2AddedAbilityF);
  next.atk1AbilityF = next.atk1TotalAbilityF;
  next.atk2AbilityF = next.atk2TotalAbilityF;

  // Cálculo de velocidad
  if (isSpeedSpecial) {
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