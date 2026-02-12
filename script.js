/* ======================================
   SECTION 1: INITIALIZATION & URL ROUTING
   ====================================== */

// Initialize URL-based page routing
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

// Update URL when page changes
function updateURLForPage(pageName) {
    window.history.replaceState({}, '', `?page=${pageName}`);
}

/* ======================================
   SECTION 2: INCENTIVES DATA
   Base: Peru Timezone (UTC-5)
   Last incentive: 08/01/2026 20:00 Peru → 09/01/2026 01:00 UTC
   ====================================== */

const incentivosData = [
    {
        nombre: "Triple XP 7d",
        codigo: "charm_xpx3_7",
        descripcion: "Receive 200% more experience for your mutants per fight for 7 days",
        duracion: 1440, // minutos = 24h
        icono: "⭐"
    },
    {
        nombre: "Tickets x25",
        codigo: "material_energy25",
        descripcion: "Campaign Passes x25",
        duracion: 720, // minutos = 12h
        icono: "🎫"
    },
    {
        nombre: "Quadruple Regeneration 3d",
        codigo: "charm_regenx4_3",
        descripcion: "Increase your mutants health regeneration by 300% for 3 days",
        duracion: 1440, // minutos = 24h
        icono: "💚"
    },
    {
        nombre: "Challenge Token",
        codigo: "material_event_token",
        descripcion: "Use this token in the Challenge Hall to win exclusive rewards!",
        duracion: 180, // minutos = 3h
        icono: "🎯"
    },
    {
        nombre: "Tickets x5",
        codigo: "material_energy5",
        descripcion: "Campaign Passes x5",
        duracion: 1800, // minutos = 30h
        icono: "🎫"
    },
    {
        nombre: "Double XP 3d",
        codigo: "charm_xpx2_3",
        descripcion: "Receive 100% more experience for your mutants per fight for 3 days",
        duracion: 600, // minutos = 10h
        icono: "✨"
    },
    {
        nombre: "Critical Strikes 3d",
        codigo: "charm_critical_3",
        descripcion: "Increase the chance of your Mutants landing a critical hit by 50% for 3 days",
        duracion: 900, // minutos = 15h
        icono: "⚡"
    },
    {
        nombre: "Tickets x25",
        codigo: "material_energy25",
        descripcion: "Campaign Passes x25",
        duracion: 2160, // minutos = 36h
        icono: "🎫"
    },
    {
        nombre: "Jackpot Token",
        codigo: "material_jackpot_token",
        descripcion: "Use this token in the Mutants Slots and try to win the Super Jackpot",
        duracion: 1140, // minutos = 19h
        icono: "🎰"
    },
    {
        nombre: "Anti-Critical Shield 1d",
        codigo: "charm_anticritical_1",
        descripcion: "Reduce the risk of receiving critical hits on your mutants by 75% for 1 day",
        duracion: 720, // minutos = 12h
        icono: "🛡️"
    },
    {
        nombre: "Reactor Token",
        codigo: "material_gacha_token",
        descripcion: "Each Token allows you to win an exclusive Mutant from the Mutant Reactor.",
        duracion: 180, // minutos = 3h
        icono: "⚛️"
    },
    {
        nombre: "Triple XP 3d",
        codigo: "charm_xpx3_3",
        descripcion: "Receive 200% more experience for your mutants per fight for 3 days",
        duracion: 1080, // minutos = 18h
        icono: "⭐"
    },
    {
        nombre: "Double Regeneration 7d",
        codigo: "charm_regenx2_7",
        descripcion: "Increase your mutants health regeneration by 100% for 7 days",
        duracion: 2520, // minutos = 42h
        icono: "💚"
    },
    {
        nombre: "Critical Strikes 7d",
        codigo: "charm_critical_7",
        descripcion: "increase the chance of your Mutants landing a critical hit by 50% for 7 days",
        duracion: 900, // minutos = 15h
        icono: "⚡"
    },
    {
        nombre: "Anti-Critical Shield 3d",
        codigo: "charm_anticritical_3",
        descripcion: "Reduce the risk of receiving critical hits on your mutants by 75% for 3 days",
        duracion: 720, // minutos = 12h
        icono: "🛡️"
    },
    {
        nombre: "Tickets x25",
        codigo: "material_energy25",
        descripcion: "Campaign Passes x25",
        duracion: 1440, // minutos = 24h
        icono: "🎫"
    },
    {
        nombre: "Jackpot Token",
        codigo: "material_jackpot_token",
        descripcion: "Use this token in the Mutants Slots and try to win the Super Jackpot",
        duracion: 2160, // minutos = 36h
        icono: "🎰"
    },
    {
        nombre: "Double Regeneration 3d",
        codigo: "charm_regenx2_3",
        descripcion: "Increase your mutants health regeneration by 100% for 3 days",
        duracion: 2160, // minutos = 36h
        icono: "💚"
    }
];

