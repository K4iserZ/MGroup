// blogger/blogger.js
// Utilities to be used inside Blogger entries. The idea is that the
// HTML of a post will include a `<script src="/blogger/blogger.js"></script>`
// and some inline code to call the functions below. All logic is self‑contained
// so it doesn't depend on the main site code.

// URL of the CSV stored on GitHub (raw). Replace with your actual repo path.
const BLOGGER_CSV_URL = 'https://raw.githubusercontent.com/usuario/repo/main/Stats.csv';

// download and cache CSV text
let _cachedCsv = null;
async function fetchBloggerCsv() {
    if (_cachedCsv) return _cachedCsv;
    const resp = await fetch(BLOGGER_CSV_URL);
    if (!resp.ok) throw new Error('Failed to load CSV');
    const text = await resp.text();
    _cachedCsv = text;
    return text;
}

function parseCsv(csvText) {
    const lines = csvText.split('\n');
    if (lines.length < 2) return [];
    const mutants = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const vals = line.split('|');
        if (vals.length < 22) continue;
        mutants.push({
            specimen: vals[0].trim(),
            name: vals[1].trim(),
            speed: parseInt(vals[2]) || 0,
            atk1p: vals[8]?.trim() || '',
            atk2p: vals[10]?.trim() || '',
            life: parseInt(vals[5]) || 0,
            abilityPct1: parseInt(vals[16]) || 0,
            abilityPct2: parseInt(vals[17]) || 0,
            abilities: vals[15]?.trim() || '',
            attack1p_name: vals[19]?.trim() || '',
            attack2p_name: vals[20]?.trim() || '',
            description: vals[21]?.trim() || ''
        });
    }
    return mutants;
}

async function getMutantBySpecimen(specimenCode) {
    const csv = await fetchBloggerCsv();
    const list = parseCsv(csv);
    return list.find(m => m.specimen === specimenCode);
}

// calculate stats mostly copied from main site version but fixed fame >=25
function calculateStats(mutantData, fameLevel = 1, starValueOverride = null) {
    if (!mutantData) return null;
    // parse abilities to names (same logic as main site)
    const abilityNames = {};
    if (mutantData.abilities) {
        const parts = mutantData.abilities.split(';');
        parts.forEach(p => {
            const [num, ability] = p.split(':');
            if (num && ability) {
                const name = ability.replace('ability_', '').replace(/_/g, ' ').split(' ').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
                abilityNames[num] = name;
            }
        });
    }
    const starValues = { platinum: 0, gold: 10, silver: -10 };
    const globalAdjust = 100;
    const starValue = (starValueOverride !== null) ? starValueOverride : (starValues['platinum']);
    const bonusStar = 100 + starValue;
    fameLevel = Math.max(25, parseInt(fameLevel) || 25); // always min 25 per your request
    let level = 100 + 10 * (fameLevel - 1);
    const extractNumber = (val) => { if (!val) return 0; const str = String(val).trim(); const match = str.match(/^(\d+)/); return parseInt(match ? match[1] : str) || 0; };
    const atk1pValue = extractNumber(mutantData.atk1p);
    const atk2pValue = extractNumber(mutantData.atk2p);
    const lifeValue = parseInt(mutantData.life) || 0;
    const speedValue = parseInt(mutantData.speed) || 0;
    const abilityPct2 = (parseInt(mutantData.abilityPct2) || 0);
    const lifeF = Math.round((lifeValue * bonusStar * level * globalAdjust) / 1000000);
    const atk1F = Math.round(Math.abs(((atk1pValue * bonusStar * level * globalAdjust) / 1000000)));
    const atk2F = Math.round(Math.abs(((atk2pValue * bonusStar * level * globalAdjust) / 1000000)));
    const speedF = (speedValue > 0 ? 10 / (speedValue / 100) : 0).toFixed(2);
    return {
        lifeF, speedF, atk1F, atk2F,
        ability1Name: abilityNames['1'] || '',
        ability2Name: abilityNames['2'] || '',
        attack1p_name: mutantData.attack1p_name || 'Attack 1',
        attack2p_name: mutantData.attack2p_name || 'Attack 2',
        description: mutantData.description || ''
    };
}

// Expose methods to global scope so inline blogger scripts can call them
window.BloggerUtils = {
    getMutantBySpecimen,
    calculateStats
};
