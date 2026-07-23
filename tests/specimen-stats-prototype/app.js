import { applyOrbEffectsToStats, getAllowedBasicOrbTypes, buildSpecialOrbOptions, buildBasicOrbOptions, normalizeAbilityType, buildAbilityDisplayEntries } from './orbLogic.js';

const starValues = { platinum: 100, gold: 75, silver: 30, bronze: 10, basic: 0 };
const numericToStarKey = { 0: 'basic', 1: 'bronze', 2: 'silver', 3: 'gold', 4: 'platinum' };
const abilityKeyMapping = { regen: 'regenerate' };

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
        N: 'https://s-ak.kobojo.com/mutants/assets/mobile/hud/fight_ui/gene_all.png',
        n: 'https://s-ak.kobojo.com/mutants/assets/mobile/hud/fight_ui/gene_all.png'
    }
};

let mutantsData = [];
let gachaData = {};
let abilitiesConfig = {};
let orbData = null;
let selectedOrbControls = null;

function parseUnlockAttack(unlockAttack) {
    const genes = {};
    if (!unlockAttack) return genes;
    unlockAttack.split(';').forEach(part => {
        const [attack, level, gen] = part.split(':');
        if (!attack || !level) return;
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

function isAOE(value) {
    return !!(value && String(value).includes(':AOE'));
}

function extractNumber(value) {
    if (!value) return 0;
    const str = String(value).trim();
    const match = str.match(/^(\d+)/);
    return parseInt(match ? match[1] : str, 10) || 0;
}

function parseGachaCSV(csvText) {
    const lines = csvText.split('\n');
    if (lines.length < 2) return;
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length < 6) continue;
        const entry = {
            gachaId: parts[0].trim(),
            specimen: parts[1].trim(),
            stars: parseInt(parts[2], 10) || 0,
            bonus: parseFloat(parts[3]) || 0,
            odds: parts[4].trim(),
            source: parts[5].trim()
        };
        if (!gachaData[entry.specimen]) gachaData[entry.specimen] = [];
        gachaData[entry.specimen].push(entry);
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
            abilitiesConfig[parts[0].trim()] = parts[1].trim();
        }
    }
}

function parseMutantsCSV(csvText) {
    const lines = csvText.split('\n');
    if (lines.length < 2) return;
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split('|');
        if (values.length < 3) continue;
        mutantsData.push({
            specimen: values[0]?.trim() || '',
            name: values[1]?.trim() || '',
            speed: parseInt(values[2], 10) || 0,
            odds: parseInt(values[3], 10) || 0,
            dna: values[4]?.trim() || '',
            life: parseInt(values[5], 10) || 0,
            incubMin: parseInt(values[6], 10) || 0,
            atk1: values[7]?.trim() || '',
            atk1p: values[8]?.trim() || '',
            atk2: values[9]?.trim() || '',
            atk2p: values[10]?.trim() || '',
            bank: parseInt(values[11], 10) || 0,
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
        });
    }
}

function getAbilityBaseKey(ability) {
    if (!ability) return '';
    const key = ability.trim().toLowerCase().replace(/^ability_/, '');
    const baseKey = key.split('_')[0] || '';
    return abilityKeyMapping[baseKey] || baseKey;
}

function getMutantBaseAbilityType(mutantData) {
    if (!mutantData?.abilities) return '';
    const abilityEntries = mutantData.abilities.split(';').map(entry => entry.trim()).filter(Boolean);
    const normalizedTypes = [];

    for (const entry of abilityEntries) {
        const [_, ability] = entry.split(':');
        const normalizedType = normalizeAbilityType(ability);
        if (normalizedType && !normalizedTypes.includes(normalizedType)) {
            normalizedTypes.push(normalizedType);
        }
    }

    return normalizedTypes[0] || '';
}

function getOrbSlotConfig(mutantData) {
    const rawSlots = mutantData?.orbSlots || '';
    const slotEntries = rawSlots
        .split(';')
        .map(entry => String(entry).trim())
        .filter(Boolean);

    const basicCount = slotEntries.filter(entry => String(entry).charAt(0).toLowerCase() === 'n').length;
    const specialCount = slotEntries.filter(entry => String(entry).charAt(0).toLowerCase() !== 'n').length;

    return {
        total: slotEntries.length,
        basicCount,
        specialCount,
        hasSpecial: specialCount > 0
    };
}