// The #18 "Quadruple Regeneration" (2160 min = 36h) is the NEXT one
// Starts: 22/01/2026 19:00 Peru (UTC-5) = 23/01/2026 00:00 UTC
// Ends: 24/01/2026 07:00 Peru = 24/01/2026 12:00 UTC
// The #1 starts: 08/01/2026 20:00 Peru = 09/01/2026 01:00 UTC

/* ======================================
   SECTION 3: SPECIMEN CODE-TO-NAME MAPPING
   Extracted from Stats.csv for raid display
   ====================================== */

const specimenCodeMap = {
    'FB_12': 'Hadeath', 'AC_12': 'Phileas Derocas', 'EF_12': 'Dream Defender',
    'CF_12': 'Inheritor of the 5 rings', 'FF_12': 'Gerard Steelgarden', 'F_13': 'Snowmage', 
    'C_13': 'Cryonos', 'D_13': 'Easter Gunny', 'B_13': 'Jack O\'Lantern', 'A_13': 'Garuda', 
    'E_13': 'Ceres', 'CB_14': 'Wrath', 'CE_13': 'Regulo&Juzya', 'AB_13': 'Enviro Mk III', 'CD_14': 'Captain Eagle'
};

function getSpecimenName(code) {
    return specimenCodeMap[code] || code;
}

/* ======================================
   SECTION 4: TIMEZONE & LOCALIZATION
   ====================================== */

const ultimoIncentivoPeru = new Date('2026-01-09T01:00:00Z');

let selectedTimezone = 'auto';
let currentTimezone = null;
let loadedIncentives = 5; // Cargar 5 inicialmente (Expirado - Activo - 3 próximos)

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
    updateIncentivosDisplay();
}

function updatePageText() {
    // Actualizar navegación
    document.querySelector('[data-page="home"]').textContent = t('home');
    document.querySelector('[data-page="incentivos"]').textContent = t('incentives');
    document.querySelector('[data-page="info"]').textContent = t('information');

    // Actualizar labels
    document.querySelector('label[for="timezoneSelect"]').textContent = t('timezone');
    document.querySelector('label[for="searchIncentive"]').textContent = t('search_incentive');

    // Actualizar opciones de select
    const timezoneSelect = document.getElementById('timezoneSelect');
    timezoneSelect.querySelector('option[value="auto"]').textContent = t('auto_detect');

    const searchSelect = document.getElementById('searchIncentive');
    searchSelect.querySelector('option[value=""]').textContent = t('select_incentive');

    // Actualizar títulos de las páginas
    const incentivosTitle = document.querySelector('#incentivos > h2');
    if (incentivosTitle) incentivosTitle.textContent = t('next_incentives');

    const homeTitle = document.querySelector('#home h1');
    if (homeTitle) homeTitle.textContent = t('hero_title');

    const homeDesc = document.querySelector('#home > .hero > p');
    if (homeDesc) homeDesc.textContent = t('hero_desc');

    const homeBtn = document.querySelector('#home .btn-primary');
    if (homeBtn) homeBtn.textContent = t('view_incentives');

    // Actualizar info boxes
    const infoBoxes = document.querySelectorAll('#home > div:nth-child(3) > div');
    if (infoBoxes.length >= 3) {
        infoBoxes[0].querySelector('h3').textContent = t('timezone_info');
        infoBoxes[0].querySelector('p').textContent = t('timezone_info_desc');
        infoBoxes[1].querySelector('h3').textContent = t('dates_info');
        infoBoxes[1].querySelector('p').textContent = t('dates_info_desc');
        infoBoxes[2].querySelector('h3').textContent = t('countdown_info');
        infoBoxes[2].querySelector('p').textContent = t('countdown_info_desc');
    }

    // Actualizar página de información
    const infoContent = document.querySelector('.info-content');
    if (infoContent) {
        const headings = infoContent.querySelectorAll('h2');
        if (headings.length >= 1) headings[0].textContent = t('how_it_works');
        if (headings.length >= 2) headings[1].textContent = t('timezone_config');
        if (headings.length >= 3) headings[2].textContent = t('incentive_status');
        if (headings.length >= 4) headings[3].textContent = t('base_timezone');
    }
}

