/* Utils: shared helpers, i18n, timezone, routing */

const ultimoIncentivoPeru = new Date('2026-01-09T01:00:00Z');

let selectedTimezone = 'auto';
let currentTimezone = null;

// Translations
const translations = {
    en: {
        home: 'Home',
        incentives: 'Crafting Incentives',
        information: 'Information',
        timezone: 'Timezone:',
        auto_detect: 'Auto-detect',
        search_incentive: 'Search Incentive:',
        select_incentive: 'Select an incentive...',
        next_incentives: 'Upcoming Crafting Incentives',
        current_active: 'Currently Active Incentive',
        active_now: '⚡ ACTIVE NOW',
        duration: 'Duration',
        start: 'Start',
        end: 'End',
        begins_in: 'Begins in',
        ends_in: 'Ends in',
        finished: 'Finished',
        active_badge: 'Active',
        upcoming_badge: 'Upcoming',
        expired_badge: 'Expired',
        no_active: 'No Active Incentives',
        no_active_desc: 'The next incentive will start soon. Get ready!',
        load_more: '📅 Load More Dates',
        showing: 'Showing',
        incentives_count: 'incentives',
        next_dates: '📅 Upcoming dates for',
        back_to_list: '← Back to list',
        hero_title: '🎮 Crafting Incentives',
        hero_desc: 'Discover upcoming events and special crafting offers in Mutants',
        view_incentives: 'View Incentives',
        timezone_info: '⏰ Local Timezone',
        timezone_info_desc: 'Schedules automatically adapt to your timezone. You can change it manually in the selector above.',
        dates_info: '📅 Precise Dates',
        dates_info_desc: 'All start and end dates and times for each incentive converted to your timezone.',
        countdown_info: '⏳ Countdown',
        countdown_info_desc: 'See the remaining time until each incentive starts or ends.',
        how_it_works: 'How it works',
        timezone_config: 'Timezone Configuration',
        use_auto: 'Auto-detect: ',
        use_auto_desc: 'Automatically detects your timezone based on your location',
        use_manual: 'Manual: ',
        use_manual_desc: 'Select your country or region from the list',
        current_timezone: 'Current timezone:',
        incentive_status: 'Incentive Status',
        status_active: 'Active: ',
        status_active_desc: 'The incentive is currently in progress',
        status_upcoming: 'Upcoming: ',
        status_upcoming_desc: 'The incentive will start in the future',
        status_expired: 'Expired: ',
        status_expired_desc: 'The incentive has already finished',
        base_timezone: 'Base Timezone',
        base_timezone_desc: 'All base schedules are in Peru Timezone (UTC-5) and are automatically converted to your selected zone.'
    }
};

let currentLanguage = 'en';

function t(key) {
    return translations[currentLanguage][key] || key;
}

function updateLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    updatePageText();
    if (typeof window !== 'undefined' && typeof window.updateIncentivosDisplay === 'function') window.updateIncentivosDisplay();
}

function updatePageText() {
    try {
        document.querySelector('[data-page="home"]').textContent = t('home');
        document.querySelector('[data-page="incentivos"]').textContent = t('incentives');
        document.querySelector('[data-page="info"]').textContent = t('information');

        document.querySelector('label[for="timezoneSelect"]').textContent = t('timezone');
        document.querySelector('label[for="searchIncentive"]').textContent = t('search_incentive');

        const timezoneSelect = document.getElementById('timezoneSelect');
        if (timezoneSelect) timezoneSelect.querySelector('option[value="auto"]').textContent = t('auto_detect');

        const searchSelect = document.getElementById('searchIncentive');
        if (searchSelect) searchSelect.querySelector('option[value=""]').textContent = t('select_incentive');

        const incentivosTitle = document.querySelector('#incentivos > h2');
        if (incentivosTitle) incentivosTitle.textContent = t('next_incentives');
        const homeTitle = document.querySelector('#home h1'); if (homeTitle) homeTitle.textContent = t('hero_title');
        const homeDesc = document.querySelector('#home > .hero > p'); if (homeDesc) homeDesc.textContent = t('hero_desc');
    } catch (e) { /* ignore if DOM not ready */ }
}

