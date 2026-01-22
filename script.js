// Incentives data (base: Peru Timezone - UTC-5)
// The last incentive starts: 08/01/2026 20:00 Peru = 09/01/2026 01:00 UTC
// Ends: 24/01/2026 07:00 Peru = 24/01/2026 12:00 UTC
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
const ultimoIncentivoPeru = new Date('2026-01-09T01:00:00Z');

let selectedTimezone = 'auto';
let currentTimezone = null;
let loadedCycles = 1;

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

function showPage(pageName) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageName).classList.add('active');

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

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
    let showExpired = false;
    const totalIncentivosToShow = incentivosData.length * loadedCycles;

    for (let totalIndex = 0; totalIndex < totalIncentivosToShow; totalIndex++) {
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
            showExpired = true; // Mostrar el expirado anterior cuando encontremos el activo
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

        // Renderizar solo: último expirado (si hay activo), activo, y todos los futuros
        if ((status.status === 'expired' && showExpired && lastExpiredIncentive) || 
            status.status === 'active' || 
            status.status === 'upcoming') {
            
            // Si es expirado, solo renderizar si es el último antes del activo
            if (status.status === 'expired' && !currentIncentive) {
                // No renderizar expirados hasta que encontremos el activo
                startDate = new Date(endDate);
                continue;
            }

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
                    ${status.status === 'expired' ? '⏱️ ' : ''}${incentivo.nombre}
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
                ${t('showing')} ${loadedCycles * incentivosData.length} ${t('incentives_count')}
            </div>
        </div>
    `;
}

// Cargar más ciclos
function loadMoreIncentivos() {
    loadedCycles += 1;
    updateIncentivosDisplay();
}

// Actualizar cada segundo
setInterval(() => {
    updateIncentivosDisplay();
    updateCurrentTimezoneInfo();
}, 1000);

// Inicial
populateSearchSelector();
updatePageText();
updateIncentivosDisplay();
updateCurrentTimezoneInfo();
