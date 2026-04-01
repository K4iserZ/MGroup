import { t, convertToTimezone, getIncentiveStatus, getTimeRemaining, ultimoIncentivoPeru, currentTimezone } from './utils.js';

let loadedIncentives = 10; // managed locally in this module

/* Incentives data and rendering */
const incentivosData = [
    { nombre: "Triple XP 7d", codigo: "charm_xpx3_7", descripcion: "Receive 200% more experience for your mutants per fight for 7 days", duracion: 1440, icono: "⭐" },
    { nombre: "Tickets x25", codigo: "material_energy25", descripcion: "Campaign Passes x25", duracion: 720, icono: "🎫" },
    { nombre: "Quadruple Regeneration 3d", codigo: "charm_regenx4_3", descripcion: "Increase your mutants health regeneration by 300% for 3 days", duracion: 1440, icono: "💚" },
    { nombre: "Challenge Token", codigo: "material_event_token", descripcion: "Use this token in the Challenge Hall to win exclusive rewards!", duracion: 180, icono: "🎯" },
    { nombre: "Tickets x5", codigo: "material_energy5", descripcion: "Campaign Passes x5", duracion: 1800, icono: "🎫" },
    { nombre: "Double XP 3d", codigo: "charm_xpx2_3", descripcion: "Receive 100% more experience for your mutants per fight for 3 days", duracion: 600, icono: "✨" },
    { nombre: "Critical Strikes 3d", codigo: "charm_critical_3", descripcion: "Increase the chance of your Mutants landing a critical hit by 50% for 3 days", duracion: 900, icono: "⚡" },
    { nombre: "Tickets x25", codigo: "material_energy25", descripcion: "Campaign Passes x25", duracion: 2160, icono: "🎫" },
    { nombre: "Jackpot Token", codigo: "material_jackpot_token", descripcion: "Use this token in the Mutants Slots and try to win the Super Jackpot", duracion: 1140, icono: "🎰" },
    { nombre: "Anti-Critical Shield 1d", codigo: "charm_anticritical_1", descripcion: "Reduce the risk of receiving critical hits on your mutants by 75% for 1 day", duracion: 720, icono: "🛡️" },
    { nombre: "Reactor Token", codigo: "material_gacha_token", descripcion: "Each Token allows you to win an exclusive Mutant from the Mutant Reactor.", duracion: 180, icono: "⚛️" },
    { nombre: "Triple XP 3d", codigo: "charm_xpx3_3", descripcion: "Receive 200% more experience for your mutants per fight for 3 days", duracion: 1080, icono: "⭐" },
    { nombre: "Double Regeneration 7d", codigo: "charm_regenx2_7", descripcion: "Increase your mutants health regeneration by 100% for 7 days", duracion: 2520, icono: "💚" },
    { nombre: "Critical Strikes 7d", codigo: "charm_critical_7", descripcion: "increase the chance of your Mutants landing a critical hit by 50% for 7 days", duracion: 900, icono: "⚡" },
    { nombre: "Anti-Critical Shield 3d", codigo: "charm_anticritical_3", descripcion: "Reduce the risk of receiving critical hits on your mutants by 75% for 3 days", duracion: 720, icono: "🛡️" },
    { nombre: "Tickets x25", codigo: "material_energy25", descripcion: "Campaign Passes x25", duracion: 1440, icono: "🎫" },
    { nombre: "Jackpot Token", codigo: "material_jackpot_token", descripcion: "Use this token in the Mutants Slots and try to win the Super Jackpot", duracion: 2160, icono: "🎰" },
    { nombre: "Double Regeneration 3d", codigo: "charm_regenx2_3", descripcion: "Increase your mutants health regeneration by 100% for 3 days", duracion: 2160, icono: "💚" }
];

function populateSearchSelector() {
    const selector = document.getElementById('searchIncentive');
    if (!selector) return;
    selector.innerHTML = '<option value="">' + t('select_incentive') + '</option>';
    const uniqueIncentivos = {};
    incentivosData.forEach(inc => {
        if (!uniqueIncentivos[inc.nombre]) uniqueIncentivos[inc.nombre] = inc;
    });
    Object.values(uniqueIncentivos).forEach(inc => {
        const option = document.createElement('option');
        option.value = inc.nombre;
        option.textContent = inc.nombre;
        selector.appendChild(option);
    });
}