function getAbilityIconUrl(ability) {
    const baseKey = getAbilityBaseKey(ability);
    return baseKey ? `https://s-ak.kobojo.com/mutants/assets/abilities/ability_${baseKey}_big.png` : '';
}

function getStarInfo(specimenId, isRestrictedType = false) {
    const starInfo = {};
    starInfo.basic = { starValue: starValues.basic, bonusGacha: 0, label: 'Basic', image: 'https://s-ak.kobojo.com/mutants/assets/mobile/thumbnails/btn_black.png' };
    if (!isRestrictedType) {
        starInfo.bronze = { starValue: starValues.bronze, bonusGacha: 0, label: 'Bronze', image: 'https://s-ak.kobojo.com/mutants/assets/mobile/thumbnails/star_bronze.png' };
        starInfo.silver = { starValue: starValues.silver, bonusGacha: 0, label: 'Silver', image: 'https://s-ak.kobojo.com/mutants/assets/mobile/thumbnails/star_silver.png' };
        starInfo.gold = { starValue: starValues.gold, bonusGacha: 0, label: 'Gold', image: 'https://s-ak.kobojo.com/mutants/assets/mobile/thumbnails/star_gold.png' };
        starInfo.platinum = { starValue: starValues.platinum, bonusGacha: 0, label: 'Platinum', image: 'https://s-ak.kobojo.com/mutants/assets/mobile/thumbnails/star_platinum.png' };
    }
    const gachaList = gachaData[specimenId] || [];
    gachaList.forEach((entry, idx) => {
        const key = `gacha_${idx}`;
        const starKey = numericToStarKey[entry.stars] || 'basic';
        const starVal = starValues[starKey] || 0;
        starInfo[key] = {
            starValue: starVal,
            bonusGacha: entry.bonus || 0,
            label: `${entry.gachaId} (${entry.stars}★)`,
            image: `https://s-ak.kobojo.com/mutants/assets/gachacontent/icon_${entry.gachaId}.png`
        };
    });
    return starInfo;
}

function calculateMutantStats(mutantData, fameLevel, starType = 'platinum', bonusGacha = 0, starValueOverride = null) {
    const globalAdjust = 100;
    const starValue = (starValueOverride !== null) ? starValueOverride : (starValues[starType] ?? starValues.platinum);
    const bonusStar = 100 + starValue;
    const level = 100 + 10 * (parseInt(fameLevel, 10) - 1);
    const abilitiesStr = mutantData.abilities || '';
    const abilityNames = {};
    const abilityIcons = {};
    const appliesTo = abilitiesConfig[mutantData.specimen] || 'both';
    if (abilitiesStr) {
        abilitiesStr.split(';').forEach(part => {
            const [num, ability] = part.split(':');
            if (num && ability) {
                const abilityKey = getAbilityBaseKey(ability);
                const abilityName = abilityKey ? abilityKey.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
                abilityNames[num] = abilityName;
                abilityIcons[num] = getAbilityIconUrl(ability);
            }
        });
    }
    const atk1pValue = extractNumber(mutantData.atk1p);
    const atk2pValue = extractNumber(mutantData.atk2p);
    const lifeValue = parseInt(mutantData.life, 10) || 0;
    const speedValue = parseInt(mutantData.speed, 10) || 0;
    const abilityPct1 = parseInt(mutantData.abilityPct1, 10) || 0;
    const abilityPct2 = parseInt(mutantData.abilityPct2, 10) || 0;
    const lifeF = Math.round((lifeValue * (bonusStar - bonusGacha) * level * globalAdjust) / 1000000);
    const bonusGachaDecimal = bonusGacha / 100;
    const atk1F = Math.round(Math.abs(((atk1pValue * bonusGachaDecimal + atk1pValue) * bonusStar * level * globalAdjust) / 1000000));
    const atk2F = Math.round(Math.abs(((atk2pValue * bonusGachaDecimal + atk2pValue) * bonusStar * level * globalAdjust) / 1000000));
    const atk1AbilityF = Math.round(Math.abs((atk1F / 100) * abilityPct2));
    const atk2AbilityF = appliesTo === 'both' ? Math.round(Math.abs((atk2F / 100) * abilityPct2)) : 0;
    const speedF = (speedValue > 0 ? 10 / (speedValue / 100) : 0).toFixed(2);
    return {
        specimen: mutantData.specimen,
        name: mutantData.name,
        type: mutantData.type,
        fameLevel: fameLevel,
        level,
        lifeF,
        speedF,
        atk1F,
        atk1AbilityF,
        atk2F,
        atk2AbilityF,
        ability1Name: abilityNames['1'] || 'Unknown',
        ability2Name: appliesTo === 'both' ? (abilityNames['2'] || 'Unknown') : '',
        ability1Icon: abilityIcons['1'] || '',
        ability2Icon: appliesTo === 'both' ? (abilityIcons['2'] || '') : '',
        attack1p_name: mutantData.attack1p_name || 'Attack 1',
        attack2p_name: mutantData.attack2p_name || 'Attack 2',
        description: mutantData.description || ''
    };
}

