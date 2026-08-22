/* Mutants data, parsing, and UI */

import { getAllowedBasicOrbTypes, getBasicOrbCategoryGroups, normalizeAbilityType, applyOrbEffectsToStats, formatAbilityLabel} from './orbRules.js';

let mutantsData = [];
let gachaData = {};
let orbsData = [];
let abilitiesConfig = {};
let selectedMutantDetail = null;

function formatDisplayNumber(value) {
    if (value === null || value === undefined || value === '') return value;

    const input = String(value).trim();
    if (!input) return value;

    const sanitized = input.replace(/,/g, '');
    const match = sanitized.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
    if (!match) return value;

    const [, sign, integerPart, decimalPart] = match;
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return `${sign}${formattedInteger}${decimalPart !== undefined ? `.${decimalPart}` : ''}`;
}

function extractNumber(value) {
    if (!value) return 0;
    const str = String(value).trim();
    const match = str.match(/^(\d+)/);
    return parseInt(match ? match[1] : str, 10) || 0;
}

function parseUnlockAttack(unlockAttack) {
    const genes = {};
    if (!unlockAttack) return genes;
    const parts = unlockAttack.split(';');
    parts.forEach(part => {
        const [attack, level, gen] = part.split(':');
        genes[attack] = gen === 'neutre' ? 'n' : gen;
    });
    return genes;
}

function parseUnlockAttackEvents(unlockAttack) {
    if (!unlockAttack) return [];
    return unlockAttack
        .split(';')
        .filter(Boolean)
        .map(part => {
            const [attack, level, gen] = part.split(':');
            return {
                attack: attack?.trim() || '',
                level: parseInt(level, 10) || 0,
                gene: gen === 'neutre' ? 'n' : (gen || 'n')
            };
        })
        .sort((a, b) => a.level - b.level);
}

function getAttackEvolutionState(mutantData, normalizedLevel, attackType) {
    const unlockEvents = parseUnlockAttackEvents(mutantData.unlockattack);
    const unlocked = unlockEvents.filter(event => event.level <= normalizedLevel);
    const fieldMap = { 1: 'atk1', 2: 'atk2', '1p': 'atk1p', '2p': 'atk2p' };
    const baseKey = attackType === 1 ? '1' : '2';
    const upgradeKey = attackType === 1 ? '1p' : '2p';
    const state = {
        unlocked: false,
        selectedKey: null,
        value: null,
        event: null,
        gene: 'n'
    };

    const baseUnlocked = unlocked.some(event => event.attack === baseKey);
    const upgradeUnlocked = unlocked.some(event => event.attack === upgradeKey);
    state.unlocked = baseUnlocked || upgradeUnlocked;
    state.selectedKey = upgradeUnlocked ? upgradeKey : (baseUnlocked ? baseKey : null);

    if (state.selectedKey) {
        const field = fieldMap[state.selectedKey];
        const event = unlocked.slice().reverse().find(item => item.attack === state.selectedKey) || null;
        state.event = event;
        state.gene = event?.gene || parseUnlockAttack(mutantData.unlockattack)[state.selectedKey] || 'n';
        state.value = extractNumber(mutantData[field]);
    }

    return state;
}

function isAOE(atkValue) {
    return atkValue && atkValue.includes(':AOE');
}

async function loadOrbsData() {
    try {
        const res = await fetch('orbs_organized.json');
        orbsData = await res.json();
    } catch (err) {
        console.error('Error loading orbs data:', err);
    }
}

async function loadGachaData() {
    try {
        const res = await fetch('gachav2.csv');
        const text = await res.text();
        parseGachaCSV(text);
    } catch (err) {
        console.error('Error loading gacha data:', err);
    }
}

async function loadAbilitiesConfig() {
    try {
        const res = await fetch('filescsv/abilitiesconfig.csv');
        const text = await res.text();
        parseAbilitiesConfigCSV(text);
    } catch (err) {
        console.error('Error loading abilities config:', err);
    }
}

function parseAbilitiesConfigCSV(csvText) {
    const lines = csvText.split('\n');
    if (lines.length < 2) return;
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split('|');
        if (parts.length >= 2) {
            const specimen = parts[0].trim();
            const appliesTo = parts[1].trim();
            abilitiesConfig[specimen] = appliesTo;
        }
    }
}

function parseGachaCSV(csvText) {
    const lines = csvText.split('\n');
    if (lines.length < 2) return;
    const headers = lines[0].split(',');
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length < 6) continue;
        const entry = {
            gachaId: parts[0].trim(),
            specimen: parts[1].trim(),
            stars: parseInt(parts[2]) || 0,
            bonus: parseFloat(parts[3]) || 0,
            odds: parts[4].trim(),
            source: parts[5].trim()
        };
        if (!gachaData[entry.specimen]) gachaData[entry.specimen] = [];
        gachaData[entry.specimen].push(entry);
    }
}

async function loadMutantsData() {
    try {
        await loadOrbsData();
        await loadAbilitiesConfig();
        const response = await fetch('Stats.csv');
        const csvText = await response.text();
        parseMutantsCSV(csvText);
        initMutantsSection();
        // Initialize compare section after mutants data is loaded
        const { initCompareSection } = await import('./compare.js');
        initCompareSection();
    } catch (error) {
        console.error('Error loading mutants data:', error);
    }
}

function parseMutantsCSV(csvText) {
    const lines = csvText.split('\n');
    if (lines.length < 2) return;
    const headers = lines[0].split('|');
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split('|');
        if (values.length < 3) continue;
        const mutant = {
            specimen: values[0].trim(),
            name: values[1].trim(),
            speed: parseInt(values[2]) || 0,
            odds: parseInt(values[3]) || 0,
            dna: values[4]?.trim() || '',
            life: parseInt(values[5]) || 0,
            incubMin: parseInt(values[6]) || 0,
            atk1: values[7]?.trim() || '',
            atk1p: values[8]?.trim() || '',
            atk2: values[9]?.trim() || '',
            atk2p: values[10]?.trim() || '',
            bank: parseInt(values[11]) || 0,
            unlockattack: values[12]?.trim() || '',
            type: values[13]?.trim() || '',
            recipe: values[14]?.trim() || '',
            abilities: values[15]?.trim() || '',
            abilityPct1: values[16]?.trim() || '',
            abilityPct2: values[17]?.trim() || '',
            orbSlots: values[18]?.trim() || '',
            attack1p_name: values[19]?.trim() || '',
            attack2p_name: values[20]?.trim() || '',
            description: values[21]?.trim() || ''
        };
        mutantsData.push(mutant);
    }
}

function initMutantsSection() {
    const searchInput = document.getElementById('mutantSearchInput');
    const genFilter = document.getElementById('genFilter');
    const backToListBtn = document.getElementById('backToMutantsListBtn');
    const clearSelectionBtn = document.getElementById('clearMutantSelectionBtn');
    const fameLevelInput = document.getElementById('mutantFameLevel');
    if (!searchInput) return;
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const selectedGen = genFilter?.value || '';
        if (selectedMutantDetail && searchTerm) {
            const match = findMutantMatch(searchTerm, selectedGen);
            if (match) {
                openMutantModal(match);
            }
            return;
        }
        filterAndDisplayMutants(searchTerm, selectedGen);
    });
    if (genFilter) {
        genFilter.addEventListener('change', (e) => {
            const searchTerm = searchInput.value.toLowerCase().trim();
            const selectedGen = e.target.value;
            if (selectedMutantDetail && searchTerm) {
                const match = findMutantMatch(searchTerm, selectedGen);
                if (match) {
                    openMutantModal(match);
                }
                return;
            }
            filterAndDisplayMutants(searchTerm, selectedGen);
        });
    }
    if (backToListBtn) {
        backToListBtn.addEventListener('click', showMutantsList);
    }
    if (clearSelectionBtn) {
        clearSelectionBtn.addEventListener('click', showMutantsList);
    }
    // Add listener for Fame Level changes
    if (fameLevelInput) {
        fameLevelInput.addEventListener('input', () => {
            if (selectedMutantDetail) {
                updateDetailPanelStats();
            }
        });
    }
    filterAndDisplayMutants('', '');
}

