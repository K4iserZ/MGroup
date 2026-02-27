/* Mutants comparison functionality */

import { getMutantFromCsv, calculateMutantStats, mutantsData, gachaData, starValues, numericToStarKey, ICONS } from './mutants.js';

let selectedMutants = [];
let mutantStarTypes = [];
const MAX_MUTANTS = 4;
const MIN_MUTANTS = 2;

function getValidStarsForMutant(mutant) {
    const restrictedTypes = ['CAPTAINPEACE', 'SEASONAL', 'GAMES', 'GACHA'];
    const typeUpper = (mutant.type || '').toUpperCase();
    const isRestrictedType = restrictedTypes.some(t => typeUpper.includes(t));
    
    const basicStars = isRestrictedType ? ['basic'] : ['basic', 'bronze', 'silver', 'gold', 'platinum'];
    
    // Add gacha skins if available
    const gachaList = gachaData[mutant.specimen] || [];
    const gachaSkins = gachaList.map((entry, idx) => `gacha_${idx}`);
    
    return [...basicStars, ...gachaSkins];
}

function getDefaultStarForMutant(mutant) {
    const restrictedTypes = ['CAPTAINPEACE', 'SEASONAL', 'GAMES', 'GACHA'];
    const typeUpper = (mutant.type || '').toUpperCase();
    const isRestrictedType = restrictedTypes.some(t => typeUpper.includes(t));
    
    if (isRestrictedType) return 'basic';
    return 'platinum';
}

function initCompareSection() {
    const container = document.getElementById('compareSelectorsContainer');
    const addBtn = document.getElementById('addMutantCompare');
    const removeBtn = document.getElementById('removeMutantCompare');
    const clearBtn = document.getElementById('clearCompare');
    const fameInput = document.getElementById('compareFameLevel');

    if (!container) return;

    // Initialize with 2 selectors
    addMutantSelector();
    addMutantSelector();

    addBtn.addEventListener('click', addMutantSelector);
    removeBtn.addEventListener('click', removeMutantSelector);
    clearBtn.addEventListener('click', clearAllSelectors);

    fameInput.addEventListener('input', updateComparison);
}

function getImageUrlForSkin(specimen, skinType, mutant) {
    if (!skinType || skinType === 'basic') {
        return `https://s-ak.kobojo.com/mutants/assets/thumbnails/${specimen.toLowerCase()}.png`;
    }
    
    // Handle gacha skins
    if (skinType.startsWith('gacha_')) {
        const idx = parseInt(skinType.split('_')[1]);
        const gachaList = gachaData[specimen] || [];
        if (gachaList[idx]) {
            return `https://s-ak.kobojo.com/mutants/assets/thumbnails/${specimen.toLowerCase()}_${gachaList[idx].gachaId}.png`;
        }
    }
    
    // Handle regular stars
    return `https://s-ak.kobojo.com/mutants/assets/thumbnails/${specimen.toLowerCase()}_${skinType}.png`;
}