// Detectar zona horaria automáticamente
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

// Actualizar texto de zona horaria detectada
function updateDetectedTimezone(tz) {
    const tzElement = document.getElementById('detectedTimezone');
    if (tz !== 'America/Lima') {
        tzElement.textContent = `(Detectado: ${tz})`;
    }
}

// Inicializar zona horaria
currentTimezone = detectTimezone();

// Event listener para cambiar zona horaria
document.getElementById('timezoneSelect').addEventListener('change', function(e) {
    selectedTimezone = e.target.value;
    if (selectedTimezone === 'auto') {
        currentTimezone = detectTimezone();
    } else {
        currentTimezone = selectedTimezone;
    }
    updateIncentivosDisplay();
    updateCurrentTimezoneInfo();
});

// Event listener para búsqueda de incentivos
document.getElementById('searchIncentive').addEventListener('change', function(e) {
    const searchValue = e.target.value;
    if (searchValue) {
        searchIncentivoDates(searchValue);
    } else {
        document.getElementById('searchResultsContainer').innerHTML = '';
    }
});

// Poblar selector de búsqueda
function populateSearchSelector() {
    const selector = document.getElementById('searchIncentive');
    const uniqueIncentivos = {};
    
    incentivosData.forEach(inc => {
        if (!uniqueIncentivos[inc.nombre]) {
            uniqueIncentivos[inc.nombre] = inc;
        }
    });

    Object.values(uniqueIncentivos).forEach(inc => {
        const option = document.createElement('option');
        option.value = inc.nombre;
        option.textContent = inc.nombre;
        selector.appendChild(option);
    });
}

// Buscar fechas de un incentivo específico
function searchIncentivoDates(incentiveNameSearch) {
    const container = document.getElementById('searchResultsContainer');
    container.innerHTML = '';

    let startDate = new Date(ultimoIncentivoPeru);
    const now = new Date();
    const results = [];
    const maxResults = 10;
    const totalIncentivosToCheck = incentivosData.length * 5; // Buscar en 5 ciclos

    for (let totalIndex = 0; totalIndex < totalIncentivosToCheck && results.length < maxResults; totalIndex++) {
        const index = totalIndex % incentivosData.length;
        const incentivo = incentivosData[index];

        if (incentivo.nombre === incentiveNameSearch) {
            const endDate = new Date(startDate.getTime() + incentivo.duracion * 60000);
            const startConverted = convertToTimezone(startDate.toISOString(), currentTimezone);
            const endConverted = convertToTimezone(endDate.toISOString(), currentTimezone);

            const status = getIncentiveStatus(startDate, endDate, now);

            // Solo mostrar futuros o actuales
            if (status.status !== 'expired' || (status.status === 'expired' && results.length === 0)) {
                results.push({
                    start: startConverted,
                    end: endConverted,
                    duration: incentivo.duracion,
                    status: status
                });
            }

            // Reiniciar para buscar más adelante
            startDate = new Date(endDate);
        } else {
            const endDate = new Date(startDate.getTime() + incentivo.duracion * 60000);
            startDate = new Date(endDate);
        }
    }

    // Renderizar resultados
    if (results.length > 0) {
        const hours = Math.floor(results[0].duration / 60);
        const minutes = results[0].duration % 60;
        const durationStr = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;

        let html = `<div class="search-results-section">
                <h3>${t('next_dates')} "${incentiveNameSearch}"</h3>
                <div class="search-results-grid">`;

        results.forEach((result, idx) => {
            html += `
                    <div class="search-result-card">
                        <div class="search-result-date">${result.start.date}</div>
                        <div class="search-result-time">
                            <strong>${result.start.time}</strong> - ${result.end.time}
                        </div>
                        ${idx === 0 && result.status.status === 'active' ? `<div style="color: #2ecc71; font-weight: bold; margin-top: 0.5rem;">${t('active_now')}</div>` : ''}
                        <div class="search-result-duration">${t('duration')}: ${durationStr}</div>
                    </div>
                `;
        });

        html += `</div></div>`;
        container.innerHTML = html;
    }
}