// Routing helpers
function initializeURLRouting() {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page');
    if (pageParam) {
        const validPages = ['home', 'mutants', 'raidpredictor', 'incentivos', 'info'];
        if (validPages.includes(pageParam)) {
            showPage(pageParam);
        }
    }
}

function updateURLForPage(pageName) {
    window.history.replaceState({}, '', `?page=${pageName}`);
}

// Timezone detection
function detectTimezone() {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        currentTimezone = tz;
        updateDetectedTimezone(tz);
        return tz;
    } catch (e) {
        console.log('No se pudo detectar la zona horaria, usando Perú por defecto');
        currentTimezone = 'America/Lima';
        return 'America/Lima';
    }
}

function updateDetectedTimezone(tz) {
    const tzElement = document.getElementById('detectedTimezone');
    if (!tzElement) return;
    if (tz !== 'America/Lima') {
        tzElement.textContent = `(Detectado: ${tz})`;
    } else {
        tzElement.textContent = '';
    }
}

// Date/time helpers
function convertToTimezone(dateStr, timezone) {
    const peruDate = new Date(dateStr);
    const options = {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    const formatter = new Intl.DateTimeFormat('es-PE', options);
    const parts = formatter.formatToParts(peruDate);
    const result = {
        year: parts.find(p => p.type === 'year').value,
        month: parts.find(p => p.type === 'month').value,
        day: parts.find(p => p.type === 'day').value,
        hour: parts.find(p => p.type === 'hour').value,
        minute: parts.find(p => p.type === 'minute').value,
        second: parts.find(p => p.type === 'second').value
    };
    return {
        date: `${result.day}/${result.month}/${result.year}`,
        time: `${result.hour}:${result.minute}`,
        fullDate: `${result.day}/${result.month}/${result.year} ${result.hour}:${result.minute}:${result.second}`
    };
}

function getIncentiveStatus(startDate, endDate, now) {
    if (now < startDate) return { status: 'upcoming', label: t('upcoming_badge') };
    if (now < endDate) return { status: 'active', label: t('active_badge') };
    return { status: 'expired', label: t('expired_badge') };
}

function getTimeRemaining(targetDate, now) {
    const diff = targetDate - now;
    if (diff <= 0) return 'Finalizado';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function updateCurrentTimezoneInfo() {
    try {
        const now = new Date();
        const options = {
            timeZone: currentTimezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        const formatter = new Intl.DateTimeFormat('es-PE', options);
        const localTimeStr = formatter.format(now);
        const el = document.getElementById('currentTimezoneInfo');
        if (el) el.textContent = `${currentTimezone} - ${localTimeStr}`;
    } catch (e) { /* ignore */ }
}

// Specimen mapping used by raids
const specimenCodeMap = {
    'FB_12': 'Hadeath', 'AC_12': 'Phileas Derocas', 'EF_12': 'Dream Defender',
    'CF_12': 'Inheritor of the 5 rings', 'FF_12': 'Gerard Steelgarden', 'F_13': 'Snowmage', 
    'C_13': 'Cryonos', 'D_13': 'Easter Gunny', 'B_13': 'Jack O\'Lantern', 'A_13': 'Garuda', 
    'E_13': 'Ceres', 'CB_14': 'Wrath', 'CE_13': 'Regulo&Juzya', 'AB_13': 'Enviro Mk III', 'CD_14': 'Captain Eagle'
};

function getSpecimenName(code) {
    return specimenCodeMap[code] || code;
}

// initialize timezone now
currentTimezone = detectTimezone();

function setTimezone(tz) {
    currentTimezone = tz;
    updateDetectedTimezone(tz);
}

export { t, updateLanguage, updatePageText, initializeURLRouting, updateURLForPage, detectTimezone, updateDetectedTimezone, convertToTimezone, getIncentiveStatus, getTimeRemaining, updateCurrentTimezoneInfo, ultimoIncentivoPeru, selectedTimezone, currentTimezone, getSpecimenName, setTimezone };