function findMutantMatch(searchTerm, selectedGen = '') {
    const normalizedTerm = searchTerm.toLowerCase().trim();
    if (!normalizedTerm) return null;
    const candidates = mutantsData.filter(mutant => {
        if (selectedGen && !mutant.dna.startsWith(selectedGen)) return false;
        return mutant.name.toLowerCase().includes(normalizedTerm) || mutant.specimen.toLowerCase().includes(normalizedTerm);
    });
    return candidates[0] || null;
}

function showMutantsList() {
    const container = document.getElementById('mutantsContainer');
    const detailPanel = document.getElementById('mutantsDetailPanel');
    const searchInput = document.getElementById('mutantSearchInput');
    const genFilter = document.getElementById('genFilter');
    if (container) {
        container.style.display = 'grid';
    }
    if (detailPanel) {
        detailPanel.style.display = 'none';
    }
    selectedMutantDetail = null;
    window.selectedMutantSkinType = 'basic';
    window.selectedMutantIsRestricted = false;
    const searchTerm = searchInput?.value.toLowerCase().trim() || '';
    const selectedGen = genFilter?.value || '';
    filterAndDisplayMutants(searchTerm, selectedGen);
}

function getMutantBySpecimen(specimenId) {
    if (!specimenId || !mutantsData.length) return null;
    return mutantsData.find(m => m.specimen.toLowerCase() === specimenId.toLowerCase()) || null;
}

function collectSelectedOrbs(specimenId) {
    if (!specimenId) return [];
    return Array.from(document.querySelectorAll(`[data-specimen="${specimenId}"]`))
        .filter(btn => btn.dataset.selectedOrbName)
        .map(btn => {
            const typeKey = btn.dataset.kind === 's'
                ? (btn.dataset.selectedSpecialType || '')
                : (btn.dataset.selectedOrbType || '');
            return {
                kind: btn.dataset.kind === 's' ? 'special' : 'basic',
                orb: {
                    id: btn.dataset.selectedOrbId || '',
                    name: btn.dataset.selectedOrbName || '',
                    type: typeKey,
                    value: Number(btn.dataset.selectedOrbValue || 0),
                    category: btn.dataset.kind === 's' ? typeKey : `basic_${typeKey}`
                }
            };
        });
}

function updateDetailPanelStats() {
    if (!selectedMutantDetail) return;
    const fameLevelInput = document.getElementById('mutantFameLevel');
    const fameLevel = Math.max(1, parseInt(fameLevelInput?.value, 10) || 25);
    const skinType = window.selectedMutantSkinType || 'basic';
    const isRestricted = window.selectedMutantIsRestricted || false;
    const starInfo = getStarInfo(selectedMutantDetail.specimen, isRestricted);
    const info = starInfo[skinType] || {};
    const bonus = info.bonusGacha || 0;
    const starVal = info.starValue || 0;
    const stats = calculateMutantStats(selectedMutantDetail, fameLevel, skinType, bonus, starVal);
    const selectedOrbs = collectSelectedOrbs(selectedMutantDetail.specimen);
    const baseAbilityType = getMutantBaseAbilityType(selectedMutantDetail);
    const specialOrbType = getActiveSpecialOrbType(selectedMutantDetail.specimen);
    const orbAdjustedStats = applyOrbEffectsToStats(stats, selectedOrbs, { baseAbilityType });
    orbAdjustedStats.skinLabel = starInfo[skinType]?.label || skinType;
    orbAdjustedStats.baseAbilityType = baseAbilityType;
    orbAdjustedStats.specialOrbType = specialOrbType;
    renderStatsDisplay(selectedMutantDetail, orbAdjustedStats);
}

function filterAndDisplayMutants(searchTerm, selectedGen = '') {
    const container = document.getElementById('mutantsContainer');
    const detailPanel = document.getElementById('mutantsDetailPanel');
    if (!container) return;
    if (detailPanel) {
        detailPanel.style.display = 'none';
    }
    container.style.display = 'grid';
    let filtered = mutantsData;
    if (selectedGen) filtered = filtered.filter(m => m.dna.startsWith(selectedGen));
    if (searchTerm) filtered = filtered.filter(m => m.name.toLowerCase().includes(searchTerm) || m.specimen.toLowerCase().includes(searchTerm));
    container.innerHTML = '';
    if (filtered.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #95a5a6; padding: 2rem;">No mutants found</div>';
        return;
    }
    filtered.forEach(mutant => { const card = createMutantCard(mutant); container.appendChild(card); });
}

function createMutantCard(mutant) {
    const card = document.createElement('div');
    card.className = 'mutant-card';
    const imageUrl = `https://s-ak.kobojo.com/mutants/assets/thumbnails/${mutant.specimen.toLowerCase()}.png`;
    card.innerHTML = `
        <div class="mutant-image"><img src="${imageUrl}" alt="${mutant.name}" onerror="this.parentElement.innerHTML='<div class=\'mutant-image-fallback\'>🧬</div>'"></div>
        <div class="mutant-name">${mutant.name}</div>
        <div class="mutant-specimen">${mutant.specimen}</div>
        <div class="mutant-type">${mutant.dna || 'N/A'}</div>
    `;
    card.addEventListener('click', () => openMutantModal(mutant));
    return card;
}

function getMutantFromCsv(mutantName) {
    if (!mutantsData || mutantsData.length === 0) return null;
    const mutant = mutantsData.find(m => m.name.toLowerCase() === mutantName.toLowerCase());
    return mutant || null;
}

function getStarInfo(specimenId, isRestrictedType = false) {
    const starInfo = {};
    
    // Siempre incluir basic
    starInfo.basic = { starValue: starValues['basic'], bonusGacha: 0, label: 'Basic', image: 'image/icon/btn_black.png' };
    
    // Solo incluir bronze/silver/gold/platinum si NO es tipo restringido
    if (!isRestrictedType) {
        starInfo.bronze = { starValue: starValues['bronze'], bonusGacha: 0, label: 'Bronze', image: ICONS.stars['bronze'] };
        starInfo.silver = { starValue: starValues['silver'], bonusGacha: 0, label: 'Silver', image: ICONS.stars['silver'] };
        starInfo.gold = { starValue: starValues['gold'], bonusGacha: 0, label: 'Gold', image: ICONS.stars['gold'] };
        starInfo.platinum = { starValue: starValues['platinum'], bonusGacha: 0, label: 'Platinum', image: ICONS.stars['platinum'] };
    }
    
    // Siempre agregar gacha options
    const gachaList = gachaData[specimenId] || [];
    gachaList.forEach((entry, idx) => {
        const key = `gacha_${idx}`;
        const starKey = numericToStarKey[entry.stars] || 'basic';
        const starVal = starValues[starKey] || 0;
        const label = `Gacha ${entry.gachaId} (${entry.stars}★, bonus ${entry.bonus})`;
        starInfo[key] = {
            starValue: starVal,
            bonusGacha: entry.bonus || 0,
            label,
            imageSuffix: entry.gachaId,
            gachaIcon: `https://s-ak.kobojo.com/mutants/assets/gachacontent/icon_${entry.gachaId}.png`,
            image: `https://s-ak.kobojo.com/mutants/assets/gachacontent/icon_${entry.gachaId}.png`
        };
    });
    
    return starInfo;
}

