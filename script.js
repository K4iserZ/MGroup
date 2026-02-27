/* script.js moved to modular files in /js. Keep this file as a tiny compatibility stub. */

console.info('script.js is now split into js/utils.js, js/incentives.js, js/mutants.js, js/raids.js and js/main.js');
    container.innerHTML = '';

    if (filtered.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #95a5a6; padding: 2rem;">No mutants found</div>';
        return;
    }

    filtered.forEach(mutant => {
        const card = createMutantCard(mutant);
        container.appendChild(card);
    });
}

function createMutantCard(mutant) {
    const card = document.createElement('div');
    card.className = 'mutant-card';
    
    const imageUrl = `https://s-ak.kobojo.com/mutants/assets/thumbnails/${mutant.specimen.toLowerCase()}.png`;
    
    card.innerHTML = `
        <div class="mutant-image">
            <img src="${imageUrl}" alt="${mutant.name}" onerror="this.parentElement.innerHTML='<div class=\'mutant-image-fallback\'>🧬</div>'">
        </div>
        <div class="mutant-name">${mutant.name}</div>
        <div class="mutant-specimen">${mutant.specimen}</div>
        <div class="mutant-type">${mutant.dna || 'N/A'}</div>
    `;
    
    card.addEventListener('click', () => openMutantModal(mutant));
    
    return card;
}

// Get mutant data from Stats.csv data
function getMutantFromCsv(mutantName) {
    if (!mutantsData || mutantsData.length === 0) return null;
    
    const mutant = mutantsData.find(m => m.name.toLowerCase() === mutantName.toLowerCase());
    return mutant || null;
}

// Star values for bonus calculation
// map of built‑in skin/star types to their bonus star value
const starValues = {
    'platinum': 100,
    'gold': 75,
    'silver': 30,
    'bronze': 10,
    'basic': 0
};


// helper to convert numeric star count (0-4) into one of the built‑in keys
const numericToStarKey = {
    0: 'basic',
    1: 'bronze',
    2: 'silver',
    3: 'gold',
    4: 'platinum'
};

// Calculate final stats based on the formula in calcularstats.txt
// now accepts optional bonusGacha parameter (defaults to 0)
function calculateMutantStats(mutantData, fameLevel, starType = 'platinum', bonusGacha = 0, starValueOverride = null) {
    const globalAdjust = 100;
    
    // Determine star value (skin bonus)
    const starValue = (starValueOverride !== null) ? starValueOverride : (starValues[starType] ?? starValues['platinum']);
    const bonusStar = 100 + starValue;
    
    // Calculate actual level from fame level
    // Level = 100 + 10*(FameLevel - 1), minimum is 25
    // When user inputs 25, it means FameLevel = 25, resulting in Level = 340
    fameLevel = Math.max(25, parseInt(fameLevel) || 25);
    let level = 100 + 10 * (fameLevel - 1);
    
    // Extract ability names from abilities string (format: "1:ability_shield;2:ability_shield_plus")
    const abilitiesStr = mutantData.abilities || '';
    const abilityNames = {};
    
    if (abilitiesStr) {
        const abilityParts = abilitiesStr.split(';');
        abilityParts.forEach(part => {
            const [num, ability] = part.split(':');
            if (num && ability) {
                const abilityName = ability.replace('ability_', '').replace(/_/g, ' ')
                    .split(' ')
                    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ');
                abilityNames[num] = abilityName;
            }
        });
    }
    
    // Extract numeric values from attack power (handle "123:AOE" format)
    const extractNumber = (val) => {
        if (!val) return 0;
        const str = String(val).trim();
        const match = str.match(/^(\d+)/);
        return parseInt(match ? match[1] : str) || 0;
    };
    
    const atk1pValue = extractNumber(mutantData.atk1p);
    const atk2pValue = extractNumber(mutantData.atk2p);
    const lifeValue = parseInt(mutantData.life) || 0;
    const speedValue = parseInt(mutantData.speed) || 0;
    const abilityPct1 = (parseInt(mutantData.abilityPct1) || 0);
    const abilityPct2 = (parseInt(mutantData.abilityPct2) || 0);
    
    // Calculate stats
    // apply gacha bonus if any
    // life formula: LifeF=(Life*(BonusStar-BonusGacha)*Level*Adjust)/1000000
    const lifeF = Math.round((lifeValue * (bonusStar - bonusGacha) * level * globalAdjust) / 1000000);
    
    // attack formula when gacha skin: AtkF=((atk*p*BonusGacha+atk*p)*BonusStar*Level*Adjust)/1000000
    // bonusGacha is stored as percentage (10, -10, 30), convert to decimal (0.10, -0.10, 0.30)
    const bonusGachaDecimal = bonusGacha / 100;
    const atk1F = Math.round(Math.abs(((atk1pValue * bonusGachaDecimal + atk1pValue) * bonusStar * level * globalAdjust) / 1000000));
    const atk2F = Math.round(Math.abs(((atk2pValue * bonusGachaDecimal + atk2pValue) * bonusStar * level * globalAdjust) / 1000000));
    
    // ability uses the updated atkF values
    const atk1AbilityF = Math.round(Math.abs((atk1F / 100) * (abilityPct2)));
    const atk2AbilityF = Math.round(Math.abs((atk2F / 100) * (abilityPct2)));
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
        ability2Name: abilityNames['2'] || 'Unknown',
        starType: starType
    };
}