function calculateEvolutionStats(mutantData, level, skinType = 'basic', bonusGacha = 0, starValueOverride = null) {
    const normalizedLevel = Math.min(25, Math.max(1, parseInt(level, 10) || 25));
    const unlockEvents = parseUnlockAttackEvents(mutantData.unlockattack);
    const unlocked = unlockEvents.filter(event => event.level <= normalizedLevel);
    const fieldMap = { 1: 'atk1', 2: 'atk2', '1p': 'atk1p', '2p': 'atk2p' };

    const attack1State = {
        unlocked: unlocked.some(event => event.attack === '1' || event.attack === '1p'),
        selectedKey: unlocked.some(event => event.attack === '1p') ? '1p' : (unlocked.some(event => event.attack === '1') ? '1' : null),
        value: null,
        event: null,
        gene: 'n'
    };
    const attack2State = {
        unlocked: unlocked.some(event => event.attack === '2' || event.attack === '2p'),
        selectedKey: unlocked.some(event => event.attack === '2p') ? '2p' : (unlocked.some(event => event.attack === '2') ? '2' : null),
        value: null,
        event: null,
        gene: 'n'
    };

    if (attack1State.selectedKey) {
        const key = attack1State.selectedKey;
        const event = unlocked.slice().reverse().find(item => item.attack === key) || null;
        const field = fieldMap[key];
        attack1State.event = event;
        attack1State.gene = event?.gene || parseUnlockAttack(mutantData.unlockattack)['1'] || 'n';
        attack1State.value = extractNumber(mutantData[field]);
    }

    if (attack2State.selectedKey) {
        const key = attack2State.selectedKey;
        const event = unlocked.slice().reverse().find(item => item.attack === key) || null;
        const field = fieldMap[key];
        attack2State.event = event;
        attack2State.gene = event?.gene || parseUnlockAttack(mutantData.unlockattack)['2'] || 'n';
        attack2State.value = extractNumber(mutantData[field]);
    }

    const starValue = (starValueOverride !== null) ? starValueOverride : (starValues[skinType] ?? starValues.platinum);
    const bonusStar = 100 + starValue;
    const globalAdjust = 100;
    const levelBase = 100 + 10 * (normalizedLevel - 1);
    const appliesTo = abilitiesConfig[mutantData.specimen] || 'both';
    const lifeValue = parseInt(mutantData.life, 10) || 0;
    const speedValue = parseInt(mutantData.speed, 10) || 0;
    const abilityPct2 = parseInt(mutantData.abilityPct2, 10) || 0;
    const lifeF = Math.round((lifeValue * (bonusStar - bonusGacha) * levelBase * globalAdjust) / 1000000);
    const bonusGachaDecimal = bonusGacha / 100;
    const atk1F = attack1State.value === null ? 0 : Math.round(Math.abs(((attack1State.value * bonusGachaDecimal + attack1State.value) * bonusStar * levelBase * globalAdjust) / 1000000));
    const atk2F = attack2State.value === null ? 0 : Math.round(Math.abs(((attack2State.value * bonusGachaDecimal + attack2State.value) * bonusStar * levelBase * globalAdjust) / 1000000));
    const atk1AbilityF = Math.round(Math.abs((atk1F / 100) * abilityPct2));
    const atk2AbilityF = appliesTo === 'both' ? Math.round(Math.abs((atk2F / 100) * abilityPct2)) : 0;
    const speedF = (speedValue > 0 ? 10 / (speedValue / 100) : 0).toFixed(2);

    return {
        ...calculateMutantStats(mutantData, level, skinType, bonusGacha, starValue),
        lifeF,
        speedF,
        atk1F,
        atk2F,
        atk1AbilityF,
        atk2AbilityF,
        unlockEvents,
        unlocked,
        attack1State,
        attack2State,
        skinType,
        bonusGacha,
        starValue,
        levelBase,
        normalizedLevel
    };
}