const starValues = { 'platinum': 100, 'gold': 75, 'silver': 30, 'bronze': 10, 'basic': 0 };
const numericToStarKey = { 0: 'basic', 1: 'bronze', 2: 'silver', 3: 'gold', 4: 'platinum' };

// Mapeo de excepciones para nombres de abilities
const abilityKeyMapping = {
    'regen': 'regenerate'
};

// icon URLs for stats and other UI elements
const ICONS = {
    life: 'https://s-ak.kobojo.com/mutants/assets/mobile/hud/common_files/icon_hp.png',
    speed: 'https://s-ak.kobojo.com/mutants/assets/mobile/hud/common_files/icon_speed.png',
    gene: {
        A: 'https://s-ak.kobojo.com/mutants/assets/mobile/hud/fight_ui/gene_a.png',
        B: 'https://s-ak.kobojo.com/mutants/assets/mobile/hud/fight_ui/gene_b.png',
        C: 'https://s-ak.kobojo.com/mutants/assets/mobile/hud/fight_ui/gene_c.png',
        D: 'https://s-ak.kobojo.com/mutants/assets/mobile/hud/fight_ui/gene_d.png',
        E: 'https://s-ak.kobojo.com/mutants/assets/mobile/hud/fight_ui/gene_e.png',
        F: 'https://s-ak.kobojo.com/mutants/assets/mobile/hud/fight_ui/gene_f.png',
        ALL: 'https://s-ak.kobojo.com/mutants/assets/mobile/hud/fight_ui/gene_all.png'
    },
    stars: {
        bronze: 'https://s-ak.kobojo.com/mutants/assets/mobile/thumbnails/star_bronze.png',
        silver: 'https://s-ak.kobojo.com/mutants/assets/mobile/thumbnails/star_silver.png',
        gold: 'https://s-ak.kobojo.com/mutants/assets/mobile/thumbnails/star_gold.png',
        platinum: 'https://s-ak.kobojo.com/mutants/assets/mobile/thumbnails/star_platinum.png',
        basic: ''
    }
};

function generateGenesHtml(dnaStr) {
    if (!dnaStr || dnaStr.trim() === '') {
        return '';
    }
    
    const dna = dnaStr.trim().toUpperCase();
    // use an inline-flex container centered by a text-align parent so
    // multiple genes (especially two) appear together and centered
    let genesHtml = '<div style="text-align: center;"><div style="display: inline-flex; align-items: center;">';

    for (let i = 0; i < dna.length; i++) {
        const geneChar = dna[i];
        const geneIcon = ICONS.gene[geneChar];
        if (geneIcon) {
            genesHtml += `<img src="${geneIcon}" alt="Gene ${geneChar}" style="width: 50px; height: 50px; object-fit: contain; display: block;" onerror="this.style.display='none';" title="Gene ${geneChar}">`;
        }
    }

    genesHtml += '</div></div>';
    return genesHtml;
}

function generateOrbSlotsHtml(orbSlotsStr, specimenId = '') {
    if (!orbSlotsStr || orbSlotsStr.trim() === '') {
        return '';
    }
    
    const orbTypes = orbSlotsStr.split(';');
    let orbHtml = `<div id="orbSlotsContainer_${specimenId}" style="position: relative;">
        <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">`;
    
    orbTypes.forEach((orbType, idx) => {
        const typeKey = orbType.charAt(0).toLowerCase();
        const imageUrl = typeKey === 'n' 
            ? 'https://s-ak.kobojo.com/mutants/assets/orb/orb_slot.png' 
            : 'https://s-ak.kobojo.com/mutants/assets/orb/orb_slot_spe.png';
        
        if (typeKey === 'n') {
            orbHtml += `<button id="orbSlot_${specimenId}_${idx}" class="orb-slot-btn" data-specimen="${specimenId}" data-slot="${idx}" data-kind="n" style="position: relative; background: none; border: 2px solid #3498db; border-radius: 6px; padding: 4px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#e94560'" onmouseout="this.style.borderColor='#3498db'">
                <div id="orbOverlay_${specimenId}_${idx}" class="orb-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;pointer-events:none;"></div>
                <img src="${imageUrl}" alt="Orb n" style="width: 55px; height: 55px; object-fit: contain; display: block; border-radius: 4px;" onerror="this.style.display='none';">
            </button>`;
        } else {
            orbHtml += `<button id="orbSlot_${specimenId}_${idx}" class="orb-slot-btn" data-specimen="${specimenId}" data-slot="${idx}" data-kind="s" style="position: relative; background: none; border: 2px dashed #9b59b6; border-radius: 6px; padding: 4px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#8e44ad'" onmouseout="this.style.borderColor='#9b59b6'">
                <div id="orbOverlay_${specimenId}_${idx}" class="orb-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;pointer-events:none;"></div>
                <img src="${imageUrl}" alt="Orb s" style="width: 55px; height: 55px; object-fit: contain; display: block; border-radius: 4px;" onerror="this.style.display='none';">
            </button>`;
        }
    });
    
    orbHtml += '</div></div>';
    return orbHtml;
}

function getMutantBaseAbilityType(mutantData) {
    if (!mutantData?.abilities) return '';
    const normalizedTypes = [];
    mutantData.abilities.split(';').map(entry => entry.trim()).filter(Boolean).forEach(entry => {
        const [, ability] = entry.split(':');
        const normalizedType = normalizeAbilityType(ability);
        if (normalizedType && !normalizedTypes.includes(normalizedType)) {
            normalizedTypes.push(normalizedType);
        }
    });
    return normalizedTypes[0] || '';
}

function getOrbSlotConfig(mutantData) {
    const rawSlots = mutantData?.orbSlots || '';
    const slotEntries = rawSlots.split(';').map(entry => String(entry).trim()).filter(Boolean);
    const basicCount = slotEntries.filter(entry => String(entry).charAt(0).toLowerCase() === 'n').length;
    const specialCount = slotEntries.length - basicCount;
    return {
        total: slotEntries.length,
        basicCount,
        specialCount,
        hasSpecial: specialCount > 0
    };
}

function getActiveSpecialOrbType(specimenId) {
    if (!specimenId) return '';
    const selectedSlot = Array.from(document.querySelectorAll(`[data-specimen="${specimenId}"][data-kind="s"]`)).find((btn) => {
        return Boolean(btn.dataset.selectedSpecialType);
    });
    return selectedSlot?.dataset.selectedSpecialType || '';
}

function getSelectedOrbPreviewItems(specimenId) {
    if (!specimenId) return [];
    return Array.from(document.querySelectorAll(`[data-specimen="${specimenId}"]`))
        .map(btn => ({
            slot: btn.dataset.slot || '',
            kind: btn.dataset.kind || '',
            name: btn.dataset.selectedOrbName || '',
            orbId: btn.dataset.selectedOrbId || ''
        }))
        .filter(item => item.name);
}