function openMutantModal(mutant) {
    const modal = document.getElementById('mutantModal');
    const content = document.getElementById('mutantDetailsContent');
    
    // Get the full mutant data from CSV
    const fullMutantData = getMutantFromCsv(mutant.name);
    
    if (!fullMutantData) {
        content.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h2 style="color: #e94560;">⚠️ Error</h2>
                <p style="color: #bdc3c7;">No se encontraron datos para: ${mutant.name}</p>
            </div>
        `;
        modal.style.display = 'flex';
        return;
    }
    
    // Check if this mutant type restricts star skins (only Basic + Gacha allowed)
    const restrictedTypes = ['CAPTAINPEACE', 'SEASONAL', 'GAMES', 'GACHA'];
    const typeUpper = (fullMutantData.type || '').toUpperCase();
    const isRestrictedType = restrictedTypes.some(t => typeUpper.includes(t));
    
    // build skin options and mapping to bonus values - MUST come before first use
    const starInfo = {
        basic: { starValue: starValues['basic'], bonusGacha: 0, label: 'Basic' },
        bronze: { starValue: starValues['bronze'], bonusGacha: 0, label: 'Bronze' },
        silver: { starValue: starValues['silver'], bonusGacha: 0, label: 'Silver' },
        gold: { starValue: starValues['gold'], bonusGacha: 0, label: 'Gold' },
        platinum: { starValue: starValues['platinum'], bonusGacha: 0, label: 'Platinum' }
    };

    // add any gacha skins for this specimen
    const gachaList = gachaData[fullMutantData.specimen] || [];
    gachaList.forEach((entry, idx) => {
        const key = `gacha_${idx}`;
        // compute starValue using numericToStarKey mapping
        const starKey = numericToStarKey[entry.stars] || 'basic';
        const starVal = starValues[starKey] || 0;
        const label = `Gacha ${entry.gachaId} (${entry.stars}★, bonus ${entry.bonus})`;
        starInfo[key] = { starValue: starVal, bonusGacha: entry.bonus || 0, label, imageSuffix: entry.gachaId };
    });
    
    // Calculate with default level 25 and basic skin
    const initialSkin = 'basic';
    const initialBonusGacha = 0;
    const initialStarValue = starValues[initialSkin];
    const stats = calculateMutantStats(fullMutantData, 25, initialSkin, initialBonusGacha, initialStarValue);
    stats.skinLabel = starInfo[initialSkin]?.label || initialSkin;
    
    // Function to get image URL based on specimen and skin type
    const getImageUrl = (specimen, skinType) => {
        const specLower = specimen.toLowerCase();
        // if we stored a custom suffix for this skin (gacha entries) use it
        if (starInfo[skinType] && starInfo[skinType].imageSuffix) {
            return `https://s-ak.kobojo.com/mutants/assets/thumbnails/${specLower}_${starInfo[skinType].imageSuffix}.png`;
        }
        if (skinType === 'basic') {
            return `https://s-ak.kobojo.com/mutants/assets/thumbnails/${specLower}.png`;
        } else {
            return `https://s-ak.kobojo.com/mutants/assets/thumbnails/${specLower}_${skinType}.png`;
        }
    };

    let optionsHtml = `
        <option value="basic" selected>⭐ Basic (+0)</option>
    `;
    
    // Only add star skins if NOT a restricted type
    if (!isRestrictedType) {
        optionsHtml += `
            <option value="bronze">⭐⭐ Bronze (+10)</option>
            <option value="silver">⭐⭐⭐ Silver (+30)</option>
            <option value="gold">⭐⭐⭐⭐ Gold (+75)</option>
            <option value="platinum">⭐⭐⭐⭐⭐ Platinum (+100)</option>
        `;
    }

    // add gacha skins to options (always shown for all types)
    gachaList.forEach((entry, idx) => {
        const key = `gacha_${idx}`;
        const label = starInfo[key].label;
        optionsHtml += `<option value="${key}">🎲 ${label}</option>`;
    });
    
    const imageUrl = getImageUrl(fullMutantData.specimen, initialSkin);
    
    content.innerHTML = `
        <div style="padding: 2rem;">
            <h2 style="color: #e94560; margin-bottom: 1.5rem; font-size: 1.8rem;">⚙️ ${mutant.name} - Stats Calculator</h2>
            
            <!-- Mutant Image -->
            <div style="text-align: center; margin-bottom: 2rem;">
                <img id="mutantImage" src="${imageUrl}" alt="${mutant.name}" 
                     style="max-height: 200px; max-width: 100%; border-radius: 8px; border: 2px solid #3498db; object-fit: contain;" 
                     onerror="this.parentElement.innerHTML='<div style=\"color: #95a5a6; font-size: 3rem;\"></div>
            </div>
            
            <div style="background: linear-gradient(135deg, #16213e 0%, #0f3460 100%); padding: 1.5rem; border-radius: 10px; border: 2px solid #3498db; margin-bottom: 2rem;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                    <!-- Level Input -->
                    <div>
                        <label for="mutantLevel" style="color: #3498db; font-weight: bold; display: block; margin-bottom: 0.8rem; font-size: 1rem;">
                            📊 Fame Level
                        </label>
                        <input type="number" id="mutantLevel" value="25" min="25" max="90" 
                               style="background: #16213e; color: #ecf0f1; border: 2px solid #3498db; padding: 0.8rem 1rem; border-radius: 5px; font-size: 1rem; width: 100%; font-weight: 500;">
                    </div>
                    
                    <!-- Skin Selection -->
                    <div>
                        <label for="mutantStar" style="color: #f39c12; font-weight: bold; display: block; margin-bottom: 0.8rem; font-size: 1rem;">
                            🎭 Skin / Star
                        </label>
                        <select id="mutantStar" style="background: #16213e; color: #ecf0f1; border: 2px solid #f39c12; padding: 0.8rem 1rem; border-radius: 5px; font-size: 1rem; width: 100%; font-weight: 500; cursor: pointer;">
                            ${optionsHtml}
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- Stats Display - Compact Format -->
            <div id="statsDisplay">
                <!-- Stats will be rendered here -->
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    // Render initial stats
    renderStatsDisplay(fullMutantData, stats);
    
    // Add event listeners for level input and star selection
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
        // Update image based on skin type
        const newImageUrl = getImageUrl(fullMutantData.specimen, skinType);
        const imgElement = document.getElementById('mutantImage');
        if (imgElement) {
            imgElement.src = newImageUrl;
            imgElement.onerror = function() {
                this.parentElement.innerHTML = '<div style="color: #95a5a6; font-size: 3rem;">🧬</div>';
            };
        }
    });
}

function renderStatsDisplay(mutantData, stats) {
    const statsDisplay = document.getElementById('statsDisplay');
    
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
                    <p style="color: #ecf0f1; font-weight: bold; margin: 0;">${stats.type}</p>
                </div>
            </div>
            
            <!-- Level and Star Row -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #3498db;">
                <div style="padding: 1rem; border-right: 1px solid #3498db;">
                    <p style="color: #95a5a6; font-size: 0.85rem; margin: 0 0 0.4rem 0;">Fame Level</p>
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
                    <p style="color: #95a5a6; font-size: 0.85rem; margin: 0 0 0.4rem 0;">❤️ Life</p>
                    <p style="color: #e94560; font-weight: bold; font-size: 1.1rem; margin: 0;">${stats.lifeF}</p>
                </div>
                
                <!-- Speed -->
                <div style="padding: 1rem; border-bottom: 1px solid #3498db;">
                    <p style="color: #95a5a6; font-size: 0.85rem; margin: 0 0 0.4rem 0;">⚡ Speed</p>
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

function closeMutantModal() {
    const modal = document.getElementById('mutantModal');
    modal.style.display = 'none';
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('mutantModal');
    if (e.target === modal) {
        closeMutantModal();
    }
});

// Actualizar cada segundo
setInterval(() => {
    updateIncentivosDisplay();
    updateCurrentTimezoneInfo();
    // Only update raid countdowns in-place to avoid layout shifts
    try { updateRaidCountdowns(); } catch(e) { /* ignore if not loaded yet */ }
}, 1000);

// ============================================================
// SECTION 9: RAID PREDICTOR & LOGIC
// ============================================================
// Handles raid data loading, prediction algorithm, and rendering
// Manages raid history, event cycle calculations, and tile/details display

let raidsCatalog = [];
let raidsHistory = [];
let raidsRules = {};
let raidsState = {};

function parsePeruDate(dateStr) {
    // Treat history date as start at 00:00 Peru (UTC-5)
    // dateStr expected like '2024-05-28'
    return new Date(dateStr + 'T00:00:00-05:00');
}

function addMonths(date, months) {
    const d = new Date(date);
    const whole = Math.trunc(months);
    d.setMonth(d.getMonth() + whole);
    const frac = months - whole;
    if (frac > 0) {
        d.setDate(d.getDate() + Math.round(frac * 30));
    }
    return d;
}

async function loadRaidsData() {
    try {
        const resp = await fetch('mgg_raids.json');
        const json = await resp.json();
        raidsCatalog = json.raids || [];
        raidsHistory = (json.history || []).slice().sort((a,b)=> new Date(a.date) - new Date(b.date));
        raidsRules = json.rules || {};
        raidsState = json.state || {};
        renderRaidPredictor();
    } catch (err) {
        console.error('Error loading raids JSON:', err);
    }
}

function detectCurrentRaid() {
    const now = new Date();
    if (!raidsHistory.length) return null;

    // Find the last history entry with start <= now
    let currentEntry = null;
    for (let i = raidsHistory.length - 1; i >= 0; i--) {
        const entry = raidsHistory[i];
        const start = parsePeruDate(entry.date);
        if (start <= now) {
            currentEntry = entry;
            break;
        }
    }

    if (!currentEntry) return null;

    const expectedMonths = raidsRules.eventDuration?.expectedMonths || 3;
    const maxMonths = raidsRules.eventDuration?.maxMonths || 4;
    const start = parsePeruDate(currentEntry.date);
    const endExpected = addMonths(start, expectedMonths);
    const endMax = addMonths(start, maxMonths);

    const isActive = now >= start && now <= endMax; // still in event window
    const isWithinExpected = now >= start && now <= endExpected;
    const isExtended = now > endExpected && now <= endMax;

    const raidInfo = raidsCatalog.find(r => r.id === currentEntry.raidId) || null;

    return {
        entry: currentEntry,
        raid: raidInfo,
        start,
        endExpected,
        endMax,
        isActive: isActive && now <= endMax && now >= start,
        isExtended,
        withinExpected: isWithinExpected
    };
}

function generatePredictions(count = 5) {
    const preds = [];
    if (!raidsHistory.length) return preds;

    const expectedMonths = raidsRules.eventDuration?.expectedMonths || 3;

    let lastHistoryEntry = raidsHistory[raidsHistory.length - 1];
    let lastDate = parsePeruDate(lastHistoryEntry.date);

    const predictedHistory = raidsHistory.slice();

    function findMostRecentNewRaidId(hist) {
        for (let i = hist.length - 1; i >= 0; i--) {
            if (hist[i].type === 'new' && hist[i].raidId) return hist[i].raidId;
        }
        return null;
    }

    // Find raids not yet used in history
    function getUnusedRaidIds() {
        const usedIds = new Set(raidsHistory.map(h => h.raidId));
        return raidsCatalog.filter(r => !usedIds.has(r.id)).map(r => r.id);
    }

    const recentTypes = raidsHistory.slice(-2).map(h => h.type);
    let unusedAssigned = false; // Track if we've already assigned an unused raid

    for (let i = 0; i < count; i++) {
        let nextType;
        const lastTwo = recentTypes.slice(-2);
        if (lastTwo.length === 2 && lastTwo[0] === 'repeat' && lastTwo[1] === 'repeat') {
            nextType = 'new';
        } else {
            const lastType = predictedHistory.length ? predictedHistory[predictedHistory.length - 1].type : 'new';
            nextType = lastType === 'new' ? 'repeat' : 'new';
        }

        const nextStart = addMonths(lastDate, expectedMonths);

        let raidId = null;
        if (nextType === 'repeat') {
            const mostRecentNew = findMostRecentNewRaidId(predictedHistory) || raidsState.lastRepeatedRaidId || null;
            const lastUnlivingIndex = predictedHistory.map(x => x.raidId).lastIndexOf(9);
            if (lastUnlivingIndex >= 0) {
                const repeatSequence = [10, 11, 12, 13];
                let repeatsAfterUnliving = 0;
                for (let j = lastUnlivingIndex + 1; j < predictedHistory.length; j++) {
                    if (predictedHistory[j].type === 'repeat') repeatsAfterUnliving++;
                }
                raidId = repeatSequence[repeatsAfterUnliving % repeatSequence.length];
            } else {
                raidId = mostRecentNew;
            }
        } else if (nextType === 'new') {
            // For NEW raids, assign the first unused raid ONLY once, then leave as null (?)
            if (!unusedAssigned) {
                const unused = getUnusedRaidIds();
                if (unused.length > 0) {
                    raidId = unused[0]; // Take the first unused raid (e.g., blazer id 16)
                    unusedAssigned = true; // Mark that we've used one
                }
            }
            // raidId stays null for subsequent NEW events
        }

        preds.push({ type: nextType, raidId, start: new Date(nextStart) });
        predictedHistory.push({ type: nextType, raidId, date: nextStart.toISOString().slice(0,10) });

        recentTypes.push(nextType);
        if (recentTypes.length > 3) recentTypes.shift();

        lastDate = new Date(nextStart);
    }

    return preds;
}

function renderRaidPredictor() {
    const currentContainer = document.getElementById('raidCurrentContainer');
    const predictionsContainer = document.getElementById('raidPredictionsContainer');
    const allList = document.getElementById('raidAllList');
    const historyList = document.getElementById('raidHistoryList');

    if (!currentContainer || !predictionsContainer) return;

    // Current
    const current = detectCurrentRaid();
    if (current && current.isActive) {
        const raidName = current.raid ? current.raid.name : `raid #${current.entry.raidId}`;
        const image = current.raid ? current.raid.image : '';
        const typeLabel = current.entry.type.toUpperCase();
        const description = current.raid ? current.raid.description : '';
        
        // Calculate countdown to end
        const now = new Date();
        const diff = current.endMax - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const countdown = `${days}d ${hours}h ${mins}m`;

        currentContainer.innerHTML = `
            <div class="raid-current-card ${current.isExtended ? 'raid-extended' : ''}">
                <div class="raid-image">${image ? `<img src="${image}" alt="${raidName}" onerror="this.style.display='none'">` : '<div style="font-size:2.4rem;color:#9b59b6">❓</div>'}</div>
                <div class="raid-meta">
                    <div class="raid-name">${raidName}</div>
                    <div class="raid-type">${typeLabel}</div>
                    <div style="margin-top:8px;color:#b9dfff">Inicio: ${convertToTimezone(current.start.toISOString(), currentTimezone).date}</div>
                    ${description ? `<div style="margin-top:8px;color:#cfdfff;font-size:0.9rem;font-style:italic">"${description}"</div>` : ''}
                    ${current.isExtended ? `<div style="color:#ffd56b;margin-top:8px;font-weight:700">Extended event • beyond expected duration</div>` : ''}
                    <div style="margin-top:12px;padding:8px;background:rgba(155,89,182,0.15);border-radius:6px;color:#e0d6ff;font-weight:700;text-align:center">
                        ⏱️ <span id="raidCurrentCountdown">${countdown}</span>
                    </div>
                    <div style="margin-top:12px; color:#cfdfff; font-size:0.9rem">Click on the raid image or go to "All Raids" to view full details.</div>
                </div>
            </div>
        `;
    } else {
        currentContainer.innerHTML = `<div class="no-active-incentive"><h3>🔬 No active raid</h3><p class="current-incentive-description">No raid is currently active according to history + rules.</p></div>`;
    }

    // Predictions
    const preds = generatePredictions(8);
    let html = '<div class="raid-predictions-list">';
    preds.forEach((p, idx) => {
        let raidName = '?';
        let description = '';
        let imgHtml = '<div style="width:56px;height:44px;border-radius:6px;background:rgba(155,89,182,0.06);display:flex;align-items:center;justify-content:center;color:#b9a3ff">?</div>';
        if (p.raidId) {
            const r = raidsCatalog.find(rr => rr.id === p.raidId);
            if (r) {
                raidName = r.name;
                imgHtml = `<img src="${r.image}" alt="${r.name}" onerror="this.style.display='none'">`;
            }
        }

        // Do NOT show dates for future predictions - unknown (current may extend)
        html += `
            <div class="raid-prediction-item">
                <div class="pred-left">
                    <div style="width:56px;height:44px;border-radius:6px;overflow:hidden;">${imgHtml}</div>
                    <div>
                        <div style="font-weight:700;color:#d6c9ff">${raidName}</div>
                        <div style="font-size:0.85rem;color:#95a5a6;margin-top:4px">${p.type.toUpperCase()}</div>
                        
                    </div>
                </div>
                <div class="pred-right">TBA</div>
            </div>
        `;
    });
    html += '</div>';
    predictionsContainer.innerHTML = html;

    // All raids
    if (allList) {
        allList.innerHTML = '';
        raidsCatalog.forEach(r => {
            const div = document.createElement('div');
            div.className = 'raid-tile';
            div.innerHTML = `<img src="${r.image}" alt="${r.name}" onerror="this.style.display='none'"> <div><div class="tile-name">${r.name}</div><div style="color:#95a5a6;font-size:0.85rem">Specimen: ${r.specimen}</div></div>`;
            div.style.cursor = 'pointer';
            div.addEventListener('click', () => openRaidDetailsInline(r, div));
            allList.appendChild(div);
        });
    }

    // History
    if (historyList) {
        historyList.innerHTML = '';
        raidsHistory.slice().reverse().forEach(h => {
            const raid = raidsCatalog.find(r=> r.id === h.raidId);
            const container = document.createElement('div');
            container.className = 'history-item';
            const raidName = raid ? raid.name : `#${h.raidId}`;
            const dateConv = convertToTimezone(parsePeruDate(h.date).toISOString(), currentTimezone);
            container.innerHTML = `<div class="hleft"><div style="width:48px;height:36px;border-radius:6px;overflow:hidden;">${raid && raid.image ? `<img src="${raid.image}" style="width:48px;height:36px;object-fit:cover" onerror="this.style.display='none'">` : '<div style="width:48px;height:36px;display:flex;align-items:center;justify-content:center;color:#9b59b6">?</div>'}</div><div><div style="font-weight:700;color:#d6c9ff">${raidName}</div><div style="font-size:0.85rem;color:#95a5a6">${dateConv.date}</div></div></div><div class="hright"><div class="history-type-${h.type}">${h.type.toUpperCase()}</div></div>`;
            historyList.appendChild(container);
        });
    }

    // Tabs behaviour
    document.querySelectorAll('.raid-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.raid-tab').forEach(b=>b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            if (tab === 'all') { document.getElementById('raidAllList').style.display = 'grid'; document.getElementById('raidHistoryList').style.display = 'none'; }
            else { document.getElementById('raidAllList').style.display = 'none'; document.getElementById('raidHistoryList').style.display = 'block'; }
        });
    });
}