function parseOrbValue(value) {
    if (!value || value === 'none') return null;
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
}

function getSelectedOrbs() {
    if (!selectedOrbControls) return [];
    const { specialOrbSelect, basicOrbSelects } = selectedOrbControls;
    const selected = [];
    const specialSelection = parseOrbValue(specialOrbSelect?.value);
    if (specialSelection) {
        selected.push(specialSelection);
    }
    const activeBasicSelects = (basicOrbSelects || []).slice(0, selectedOrbControls.visibleBasicCount || basicOrbSelects.length);
    activeBasicSelects.forEach(select => {
        const selection = parseOrbValue(select?.value);
        if (selection) {
            selected.push(selection);
        }
    });
    return selected;
}

function getSelectedOrbValues() {
    if (!selectedOrbControls) return { specialValue: 'none', basicValues: [] };
    const { specialOrbSelect, basicOrbSelects } = selectedOrbControls;
    const basicValues = (basicOrbSelects || []).slice(0, selectedOrbControls.visibleBasicCount || basicOrbSelects.length).map(select => select?.value || 'none');
    return {
        specialValue: specialOrbSelect?.value || 'none',
        basicValues
    };
}

function init() {
    const specimenInput = document.getElementById('specimenInput');
    const specimenList = document.getElementById('specimenList');
    const levelInput = document.getElementById('levelInput');
    const skinSelect = document.getElementById('skinSelect');
    const specialOrbSelect = document.getElementById('specialOrbSelect');
    const specialOrbLabel = document.getElementById('specialOrbLabel');
    const basicOrbLabels = [
        document.getElementById('basicOrbLabel1'),
        document.getElementById('basicOrbLabel2'),
        document.getElementById('basicOrbLabel3')
    ].filter(Boolean);
    const basicOrbSelects = [
        document.getElementById('basicOrbSelect1'),
        document.getElementById('basicOrbSelect2'),
        document.getElementById('basicOrbSelect3')
    ].filter(Boolean);
    const status = document.getElementById('status');
    const results = document.getElementById('results');
    selectedOrbControls = { specialOrbSelect, specialOrbLabel, basicOrbSelects, basicOrbLabels, visibleBasicCount: basicOrbSelects.length, visibleSpecial: true };

    async function fetchTextFromCandidates(candidates) {
        for (const candidate of candidates) {
            try {
                const response = await fetch(candidate);
                if (!response.ok) continue;
                return await response.text();
            } catch (error) {
                console.warn(`Failed to load ${candidate}`, error);
            }
        }
        throw new Error(`Unable to load any candidate: ${candidates.join(', ')}`);
    }

    async function loadData() {
        try {
            const baseCandidates = [
                '../../Stats.csv',
                '../Stats.csv',
                '/Stats.csv',
                'Stats.csv'
            ];
            const gachaCandidates = [
                '../../gachav2.csv',
                '../gachav2.csv',
                '/gachav2.csv',
                'gachav2.csv'
            ];
            const abilitiesCandidates = [
                '../../filescsv/abilitiesconfig.csv',
                '../filescsv/abilitiesconfig.csv',
                '/filescsv/abilitiesconfig.csv',
                'filescsv/abilitiesconfig.csv'
            ];
            const orbsCandidates = [
                '../../orbs_organized.json',
                '../orbs_organized.json',
                '/orbs_organized.json',
                'orbs_organized.json'
            ];

            const [statsText, gachaText, abilitiesText, orbsText] = await Promise.all([
                fetchTextFromCandidates(baseCandidates),
                fetchTextFromCandidates(gachaCandidates),
                fetchTextFromCandidates(abilitiesCandidates),
                fetchTextFromCandidates(orbsCandidates)
            ]);

            parseMutantsCSV(statsText);
            parseGachaCSV(gachaText);
            parseAbilitiesConfigCSV(abilitiesText);
            orbData = JSON.parse(orbsText);
            populateSpecimenOptions(specimenList, specimenInput);
            populateSkinOptions(mutantsData[0]?.specimen || '', skinSelect);
            populateOrbControls(mutantsData[0]);
            renderSelection();
            status.textContent = `Loaded ${mutantsData.length} specimens, ${Object.keys(gachaData).length} gacha entries and ${Object.keys(orbData?.basic || {}).length} orb groups.`;
        } catch (error) {
            console.error(error);
            status.textContent = 'Unable to load data.';
        }
    }

    function populateSpecimenOptions(list, input) {
        list.innerHTML = '';
        mutantsData.forEach(mutant => {
            const nameOption = document.createElement('option');
            nameOption.value = mutant.name;
            nameOption.label = `${mutant.name} (${mutant.specimen})`;
            list.appendChild(nameOption);

            const codeOption = document.createElement('option');
            codeOption.value = mutant.specimen;
            codeOption.label = `${mutant.specimen} — ${mutant.name}`;
            list.appendChild(codeOption);
        });
        if (!input.value && mutantsData[0]) {
            input.value = mutantsData[0].name;
        }
    }

    function getSelectedMutant(value) {
        const needle = (value || '').toLowerCase().trim();
        if (!needle) return mutantsData[0] || null;
        return mutantsData.find(mutant => {
            return mutant.name.toLowerCase().includes(needle) || mutant.specimen.toLowerCase().includes(needle);
        }) || null;
    }

    function populateSkinOptions(specimenId, select) {
        const mutant = mutantsData.find(item => item.specimen === specimenId);
        if (!mutant) return;
        const restrictedTypes = ['CAPTAINPEACE', 'SEASONAL', 'VIDEOGAME', 'GACHA', 'ZODIAC'];
        const isRestrictedType = restrictedTypes.some(type => (mutant.type || '').toUpperCase().includes(type));
        const starInfo = getStarInfo(specimenId, isRestrictedType);
        const previousValue = select.value || 'basic';
        select.innerHTML = '';
        Object.entries(starInfo).forEach(([key, info]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = info.label;
            select.appendChild(option);
        });

        const nextValue = starInfo[previousValue] ? previousValue : Object.keys(starInfo)[0] || 'basic';
        select.value = nextValue;
    }

    function populateOrbControls(mutant = null) {
        if (!orbData) return;
        const selectedMutant = mutant || getSelectedMutant(specimenInput.value);
        const slotConfig = getOrbSlotConfig(selectedMutant);
        const specialOptions = buildSpecialOrbOptions(orbData);
        const selectedValues = getSelectedOrbValues();
        const selectedSpecialValue = specialOptions.some(option => option.value === selectedValues.specialValue)
            ? selectedValues.specialValue
            : 'none';
        const baseAbilityType = getMutantBaseAbilityType(selectedMutant);

        const shouldShowSpecial = slotConfig.hasSpecial;
        selectedOrbControls.visibleBasicCount = slotConfig.basicCount;
        selectedOrbControls.visibleSpecial = shouldShowSpecial;

        specialOrbLabel.style.display = shouldShowSpecial ? '' : 'none';
        specialOrbSelect.style.display = shouldShowSpecial ? '' : 'none';
        specialOrbSelect.disabled = !shouldShowSpecial;

        specialOrbSelect.innerHTML = '';
        specialOptions.forEach(optionData => {
            const option = document.createElement('option');
            option.value = optionData.value;
            option.textContent = optionData.label;
            specialOrbSelect.appendChild(option);
        });
        specialOrbSelect.value = shouldShowSpecial ? selectedSpecialValue : 'none';

        const specialSelection = parseOrbValue(specialOrbSelect.value);
        basicOrbLabels.forEach((label, index) => {
            const isVisible = index < slotConfig.basicCount;
            label.style.display = isVisible ? '' : 'none';
        });
        basicOrbSelects.forEach((select, index) => {
            const isVisible = index < slotConfig.basicCount;
            select.style.display = isVisible ? '' : 'none';
            select.disabled = !isVisible;
            if (!isVisible) {
                select.value = 'none';
                return;
            }

            const options = buildBasicOrbOptions(orbData, specialSelection?.orb?.type || '', baseAbilityType);
            const previousValue = selectedValues.basicValues[index] || 'none';
            const selectedValue = options.some(option => option.value === previousValue)
                ? previousValue
                : 'none';

            select.innerHTML = '';
            options.forEach(optionData => {
                const option = document.createElement('option');
                option.value = optionData.value;
                option.textContent = optionData.label;
                select.appendChild(option);
            });
            select.value = selectedValue;
        });
    }

    function renderSelection() {
        const mutant = getSelectedMutant(specimenInput.value);
        if (!mutant) {
            results.innerHTML = '<div class="card"><div class="muted">No specimen found for that text.</div></div>';
            return;
        }
        const specimenId = mutant.specimen;
        const level = Math.min(25, Math.max(1, parseInt(levelInput.value, 10) || 25));
        const skinType = skinSelect.value || 'basic';
        const starInfo = getStarInfo(specimenId, false);
        const info = starInfo[skinType] || starInfo.basic;
        const stats = calculateEvolutionStats(mutant, level, skinType, info.bonusGacha || 0, info.starValue ?? null);
        const orbAdjustedStats = { ...stats, ...applyOrbEffectsToStats(stats, getSelectedOrbs(), { baseAbilityType: getMutantBaseAbilityType(mutant) }) };
        const derivedAbilityStats = {
            atk1AbilityF: orbAdjustedStats.atk1TotalAbilityF ?? orbAdjustedStats.atk1AbilityF,
            atk2AbilityF: orbAdjustedStats.atk2TotalAbilityF ?? orbAdjustedStats.atk2AbilityF
        };
        renderResults(mutant, { ...orbAdjustedStats, ...derivedAbilityStats }, level, skinType, info);
        populateSkinOptions(specimenId, skinSelect);
        populateOrbControls(mutant);
    }

    specimenInput.addEventListener('input', renderSelection);
    specimenInput.addEventListener('change', renderSelection);
    levelInput.addEventListener('input', renderSelection);
    skinSelect.addEventListener('change', renderSelection);
    specialOrbSelect.addEventListener('change', renderSelection);
    basicOrbSelects.forEach(select => select.addEventListener('change', renderSelection));

    loadData();
}