function buildOrbPreviewHtml(mutantData) {
    if (!mutantData) return '';
    const slotConfig = getOrbSlotConfig(mutantData);
    const selectedItems = getSelectedOrbPreviewItems(mutantData.specimen || '');
    const selectedSummary = selectedItems.length > 0
        ? selectedItems.map(item => `<span style="display:inline-flex; align-items:center; gap:0.35rem; color:#ecf0f1; font-size:0.78rem;">${item.kind === 's' ? '★' : '●'} ${item.name}</span>`).join('')
        : '<span style="color:#95a5a6; font-size:0.78rem;">No orbs selected yet</span>';

    return `
        <div style="background: linear-gradient(135deg, rgba(22,33,62,0.95) 0%, rgba(15,52,96,0.95) 100%); border: 1px solid rgba(52, 152, 219, 0.35); border-radius: 10px; padding: 0.75rem 0.9rem; box-shadow: 0 8px 25px rgba(0,0,0,0.2);">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.6rem; margin-bottom:0.45rem; flex-wrap:wrap;">
                <div style="color:#f39c12; font-weight:700; font-size:0.85rem;">Orb selection</div>
                <div style="color:#95a5a6; font-size:0.75rem;">${slotConfig.basicCount} basic • ${slotConfig.specialCount} special</div>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:0.4rem; align-items:center; min-height:1.2rem;">${selectedSummary}</div>
        </div>
    `;
}

function refreshOrbPreview(specimenId) {
    const preview = document.getElementById('mutantOrbPreview');
    if (!preview || !selectedMutantDetail) return;
    preview.innerHTML = buildOrbPreviewHtml(selectedMutantDetail);
}

function getAbilityBaseKey(ability) {
    if (!ability) return '';
    const key = ability.trim().toLowerCase().replace(/^ability_/, '');
    const baseKey = key.split('_')[0] || '';
    // Aplicar mapeo de excepciones si existe
    return abilityKeyMapping[baseKey] || baseKey;
}

function getAbilityIconUrl(ability) {
    const baseKey = getAbilityBaseKey(ability);
    return baseKey ? `image/abilities/ability_${baseKey}_big.png` : '';
}

function calculateMutantStats(mutantData, fameLevel, starType = 'platinum', bonusGacha = 0, starValueOverride = null) {
    const globalAdjust = 100;
    const starValue = (starValueOverride !== null) ? starValueOverride : (starValues[starType] ?? starValues['platinum']);
    const bonusStar = 100 + starValue;
    const normalizedFameLevel = Math.max(1, parseInt(fameLevel, 10) || 25);
    let level = 100 + 10 * (normalizedFameLevel - 1);
    const abilitiesStr = mutantData.abilities || '';
    const abilityNames = {};
    const abilityIcons = {};
    const appliesTo = abilitiesConfig[mutantData.specimen] || 'both';
    const unlockEvents = parseUnlockAttackEvents(mutantData.unlockattack);
    const unlocked = unlockEvents.filter(event => event.level <= normalizedFameLevel);

    if (abilitiesStr) {
        const abilityParts = abilitiesStr.split(';');
        abilityParts.forEach(part => {
            const [num, ability] = part.split(':');
            if (num && ability) {
                const abilityKey = getAbilityBaseKey(ability);
                const abilityName = abilityKey
                    ? abilityKey.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                    : '';
                abilityNames[num] = abilityName;
                abilityIcons[num] = getAbilityIconUrl(ability);
            }
        });
    }

    const attack1State = getAttackEvolutionState(mutantData, normalizedFameLevel, 1);
    const attack2State = getAttackEvolutionState(mutantData, normalizedFameLevel, 2);
    const lifeValue = parseInt(mutantData.life) || 0;
    const speedValue = parseInt(mutantData.speed) || 0;
    const abilityPct2 = (parseInt(mutantData.abilityPct2) || 0);
    const lifeF = Math.round((lifeValue * (bonusStar - bonusGacha) * level * globalAdjust) / 1000000);
    const bonusGachaDecimal = bonusGacha / 100;
    const atk1Value = attack1State.value === null ? 0 : attack1State.value;
    const atk2Value = attack2State.value === null ? 0 : attack2State.value;
    const atk1F = attack1State.value === null ? 0 : Math.round(Math.abs(((atk1Value * bonusGachaDecimal + atk1Value) * bonusStar * level * globalAdjust) / 1000000));
    const atk2F = attack2State.value === null ? 0 : Math.round(Math.abs(((atk2Value * bonusGachaDecimal + atk2Value) * bonusStar * level * globalAdjust) / 1000000));
    const atk1AbilityF = Math.round(Math.abs((atk1F / 100) * (abilityPct2)));
    const atk2AbilityF = appliesTo === 'both' ? Math.round(Math.abs((atk2F / 100) * (abilityPct2))) : 0;
    const speedF = (speedValue > 0 ? 10 / (speedValue / 100) : 0).toFixed(2);
    return {
        specimen: mutantData.specimen,
        name: mutantData.name,
        type: mutantData.type,
        fameLevel: normalizedFameLevel,
        level: level,
        lifeF: lifeF,
        speedF: speedF,
        atk1F: atk1F,
        atk1AbilityF: atk1AbilityF,
        atk2F: atk2F,
        atk2AbilityF: atk2AbilityF,
        ability1Name: abilityNames['1'] || 'Unknown',
        ability2Name: appliesTo === 'both' ? (abilityNames['2'] || 'Unknown') : '',
        ability1Icon: abilityIcons['1'] || '',
        ability2Icon: appliesTo === 'both' ? (abilityIcons['2'] || '') : '',
        starType: starType,
        unlockEvents,
        unlocked,
        attack1State,
        attack2State,
        attack1p_name: mutantData.attack1p_name || 'Attack 1',
        attack2p_name: mutantData.attack2p_name || 'Attack 2',
        description: mutantData.description || ''
    };
}

function getAllowedBasicOrbTypesForMutant(mutantData) {
    const baseAbilityType = getMutantBaseAbilityType(mutantData);
    return getAllowedBasicOrbTypes('', baseAbilityType);
}

function getBasicOrbs(mutantData, types = []) {
    if (!orbsData || !orbsData.basic) return [];
    const allowed = (types.length > 0 ? types : getAllowedBasicOrbTypesForMutant(mutantData)).filter(Boolean);
    const basicOrbs = [];
    allowed.forEach(typeKey => {
        const orbs = orbsData.basic[typeKey];
        if (Array.isArray(orbs) && orbs.length > 0) {
            basicOrbs.push(...orbs);
        }
    });
    return basicOrbs;
}

function getAllOrbsByType(typeKey) {
    if (!orbsData) return [];
    if (orbsData.basic && orbsData.basic[typeKey]) return orbsData.basic[typeKey];
    if (orbsData.special && orbsData.special[typeKey]) return orbsData.special[typeKey];
    return [];
}

