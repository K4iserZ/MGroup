import { convertToTimezone, getSpecimenName, currentTimezone } from './utils.js';

let raidsCatalog = [];
let raidsHistory = [];
let raidsRules = {};
let raidsState = {};

function parsePeruDate(dateStr) {
    return new Date(dateStr + 'T00:00:00-05:00');
}

function addMonths(date, months) {
    const d = new Date(date);
    const whole = Math.trunc(months);
    d.setMonth(d.getMonth() + whole);
    const frac = months - whole;
    if (frac > 0) d.setDate(d.getDate() + Math.round(frac * 30));
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
    let currentEntry = null;
    for (let i = raidsHistory.length - 1; i >= 0; i--) {
        const entry = raidsHistory[i];
        const start = parsePeruDate(entry.date);
        if (start <= now) { currentEntry = entry; break; }
    }
    if (!currentEntry) return null;
    const expectedMonths = raidsRules.eventDuration?.expectedMonths || 3;
    const maxMonths = raidsRules.eventDuration?.maxMonths || 4;
    const start = parsePeruDate(currentEntry.date);
    const endExpected = addMonths(start, expectedMonths);
    const endMax = addMonths(start, maxMonths);
    const isActive = now >= start && now <= endMax;
    const isWithinExpected = now >= start && now <= endExpected;
    const isExtended = now > endExpected && now <= endMax;
    const raidInfo = raidsCatalog.find(r => r.id === currentEntry.raidId) || null;
    return { entry: currentEntry, raid: raidInfo, start, endExpected, endMax, isActive: isActive && now <= endMax && now >= start, isExtended, withinExpected: isWithinExpected };
}

