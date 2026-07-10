/* Mutants data, parsing, and UI */

let mutantsData = [];
let gachaData = {};
let orbsData = [];
let abilitiesConfig = {};
let selectedMutantDetail = null;

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

function updateDetailPanelStats() {
    if (!selectedMutantDetail) return;
    const fameLevelInput = document.getElementById('mutantFameLevel');
    const fameLevel = parseInt(fameLevelInput?.value) || 25;
    const skinType = window.selectedMutantSkinType || 'basic';
    const isRestricted = window.selectedMutantIsRestricted || false;
    const starInfo = getStarInfo(selectedMutantDetail.specimen, isRestricted);
    const info = starInfo[skinType] || {};
    const bonus = info.bonusGacha || 0;
    const starVal = info.starValue || 0;
    const stats = calculateMutantStats(selectedMutantDetail, fameLevel, skinType, bonus, starVal);
    stats.skinLabel = starInfo[skinType]?.label || skinType;
    renderStatsDisplay(selectedMutantDetail, stats);
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
    // container for slots (overlay dropdown will be appended here)
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
                <img src="${imageUrl}" alt="Orb n" style="width: 40px; height: 40px; object-fit: contain; display: block; border-radius: 4px;" onerror="this.style.display='none';">
            </button>`;
        } else {
            // render special slot as a clickable button too, mark as kind="s"
            orbHtml += `<button id="orbSlot_${specimenId}_${idx}" class="orb-slot-btn" data-specimen="${specimenId}" data-slot="${idx}" data-kind="s" style="position: relative; background: none; border: 2px dashed #9b59b6; border-radius: 6px; padding: 4px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#8e44ad'" onmouseout="this.style.borderColor='#9b59b6'">
                <div id="orbOverlay_${specimenId}_${idx}" class="orb-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;pointer-events:none;"></div>
                <img src="${imageUrl}" alt="Orb s" style="width: 40px; height: 40px; object-fit: contain; display: block; border-radius: 4px;" onerror="this.style.display='none';">
            </button>`;
        }
    });
    
    orbHtml += '</div></div>';
    return orbHtml;
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
    fameLevel = Math.max(25, parseInt(fameLevel) || 25);
    let level = 100 + 10 * (fameLevel - 1);
    const abilitiesStr = mutantData.abilities || '';
    const abilityNames = {};
    const abilityIcons = {};
    const appliesTo = abilitiesConfig[mutantData.specimen] || 'both';
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
    const extractNumber = (val) => { if (!val) return 0; const str = String(val).trim(); const match = str.match(/^(\d+)/); return parseInt(match ? match[1] : str) || 0; };
    const atk1pValue = extractNumber(mutantData.atk1p);
    const atk2pValue = extractNumber(mutantData.atk2p);
    const lifeValue = parseInt(mutantData.life) || 0;
    const speedValue = parseInt(mutantData.speed) || 0;
    const abilityPct1 = (parseInt(mutantData.abilityPct1) || 0);
    const abilityPct2 = (parseInt(mutantData.abilityPct2) || 0);
    const lifeF = Math.round((lifeValue * (bonusStar - bonusGacha) * level * globalAdjust) / 1000000);
    const bonusGachaDecimal = bonusGacha / 100;
    const atk1F = Math.round(Math.abs(((atk1pValue * bonusGachaDecimal + atk1pValue) * bonusStar * level * globalAdjust) / 1000000));
    const atk2F = Math.round(Math.abs(((atk2pValue * bonusGachaDecimal + atk2pValue) * bonusStar * level * globalAdjust) / 1000000));
    const atk1AbilityF = Math.round(Math.abs((atk1F / 100) * (abilityPct2)));
    const atk2AbilityF = appliesTo === 'both' ? Math.round(Math.abs((atk2F / 100) * (abilityPct2))) : 0;
    const speedF = (speedValue > 0 ? 10 / (speedValue / 100) : 0).toFixed(2);
    return {
        specimen: mutantData.specimen,
        name: mutantData.name,
        type: mutantData.type,
        fameLevel: fameLevel,
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
        attack1p_name: mutantData.attack1p_name || 'Attack 1',
        attack2p_name: mutantData.attack2p_name || 'Attack 2',
        description: mutantData.description || ''
    };
}

function getBasicOrbs(types = []) {
    if (!orbsData || !orbsData.basic) return [];
    
    // Get the first orb from each requested basic category (attack/critical by default)
    const basicOrbs = [];
    const allowed = types.length > 0 ? types : ['attack','critical'];
    allowed.forEach(typeKey => {
        const orbs = orbsData.basic[typeKey];
        if (Array.isArray(orbs) && orbs.length > 0) {
            basicOrbs.push(orbs[0]);
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
    dropdown.innerHTML = ''; // clear existing content

    // delete orb button always visible in first list
    const del = document.createElement('button');
    del.style.cssText = 'display:flex;align-items:center;gap:0.6rem;background:rgba(231,76,60,0.1);border:1px solid #e74c3c;border-radius:6px;padding:0.6rem;width:100%;text-align:left;cursor:pointer;color:#e74c3c;font-weight:600;';
    del.onmouseover = () => { del.style.background = 'rgba(231,76,60,0.15)'; };
    del.onmouseout  = () => { del.style.background = 'rgba(231,76,60,0.1)'; };
    del.onclick     = (e) => { e.stopPropagation(); removeOrbOverlay(specimenId, slotIndex); };
    del.innerHTML   = '🗑️ Delete orb';
    dropdown.appendChild(del);

    // decide whether this slot is special
    const slotEl = document.getElementById(`orbSlot_${specimenId}_${slotIndex}`);
    const isSpecialSlot = slotEl && slotEl.dataset && slotEl.dataset.kind === 's';

    if (isSpecialSlot) {
        // list special categories directly (no basic orbs)
        const keys = orbsData && orbsData.special ? Object.keys(orbsData.special) : [];
        if (keys.length === 0) return;
        keys.forEach((key) => {
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
        return;
    }

    // non-special slots: show basic orbs (attack/critical)
    const basicOrbs = getBasicOrbs(['attack', 'critical','life','regenerate','retaliate','shield','slash','strengthen','weaken']);
    if (basicOrbs.length === 0) return;
    basicOrbs.forEach((orb) => {
        const typeKey = Object.keys(orbsData.basic).find(key => orbsData.basic[key][0]?.id === orb.id);
        const orbImageUrl = `https://s-ak.kobojo.com/mutants/assets/thumbnails/${orb.id}.png`;
        const b = document.createElement('button');
        b.style.cssText = 'display:flex;align-items:center;gap:0.6rem;background:rgba(52,152,219,0.1);border:1px solid #3498db;border-radius:6px;padding:0.6rem;width:100%;text-align:left;cursor:pointer;';
        b.onmouseover = () => { b.style.background = 'rgba(233,69,96,0.1)'; };
        b.onmouseout = () => { b.style.background = 'rgba(52,152,219,0.1)'; };
        b.onclick = (e) => { e.stopPropagation(); showOrbsByType(specimenId, slotIndex, typeKey); };
        b.innerHTML = `<img src="${orbImageUrl}" alt="${orb.name}" style="width:40px;height:40px;object-fit:contain;border-radius:4px;flex-shrink:0;" onerror="this.style.display='none';"><span style="color:#ecf0f1; font-size:0.9rem; font-weight:500;">${orb.name}</span>`;
        dropdown.appendChild(b);
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
}