// helper to populate a dropdown with the two base types
function populateBasicOrbOptions(specimenId, slotIndex, dropdown) {
    dropdown.innerHTML = '';
    const mutantData = getMutantBySpecimen(specimenId);
    const slotEl = document.getElementById(`orbSlot_${specimenId}_${slotIndex}`);
    const isSpecialSlot = slotEl && slotEl.dataset && slotEl.dataset.kind === 's';
    const specialType = isSpecialSlot ? (slotEl.dataset.selectedSpecialType || '') : getActiveSpecialOrbType(specimenId);

    // delete orb button always visible in first list
    const del = document.createElement('button');
    del.style.cssText = 'display:flex;align-items:center;gap:0.6rem;background:rgba(231,76,60,0.1);border:1px solid #e74c3c;border-radius:6px;padding:0.6rem;width:100%;text-align:left;cursor:pointer;color:#e74c3c;font-weight:600;';
    del.onmouseover = () => { del.style.background = 'rgba(231,76,60,0.15)'; };
    del.onmouseout  = () => { del.style.background = 'rgba(231,76,60,0.1)'; };
    del.onclick     = (e) => { e.stopPropagation(); removeOrbOverlay(specimenId, slotIndex); };
    del.innerHTML   = '🗑️ Delete orb';
    dropdown.appendChild(del);

    if (isSpecialSlot) {
        const keys = orbsData && orbsData.special ? Object.keys(orbsData.special) : [];
        const baseAbility = getMutantBaseAbilityType(mutantData);
        if (keys.length === 0) return;
        keys.forEach((key) => {
            // exclude special orb that matches the specimen's own base ability
            const keyAbility = String(key).replace(/^add/, '');
            if (baseAbility && keyAbility === baseAbility) return;
            const firstOrb = orbsData.special[key] && orbsData.special[key][0];
            const orbImageUrl = firstOrb ? `https://s-ak.kobojo.com/mutants/assets/thumbnails/${firstOrb.id}.png` : '';
            const b = document.createElement('button');
            b.style.cssText = 'display:flex;align-items:center;gap:0.6rem;background:rgba(52,152,219,0.1);border:1px solid #3498db;border-radius:6px;padding:0.6rem;width:100%;text-align:left;cursor:pointer;';
            b.onmouseover = () => { b.style.background = 'rgba(233,69,96,0.1)'; };
            b.onmouseout = () => { b.style.background = 'rgba(52,152,219,0.1)'; };
            b.onclick = (e) => { e.stopPropagation(); showOrbsByType(specimenId, slotIndex, key); };
            b.innerHTML = `${orbImageUrl ? `<img src="${orbImageUrl}" alt="${key}" style="width:50px;height:50px;object-fit:contain;border-radius:4px;flex-shrink:0;" onerror="this.style.display='none';">` : ''}<span style="color:#ecf0f1; font-size:0.9rem; font-weight:500;">${key}</span>`;
            dropdown.appendChild(b);
        });
        return;
    }

    const categoryGroups = getBasicOrbCategoryGroups(orbsData, specialType, getMutantBaseAbilityType(mutantData));
    if (categoryGroups.length === 0) return;

    categoryGroups.forEach((group) => {
        const groupButton = document.createElement('button');
        groupButton.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:0.6rem;background:rgba(52,152,219,0.1);border:1px solid #3498db;border-radius:6px;padding:0.6rem;width:100%;text-align:left;cursor:pointer;color:#ecf0f1;';
        groupButton.onmouseover = () => { groupButton.style.background = 'rgba(233,69,96,0.1)'; };
        groupButton.onmouseout = () => { groupButton.style.background = 'rgba(52,152,219,0.1)'; };
        groupButton.onclick = (e) => { e.stopPropagation(); showOrbsByType(specimenId, slotIndex, group.typeKey); };
        groupButton.innerHTML = `<span style="font-weight:600;">${group.label}</span><span style="color:#95a5a6; font-size:0.8rem;">${group.orbs.length} levels</span>`;
        dropdown.appendChild(groupButton);
    });
}

function showOrbDropdown(specimenId, slotIndex) {
    const btn = document.getElementById(`orbSlot_${specimenId}_${slotIndex}`);
    const container = document.getElementById(`orbSlotsContainer_${specimenId}`);
    if (!btn || !container) return;

    // toggle removal if already present
    let dropdown = document.getElementById(`orbDropdown_${specimenId}_${slotIndex}`);
    if (dropdown) { dropdown.remove(); return; }

    dropdown = document.createElement('div');
    dropdown.id = `orbDropdown_${specimenId}_${slotIndex}`;
    dropdown.style.cssText = 'position:absolute; background: linear-gradient(135deg, #16213e 0%, #0f3460 100%); border: 2px solid #e94560; border-radius: 8px; padding: 1rem; z-index: 10000; box-shadow: 0 8px 20px rgba(0,0,0,0.6); min-width: 240px; max-width: 320px;';

    populateBasicOrbOptions(specimenId, slotIndex, dropdown);

    container.appendChild(dropdown);

    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const top = btnRect.bottom - containerRect.top + 4;
    const left = btnRect.left - containerRect.left + btnRect.width / 2;
    dropdown.style.top = `${top}px`;
    dropdown.style.left = `${left}px`;
    dropdown.style.transform = 'translateX(-50%)';

    setTimeout(() => {
        const closeDropdown = (e) => {
            const dd = document.getElementById(`orbDropdown_${specimenId}_${slotIndex}`);
            if (dd && !dd.contains(e.target) && e.target.id !== `orbSlot_${specimenId}_${slotIndex}`) {
                dd.remove();
                document.removeEventListener('click', closeDropdown);
            }
        };
        document.addEventListener('click', closeDropdown);
    }, 0);
}

function removeOrbOverlay(specimenId, slotIndex) {
    const overlay = document.getElementById(`orbOverlay_${specimenId}_${slotIndex}`);
    if (overlay) {
        overlay.innerHTML = '';
    }
    const orbBtn = document.getElementById(`orbSlot_${specimenId}_${slotIndex}`);
    if (orbBtn) {
        orbBtn.removeAttribute('data-selected-orb-name');
        orbBtn.removeAttribute('data-selected-orb-id');
        orbBtn.removeAttribute('data-selected-orb-type');
        orbBtn.removeAttribute('data-selected-orb-value');
        orbBtn.removeAttribute('data-selected-special-type');
    }
    refreshOrbPreview(specimenId);
    updateDetailPanelStats();
}

function showSpecialCategories(specimenId, slotIndex) {
    const dropdown = document.getElementById(`orbDropdown_${specimenId}_${slotIndex}`);
    if (!dropdown || !orbsData || !orbsData.special) return;

    dropdown.innerHTML = '';

    const keys = Object.keys(orbsData.special);
    const baseAbility = getMutantBaseAbilityType(getMutantBySpecimen(specimenId));
    if (keys.length === 0) return;

    // add back button to return to initial list
    const backBtn = document.createElement('button');
    backBtn.style.cssText = 'display:flex;align-items:center;gap:0.6rem;background:rgba(52,152,219,0.1);border:1px solid #3498db;border-radius:6px;padding:0.6rem;width:100%;text-align:left;cursor:pointer;margin-bottom:0.6rem;';
    backBtn.onmouseover = () => { backBtn.style.background = 'rgba(233,69,96,0.1)'; };
    backBtn.onmouseout = () => { backBtn.style.background = 'rgba(52,152,219,0.1)'; };
    backBtn.onclick = (e) => { e.stopPropagation(); populateBasicOrbOptions(specimenId, slotIndex, dropdown); };
    backBtn.textContent = '← Back';
    dropdown.appendChild(backBtn);

    // list special categories using same style as basic options
    keys.forEach((key) => {
        const keyAbility = String(key).replace(/^add/, '');
        if (baseAbility && keyAbility === baseAbility) return;
        const firstOrb = orbsData.special[key] && orbsData.special[key][0];
        const orbImageUrl = firstOrb ? `https://s-ak.kobojo.com/mutants/assets/thumbnails/${firstOrb.id}.png` : '';
        const b = document.createElement('button');
        b.style.cssText = 'display:flex;align-items:center;gap:0.6rem;background:rgba(52,152,219,0.1);border:1px solid #3498db;border-radius:6px;padding:0.6rem;width:100%;text-align:left;cursor:pointer;';
        b.onmouseover = () => { b.style.background = 'rgba(233,69,96,0.1)'; };
        b.onmouseout = () => { b.style.background = 'rgba(52,152,219,0.1)'; };
        b.onclick = (e) => { e.stopPropagation(); showOrbsByType(specimenId, slotIndex, key); };
        b.innerHTML = `${orbImageUrl ? `<img src="${orbImageUrl}" alt="${key}" style="width:40px;height:40px;object-fit:contain;border-radius:4px;flex-shrink:0;" onerror="this.style.display='none';">` : ''}<span style="color:#ecf0f1; font-size:0.9rem; font-weight:500;">${key}</span>`;
        dropdown.appendChild(b);
    });
}