function generatePredictions(count = 5) {
    const preds = [];
    if (!raidsHistory.length) return preds;
    const expectedMonths = raidsRules.eventDuration?.expectedMonths || 3;
    let lastHistoryEntry = raidsHistory[raidsHistory.length - 1];
    let lastDate = parsePeruDate(lastHistoryEntry.date);
    const predictedHistory = raidsHistory.slice();
    function findMostRecentNewRaidId(hist) { for (let i = hist.length - 1; i >= 0; i--) if (hist[i].type === 'new' && hist[i].raidId) return hist[i].raidId; return null; }
    function getUnusedRaidIds() { const usedIds = new Set(raidsHistory.map(h => h.raidId)); return raidsCatalog.filter(r => !usedIds.has(r.id)).map(r => r.id); }
    const recentTypes = raidsHistory.slice(-2).map(h => h.type);
    let unusedAssigned = false;
    for (let i = 0; i < count; i++) {
        let nextType;
        const lastTwo = recentTypes.slice(-2);
        if (lastTwo.length === 2 && lastTwo[0] === 'repeat' && lastTwo[1] === 'repeat') nextType = 'new';
        else { const lastType = predictedHistory.length ? predictedHistory[predictedHistory.length - 1].type : 'new'; nextType = lastType === 'new' ? 'repeat' : 'new'; }
        const nextStart = addMonths(lastDate, expectedMonths);
        let raidId = null;
        if (nextType === 'repeat') {
            const mostRecentNew = findMostRecentNewRaidId(predictedHistory) || raidsState.lastRepeatedRaidId || null;
            const lastUnlivingIndex = predictedHistory.map(x => x.raidId).lastIndexOf(9);
            if (lastUnlivingIndex >= 0) {
                const repeatSequence = [10, 11, 12, 13];
                let repeatsAfterUnliving = 0;
                for (let j = lastUnlivingIndex + 1; j < predictedHistory.length; j++) if (predictedHistory[j].type === 'repeat') repeatsAfterUnliving++;
                raidId = repeatSequence[repeatsAfterUnliving % repeatSequence.length];
            } else {
                raidId = mostRecentNew;
            }
        } else if (nextType === 'new') {
            if (!unusedAssigned) { const unused = getUnusedRaidIds(); if (unused.length > 0) { raidId = unused[0]; unusedAssigned = true; } }
        }
        preds.push({ type: nextType, raidId, start: new Date(nextStart) });
        predictedHistory.push({ type: nextType, raidId, date: nextStart.toISOString().slice(0,10) });
        recentTypes.push(nextType); if (recentTypes.length > 3) recentTypes.shift();
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
    const current = detectCurrentRaid();
    if (current && current.isActive) {
        const raidName = current.raid ? current.raid.name : `raid #${current.entry.raidId}`;
        const image = current.raid ? current.raid.image : '';
        const typeLabel = current.entry.type.toUpperCase();
        const description = current.raid ? current.raid.description : '';
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
                    <div style="margin-top:12px;padding:8px;background:rgba(155,89,182,0.15);border-radius:6px;color:#e0d6ff;font-weight:700;text-align:center">⏱️ <span id="raidCurrentCountdown">${countdown}</span></div>
                    <div style="margin-top:12px; color:#cfdfff; font-size:0.9rem">Click on the raid image or go to "All Raids" to view full details.</div>
                </div>
            </div>
        `;
    } else {
        currentContainer.innerHTML = `<div class="no-active-incentive"><h3>🔬 No active raid</h3><p class="current-incentive-description">No raid is currently active according to history + rules.</p></div>`;
    }
    const preds = generatePredictions(8);
    let html = '<div class="raid-predictions-list">';
    preds.forEach((p, idx) => {
        let raidName = '?';
        let imgHtml = '<div style="width:56px;height:44px;border-radius:6px;background:rgba(155,89,182,0.06);display:flex;align-items:center;justify-content:center;color:#b9a3ff">?</div>';
        if (p.raidId) {
            const r = raidsCatalog.find(rr => rr.id === p.raidId);
            if (r) { raidName = r.name; imgHtml = `<img src="${r.image}" alt="${r.name}" onerror="this.style.display='none'">`; }
        }
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
    if (allList) {
        allList.innerHTML = '';
        raidsCatalog.forEach(r => { const div = document.createElement('div'); div.className = 'raid-tile'; div.innerHTML = `<img src="${r.image}" alt="${r.name}" onerror="this.style.display='none'"> <div><div class="tile-name">${r.name}</div><div style="color:#95a5a6;font-size:0.85rem">Specimen: ${r.specimen}</div></div>`; div.style.cursor = 'pointer'; div.addEventListener('click', () => openRaidDetailsInline(r, div)); allList.appendChild(div); });
    }
    if (historyList) {
        historyList.innerHTML = '';
        raidsHistory.slice().reverse().forEach(h => { const raid = raidsCatalog.find(r=> r.id === h.raidId); const container = document.createElement('div'); container.className = 'history-item'; const raidName = raid ? raid.name : `#${h.raidId}`; const dateConv = convertToTimezone(parsePeruDate(h.date).toISOString(), currentTimezone); container.innerHTML = `<div class="hleft"><div style="width:48px;height:36px;border-radius:6px;overflow:hidden;">${raid && raid.image ? `<img src="${raid.image}" style="width:48px;height:36px;object-fit:cover" onerror="this.style.display='none'">` : '<div style="width:48px;height:36px;display:flex;align-items:center;justify-content:center;color:#9b59b6">?</div>'}</div><div><div style="font-weight:700;color:#d6c9ff">${raidName}</div><div style="font-size:0.85rem;color:#95a5a6">${dateConv.date}</div></div></div><div class="hright"><div class="history-type-${h.type}">${h.type.toUpperCase()}</div></div>`; historyList.appendChild(container); });
    }
    document.querySelectorAll('.raid-tab').forEach(btn => { btn.addEventListener('click', (e) => { document.querySelectorAll('.raid-tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); const tab = btn.dataset.tab; if (tab === 'all') { document.getElementById('raidAllList').style.display = 'grid'; document.getElementById('raidHistoryList').style.display = 'none'; } else { document.getElementById('raidAllList').style.display = 'none'; document.getElementById('raidHistoryList').style.display = 'block'; } }); });
}

function openImageLightbox(url) { const lb = document.getElementById('imageLightbox'); const img = document.getElementById('lightboxImage'); if (!lb || !img) return; img.src = url; lb.style.display = 'flex'; }
function closeImageLightbox() { const lb = document.getElementById('imageLightbox'); const img = document.getElementById('lightboxImage'); if (!lb || !img) return; img.src = ''; lb.style.display = 'none'; }

window.addEventListener('click', (e) => { const lb = document.getElementById('imageLightbox'); if (!lb) return; if (e.target === lb) closeImageLightbox(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeImageLightbox(); });

function openRaidModal(raid) { console.warn('openRaidModal is deprecated; use openRaidDetailsInline'); }

function openRaidDetailsInline(raid, tileElement) {
    const panel = document.getElementById('raidDetailsPanel'); if (!panel) return; document.querySelectorAll('.raid-tile').forEach(t => t.classList.remove('active')); if (tileElement) tileElement.classList.add('active');
    const image = raid.image || '';
    const description = raid.description || '';
    const additional = raid.additionalInfo || '';
    let rewardsHtml = '';
    if (raid.rewards && Array.isArray(raid.rewards) && raid.rewards.length) {
        rewardsHtml = raid.rewards.map(rw => { if (!rw) return ''; if (typeof rw === 'string') { return `<div><img class="reward-img" src="${rw}" alt="reward" onerror="this.style.display='none'"></div>`; } else if (typeof rw === 'object') { const url = rw.image || rw.url || ''; const label = rw.name || rw.label || ''; return `<div><img class="reward-img" src="${url}" alt="${label}" onerror="this.style.display='none'"><div class="reward-label">${label}</div></div>`; } return ''; }).join('');
    } else { rewardsHtml = `<div class="reward-placeholder">No rewards defined</div>`; }
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
                <div class="rewards-images">${rewardsHtml}</div>
            </div>
        </div>
    `;
    panel.querySelectorAll('.reward-img').forEach(imgEl => { imgEl.addEventListener('click', (e) => { const src = imgEl.getAttribute('src'); if (src) openImageLightbox(src); }); imgEl.addEventListener('touchstart', () => { const src = imgEl.getAttribute('src'); if (src) openImageLightbox(src); }); });
    panel.style.display = 'block'; panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateRaidCountdowns() {
    try {
        const current = detectCurrentRaid();
        const el = document.getElementById('raidCurrentCountdown');
        if (el && current && current.isActive) {
            const now = new Date();
            const diff = current.endMax - now;
            if (diff <= 0) el.textContent = 'Ended';
            else { const days = Math.floor(diff / (1000 * 60 * 60 * 24)); const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)); const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)); el.textContent = `${days}d ${hours}h ${mins}m`; }
        }
    } catch (err) { }
}

export { loadRaidsData, detectCurrentRaid, generatePredictions, renderRaidPredictor, openRaidDetailsInline, updateRaidCountdowns };
