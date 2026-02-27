/* Mutants data, parsing, and UI */

let mutantsData = [];
let gachaData = {};

async function loadGachaData() {
    try {
        const res = await fetch('gachav2.csv');
        const text = await res.text();
        parseGachaCSV(text);
    } catch (err) {
        console.error('Error loading gacha data:', err);
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
            orbSlots: values[18]?.trim() || ''
        };
        mutantsData.push(mutant);
    }
}

function initMutantsSection() {
    const searchInput = document.getElementById('mutantSearchInput');
    const genFilter = document.getElementById('genFilter');
    if (!searchInput) return;
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const selectedGen = genFilter.value;
        filterAndDisplayMutants(searchTerm, selectedGen);
    });
    if (genFilter) {
        genFilter.addEventListener('change', (e) => {
            const searchTerm = searchInput.value.toLowerCase();
            const selectedGen = e.target.value;
            filterAndDisplayMutants(searchTerm, selectedGen);
        });
    }
    filterAndDisplayMutants('', '');
}

function filterAndDisplayMutants(searchTerm, selectedGen = '') {
    const container = document.getElementById('mutantsContainer');
    if (!container) return;
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

const starValues = { 'platinum': 100, 'gold': 75, 'silver': 30, 'bronze': 10, 'basic': 0 };
const numericToStarKey = { 0: 'basic', 1: 'bronze', 2: 'silver', 3: 'gold', 4: 'platinum' };

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

function calculateMutantStats(mutantData, fameLevel, starType = 'platinum', bonusGacha = 0, starValueOverride = null) {
    const globalAdjust = 100;
    const starValue = (starValueOverride !== null) ? starValueOverride : (starValues[starType] ?? starValues['platinum']);
    const bonusStar = 100 + starValue;
    fameLevel = Math.max(25, parseInt(fameLevel) || 25);
    let level = 100 + 10 * (fameLevel - 1);
    const abilitiesStr = mutantData.abilities || '';
    const abilityNames = {};
    if (abilitiesStr) {
        const abilityParts = abilitiesStr.split(';');
        abilityParts.forEach(part => {
            const [num, ability] = part.split(':');
            if (num && ability) {
                const abilityName = ability.replace('ability_', '').replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                abilityNames[num] = abilityName;
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
    const atk2AbilityF = Math.round(Math.abs((atk2F / 100) * (abilityPct2)));
    const speedF = (speedValue > 0 ? 10 / (speedValue / 100) : 0).toFixed(2);
    return { specimen: mutantData.specimen, name: mutantData.name, type: mutantData.type, fameLevel: fameLevel, level: level, lifeF: lifeF, speedF: speedF, atk1F: atk1F, atk1AbilityF: atk1AbilityF, atk2F: atk2F, atk2AbilityF: atk2AbilityF, ability1Name: abilityNames['1'] || 'Unknown', ability2Name: abilityNames['2'] || 'Unknown', starType: starType };
}

function openMutantModal(mutant) {
    const modal = document.getElementById('mutantModal');
    const content = document.getElementById('mutantDetailsContent');
    const fullMutantData = getMutantFromCsv(mutant.name);
    if (!fullMutantData) {
        content.innerHTML = `
            <div style="text-align: center; padding: 2rem;"><h2 style="color: #e94560;">⚠️ Error</h2><p style="color: #bdc3c7;">No se encontraron datos para: ${mutant.name}</p></div>`;
        modal.style.display = 'flex';
        return;
    }
    const restrictedTypes = ['CAPTAINPEACE', 'SEASONAL', 'GAMES', 'GACHA'];
    const typeUpper = (fullMutantData.type || '').toUpperCase();
    const isRestrictedType = restrictedTypes.some(t => typeUpper.includes(t));
    const starInfo = { basic: { starValue: starValues['basic'], bonusGacha: 0, label: 'Basic' }, bronze: { starValue: starValues['bronze'], bonusGacha: 0, label: 'Bronze' }, silver: { starValue: starValues['silver'], bonusGacha: 0, label: 'Silver' }, gold: { starValue: starValues['gold'], bonusGacha: 0, label: 'Gold' }, platinum: { starValue: starValues['platinum'], bonusGacha: 0, label: 'Platinum' } };
    const gachaList = gachaData[fullMutantData.specimen] || [];
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
            // gacha icon based on skin id
            gachaIcon: `https://s-ak.kobojo.com/mutants/assets/gachacontent/icon_${entry.gachaId}.png`
        };
    });
    const initialSkin = 'basic';
    const initialBonusGacha = 0;
    const initialStarValue = starValues[initialSkin];
    const stats = calculateMutantStats(fullMutantData, 25, initialSkin, initialBonusGacha, initialStarValue);
    stats.skinLabel = starInfo[initialSkin]?.label || initialSkin;
    // set initial gacha, star, and type icons if needed
    setTimeout(() => {
        const info = starInfo[initialSkin] || {};
        // old absolute icon, hide
        const gachaImg = document.getElementById('gachaIcon');
        if (gachaImg) {
            gachaImg.style.display = 'none';
        }
        // select icon
        const gachaSelectImg = document.getElementById('gachaSelectIcon');
        if (gachaSelectImg) {
            if (info.gachaIcon) {
                gachaSelectImg.src = info.gachaIcon;
                gachaSelectImg.style.display = 'inline-block';
            } else {
                gachaSelectImg.style.display = 'none';
            }
        }
        const starImg = document.getElementById('starIcon');
        if (starImg) {
            if (ICONS.stars[initialSkin] && ICONS.stars[initialSkin] !== '') {
                starImg.src = ICONS.stars[initialSkin];
                starImg.style.display = 'inline-block';
            } else {
                starImg.style.display = 'none';
            }
        }
        const typeImg = document.getElementById('typeIconDisplay');
        if (typeImg) {
            if (typeIconUrl) {
                typeImg.src = typeIconUrl;
                typeImg.style.display = 'inline-block';
            } else {
                typeImg.style.display = 'none';
            }
        }
    }, 0);
    const getImageUrl = (specimen, skinType) => {
        const specLower = specimen.toLowerCase();
        if (starInfo[skinType] && starInfo[skinType].imageSuffix) return `https://s-ak.kobojo.com/mutants/assets/thumbnails/${specLower}_${starInfo[skinType].imageSuffix}.png`;
        if (skinType === 'basic') return `https://s-ak.kobojo.com/mutants/assets/thumbnails/${specLower}.png`;
        else return `https://s-ak.kobojo.com/mutants/assets/thumbnails/${specLower}_${skinType}.png`;
    };
    // build star/skin dropdown using plain text (icons not supported in <option>)
    let optionsHtml = `<option value="basic" selected>Basic (+0)</option>`;
    if (!isRestrictedType) {
        optionsHtml += `<option value="bronze">Bronze (+10)</option>`;
        optionsHtml += `<option value="silver">Silver (+30)</option>`;
        optionsHtml += `<option value="gold">Gold (+75)</option>`;
        optionsHtml += `<option value="platinum">Platinum (+100)</option>`;
    }
    gachaList.forEach((entry, idx) => { const key = `gacha_${idx}`; const label = starInfo[key].label; optionsHtml += `<option value="${key}">🎲 ${label}</option>`; });
    const imageUrl = getImageUrl(fullMutantData.specimen, initialSkin);
    // include placeholder for gacha icon
    content.innerHTML = `
        <div style="padding: 2rem;">
            <h2 style="color: #e94560; margin-bottom: 1.5rem; font-size: 1.8rem;">⚙️ ${mutant.name} - Stats Calculator</h2>
            <div style="text-align: center; margin-bottom: 2rem; position: relative;">
                <img id="mutantImage" src="${imageUrl}" alt="${mutant.name}" style="max-height: 200px; max-width: 100%; border-radius: 8px; border: 2px solid #3498db; object-fit: contain;" onerror="this.parentElement.innerHTML='<div style=\"color: #95a5a6; font-size: 3rem;\"></div>
                <img id="gachaIcon" src="" alt="" style="max-width:64px; position:absolute; bottom:4px; left:4px; display:none;">
            </div>
            <div style="background: linear-gradient(135deg, #16213e 0%, #0f3460 100%); padding: 1.5rem; border-radius: 10px; border: 2px solid #3498db; margin-bottom: 2rem;"><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;"><div><label for="mutantLevel" style="color: #3498db; font-weight: bold; display: block; margin-bottom: 0.8rem; font-size: 1rem;">📊 Fame Level</label><input type="number" id="mutantLevel" value="25" min="25" max="90" style="background: #16213e; color: #ecf0f1; border: 2px solid #3498db; padding: 0.8rem 1rem; border-radius: 5px; font-size: 1rem; width: 100%; font-weight: 500;"></div><div><label for="mutantStar" style="color: #f39c12; font-weight: bold; display: block; margin-bottom: 0.8rem; font-size: 1rem;">🎭 Skin / Star</label><div style="display:flex; align-items:center;"><select id="mutantStar" style="background: #16213e; color: #ecf0f1; border: 2px solid #f39c12; padding: 0.8rem 1rem; border-radius: 5px; font-size: 1rem; width: 100%; font-weight: 500; cursor: pointer;">${optionsHtml}</select><img id="starIcon" src="" alt="" style="width:24px; height:24px; margin-left:8px; display:none;"><img id="gachaSelectIcon" src="" alt="" style="width:70px; height:70px; margin-left:8px; display:none;"></div></div></div></div><div id="statsDisplay"></div></div>
    `;
    modal.style.display = 'flex';
    renderStatsDisplay(fullMutantData, stats);
    const levelInput = document.getElementById('mutantLevel');
    const starSelect = document.getElementById('mutantStar');
    levelInput.addEventListener('input', function(e) {
        const newFameLevel = parseInt(e.target.value) || 25;
        const skinType = starSelect.value;
        const info = starInfo[skinType] || {};
        const bonus = info.bonusGacha || 0;
        const starVal = info.starValue || 0;
        const newStats = calculateMutantStats(fullMutantData, newFameLevel, skinType, bonus, starVal);
        newStats.skinLabel = starInfo[skinType]?.label || skinType;
        renderStatsDisplay(fullMutantData, newStats);
    });
    starSelect.addEventListener('change', function(e) {
        const fameLevel = parseInt(levelInput.value) || 25;
        const skinType = e.target.value;
        const info = starInfo[skinType] || {};
        const bonus = info.bonusGacha || 0;
        const starVal = info.starValue || 0;
        const newStats = calculateMutantStats(fullMutantData, fameLevel, skinType, bonus, starVal);
        newStats.skinLabel = starInfo[skinType]?.label || skinType;
        renderStatsDisplay(fullMutantData, newStats);
        const newImageUrl = getImageUrl(fullMutantData.specimen, skinType);
        const imgElement = document.getElementById('mutantImage');
        if (imgElement) { imgElement.src = newImageUrl; imgElement.onerror = function() { this.parentElement.innerHTML = '<div style="color: #95a5a6; font-size: 3rem;">🧬</div>'; }; }
        // update select gacha icon if available
        const gachaSelectImg = document.getElementById('gachaSelectIcon');
        if (gachaSelectImg) {
            if (info.gachaIcon) {
                gachaSelectImg.src = info.gachaIcon;
                gachaSelectImg.style.display = 'inline-block';
            } else {
                gachaSelectImg.style.display = 'none';
            }
        }
        // update star icon next to select
        const starImg = document.getElementById('starIcon');
        if (starImg) {
            if (ICONS.stars[skinType] && ICONS.stars[skinType] !== '') {
                starImg.src = ICONS.stars[skinType];
                starImg.style.display = 'inline-block';
            } else {
                starImg.style.display = 'none';
            }
        }
        // type icon does not change with skin, but ensure it remains correct
        const typeImg = document.getElementById('typeIconDisplay');
        if (typeImg) {
            if (typeIconUrl) {
                typeImg.src = typeIconUrl;
                typeImg.style.display = 'inline-block';
            } else {
                typeImg.style.display = 'none';
            }
        }
    });

}

function renderStatsDisplay(mutantData, stats) {
    const statsDisplay = document.getElementById('statsDisplay');
    if (!statsDisplay) return;
    // type icon url tried later for positioning
    let typeIconUrl = '';
    if (mutantData.type) {
        typeIconUrl = `https://s-ak.kobojo.com/mutants/assets/mobile/hud/m_m_m/icon_${mutantData.type.toLowerCase()}.png`;
    }
    const statsHTML = `
        <div style="background: linear-gradient(135deg, #16213e 0%, #0f3460 100%); border: 1px solid #3498db; border-radius: 8px; overflow: hidden;">
            <!-- Basic Info Row -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #3498db;">
                <div style="padding: 1rem; border-right: 1px solid #3498db;">
                    <p style="color: #95a5a6; font-size: 0.85rem; margin: 0 0 0.4rem 0;">Specimen</p>
                    <p style="color: #2ecc71; font-weight: bold; margin: 0;">${stats.specimen}</p>
                </div>
                <div style="padding: 1rem;">
                    <p style="color: #95a5a6; font-size: 0.85rem; margin: 0 0 0.4rem 0;">Type</p>
                    <p style="color: #ecf0f1; font-weight: bold; margin: 0;"><img src="https://s-ak.kobojo.com/mutants/assets/mobile/hud/m_m_m/icon_${stats.type.toLowerCase()}.png" alt="${stats.type}" style="width:40px; vertical-align:middle; margin-right:6px;" onerror="this.style.display='none';">${stats.type}</p>
                </div>
            </div>
            
            <!-- Level and Star Row -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #3498db;">
                <div style="padding: 1rem; border-right: 1px solid #3498db;">
                    <p style="color: #95a5a6; font-size: 0.85rem; margin: 0 0 0.4rem 0;">Level</p>
                    <p style="color: #2ecc71; font-weight: bold; margin: 0;">${stats.fameLevel}</p>
                </div>
                <div style="padding: 1rem;">
                    <p style="color: #95a5a6; font-size: 0.85rem; margin: 0 0 0.4rem 0;">Skin / Star</p>
                    <p style="color: #f39c12; font-weight: bold; margin: 0;">${stats.skinLabel || (stats.starType.charAt(0).toUpperCase() + stats.starType.slice(1))}</p>
                </div>
            </div>
            
            <!-- Stats Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr;">
                <!-- Life -->
                <div style="padding: 1rem; border-right: 1px solid #3498db; border-bottom: 1px solid #3498db;">
                    <p style="color: #95a5a6; font-size: 0.85rem; margin: 0 0 0.4rem 0;"><img src="${ICONS.life}" alt="Life" style="width:24px; vertical-align:middle; margin-right:6px;">Life</p>
                    <p style="color: #e94560; font-weight: bold; font-size: 1.1rem; margin: 0;">${stats.lifeF}</p>
                </div>
                
                <!-- Speed -->
                <div style="padding: 1rem; border-bottom: 1px solid #3498db;">
                    <p style="color: #95a5a6; font-size: 0.85rem; margin: 0 0 0.4rem 0;"><img src="${ICONS.speed}" alt="Speed" style="width:24px; vertical-align:middle; margin-right:6px;">Speed</p>
                    <p style="color: #3498db; font-weight: bold; font-size: 1.1rem; margin: 0;">${stats.speedF}</p>
                </div>
                
                <!-- Attack 1 -->
                <div style="padding: 1rem; border-right: 1px solid #3498db; border-bottom: 1px solid #3498db;">
                    <p style="color: #95a5a6; font-size: 0.85rem; margin: 0 0 0.4rem 0;">⚔️ Attack 1</p>
                    <p style="color: #f39c12; font-weight: bold; margin: 0; font-size: 0.9rem;">${stats.atk1F}</p>
                    <p style="color: #95a5a6; font-size: 0.75rem; margin: 0.3rem 0 0 0;">${stats.ability1Name}</p>
                    <p style="color: #f39c12; font-weight: bold; margin: 0.2rem 0 0 0; font-size: 0.9rem;">${stats.atk1AbilityF}</p>
                </div>
                
                <!-- Attack 2 -->
                <div style="padding: 1rem; border-bottom: 1px solid #3498db;">
                    <p style="color: #95a5a6; font-size: 0.85rem; margin: 0 0 0.4rem 0;">⚔️ Attack 2</p>
                    <p style="color: #9b59b6; font-weight: bold; margin: 0; font-size: 0.9rem;">${stats.atk2F}</p>
                    <p style="color: #95a5a6; font-size: 0.75rem; margin: 0.3rem 0 0 0;">${stats.ability2Name}</p>
                    <p style="color: #9b59b6; font-weight: bold; margin: 0.2rem 0 0 0; font-size: 0.9rem;">${stats.atk2AbilityF}</p>
                </div>
            </div>
        </div>
    `;
    statsDisplay.innerHTML = statsHTML;
}

function closeMutantModal() { const modal = document.getElementById('mutantModal'); if (modal) modal.style.display = 'none'; }

// expose modal control functions globally for inline handlers
window.closeMutantModal = closeMutantModal;
window.openMutantModal = openMutantModal;

window.addEventListener('click', (e) => { const modal = document.getElementById('mutantModal'); if (e.target === modal) closeMutantModal(); });

export { loadGachaData, loadMutantsData, initMutantsSection, getMutantFromCsv, mutantsData, gachaData, closeMutantModal, openMutantModal, starValues, numericToStarKey, ICONS, calculateMutantStats };