function showOrbsByType(specimenId, slotIndex, typeKey) {
    const dropdown = document.getElementById(`orbDropdown_${specimenId}_${slotIndex}`);
    if (!dropdown) return;

    const slotEl = document.getElementById(`orbSlot_${specimenId}_${slotIndex}`);
    const isSpecialSlot = slotEl && slotEl.dataset && slotEl.dataset.kind === 's';
    const specialType = isSpecialSlot ? (slotEl.dataset.selectedSpecialType || '') : getActiveSpecialOrbType(specimenId);

    let orbsByType = [];
    if (orbsData && orbsData.special && orbsData.special[typeKey]) {
        orbsByType = orbsData.special[typeKey];
    } else if (orbsData && orbsData.basic && orbsData.basic[typeKey]) {
        orbsByType = getBasicOrbCategoryGroups(orbsData, specialType, getMutantBaseAbilityType(getMutantBySpecimen(specimenId))).find(group => group.typeKey === typeKey)?.orbs || [];
    } else {
        orbsByType = getAllOrbsByType(typeKey);
    }
    
    // back button only; styling stays same as basic options
    const backBtn = document.createElement('button');
    backBtn.style.cssText = 'display:flex;align-items:center;gap:0.6rem;background:rgba(52,152,219,0.1);border:1px solid #3498db;border-radius:6px;padding:0.6rem;width:100%;text-align:left;cursor:pointer;margin-bottom:0.6rem;';
    backBtn.onmouseover = () => { backBtn.style.background = 'rgba(233,69,96,0.1)'; };
    backBtn.onmouseout = () => { backBtn.style.background = 'rgba(52,152,219,0.1)'; };
    backBtn.onclick = (e) => { e.stopPropagation(); populateBasicOrbOptions(specimenId, slotIndex, dropdown); };
    backBtn.textContent = '← Back';

    dropdown.innerHTML = '';
    dropdown.appendChild(backBtn);

    const list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-direction:column;gap:0.8rem;max-height:60vh;overflow-y:auto;';

    orbsByType.forEach((orb) => {
        const orbImageUrl = `https://s-ak.kobojo.com/mutants/assets/thumbnails/${orb.id}.png`;
        const b = document.createElement('button');
        b.style.cssText = 'display:flex;align-items:center;gap:0.6rem;background:rgba(52,152,219,0.1);border:1px solid #3498db;border-radius:6px;padding:0.6rem;width:100%;text-align:left;cursor:pointer;';
        b.onmouseover = () => { b.style.background = 'rgba(233,69,96,0.1)'; };
        b.onmouseout = () => { b.style.background = 'rgba(52,152,219,0.1)'; };
        b.onclick = (e) => { e.stopPropagation(); selectOrb(specimenId, slotIndex, orb, typeKey); };
        b.innerHTML = `<img src="${orbImageUrl}" alt="${orb.name}" style="width:40px;height:40px;object-fit:contain;border-radius:4px;flex-shrink:0;" onerror="this.style.display='none';"><span style="color:#ecf0f1; font-size:0.9rem; font-weight:500;">${orb.name}</span>`;
        list.appendChild(b);
    });
    dropdown.appendChild(list);
}

function selectOrb(specimenId, slotIndex, orb, typeKey = '') {
    const orbId = orb?.id || '';
    const orbName = orb?.name || '';
    const orbValue = Number(orb?.value ?? 0);
    const resolvedTypeKey = typeKey || orb?.type || '';
    const orbBtn = document.getElementById(`orbSlot_${specimenId}_${slotIndex}`);
    if (orbBtn) {
        let overlay = document.getElementById(`orbOverlay_${specimenId}_${slotIndex}`);
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = `orbOverlay_${specimenId}_${slotIndex}`;
            overlay.className = 'orb-overlay';
            overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;pointer-events:none;';
            orbBtn.appendChild(overlay);
        }
        const orbImageUrl = `https://s-ak.kobojo.com/mutants/assets/thumbnails/${orbId}.png`;
        overlay.innerHTML = `<img src="${orbImageUrl}" alt="${orbName}" style="width: 75px; height: 75px; object-fit: contain; border-radius: 4px;" onerror="this.style.display='none';">`;
        orbBtn.setAttribute('data-selected-orb-name', orbName);
        orbBtn.setAttribute('data-selected-orb-id', orbId);
        orbBtn.setAttribute('data-selected-orb-value', String(orbValue));
        orbBtn.setAttribute('data-selected-orb-type', resolvedTypeKey);
        if (orbBtn.dataset.kind === 's') {
            orbBtn.setAttribute('data-selected-special-type', resolvedTypeKey);
        } else {
            orbBtn.removeAttribute('data-selected-special-type');
        }
    }

    const dropdown = document.getElementById(`orbDropdown_${specimenId}_${slotIndex}`);
    if (dropdown) {
        dropdown.remove();
    }
    refreshOrbPreview(specimenId);
    updateDetailPanelStats();
}

