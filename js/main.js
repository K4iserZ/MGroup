import { initializeURLRouting, detectTimezone, updatePageText, updateCurrentTimezoneInfo, setTimezone, currentTimezone } from './utils.js';
import { populateSearchSelector, searchIncentivoDates, updateIncentivosDisplay, loadMoreIncentivos } from './incentives.js';
import { loadGachaData, loadMutantSummaries } from './mutants.js';
import { loadRaidsData, updateRaidCountdowns } from './raids.js';

// Page navigation
function showPage(pageName) {
    document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));
    const target = document.getElementById(pageName);
    if (target) target.classList.add('active');
    if (pageName === 'mutants') loadMutantsPage();
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const navLink = document.querySelector(`[data-page="${pageName}"]`);
    if (navLink) navLink.classList.add('active');
    window.history.replaceState({}, '', `?page=${pageName}`);
    const navToggle = document.getElementById('navToggle');
    const nav = document.getElementById('mainNav');
    if (navToggle && navToggle.classList.contains('active')) { navToggle.classList.remove('active'); if (nav) nav.classList.remove('active'); }
    const dropdown = document.querySelector('.nav-dropdown');
    if (dropdown && dropdown.contains(document.activeElement)) {
        document.activeElement.blur();
    }
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
let mutantsPageLoadPromise = null;
function loadMutantsPage() {
    if (!mutantsPageLoadPromise) {
        mutantsPageLoadPromise = loadMutantSummaries().catch(error => {
            mutantsPageLoadPromise = null;
            console.error('Error loading mutant summaries:', error);
        });
    }
    return mutantsPageLoadPromise;
}
document.querySelectorAll('[data-page="mutants"]').forEach(link => {
    link.addEventListener('click', loadMutantsPage);
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
if (new URLSearchParams(window.location.search).get('page') === 'mutants') {
    loadMutantsPage();
}
loadGachaData();

setInterval(() => {
    updateIncentivosDisplay();
    updateCurrentTimezoneInfo();
    try { updateRaidCountdowns(); } catch (e) {}
}, 1000);