function searchIncentivoDates(incentiveNameSearch) {
    const container = document.getElementById('searchResultsContainer');
    if (!container) return;
    container.innerHTML = '';
    let startDate = new Date(ultimoIncentivoPeru);
    const now = new Date();
    const results = [];
    const maxResults = 10;
    const maxIterations = 10000; // Límite muy alto para cálculos futuros
    for (let totalIndex = 0; totalIndex < maxIterations && results.length < maxResults; totalIndex++) {
        const index = totalIndex % incentivosData.length;
        const incentivo = incentivosData[index];
        if (incentivo.nombre === incentiveNameSearch) {
            const endDate = new Date(startDate.getTime() + incentivo.duracion * 60000);
            const status = getIncentiveStatus(startDate, endDate, now);
            // Solo incluir si no está expirado
            if (status.status !== 'expired') {
                const startConverted = convertToTimezone(startDate.toISOString(), currentTimezone);
                const endConverted = convertToTimezone(endDate.toISOString(), currentTimezone);
                results.push({ start: startConverted, end: endConverted, duration: incentivo.duracion, status: status });
            }
            startDate = new Date(endDate);
        } else {
            const endDate = new Date(startDate.getTime() + incentivo.duracion * 60000);
            startDate = new Date(endDate);
        }
    }
    if (results.length > 0) {
        const hours = Math.floor(results[0].duration / 60);
        const minutes = results[0].duration % 60;
        const durationStr = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        let html = `<div class="search-results-section"><h3>${t('next_dates')} "${incentiveNameSearch}"</h3><div class="search-results-grid">`;
        results.forEach((result, idx) => {
            html += `
                <div class="search-result-card">
                    <div class="search-result-date">${result.start.date}</div>
                    <div class="search-result-time"><strong>${result.start.time}</strong> - ${result.end.time}</div>
                    ${idx === 0 && result.status.status === 'active' ? `<div style="color: #2ecc71; font-weight: bold; margin-top: 0.5rem;">${t('active_now')}</div>` : ''}
                    <div class="search-result-duration">${t('duration')}: ${durationStr}</div>
                </div>
            `;
        });
        html += `</div></div>`;
        container.innerHTML = html;
    }
}