function openMutantModal(mutant) {
    const container = document.getElementById('mutantsContainer');
    const detailPanel = document.getElementById('mutantsDetailPanel');
    const content = document.getElementById('mutantsDetailContent');
    const fullMutantData = getMutantFromCsv(mutant.name);
    if (!fullMutantData) {
        if (content) {
            content.innerHTML = `
                <div style="text-align: center; padding: 2rem;"><h2 style="color: #e94560;">⚠️ Error</h2><p style="color: #bdc3c7;">No se encontraron datos para: ${mutant.name}</p></div>`;
        }
        if (container) container.style.display = 'none';
        if (detailPanel) detailPanel.style.display = 'flex';
        selectedMutantDetail = null;
        return;
    }
    selectedMutantDetail = fullMutantData;
    if (container) container.style.display = 'none';
    if (detailPanel) detailPanel.style.display = 'flex';
    const restrictedTypes = ['CAPTAINPEACE', 'SEASONAL', 'VIDEOGAME', 'GACHA', 'ZODIAC','COMMUNITY'];
    const typeUpper = (fullMutantData.type || '').toUpperCase();
    const isRestrictedType = restrictedTypes.some(t => typeUpper.includes(t));
    window.selectedMutantIsRestricted = isRestrictedType;
    const initialSkin = 'basic';
    const initialBonusGacha = 0;
    const initialStarValue = starValues[initialSkin];
    
    const getImageUrl = (specimen, skinType) => {
        const starInfoLocal = getStarInfo(specimen, isRestrictedType);
        const specLower = specimen.toLowerCase();
        if (starInfoLocal[skinType] && starInfoLocal[skinType].imageSuffix) return `https://s-ak.kobojo.com/mutants/assets/thumbnails/${specLower}_${starInfoLocal[skinType].imageSuffix}.png`;
        if (skinType === 'basic') return `https://s-ak.kobojo.com/mutants/assets/thumbnails/${specLower}.png`;
        else return `https://s-ak.kobojo.com/mutants/assets/thumbnails/${specLower}_${skinType}.png`;
    };
    
    const imageUrl = getImageUrl(fullMutantData.specimen, initialSkin);
    const genesHtml = generateGenesHtml(fullMutantData.dna);
    const orbSlotsHtml = generateOrbSlotsHtml(fullMutantData.orbSlots, fullMutantData.specimen);
    const orbPreviewHtml = buildOrbPreviewHtml(fullMutantData);
    
    // Build skin selector as a dropdown combobox with images
    const starInfoObj = getStarInfo(fullMutantData.specimen, isRestrictedType);
    const selectedSkinInfo = starInfoObj[initialSkin];
    let skinSelectorHtml = `
        <div style="position: relative;">
            <button id="mutantSkinToggle" type="button" style="background: linear-gradient(135deg, rgba(22,33,62,0.95) 0%, rgba(15,52,96,0.95) 100%); border: 2px solid #f39c12; padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 0.8rem; width: 100%; transition: all 0.2s;" title="${selectedSkinInfo.label}">
                <img src="${selectedSkinInfo.image}" alt="${selectedSkinInfo.label}" style="width: 40px; height: 40px; object-fit: contain; border-radius: 6px;" onerror="this.style.display='none';">
                <span style="color: #ecf0f1; font-weight: 500; flex: 1; text-align: left;">${selectedSkinInfo.label}</span>
                <span style="color: #f39c12; font-size: 1.2rem;">▼</span>
            </button>
            <div id="mutantSkinDropdown" style="position: absolute; top: 100%; left: 0; right: 0; background: linear-gradient(135deg, #16213e 0%, #0f3460 100%); border: 2px solid #f39c12; border-top: none; border-radius: 0 0 8px 8px; margin-top: -2px; max-height: 300px; overflow-y: auto; z-index: 1000; display: none; box-shadow: 0 8px 20px rgba(0,0,0,0.6);">
    `;
    Object.entries(starInfoObj).forEach(([key, info]) => {
        skinSelectorHtml += `
                <button type="button" data-skin-type="${key}" class="skin-dropdown-option" style="display: flex; align-items: center; gap: 0.8rem; width: 100%; padding: 0.8rem 1rem; background: none; border: none; cursor: pointer; color: #ecf0f1; text-align: left; transition: background 0.2s;" onmouseover="this.style.background='rgba(233,69,96,0.2)'" onmouseout="this.style.background='none'">
                    <img src="${info.image}" alt="${info.label}" style="width: 40px; height: 40px; object-fit: contain; border-radius: 6px;" onerror="this.style.display='none';">
                    <span style="flex: 1; font-weight: 500;">${info.label}</span>
                </button>
        `;
    });
    skinSelectorHtml += `
            </div>
        </div>
    `;
    
    content.innerHTML = `
        <div style="padding: 1rem; width: 100%;">
            <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; align-items: start;">
                <!-- LEFT COLUMN: Image, Genes, Orbs -->
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <h2 style="color: #e94560; margin: 0 0 0.5rem 0; font-size: 1.6rem;">⚙️ ${mutant.name}</h2>
                    <div style="background: linear-gradient(135deg, rgba(22,33,62,0.95) 0%, rgba(15,52,96,0.95) 100%); border: 1px solid rgba(52, 152, 219, 0.35); border-radius: 10px; padding: 1rem; box-shadow: 0 8px 25px rgba(0,0,0,0.2);">
                        <div style="text-align: center; margin-bottom: 0.8rem;">
                            <img id="mutantImage" src="${imageUrl}" alt="${mutant.name}" style="max-height: 200px; max-width: 100%; border-radius: 8px; border: 2px solid #3498db; object-fit: contain;">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.8rem; align-items: center;">
                            ${genesHtml}
                            <div style="width: 100%;">
                                ${orbSlotsHtml}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- RIGHT COLUMN: Skin Selector, Stats -->
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <div style="background: linear-gradient(135deg, rgba(22,33,62,0.95) 0%, rgba(15,52,96,0.95) 100%); border: 1px solid rgba(52, 152, 219, 0.35); border-radius: 10px; padding: 1rem; box-shadow: 0 8px 25px rgba(0,0,0,0.2);">
                        <label style="color: #f39c12; font-weight: bold; display: block; margin-bottom: 0.8rem; font-size: 0.9rem;">🎭 Skin / Star:</label>
                        ${skinSelectorHtml}
                    </div>
                    <div id="statsDisplay" style="flex: 1;"></div>
                    <div id="mutantOrbPreview">${orbPreviewHtml}</div>
                </div>
            </div>
        </div>
    `;
    
    // Store the selected skin type for updates
    window.selectedMutantSkinType = initialSkin;
    if (detailPanel) detailPanel.style.display = 'flex';
    updateDetailPanelStats();
    refreshOrbPreview(fullMutantData.specimen);
    
    // Add event listeners for orb slots
    setTimeout(() => {
        const orbSlotBtns = document.querySelectorAll(`[data-specimen="${fullMutantData.specimen}"]`);
        orbSlotBtns.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const slotIndex = parseInt(btn.dataset.slot, 10);
                showOrbDropdown(fullMutantData.specimen, isNaN(slotIndex) ? 0 : slotIndex);
            });
        });
        
        // Add event listeners for skin selector dropdown
        const skinToggle = document.getElementById('mutantSkinToggle');
        const skinDropdown = document.getElementById('mutantSkinDropdown');
        const skinOptions = document.querySelectorAll('.skin-dropdown-option');
        
        // Toggle dropdown on button click
        if (skinToggle) {
            skinToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                skinDropdown.style.display = skinDropdown.style.display === 'none' ? 'flex' : 'none';
                skinDropdown.style.flexDirection = 'column';
            });
        }
        
        // Handle skin selection
        skinOptions.forEach((option) => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const skinType = option.dataset.skinType;
                window.selectedMutantSkinType = skinType;
                
                // Get the skin info and update button
                const starInfoObj = getStarInfo(fullMutantData.specimen, isRestrictedType);
                const info = starInfoObj[skinType];
                
                if (skinToggle && info) {
                    skinToggle.innerHTML = `
                        <img src="${info.image}" alt="${info.label}" style="width: 40px; height: 40px; object-fit: contain; border-radius: 6px;" onerror="this.style.display='none';">
                        <span style="color: #ecf0f1; font-weight: 500; flex: 1; text-align: left;">${info.label}</span>
                        <span style="color: #f39c12; font-size: 1.2rem;">▼</span>
                    `;
                }
                
                // Close dropdown
                skinDropdown.style.display = 'none';
                
                // Update image
                const newImageUrl = getImageUrl(fullMutantData.specimen, skinType);
                const imgElement = document.getElementById('mutantImage');
                if (imgElement) { 
                    imgElement.src = newImageUrl; 
                    imgElement.onerror = function() { this.parentElement.innerHTML = '<div style="color: #95a5a6; font-size: 3rem;">🧬</div>'; }; 
                }
                
                // Update stats
                updateDetailPanelStats();
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (skinDropdown && !skinDropdown.contains(e.target) && e.target !== skinToggle) {
                skinDropdown.style.display = 'none';
            }
        });
    }, 0);

}

function buildAbilityBreakdownHtml(stats, attackKey, abilityName, abilityIcon) {
    const specialType = stats.specialOrbType || '';
    const addedAbilityType = specialType && specialType !== 'speed' ? specialType.replace(/^add/, '') : '';
    const addedAbilityIcon = addedAbilityType ? getAbilityIconUrl(`ability_${addedAbilityType}`) : '';

    const baseValue = Math.round(Number(stats[`${attackKey}BaseAbilityF`] ?? 0));
    const addedValue = Math.round(Number(stats[`${attackKey}AddedAbilityF`] ?? 0));

    const lines = [];

    // Base ability line (show if mutant has a named ability or base value)
    if ((abilityName && abilityName !== 'Unknown') || baseValue > 0) {
        const icon = abilityIcon || '';
        const label = abilityName && abilityName !== 'Unknown' ? abilityName : formatAbilityLabel(abilityName || '');
        lines.push({ icon, label, value: baseValue });
    }

    // Added ability line (from special orb or basic ability orbs)
    if (addedValue > 0 && addedAbilityType) {
        const label = formatAbilityLabel(addedAbilityType);
        lines.push({ icon: addedAbilityIcon, label, value: addedValue });
    }

    // If no base but there is an added ability value and no named ability, still show added
    if (lines.length === 0 && addedValue > 0) {
        const label = addedAbilityType ? formatAbilityLabel(addedAbilityType) : 'Ability';
        lines.push({ icon: addedAbilityIcon, label, value: addedValue });
    }

    if (lines.length === 0) return '';

    const html = lines.map(line => `
        <div style="display:flex; align-items:center; gap:0.4rem; font-size: 0.85rem; margin-top: 0.3rem;">
            ${line.icon ? `<img src="${line.icon}" alt="${line.label}" style="width:18px; height:18px; object-fit:contain;" onerror="this.style.display='none';">` : ''}
            <span style="color:#ecf0f1; font-weight:600;">${line.label}</span>
            <span style="color:#ecf0f1; font-weight:bold; margin-left:auto;">${formatDisplayNumber(line.value)}</span>
        </div>`).join('');

    return html;
}

