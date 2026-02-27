import { initializeURLRouting, detectTimezone, updatePageText, updateCurrentTimezoneInfo, setTimezone, currentTimezone } from './utils.js';
import { populateSearchSelector, searchIncentivoDates, updateIncentivosDisplay, loadMoreIncentivos } from './incentives.js';
import { loadGachaData, loadMutantsData } from './mutants.js';
import { loadRaidsData, updateRaidCountdowns } from './raids.js';

// Page navigation
function showPage(pageName) {
    document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));
    const target = document.getElementById(pageName);
    if (target) target.classList.add('active');
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const navLink = document.querySelector(`[data-page="${pageName}"]`);
    if (navLink) navLink.classList.add('active');
    window.history.replaceState({}, '', `?page=${pageName}`);
    const navToggle = document.getElementById('navToggle');
    const nav = document.getElementById('mainNav');
    if (navToggle && navToggle.classList.contains('active')) { navToggle.classList.remove('active'); if (nav) nav.classList.remove('active'); }
}

// Expose functions used by inline handlers
window.loadMoreIncentivos = loadMoreIncentivos;
window.showPage = showPage;
window.updateIncentivosDisplay = updateIncentivosDisplay;
window.searchIncentivoDates = searchIncentivoDates;

// Navigation event listeners
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) { e.preventDefault(); const pageName = this.getAttribute('data-page'); showPage(pageName); });
});
const navToggle = document.getElementById('navToggle'); if (navToggle) navToggle.addEventListener('click', function() { this.classList.toggle('active'); document.getElementById('mainNav').classList.toggle('active'); });

// Timezone selector handler
const tzSelect = document.getElementById('timezoneSelect');
if (tzSelect) tzSelect.addEventListener('change', function(e) {
    const selected = e.target.value;
    if (selected === 'auto') {
        detectTimezone();
    } else {
        setTimezone(selected);
    }
    updateIncentivosDisplay();
    updateCurrentTimezoneInfo();
});

// Search incentive selector
const searchSelect = document.getElementById('searchIncentive');
if (searchSelect) searchSelect.addEventListener('change', function(e) {
    const val = e.target.value;
    if (val) searchIncentivoDates(val);
    else document.getElementById('searchResultsContainer').innerHTML = '';
});

// Initialization sequence
loadRaidsData();
initializeURLRouting();
populateSearchSelector();
updatePageText();
updateIncentivosDisplay();
updateCurrentTimezoneInfo();
loadMutantsData();
loadGachaData();

setInterval(() => {
    updateIncentivosDisplay();
    updateCurrentTimezoneInfo();
    try { updateRaidCountdowns(); } catch (e) {}
}, 1000);