function showSpecialCategories(specimenId, slotIndex) {
    const dropdown = document.getElementById(`orbDropdown_${specimenId}_${slotIndex}`);
    if (!dropdown || !orbsData || !orbsData.special) return;

    dropdown.innerHTML = '';

    const keys = Object.keys(orbsData.special);
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

    // Prefer special list when the type exists under special; otherwise fallback
    let orbsByType = [];
    if (orbsData && orbsData.special && orbsData.special[typeKey]) {
        orbsByType = orbsData.special[typeKey];
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
        b.onclick = (e) => { e.stopPropagation(); selectOrb(specimenId, slotIndex, orb.id, orb.name); };
        b.innerHTML = `<img src="${orbImageUrl}" alt="${orb.name}" style="width:40px;height:40px;object-fit:contain;border-radius:4px;flex-shrink:0;" onerror="this.style.display='none';"><span style="color:#ecf0f1; font-size:0.9rem; font-weight:500;">${orb.name}</span>`;
        list.appendChild(b);
    });
    dropdown.appendChild(list);
}

function selectOrb(specimenId, slotIndex, orbId, orbName) {
    // find the button corresponding to this slot and update its overlay
    const orbBtn = document.getElementById(`orbSlot_${specimenId}_${slotIndex}`);
    if (orbBtn) {
        let overlay = document.getElementById(`orbOverlay_${specimenId}_${slotIndex}`);
        if (!overlay) {
            // should already exist from generation, but create just in case
            overlay = document.createElement('div');
            overlay.id = `orbOverlay_${specimenId}_${slotIndex}`;
            overlay.className = 'orb-overlay';
            overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;pointer-events:none;';
            orbBtn.appendChild(overlay);
        }
        const orbImageUrl = `https://s-ak.kobojo.com/mutants/assets/thumbnails/${orbId}.png`;
        overlay.innerHTML = `<img src="${orbImageUrl}" alt="${orbName}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 4px;" onerror="this.style.display='none';">`;
    }

    // Close dropdown
    const dropdown = document.getElementById(`orbDropdown_${specimenId}_${slotIndex}`);
    if (dropdown) {
        dropdown.remove();
    }
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
    const restrictedTypes = ['CAPTAINPEACE', 'SEASONAL', 'VIDEOGAME', 'GACHA', 'ZODIAC'];
    const typeUpper = (fullMutantData.type || '').toUpperCase();
    const isRestrictedType = restrictedTypes.some(t => typeUpper.includes(t));
    window.selectedMutantIsRestricted = isRestrictedType;
    const initialSkin = 'basic';
    const initialBonusGacha = 0;
    const initialStarValue = starValues[initialSkin];
    const stats = calculateMutantStats(fullMutantData, 25, initialSkin, initialBonusGacha, initialStarValue);
    
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
                </div>
            </div>
        </div>
    `;
    
    // Store the selected skin type for updates
    window.selectedMutantSkinType = initialSkin;
    if (detailPanel) detailPanel.style.display = 'flex';
    renderStatsDisplay(fullMutantData, stats);
    
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
                    <p style=\"color: #e94560; font-weight: bold; font-size: 1rem; margin: 0;\">${stats.lifeF}</p>
                </div>
                <div style=\"padding: 0.7rem; border: 1px solid rgba(52,152,219,0.25); border-radius: 6px; background: rgba(9,18,34,0.5);\">
                    <p style=\"color: #95a5a6; font-size: 0.75rem; margin: 0 0 0.3rem 0; font-weight: 600;\"><img src=\"${ICONS.speed}\" alt=\"Speed\" style=\"width:25px; vertical-align:middle; margin-right:3px;\">Speed</p>
                    <p style=\"color: #3498db; font-weight: bold; font-size: 1rem; margin: 0;\">${stats.speedF}</p>
                </div>
                <div style=\"padding: 0.7rem; border: 1px solid rgba(52,152,219,0.25); border-radius: 6px; background: rgba(9,18,34,0.5);\">
                    <p style=\"color: #95a5a6; font-size: 0.75rem; margin: 0 0 0.3rem 0; font-weight: 600;\"><img src=\"image/gene/${atk1pIcon}\" alt=\"Attack 1\" style=\"width:35px; vertical-align:middle; margin-right:2px;\" onerror=\"this.style.display='none';\">${stats.attack1p_name}</p>
                    <p style=\"color: #f39c12; font-weight: bold; margin: 0.2rem 0; font-size: 0.9rem;\">${stats.atk1F}</p>
                    <div style=\"display:flex; align-items:center; gap:0.3rem; font-size: 0.7rem; margin-top: 0.3rem;\">
                        <img src=\"${stats.ability1Icon}\" alt=\"${stats.ability1Name}\" style=\"width:16px; height:16px; object-fit:contain;\" onerror=\"this.style.display='none';\">
                        <span style=\"color:#ecf0f1;\">${stats.ability1Name}</span>
                    </div>
                    <div style=\"color:#f39c12; font-weight:bold; font-size:0.8rem; margin-top:0.2rem;\">${stats.atk1AbilityF}</div>
                </div>
                <div style=\"padding: 0.7rem; border: 1px solid rgba(52,152,219,0.25); border-radius: 6px; background: rgba(9,18,34,0.5);\">
                    <p style=\"color: #95a5a6; font-size: 0.75rem; margin: 0 0 0.3rem 0; font-weight: 600;\"><img src=\"image/gene/${atk2pIcon}\" alt=\"Attack 2\" style=\"width:35px; vertical-align:middle; margin-right:2px;\" onerror=\"this.style.display='none';\">${stats.attack2p_name}</p>
                    <p style=\"color: #9b59b6; font-weight: bold; margin: 0.2rem 0; font-size: 0.9rem;\">${stats.atk2F}</p>
                    ${stats.ability2Name ? `<div style=\"display:flex; align-items:center; gap:0.3rem; font-size: 0.7rem; margin-top: 0.3rem;\">
                        <img src=\"${stats.ability2Icon}\" alt=\"${stats.ability2Name}\" style=\"width:16px; height:16px; object-fit:contain;\" onerror=\"this.style.display='none';\">
                        <span style=\"color:#ecf0f1;\">${stats.ability2Name}</span>
                    </div>` : ''}
                    ${stats.ability2Name ? `<div style=\"color:#9b59b6; font-weight:bold; font-size:0.8rem; margin-top:0.2rem;\">${stats.atk2AbilityF}</div>` : ''}
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

export { loadGachaData, loadMutantsData, initMutantsSection, getMutantFromCsv, mutantsData, gachaData, closeMutantModal, openMutantModal, starValues, numericToStarKey, ICONS, calculateMutantStats, generateGenesHtml, getAbilityIconUrl, parseUnlockAttack, isAOE };