function addMutantSelector() {
    if (selectedMutants.length >= MAX_MUTANTS) {
        alert(`Maximum ${MAX_MUTANTS} mutants allowed`);
        return;
    }

    const container = document.getElementById('compareSelectorsContainer');
    const index = selectedMutants.length;
    const div = document.createElement('div');
    div.className = 'compare-selector';
    div.style.padding = '1rem';
    div.style.background = '#0f3460';
    div.style.borderRadius = '8px';
    div.style.border = '2px solid #3498db';

    const colors = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c'];

    div.innerHTML = `
        <label style="color: ${colors[index]}; font-weight: bold; display: block; margin-bottom: 0.5rem;">🔍 Mutant ${index + 1}</label>
        <div style="position: relative; margin-bottom: 0.8rem;">
            <input type="text" id="mutantSearch${index}" placeholder="Search mutant..." style="background: #16213e; color: #ecf0f1; border: 2px solid ${colors[index]}; padding: 0.6rem 1rem; border-radius: 5px; font-size: 0.95rem; width: 100%; font-weight: 500;">
            <div id="mutantDropdown${index}" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: #0f3460; border: 2px solid ${colors[index]}; border-top: none; border-radius: 0 0 5px 5px; max-height: 200px; overflow-y: auto; z-index: 1000;"></div>
        </div>
        <label style="color: ${colors[index]}; font-weight: bold; display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">⭐ Star Type</label>
        <select id="mutantStarSelect${index}" style="background: #16213e; color: #ecf0f1; border: 2px solid ${colors[index]}; padding: 0.6rem 1rem; border-radius: 5px; font-size: 0.95rem; width: 100%; font-weight: 500; cursor: pointer; margin-bottom: 0.8rem;">
            <option value="">-- Select Mutant First --</option>
        </select>
        <div id="mutantPreview${index}" style="margin-top: 0.8rem; text-align: center; display: none;">
            <img id="mutantImg${index}" src="" alt="" style="max-width: 100%; max-height: 120px; border-radius: 5px; margin-bottom: 0.5rem;">
            <p id="mutantName${index}" style="color: #ecf0f1; font-size: 0.9rem; margin: 0;"></p>
            <p id="mutantSkinLabel${index}" style="color: #f39c12; font-size: 0.8rem; margin: 0.3rem 0 0 0;"></p>
        </div>
    `;

    container.appendChild(div);
    selectedMutants.push(null);
    mutantStarTypes.push('platinum');

    const searchInput = document.getElementById(`mutantSearch${index}`);
    const dropdown = document.getElementById(`mutantDropdown${index}`);
    const starSelect = document.getElementById(`mutantStarSelect${index}`);
    
    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();
        dropdown.innerHTML = '';
        
        if (value.length < 1) {
            dropdown.style.display = 'none';
            return;
        }
        
        const filtered = mutantsData.filter(m => m.name.toLowerCase().includes(value)).slice(0, 10);
        
        if (filtered.length === 0) {
            dropdown.style.display = 'none';
            return;
        }
        
        filtered.forEach(mutant => {
            const option = document.createElement('div');
            option.style.padding = '0.6rem 1rem';
            option.style.cursor = 'pointer';
            option.style.borderBottom = '1px solid #3498db';
            option.style.color = '#ecf0f1';
            option.style.transition = 'background 0.2s';
            option.innerHTML = `${mutant.name}`;
            
            option.addEventListener('mouseenter', () => {
                option.style.background = '#16213e';
            });
            option.addEventListener('mouseleave', () => {
                option.style.background = 'transparent';
            });
            
            option.addEventListener('click', () => {
                selectedMutants[index] = mutant.name;
                searchInput.value = mutant.name;
                dropdown.style.display = 'none';
                
                const fullMutant = getMutantFromCsv(mutant.name);
                const validStars = getValidStarsForMutant(fullMutant);
                const defaultStar = getDefaultStarForMutant(fullMutant);
                
                // Update star options with gacha skins
                let starsHtml = '';
                validStars.forEach(star => {
                    let label = '';
                    if (star.startsWith('gacha_')) {
                        const idx = parseInt(star.split('_')[1]);
                        const gachaList = gachaData[mutant.specimen] || [];
                        if (gachaList[idx]) {
                            label = `🎲 Gacha ${gachaList[idx].gachaId} (${gachaList[idx].stars}★)`;
                        }
                    } else {
                        label = star.charAt(0).toUpperCase() + star.slice(1);
                    }
                    starsHtml += `<option value="${star}" ${star === defaultStar ? 'selected' : ''}>${label}</option>`;
                });
                starSelect.innerHTML = starsHtml;
                mutantStarTypes[index] = defaultStar;
                
                updateMutantPreview(index);
                updateComparison();
            });
            
            dropdown.appendChild(option);
        });
        
        dropdown.style.display = 'block';
    });
    
    searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            dropdown.style.display = 'none';
        }, 200);
    });

    starSelect.addEventListener('change', (e) => {
        mutantStarTypes[index] = e.target.value;
        updateMutantPreview(index);
        updateComparison();
    });
}