function renderResults(mutant, stats, level, skinType, skinInfo) {
    const results = document.getElementById('results');
    const status = document.getElementById('status');
    const genes = parseUnlockAttack(mutant.unlockattack);
    const attack1Label = mutant.attack1p_name || 'Attack 1';
    const attack2Label = mutant.attack2p_name || 'Attack 2';
    const attack1State = stats.attack1State;
    const attack2State = stats.attack2State;

    const timelineItems = stats.unlockEvents.map(event => {
        const isUnlocked = event.level <= level;
        const label = event.attack === '1' ? 'Attack 1' : event.attack === '2' ? 'Attack 2' : event.attack === '1p' ? 'Upgrade 1' : event.attack === '2p' ? 'Upgrade 2' : event.attack;
        const geneIcon = event.gene && ICONS.gene[event.gene.toUpperCase()] ? `<img class="gene-icon" src="${ICONS.gene[event.gene.toUpperCase()]}" alt="${event.gene}" />` : '';
        return `
            <div class="timeline-item ${isUnlocked ? 'unlocked' : 'locked'}">
                <div>
                    <strong>${label}</strong><br />
                    <span class="muted small">Unlocks at level ${event.level}</span>
                </div>
                <div style="display:flex; align-items:center; gap:0.4rem;">
                    ${geneIcon}
                    <span class="pill">${event.gene.toUpperCase()}</span>
                </div>
            </div>
        `;
    }).join('');

    const orbDetails = (() => {
        const selected = getSelectedOrbs();
        if (!selected.length) return 'No orbs selected';
        return selected.map(entry => entry.orb?.name || 'Orb').join(' • ');
    })();

    const selectedOrbs = getSelectedOrbs();
    const attackItems = [
        {
            title: attack1Label,
            state: attack1State,
            value: stats.atk1F,
            ability: stats.ability1Name,
            abilityValue: stats.atk1AbilityF,
            isUnlocked: attack1State.unlocked,
            unlockLevel: attack1State.event?.level || null
        },
        {
            title: attack2Label,
            state: attack2State,
            value: stats.atk2F,
            ability: stats.ability2Name,
            abilityValue: stats.atk2AbilityF,
            isUnlocked: attack2State.unlocked,
            unlockLevel: attack2State.event?.level || null
        }
    ].map(item => {
        const geneIcon = item.state.gene && ICONS.gene[item.state.gene.toUpperCase()] ? `<img class="gene-icon" src="${ICONS.gene[item.state.gene.toUpperCase()]}" alt="${item.state.gene}" />` : '';
        const unlockText = item.isUnlocked ? `Unlocked • ${item.state.selectedKey || '—'}` : `Locked until level ${item.unlockLevel ?? '—'}`;
        return `
            <div class="attack-item ${item.isUnlocked ? 'unlocked' : 'locked'}">
                <div>
                    <strong>${item.title}</strong><br />
                    <span class="muted small">${unlockText}</span>
                </div>
                <div style="text-align:right;">
                    <div>${item.isUnlocked ? item.value.toLocaleString() : '0'}</div>
                    <div class="small muted">${item.isUnlocked ? `${item.abilityValue.toLocaleString()} • ${item.ability || '—'}` : 'Locked'}</div>
                </div>
                <div style="display:flex; align-items:center; gap:0.4rem;">
                    ${geneIcon}
                    <span class="pill">${item.state.gene ? item.state.gene.toUpperCase() : 'N'}</span>
                </div>
            </div>
        `;
    }).join('');

    const abilitySummary = (attackId) => {
        const baseAbilityType = getMutantBaseAbilityType(mutant);
        const specialSelection = selectedOrbs.find(entry => entry.kind === 'special');
        const specialType = specialSelection?.orb?.type || '';
        const baseValue = attackId === 1 ? Number(stats.atk1BaseAbilityF || 0) : Number(stats.atk2BaseAbilityF || 0);
        const addedValue = attackId === 1 ? Number(stats.atk1AddedAbilityF || 0) : Number(stats.atk2AddedAbilityF || 0);
        const entries = buildAbilityDisplayEntries(baseAbilityType, specialType, baseValue, addedValue);
        return entries.map(entry => `${entry.label}: ${Math.trunc(entry.value)}`).join(' | ');
    };

    results.innerHTML = `
        <div class="card">
            <div style="display:flex; justify-content:space-between; gap:1rem; flex-wrap:wrap; align-items:center;">
                <div>
                    <h2 style="margin:0 0 0.25rem; color:#e94560;">${mutant.name} • ${mutant.specimen}</h2>
                    <div class="muted">DNA: ${mutant.dna || '—'} • Skin: ${skinInfo.label}</div>
                </div>
                <div class="pill">Level ${level} • Supports levels 1–25</div>
            </div>

            <div class="muted small" style="margin-top:0.6rem;">Orb preview: ${orbDetails}</div>

            <div style="margin-top: 0.8rem; display:flex; flex-wrap:wrap; gap:0.5rem;">
                <span class="pill">Attack/Life multiplier from basic orbs</span>
                <span class="pill">Ability multiplier from allowed basic orbs</span>
                <span class="pill">Special speed orbs modify speed directly</span>
            </div>

            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-label">Life</div>
                    <div class="stat-value">${stats.lifeF.toLocaleString()}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Speed</div>
                    <div class="stat-value">${stats.speedF}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Atk 1</div>
                    <div class="stat-value">${stats.atk1F.toLocaleString()}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Atk 2</div>
                    <div class="stat-value">${stats.atk2F.toLocaleString()}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Ability 1</div>
                    <div class="stat-value">${abilitySummary(1)}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Ability 2</div>
                    <div class="stat-value">${abilitySummary(2)}</div>
                </div>
            </div>

            <div style="margin-top: 1rem; display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem;">
                <div>
                    <h3 style="margin-bottom:0.35rem;">Current active attacks</h3>
                    <div class="attack-list">${attackItems}</div>
                </div>
                <div>
                    <h3 style="margin-bottom:0.35rem;">Unlock timeline from unlockAttack</h3>
                    <div class="timeline-list">${timelineItems}</div>
                </div>
            </div>
        </div>
    `;
    status.textContent = `Using ${skinInfo.label} and current unlocks from level ${level}`;
}

init();