// Lightbox for reward images
function openImageLightbox(url) {
    const lb = document.getElementById('imageLightbox');
    const img = document.getElementById('lightboxImage');
    if (!lb || !img) return;
    img.src = url;
    lb.style.display = 'flex';
}

function closeImageLightbox() {
    const lb = document.getElementById('imageLightbox');
    const img = document.getElementById('lightboxImage');
    if (!lb || !img) return;
    img.src = '';
    lb.style.display = 'none';
}

// Close lightbox on background click
window.addEventListener('click', (e) => {
    const lb = document.getElementById('imageLightbox');
    if (!lb) return;
    if (e.target === lb) closeImageLightbox();
});

// Close lightbox on ESC
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeImageLightbox();
});

function openRaidModal(raid) {
    // legacy modal removed - use inline details panel
    console.warn('openRaidModal is deprecated; use openRaidDetailsInline');
}

// Inline details rendering (replaces modal)
function openRaidDetailsInline(raid, tileElement) {
    const panel = document.getElementById('raidDetailsPanel');
    if (!panel) return;

    // mark active tile
    document.querySelectorAll('.raid-tile').forEach(t => t.classList.remove('active'));
    if (tileElement) tileElement.classList.add('active');

    const image = raid.image || '';
    const description = raid.description || '';
    const additional = raid.additionalInfo || '';

    // build rewards html
    let rewardsHtml = '';
    if (raid.rewards && Array.isArray(raid.rewards) && raid.rewards.length) {
        rewardsHtml = raid.rewards.map(rw => {
            if (!rw) return '';
            // allow either string (url) or object { image, name }
            if (typeof rw === 'string') {
                return `<div><img class="reward-img" src="${rw}" alt="reward" onerror="this.style.display='none'"></div>`;
            } else if (typeof rw === 'object') {
                const url = rw.image || rw.url || '';
                const label = rw.name || rw.label || '';
                return `<div><img class="reward-img" src="${url}" alt="${label}" onerror="this.style.display='none'"><div class="reward-label">${label}</div></div>`;
            }
            return '';
        }).join('');
    } else {
        rewardsHtml = `<div class="reward-placeholder">No rewards defined</div>`;
    }

    panel.innerHTML = `
        <div class="raid-details-inline">
            <div class="raid-details-main">
                <div class="raid-details-image">${image ? `<img src="${image}" alt="${raid.name}" onerror="this.style.display='none'">` : '<div style="padding:16px;color:#9b59b6">No image</div>'}</div>
                <div class="raid-details-info" style="margin-top:12px;">
                    <div class="raid-details-name">${raid.name}</div>
                    <div style="color:#95a5a6;margin-top:8px">Specimen: <strong style="color:#cfefff">${getSpecimenName(raid.specimen)}</strong> <span style="color:#7f8c8d">(${raid.specimen})</span></div>
                    ${description ? `<div style="color:#d6c9ff;margin-top:12px;font-style:italic;font-size:1rem">"${description}"</div>` : ''}
                    ${additional ? `<div style="margin-top:10px;color:#dcd2ff;font-size:0.95rem">${additional}</div>` : ''}
                    <div style="margin-top:12px;color:#dcd2ff">ID: ${raid.id}</div>
                </div>
            </div>
            <div class="raid-details-rewardcol">
                <h4 style="color:#3498db; margin-top: 2px;">Rewards</h4>
                <div class="rewards-images">
                    ${rewardsHtml}
                </div>
            </div>
        </div>
    `;

    // attach click handlers for reward images to open lightbox
    panel.querySelectorAll('.reward-img').forEach(imgEl => {
        imgEl.addEventListener('click', (e) => {
            const src = imgEl.getAttribute('src');
            if (src) openImageLightbox(src);
        });
        // support touch (tap) for mobile - same handler
        imgEl.addEventListener('touchstart', () => {
            const src = imgEl.getAttribute('src');
            if (src) openImageLightbox(src);
        });
    });
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Adjust main image to display fully; if portrait/tall image, limit height to 70% viewport
    try {
        const mainImg = panel.querySelector('.raid-details-image img');
        if (mainImg) {
            mainImg.addEventListener('load', () => {
                const w = mainImg.naturalWidth || mainImg.width;
                const h = mainImg.naturalHeight || mainImg.height;
                if (h && w && h / w > 1.2) {
                    // tall image — fit by height and reduce to ~70% of viewport
                    mainImg.style.width = 'auto';
                    mainImg.style.maxHeight = Math.round(window.innerHeight * 0.7) + 'px';
                } else {
                    // landscape or square — fit width of column
                    mainImg.style.width = '100%';
                    mainImg.style.maxHeight = Math.round(window.innerHeight * 0.8) + 'px';
                }
            });
            // in case already cached
            if (mainImg.complete) {
                const w = mainImg.naturalWidth || mainImg.width;
                const h = mainImg.naturalHeight || mainImg.height;
                if (h && w && h / w > 1.2) {
                    mainImg.style.width = 'auto';
                    mainImg.style.maxHeight = Math.round(window.innerHeight * 0.7) + 'px';
                } else {
                    mainImg.style.width = '100%';
                    mainImg.style.maxHeight = Math.round(window.innerHeight * 0.8) + 'px';
                }
            }
        }
    } catch (e) { /* ignore */ }
}

// Update only countdowns for raids to avoid reflow of full lists
function updateRaidCountdowns() {
    // Update current raid countdown
    try {
        const current = detectCurrentRaid();
        const el = document.getElementById('raidCurrentCountdown');
        if (el && current && current.isActive) {
            const now = new Date();
            const diff = current.endMax - now;
            if (diff <= 0) {
                el.textContent = 'Ended';
            } else {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                el.textContent = `${days}d ${hours}h ${mins}m`;
            }
        }
    } catch (err) {
        // ignore
    }
}

// SECTION 10: INITIALIZATION & STARTUP
// Ensure the raids data is loaded at startup
loadRaidsData();

// Initialize URL routing for ?page=pageName support (Blogspot frames)
initializeURLRouting();

// Inicial
populateSearchSelector();
updatePageText();
updateIncentivosDisplay();
updateCurrentTimezoneInfo();
// load both datasets on startup
loadMutantsData();
loadGachaData();