function updateMutantPreview(index) {
    const mutantName = selectedMutants[index];
    const preview = document.getElementById(`mutantPreview${index}`);
    const skinType = mutantStarTypes[index];
    
    if (!mutantName) {
        preview.style.display = 'none';
        return;
    }

    const mutant = getMutantFromCsv(mutantName);
    if (!mutant) return;

    preview.style.display = 'block';
    const imageUrl = getImageUrlForSkin(mutant.specimen, skinType, mutant);
    const imgElement = document.getElementById(`mutantImg${index}`);
    
    imgElement.src = imageUrl;
    imgElement.onerror = function() {
        this.style.display = 'none';
    };
    imgElement.onload = function() {
        this.style.display = '';
    };
    
    document.getElementById(`mutantName${index}`).textContent = mutantName;
    
    // Update skin label
    let skinLabel = '';
    if (skinType.startsWith('gacha_')) {
        const idx = parseInt(skinType.split('_')[1]);
        const gachaList = gachaData[mutant.specimen] || [];
        if (gachaList[idx]) {
            skinLabel = `🎲 Gacha ${gachaList[idx].gachaId}`;
        }
    } else {
        skinLabel = skinType.charAt(0).toUpperCase() + skinType.slice(1);
    }
    document.getElementById(`mutantSkinLabel${index}`).textContent = skinLabel;
}

function removeMutantSelector() {
    if (selectedMutants.length <= MIN_MUTANTS) {
        alert(`Minimum ${MIN_MUTANTS} mutants required`);
        return;
    }

    const container = document.getElementById('compareSelectorsContainer');
    const lastChild = container.lastElementChild;
    if (lastChild) {
        lastChild.remove();
    }
    selectedMutants.pop();
    mutantStarTypes.pop();
    updateComparison();
}

function clearAllSelectors() {
    const container = document.getElementById('compareSelectorsContainer');
    container.innerHTML = '';
    selectedMutants = [];
    mutantStarTypes = [];
    document.getElementById('compareResultsContainer').innerHTML = '';
    
    // Re-add 2 default selectors
    addMutantSelector();
    addMutantSelector();
}

function updateComparison() {
    const fameLevel = parseInt(document.getElementById('compareFameLevel').value) || 25;

    const validMutants = selectedMutants.filter(m => m !== null && m !== '');
    
    if (validMutants.length < MIN_MUTANTS) {
        document.getElementById('compareResultsContainer').innerHTML = '<p style="color: #95a5a6; text-align: center; padding: 2rem;">Select at least 2 mutants to compare</p>';
        return;
    }

    renderComparison(validMutants, fameLevel);
}