function updateIncentivosDisplay() {
    const container = document.getElementById('incentivosContainer');
    const currentContainer = document.getElementById('currentIncentiveContainer');
    const loadMoreSection = document.getElementById('loadMoreSection');
    if (!container || !currentContainer || !loadMoreSection) return;
    container.innerHTML = '';
    currentContainer.innerHTML = '';
    loadMoreSection.innerHTML = '';
    let startDate = new Date(ultimoIncentivoPeru);
    const now = new Date();
    let currentIncentive = null;
    let lastExpiredIncentive = null;
    let renderedCount = 0;
    let hasRenderedExpired = false;
    const startCalc = Date.now();
    for (let totalIndex = 0; renderedCount < loadedIncentives; totalIndex++) {
        if (Date.now() - startCalc > 2000) { // 2s de bloqueo máximo para evitar freeze tras muy muchos ciclos
            console.warn('Incentives rendering stopped after 2s to avoid infinite loop');
            break;
        }
        const index = totalIndex % incentivosData.length;
        const incentivo = incentivosData[index];
        const endDate = new Date(startDate.getTime() + incentivo.duracion * 60000);
        const startConverted = convertToTimezone(startDate.toISOString(), currentTimezone);
        const endConverted = convertToTimezone(endDate.toISOString(), currentTimezone);
        const status = getIncentiveStatus(startDate, endDate, now);
        const timeRemaining = status.status === 'upcoming' ? getTimeRemaining(startDate, now) : status.status === 'active' ? getTimeRemaining(endDate, now) : 'Finalizado';
        const hours = Math.floor(incentivo.duracion / 60);
        const minutes = incentivo.duracion % 60;
        const durationStr = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        if (status.status === 'active' && !currentIncentive) {
            currentIncentive = { ...incentivo, status, timeRemaining, endDate, endConverted, durationStr, index: index + 1 };
        }
        if (status.status === 'expired') {
            lastExpiredIncentive = { incentivo, index, startConverted, endConverted, durationStr, status };
        }
        if (lastExpiredIncentive && !hasRenderedExpired && (status.status === 'active' || status.status === 'upcoming')) {
            const expiredCard = document.createElement('div');
            expiredCard.className = `incentivo-card expired`;
            const imageUrl = `https://s-ak.kobojo.com/mutants/assets/thumbnails/${lastExpiredIncentive.incentivo.codigo}.png`;
            expiredCard.innerHTML = `
                <div class="status-badge status-expired">${t('expired_badge')}</div>
                <div class="incentivo-icon">
                    <img src="${imageUrl}" alt="${lastExpiredIncentive.incentivo.nombre}" onerror="this.parentElement.innerHTML='<span class=\'fallback\'>${lastExpiredIncentive.incentivo.icono}</span>'">
                </div>
                <div class="incentivo-name">⏱️ ${lastExpiredIncentive.incentivo.nombre}<span style="font-size: 0.8rem; color: #95a5a6; margin-left: 0.5rem;">#${lastExpiredIncentive.index + 1}</span></div>
                <div class="incentivo-description">${lastExpiredIncentive.incentivo.descripcion}</div>
                <div class="incentivo-duration"><div class="duration-label">${t('duration')}</div><div class="duration-value">${lastExpiredIncentive.durationStr}</div></div>
                <div class="incentivo-dates"><div class="date-label">${t('start')}</div><div class="date-value">${lastExpiredIncentive.startConverted.date} ${lastExpiredIncentive.startConverted.time}</div><div class="date-label" style="margin-top: 0.5rem;">${t('end')}</div><div class="date-value">${lastExpiredIncentive.endConverted.date} ${lastExpiredIncentive.endConverted.time}</div></div>
                <div class="countdown"><div class="countdown-label">${t('finished')}</div><div class="countdown-value">✅ ${t('finished')}</div></div>
            `;
            container.insertBefore(expiredCard, container.firstChild);
            renderedCount++;
            hasRenderedExpired = true;
        }
        if (status.status === 'active' || status.status === 'upcoming') {
            const card = document.createElement('div');
            card.className = `incentivo-card ${status.status}`;
            const imageUrl = `https://s-ak.kobojo.com/mutants/assets/thumbnails/${incentivo.codigo}.png`;
            card.innerHTML = `
                <div class="status-badge status-${status.status}">${status.label}</div>
                <div class="incentivo-icon"><img src="${imageUrl}" alt="${incentivo.nombre}" onerror="this.parentElement.innerHTML='<span class=\'fallback\'>${incentivo.icono}</span>'"></div>
                <div class="incentivo-name">${incentivo.nombre}<span style="font-size: 0.8rem; color: #95a5a6; margin-left: 0.5rem;">#${index + 1}</span></div>
                <div class="incentivo-description">${incentivo.descripcion}</div>
                <div class="incentivo-duration"><div class="duration-label">${t('duration')}</div><div class="duration-value">${durationStr}</div></div>
                <div class="incentivo-dates"><div class="date-label">${t('start')}</div><div class="date-value">${startConverted.date} ${startConverted.time}</div><div class="date-label" style="margin-top: 0.5rem;">${t('end')}</div><div class="date-value">${endConverted.date} ${endConverted.time}</div></div>
                <div class="countdown"><div class="countdown-label">${status.status === 'upcoming' ? t('begins_in') : status.status === 'active' ? t('ends_in') : t('finished')}</div><div class="countdown-value">${timeRemaining}</div></div>
            `;
            container.appendChild(card);
            renderedCount++;
        }
        startDate = new Date(endDate);
    }
    if (currentIncentive) {
        const imageUrl = `https://s-ak.kobojo.com/mutants/assets/thumbnails/${currentIncentive.codigo}.png`;
        currentContainer.innerHTML = `
            <div class="current-incentive-section">
                <h3>🎯 ${t('current_active')} (#${currentIncentive.index})</h3>
                <div class="current-incentive-content">
                    <div class="current-incentive-icon"><img src="${imageUrl}" alt="${currentIncentive.nombre}" onerror="this.parentElement.innerHTML='<span style=\'font-size: 2rem;\'>${currentIncentive.icono}</span>'"></div>
                    <div class="current-incentive-info"><div class="current-incentive-name">${currentIncentive.nombre}</div><div class="current-incentive-description">${currentIncentive.descripcion}</div><div class="current-incentive-time"><div class="current-incentive-time-label">${t('ends_in')}:</div><div class="current-incentive-time-value">${currentIncentive.timeRemaining}</div><div class="current-incentive-time-label" style="margin-top: 1rem;">${t('end')}: ${currentIncentive.endConverted.date} ${currentIncentive.endConverted.time}</div></div></div>
                </div>
            </div>
        `;
    } else {
        currentContainer.innerHTML = `<div class="no-active-incentive"><h3>⏰ ${t('no_active')}</h3><p>${t('no_active_desc')}</p></div>`;
    }
    loadMoreSection.innerHTML = `
        <div class="load-more-container">
            <button class="btn-load-more" onclick="loadMoreIncentivos()">
                ${t('load_more')}
            </button>
            <div class="load-more-status">
                ${t('showing')} ${renderedCount} ${t('incentives_count')}
            </div>
        </div>
    `;
}

function loadMoreIncentivos() {
    loadedIncentives += 10;
    updateIncentivosDisplay();
}

export { incentivosData, populateSearchSelector, searchIncentivoDates, updateIncentivosDisplay, loadMoreIncentivos };
