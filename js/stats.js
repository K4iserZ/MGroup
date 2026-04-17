// Stats Calculator functionality

import { calculateMutantStats, mutantsData, gachaData, starValues, numericToStarKey } from './mutants.js';

function initStatsSection() {
    const fameInput = document.getElementById('statsFameLevel');
    const tableContainer = document.getElementById('statsTableContainer');
    const exportBtn = document.getElementById('exportStatsBtn');

    if (!fameInput || !tableContainer) return;

    function updateStatsTable() {
        const fameLevel = parseInt(fameInput.value) || 25;
        let tableHTML = `
            <div style="background: linear-gradient(135deg, #16213e 0%, #0f3460 100%); padding: 1.5rem; border-radius: 10px; border: 2px solid #3498db;">
                <table style="width: 100%; border-collapse: collapse; color: #ecf0f1;">
                    <thead>
                        <tr style="border-bottom: 2px solid #3498db;">
                            <th style="padding: 0.5rem; text-align: left; color: #3498db;">Specimen</th>
                            <th style="padding: 0.5rem; text-align: left; color: #3498db;">Name</th>
                            <th style="padding: 0.5rem; text-align: left; color: #3498db;">Type</th>
                            <th style="padding: 0.5rem; text-align: center; color: #3498db;">Life</th>
                            <th style="padding: 0.5rem; text-align: center; color: #3498db;">Speed</th>
                            <th style="padding: 0.5rem; text-align: center; color: #3498db;">Atk1</th>
                            <th style="padding: 0.5rem; text-align: center; color: #3498db;">Atk2</th>
                            <th style="padding: 0.5rem; text-align: center; color: #3498db;">Ability Atk1%</th>
                            <th style="padding: 0.5rem; text-align: center; color: #3498db;">Ability Atk2%</th>
                            <th style="padding: 0.5rem; text-align: left; color: #3498db;">Name of Ability</th>
                            <th style="padding: 0.5rem; text-align: center; color: #3498db;">Multiple</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        mutantsData.forEach(mutant => {
            const restrictedTypes = ['CAPTAINPEACE', 'SEASONAL', 'GAMES', 'GACHA', 'ZODIAC'];
            const typeUpper = (mutant.type || '').toUpperCase();
            const isRestricted = restrictedTypes.some(t => typeUpper.includes(t));

            const versions = [];
            if (!isRestricted) {
                versions.push({ starType: 'platinum', bonusGacha: 0, label: 'Platinum', starValue: 100 });
            } else {
                versions.push({ starType: 'basic', bonusGacha: 0, label: 'Basic', starValue: 0 });
            }

            // Add gacha skins
            const gachaList = gachaData[mutant.specimen] || [];
            gachaList.forEach((entry, idx) => {
                const skinName = entry.gachaId.charAt(0).toUpperCase() + entry.gachaId.slice(1).toLowerCase();
                versions.push({ starType: `gacha_${idx}`, bonusGacha: entry.bonus, label: `${entry.stars}⭐ ${skinName}`, starValue: starValues[numericToStarKey[entry.stars]] || 0 });
            });

            versions.forEach(version => {
                const stats = calculateMutantStats(mutant, fameLevel, version.starType, version.bonusGacha, version.starValue);

                // Determine if attacks are AOE
                const atk1IsAOE = (mutant.atk1p || '').toUpperCase().includes('AOE');
                const atk2IsAOE = (mutant.atk2p || '').toUpperCase().includes('AOE');
                let multiple = '';
                if (atk1IsAOE && atk2IsAOE) multiple = '1p,2p';
                else if (atk1IsAOE) multiple = '1p';
                else if (atk2IsAOE) multiple = '2p';

                tableHTML += `
                    <tr style="border-bottom: 1px solid #34495e;">
                        <td style="padding: 0.5rem;">${mutant.specimen}</td>
                        <td style="padding: 0.5rem;">${mutant.name} (${version.label})</td>
                        <td style="padding: 0.5rem;">${mutant.type || 'N/A'}</td>
                        <td style="padding: 0.5rem; text-align: center;">${stats.lifeF.toLocaleString()}</td>
                        <td style="padding: 0.5rem; text-align: center;">${stats.speedF}</td>
                        <td style="padding: 0.5rem; text-align: center;">${stats.atk1F.toLocaleString()}</td>
                        <td style="padding: 0.5rem; text-align: center;">${stats.atk2F.toLocaleString()}</td>
                        <td style="padding: 0.5rem; text-align: center;">${stats.atk1AbilityF.toLocaleString()}</td>
                        <td style="padding: 0.5rem; text-align: center;">${stats.atk2AbilityF.toLocaleString()}</td>
                        <td style="padding: 0.5rem;">${stats.ability1Name} / ${stats.ability2Name}</td>
                        <td style="padding: 0.5rem; text-align: center;">${multiple}</td>
                    </tr>
                `;
            });
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;

        tableContainer.innerHTML = tableHTML;
    }

    function exportStatsToCSV() {
        const fameLevel = parseInt(fameInput.value) || 25;
        let csvContent = 'Specimen|Name|Type|Life|Speed|Atk1|Atk2|Ability Atk1%|Ability Atk2%|Name of Ability|Multiple\n';

        mutantsData.forEach(mutant => {
            const restrictedTypes = ['CAPTAINPEACE', 'SEASONAL', 'GAMES', 'GACHA', 'ZODIAC'];
            const typeUpper = (mutant.type || '').toUpperCase();
            const isRestricted = restrictedTypes.some(t => typeUpper.includes(t));

            const versions = [];
            if (!isRestricted) {
                versions.push({ starType: 'platinum', bonusGacha: 0, label: 'Platinum', starValue: 100 });
            } else {
                versions.push({ starType: 'basic', bonusGacha: 0, label: 'Basic', starValue: 0 });
            }

            // Add gacha skins
            const gachaList = gachaData[mutant.specimen] || [];
            gachaList.forEach((entry, idx) => {
                const skinName = entry.gachaId.charAt(0).toUpperCase() + entry.gachaId.slice(1).toLowerCase();
                versions.push({ starType: `gacha_${idx}`, bonusGacha: entry.bonus, label: `${entry.stars}⭐ ${skinName}`, starValue: starValues[numericToStarKey[entry.stars]] || 0 });
            });

            versions.forEach(version => {
                const stats = calculateMutantStats(mutant, fameLevel, version.starType, version.bonusGacha, version.starValue);

                // Determine if attacks are AOE
                const atk1IsAOE = (mutant.atk1p || '').toUpperCase().includes('AOE');
                const atk2IsAOE = (mutant.atk2p || '').toUpperCase().includes('AOE');
                let multiple = '';
                if (atk1IsAOE && atk2IsAOE) multiple = '1p,2p';
                else if (atk1IsAOE) multiple = '1p';
                else if (atk2IsAOE) multiple = '2p';

                const row = [
                    mutant.specimen,
                    `${mutant.name} (${version.label})`,
                    mutant.type || 'N/A',
                    stats.lifeF,
                    stats.speedF,
                    stats.atk1F,
                    stats.atk2F,
                    stats.atk1AbilityF,
                    stats.atk2AbilityF,
                    `${stats.ability1Name} / ${stats.ability2Name}`,
                    multiple
                ].map(field => `"${field}"`).join('|');

                csvContent += row + '\n';
            });
        });

        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `mutants_stats_level_${fameLevel}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    fameInput.addEventListener('input', updateStatsTable);
    if (exportBtn) {
        exportBtn.addEventListener('click', exportStatsToCSV);
    }
    updateStatsTable(); // Initial load
}

export { initStatsSection };