function renderComparison(mutantNames, fameLevel) {
    const container = document.getElementById('compareResultsContainer');
    const mutants = mutantNames.map(name => getMutantFromCsv(name)).filter(m => m !== null);

    if (mutants.length === 0) return;

    // Calculate stats for each mutant with individual star types
    const stats = mutants.map((mutant, idx) => {
        const starType = mutantStarTypes[selectedMutants.indexOf(mutant.name)];
        let starValue = 0;
        let bonusGacha = 0;
        
        // Handle gacha skins
        if (starType.startsWith('gacha_')) {
            const gachaIdx = parseInt(starType.split('_')[1]);
            const gachaList = gachaData[mutant.specimen] || [];
            if (gachaList[gachaIdx]) {
                const gachaEntry = gachaList[gachaIdx];
                const starKey = numericToStarKey[gachaEntry.stars] || 'basic';
                starValue = starValues[starKey] || 0;
                bonusGacha = gachaEntry.bonus || 0;
            }
        } else {
            starValue = starValues[starType] || 0;
        }
        
        return calculateMutantStats(mutant, fameLevel, starType, bonusGacha, starValue);
    });

    // Get stat categories
    const statCategories = [
        { key: 'lifeF', label: 'Life', icon: ICONS.life, color: '#e94560' },
        { key: 'speedF', label: 'Speed', icon: ICONS.speed, color: '#3498db' },
        { key: 'atk1F', label: 'Attack 1', icon: null, color: '#f39c12', emoji: '⚔️' },
        { key: 'atk1AbilityF', label: 'Atk1 Ability', icon: null, color: '#f39c12', emoji: '✨' },
        { key: 'atk2F', label: 'Attack 2', icon: null, color: '#9b59b6', emoji: '⚔️' },
        { key: 'atk2AbilityF', label: 'Atk2 Ability', icon: null, color: '#9b59b6', emoji: '✨' }
    ];

    const colors = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c'];

    let html = `
        <div style="border: 2px solid #3498db; border-radius: 10px; overflow: hidden; background: linear-gradient(135deg, #16213e 0%, #0f3460 100%);">
            <!-- Header with mutant names -->
            <div style="display: grid; grid-template-columns: 200px ${mutants.map(() => '1fr').join(' ')}; gap: 0; border-bottom: 2px solid #3498db;">
                <div style="padding: 1rem; background: #0f3460; display: flex; align-items: center; justify-content: center; border-right: 2px solid #3498db;">
                    <p style="color: #3498db; font-weight: bold; margin: 0;">Stat</p>
                </div>
    `;

    stats.forEach((stat, idx) => {
        const mutant = mutants[idx];
        const starType = mutantStarTypes[selectedMutants.indexOf(mutant.name)];
        const imageUrl = getImageUrlForSkin(mutant.specimen, starType, mutant);
        
        // Generate skin label
        let starLabel = '';
        if (starType.startsWith('gacha_')) {
            const gachaIdx = parseInt(starType.split('_')[1]);
            const gachaList = gachaData[mutant.specimen] || [];
            if (gachaList[gachaIdx]) {
                starLabel = `🎲 Gacha ${gachaList[gachaIdx].gachaId}`;
            }
        } else {
            starLabel = starType.charAt(0).toUpperCase() + starType.slice(1);
        }
        
        html += `
            <div style="padding: 1rem; background: #0f3460; border-right: 2px solid #3498db; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; border-right: ${idx < mutants.length - 1 ? '2px solid #3498db' : 'none'};">
                <img src="${imageUrl}" alt="${stat.name}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid ${colors[idx]};" onerror="this.style.display='none';">
                <p style="color: ${colors[idx]}; font-weight: bold; margin: 0; font-size: 0.9rem;">${stat.name}</p>
                <p style="color: #95a5a6; font-size: 0.75rem; margin: 0;">${stat.type || 'N/A'}</p>
                <p style="color: #f39c12; font-size: 0.75rem; margin: 0.2rem 0 0 0;">⭐ ${starLabel}</p>
            </div>
        `;
    });

    html += `</div>`;

    // Comparison rows
    statCategories.forEach(cat => {
        html += `<div style="display: grid; grid-template-columns: 200px ${mutants.map(() => '1fr').join(' ')}; gap: 0; border-bottom: 1px solid #3498db;">`;
        
        // Label
        html += `
            <div style="padding: 1rem; border-right: 2px solid #3498db; display: flex; align-items: center; gap: 0.5rem;">
                ${cat.icon ? `<img src="${cat.icon}" alt="${cat.label}" style="width: 20px; height: 20px;">` : ''}
                ${cat.emoji ? `<span style="font-size: 1.2rem;">${cat.emoji}</span>` : ''}
                <span style="color: #95a5a6; font-size: 0.9rem;">${cat.label}</span>
            </div>
        `;

        // Values
        const values = stats.map(stat => stat[cat.key]);
        const maxValue = Math.max(...values.filter(v => v !== null && v !== undefined));

        values.forEach((val, idx) => {
            const isMax = val === maxValue;
            const barWidth = maxValue > 0 ? (val / maxValue) * 100 : 0;
            html += `
                <div style="padding: 1rem; border-right: ${idx < stats.length - 1 ? '2px solid #3498db' : 'none'}; display: flex; flex-direction: column; gap: 0.5rem;">
                    <p style="color: ${colors[idx]}; font-weight: bold; font-size: 1.1rem; margin: 0; ${isMax ? 'text-shadow: 0 0 10px ' + colors[idx] : ''}">${val}</p>
                    <div style="background: rgba(52, 152, 219, 0.2); height: 6px; border-radius: 3px; overflow: hidden;">
                        <div style="background: ${colors[idx]}; height: 100%; width: ${barWidth}%; transition: width 0.3s ease;"></div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
    });

    html += `</div>`;

    container.innerHTML = html;
}

export { initCompareSection };