// ============================================================
// SECTION 5: PAGE ROUTING & NAVIGATION
// ============================================================
// Manages page navigation, URL updates, and active state tracking

function showPage(pageName) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageName).classList.add('active');

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    // Update URL for bookmarking/sharing
    window.history.replaceState({}, '', `?page=${pageName}`);

    // Cerrar menú en mobile
    const navToggle = document.getElementById('navToggle');
    const nav = document.getElementById('mainNav');
    if (navToggle.classList.contains('active')) {
        navToggle.classList.remove('active');
        nav.classList.remove('active');
    }
}

// Event listeners para navegación
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const pageName = this.getAttribute('data-page');
        showPage(pageName);
    });
});

// Toggle menú mobile
document.getElementById('navToggle').addEventListener('click', function() {
    this.classList.toggle('active');
    document.getElementById('mainNav').classList.toggle('active');
});

// ============================================================
// SECTION 6: TIMEZONE CONVERSION & LOCALIZATION  
// ============================================================
// Handles timezone conversion and user-facing text localization

// Convertir fecha de Perú a zona horaria seleccionada
function convertToTimezone(dateStr, timezone) {
    // dateStr es formato "2026-01-22T19:00:00"
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

// Calcular estado del incentivo
function getIncentiveStatus(startDate, endDate, now) {
    if (now < startDate) return { status: 'upcoming', label: t('upcoming_badge') };
    if (now < endDate) return { status: 'active', label: t('active_badge') };
    return { status: 'expired', label: t('expired_badge') };
}

// Calcular tiempo restante
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

// Actualizar información de zona horaria
function updateCurrentTimezoneInfo() {
    const offset = new Date().toLocaleString('es-PE', {
        timeZone: currentTimezone,
        timeZoneName: 'longOffset'
    });
    
    const now = new Date();
    const localTime = new Date(now.toLocaleString('es-PE', {
        timeZone: currentTimezone
    }));
    
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
    
    document.getElementById('currentTimezoneInfo').textContent = 
        `${currentTimezone} - ${localTimeStr}`;
}

// ============================================================
// SECTION 7: INCENTIVES RENDERING & DISPLAY
// ============================================================
// Manages incentive card rendering, status calculation, and timezone-aware display

// Renderizar incentivos
function updateIncentivosDisplay() {
    const container = document.getElementById('incentivosContainer');
    const currentContainer = document.getElementById('currentIncentiveContainer');
    const loadMoreSection = document.getElementById('loadMoreSection');
    container.innerHTML = '';
    currentContainer.innerHTML = '';
    loadMoreSection.innerHTML = '';

    let currentDate = new Date(ultimoIncentivoPeru);
    let startDate = new Date(ultimoIncentivoPeru);
    
    const now = new Date();
    let currentIncentive = null;
    let lastExpiredIncentive = null;
    let renderedCount = 0;
    let hasRenderedExpired = false;

    for (let totalIndex = 0; totalIndex < incentivosData.length * 5 && renderedCount < loadedIncentives; totalIndex++) {
        const index = totalIndex % incentivosData.length;
        const incentivo = incentivosData[index];
        const cycleNumber = Math.floor(totalIndex / incentivosData.length);

        // Calcular fechas del incentivo
        const endDate = new Date(startDate.getTime() + incentivo.duracion * 60000);
        
        // Convertir a zona horaria seleccionada
        const startConverted = convertToTimezone(startDate.toISOString(), currentTimezone);
        const endConverted = convertToTimezone(endDate.toISOString(), currentTimezone);
        
        // Determinar estado
        const status = getIncentiveStatus(startDate, endDate, now);
        const timeRemaining = status.status === 'upcoming' 
            ? getTimeRemaining(startDate, now)
            : status.status === 'active'
            ? getTimeRemaining(endDate, now)
            : 'Finalizado';

        const hours = Math.floor(incentivo.duracion / 60);
        const minutes = incentivo.duracion % 60;
        const durationStr = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;

        // Guardar el incentivo activo
        if (status.status === 'active' && !currentIncentive) {
            currentIncentive = {
                ...incentivo,
                status,
                timeRemaining,
                endDate,
                endConverted,
                durationStr,
                index: index + 1
            };
        }

        // Guardar el último expirado
        if (status.status === 'expired') {
            lastExpiredIncentive = {
                incentivo,
                index,
                cycleNumber,
                startConverted,
                endConverted,
                durationStr,
                status
            };
        }

        // Renderizar el expirado PRIMERO (una sola vez, antes de activo y upcoming)
        if (lastExpiredIncentive && !hasRenderedExpired && (status.status === 'active' || status.status === 'upcoming')) {
            const expiredCard = document.createElement('div');
            expiredCard.className = `incentivo-card expired`;
            
            const imageUrl = `https://s-ak.kobojo.com/mutants/assets/thumbnails/${lastExpiredIncentive.incentivo.codigo}.png`;
            
            expiredCard.innerHTML = `
                <div class="status-badge status-expired">${t('expired_badge')}</div>
                <div class="incentivo-icon">
                    <img src="${imageUrl}" alt="${lastExpiredIncentive.incentivo.nombre}" onerror="this.parentElement.innerHTML='<span class=\'fallback\'>${lastExpiredIncentive.incentivo.icono}</span>'">
                </div>
                <div class="incentivo-name">
                    ⏱️ ${lastExpiredIncentive.incentivo.nombre}
                    <span style="font-size: 0.8rem; color: #95a5a6; margin-left: 0.5rem;">#${lastExpiredIncentive.index + 1}</span>
                </div>
                <div class="incentivo-description">${lastExpiredIncentive.incentivo.descripcion}</div>
                
                <div class="incentivo-duration">
                    <div class="duration-label">${t('duration')}</div>
                    <div class="duration-value">${lastExpiredIncentive.durationStr}</div>
                </div>

                <div class="incentivo-dates">
                    <div class="date-label">${t('start')}</div>
                    <div class="date-value">${lastExpiredIncentive.startConverted.date} ${lastExpiredIncentive.startConverted.time}</div>
                    <div class="date-label" style="margin-top: 0.5rem;">${t('end')}</div>
                    <div class="date-value">${lastExpiredIncentive.endConverted.date} ${lastExpiredIncentive.endConverted.time}</div>
                </div>

                <div class="countdown">
                    <div class="countdown-label">${t('finished')}</div>
                    <div class="countdown-value">✅ ${t('finished')}</div>
                </div>
            `;
            
            container.insertBefore(expiredCard, container.firstChild);
            renderedCount++;
            hasRenderedExpired = true;
        }

        // Renderizar activo y próximos
        if (status.status === 'active' || status.status === 'upcoming') {

            // Crear tarjeta
            const card = document.createElement('div');
            card.className = `incentivo-card ${status.status === 'expired' ? 'expired' : ''}`;
            
            const imageUrl = `https://s-ak.kobojo.com/mutants/assets/thumbnails/${incentivo.codigo}.png`;
            
            card.innerHTML = `
                <div class="status-badge status-${status.status}">${status.label}</div>
                <div class="incentivo-icon">
                    <img src="${imageUrl}" alt="${incentivo.nombre}" onerror="this.parentElement.innerHTML='<span class=\'fallback\'>${incentivo.icono}</span>'">
                </div>
                <div class="incentivo-name">
                    ${incentivo.nombre}
                    <span style="font-size: 0.8rem; color: #95a5a6; margin-left: 0.5rem;">#${index + 1}</span>
                </div>
                <div class="incentivo-description">${incentivo.descripcion}</div>
                
                <div class="incentivo-duration">
                    <div class="duration-label">${t('duration')}</div>
                    <div class="duration-value">${durationStr}</div>
                </div>

                <div class="incentivo-dates">
                    <div class="date-label">${t('start')}</div>
                    <div class="date-value">${startConverted.date} ${startConverted.time}</div>
                    <div class="date-label" style="margin-top: 0.5rem;">${t('end')}</div>
                    <div class="date-value">${endConverted.date} ${endConverted.time}</div>
                </div>

                <div class="countdown">
                    <div class="countdown-label">
                        ${status.status === 'upcoming' ? t('begins_in') : status.status === 'active' ? t('ends_in') : t('finished')}
                    </div>
                    <div class="countdown-value">${timeRemaining}</div>
                </div>
            `;

            container.appendChild(card);
            renderedCount++; // Contar solo los renderizados
        }

        // Siguiente incentivo comienza cuando termina el actual
        startDate = new Date(endDate);
    }

    // Mostrar incentivo actual o mensaje
    if (currentIncentive) {
        const imageUrl = `https://s-ak.kobojo.com/mutants/assets/thumbnails/${currentIncentive.codigo}.png`;
        currentContainer.innerHTML = `
            <div class="current-incentive-section">
                <h3>🎯 ${t('current_active')} (#${currentIncentive.index})</h3>
                <div class="current-incentive-content">
                    <div class="current-incentive-icon">
                        <img src="${imageUrl}" alt="${currentIncentive.nombre}" onerror="this.parentElement.innerHTML='<span style=\'font-size: 2rem;\'>${currentIncentive.icono}</span>'">
                    </div>
                    <div class="current-incentive-info">
                        <div class="current-incentive-name">${currentIncentive.nombre}</div>
                        <div class="current-incentive-description">${currentIncentive.descripcion}</div>
                        <div class="current-incentive-time">
                            <div class="current-incentive-time-label">${t('ends_in')}:</div>
                            <div class="current-incentive-time-value">${currentIncentive.timeRemaining}</div>
                            <div class="current-incentive-time-label" style="margin-top: 1rem;">${t('end')}: ${currentIncentive.endConverted.date} ${currentIncentive.endConverted.time}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        currentContainer.innerHTML = `
            <div class="no-active-incentive">
                <h3>⏰ ${t('no_active')}</h3>
                <p>${t('no_active_desc')}</p>
            </div>
        `;
    }

    // Mostrar botón de cargar más
    loadMoreSection.innerHTML = `
        <div class="load-more-container">
            <button class="btn-load-more" onclick="loadMoreIncentivos()">
                ${t('load_more')}
            </button>
            <div class="load-more-status">
                ${t('showing')} ${loadedIncentives} ${t('incentives_count')}
            </div>
        </div>
    `;
}

// Cargar más incentivos
function loadMoreIncentivos() {
    loadedIncentives += 4; // Agregar 4 más cada vez
    updateIncentivosDisplay();
}

// ============================================================
// SECTION 8: MUTANTS DATABASE & DISPLAY
// ============================================================
// Handles mutant creature data loading, parsing, filtering, and card rendering

// Parse CSV y crear objeto de mutantes
let mutantsData = [];

async function loadMutantsData() {
    try {
        const response = await fetch('Stats.csv');
        const csvText = await response.text();
        parseMutantsCSV(csvText);
        initMutantsSection();
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

    // Mostrar todos los mutantes inicialmente
    filterAndDisplayMutants('', '');
}

function filterAndDisplayMutants(searchTerm, selectedGen = '') {
    const container = document.getElementById('mutantsContainer');
    if (!container) return;

    let filtered = mutantsData;
    
    // Filtrar por gen (por el campo DNA que contiene A, AA, AB, B, BA, etc)
    if (selectedGen) {
        filtered = filtered.filter(m => m.dna.startsWith(selectedGen));
    }
    
    // Filtrar por búsqueda
    if (searchTerm) {
        filtered = filtered.filter(m => 
            m.name.toLowerCase().includes(searchTerm) ||
            m.specimen.toLowerCase().includes(searchTerm)
        );
    }

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

function openMutantModal(mutant) {
    const modal = document.getElementById('mutantModal');
    const content = document.getElementById('mutantDetailsContent');
    
    content.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <h2 style="color: #e94560; font-size: 2rem; margin-bottom: 1rem;">🚧 En Desarrollo</h2>
            <p style="color: #bdc3c7; font-size: 1.1rem;">Esta funcionalidad está siendo desarrollada.</p>
            <p style="color: #95a5a6; margin-top: 1rem;">Mutante: <strong style="color: #3498db;">${mutant.name}</strong></p>
        </div>
    `;
    
    modal.style.display = 'flex';
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
loadMutantsData();