function renderStatsDisplay(mutantData, stats) {
    const statsDisplay = document.getElementById('statsDisplay');
    if (!statsDisplay) return;
    // type icon url tried later for positioning
    let typeIconUrl = '';
    if (mutantData.type) {
        typeIconUrl = `https://s-ak.kobojo.com/mutants/assets/mobile/hud/m_m_m/icon_${mutantData.type.toLowerCase()}.png`;
    }

    // Parse unlockAttack for genes
    const genes = parseUnlockAttack(mutantData.unlockattack);
    const atk1IsAOE = isAOE(mutantData.atk1);
    const atk2IsAOE = isAOE(mutantData.atk2);
    const atk1pIsAOE = isAOE(mutantData.atk1p);
    const atk2pIsAOE = isAOE(mutantData.atk2p);
    const atk1Gen = genes['1'] || 'n';
    const atk2Gen = genes['2'] || 'n';
    const atk1pGen = genes['1p'] || 'n';
    const atk2pGen = genes['2p'] || 'n';
    const atk1Icon = atk1IsAOE ? `attack_${atk1Gen}_aoe.png` : `attack_${atk1Gen}.png`;
    const atk2Icon = atk2IsAOE ? `attack_${atk2Gen}_aoe.png` : `attack_${atk2Gen}.png`;
    const atk1pIcon = atk1pIsAOE ? `attack_${atk1pGen}_aoe.png` : `attack_${atk1pGen}.png`;
    const atk2pIcon = atk2pIsAOE ? `attack_${atk2pGen}_aoe.png` : `attack_${atk2pGen}.png`;

    const statsHTML = `
        <div style="background: linear-gradient(135deg, #16213e 0%, #0f3460 100%); border: 1px solid #3498db; border-radius: 10px; overflow: hidden; padding: 0.9rem; box-shadow: 0 8px 25px rgba(0,0,0,0.2);">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.6rem; auto-rows: max-content;">
                <div style="padding: 0.7rem; border: 1px solid rgba(52,152,219,0.25); border-radius: 6px; background: rgba(9,18,34,0.5);">
                    <p style="color: #95a5a6; font-size: 0.75rem; margin: 0 0 0.3rem 0; font-weight: 600;">Specimen</p>
                    <p style="color: #2ecc71; font-weight: bold; margin: 0; font-size: 0.9rem;">${stats.specimen}</p>
                </div>
                <div style="padding: 0.7rem; border: 1px solid rgba(52,152,219,0.25); border-radius: 6px; background: rgba(9,18,34,0.5);">
                    <p style="color: #95a5a6; font-size: 0.75rem; margin: 0 0 0.3rem 0; font-weight: 600;\">Type</p>
                    <p style="color: #ecf0f1; font-weight: bold; margin: 0; font-size: 0.9rem;\"><img src=\"https://s-ak.kobojo.com/mutants/assets/mobile/hud/m_m_m/icon_${stats.type.toLowerCase()}.png\" alt=\"${stats.type}\" style=\"width:24px; vertical-align:middle; margin-right:4px;\" onerror=\"this.style.display='none';\">${stats.type}</p>
                </div>
                <div style="padding: 0.7rem; border: 1px solid rgba(52,152,219,0.25); border-radius: 6px; background: rgba(9,18,34,0.5);\">
                    <p style=\"color: #95a5a6; font-size: 0.75rem; margin: 0 0 0.3rem 0; font-weight: 600;\"><img src=\"${ICONS.life}\" alt=\"Life\" style=\"width:25px; vertical-align:middle; margin-right:3px;\">Life</p>
                    <p style=\"color: #e94560; font-weight: bold; font-size: 1rem; margin: 0;\">${formatDisplayNumber(stats.lifeF)}</p>
                </div>
                <div style=\"padding: 0.7rem; border: 1px solid rgba(52,152,219,0.25); border-radius: 6px; background: rgba(9,18,34,0.5);\">
                    <p style=\"color: #95a5a6; font-size: 0.75rem; margin: 0 0 0.3rem 0; font-weight: 600;\"><img src=\"${ICONS.speed}\" alt=\"Speed\" style=\"width:25px; vertical-align:middle; margin-right:3px;\">Speed</p>
                    <p style=\"color: #3498db; font-weight: bold; font-size: 1rem; margin: 0;\">${formatDisplayNumber(stats.speedF)}</p>
                </div>
                <div style=\"padding: 0.7rem; border: 1px solid rgba(52,152,219,0.25); border-radius: 6px; background: rgba(9,18,34,0.5);\">
                    <p style=\"color: #95a5a6; font-size: 0.75rem; margin: 0 0 0.3rem 0; font-weight: 600;\"><img src=\"image/gene/${atk1pIcon}\" alt=\"Attack 1\" style=\"width:35px; vertical-align:middle; margin-right:2px;\" onerror=\"this.style.display='none';\">${stats.attack1p_name}</p>
                    <p style=\"color: #f39c12; font-weight: bold; margin: 0.2rem 0; font-size: 0.9rem;\">${formatDisplayNumber(stats.atk1F)}</p>
                    ${buildAbilityBreakdownHtml(stats, 'atk1', stats.ability1Name, stats.ability1Icon)}
                </div>
                <div style="padding: 0.7rem; border: 1px solid rgba(52,152,219,0.25); border-radius: 6px; background: rgba(9,18,34,0.5);">
                    <p style="color: #95a5a6; font-size: 0.75rem; margin: 0 0 0.3rem 0; font-weight: 600;"><img src="image/gene/${atk2pIcon}" alt="Attack 2" style="width:35px; vertical-align:middle; margin-right:2px;" onerror="this.style.display='none';">${stats.attack2p_name}</p>
                    <p style="color: #f39c12; font-weight: bold; margin: 0.2rem 0; font-size: 0.9rem;">${formatDisplayNumber(stats.atk2F)}</p>
                    ${buildAbilityBreakdownHtml(stats, 'atk2', stats.ability2Name, stats.ability2Icon)}
                </div>
                </div>
            </div>
        </div>
    `;
    statsDisplay.innerHTML = statsHTML;
}

function closeMutantModal() { showMutantsList(); }

// expose modal control functions globally for inline handlers
window.closeMutantModal = closeMutantModal;
window.openMutantModal = openMutantModal;
window.selectOrb = selectOrb;
window.showOrbsByType = showOrbsByType;

window.addEventListener('click', (e) => { const modal = document.getElementById('mutantModal'); if (e.target === modal) closeMutantModal(); });

export { loadGachaData, loadMutantsData, initMutantsSection, getMutantFromCsv, mutantsData, gachaData, closeMutantModal, openMutantModal, starValues, numericToStarKey, ICONS, calculateMutantStats, generateGenesHtml, getAbilityIconUrl, parseUnlockAttack, isAOE, formatDisplayNumber };
