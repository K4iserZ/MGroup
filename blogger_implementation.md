# Implementación de Entradas para Blogger

## Descripción
Esta implementación permite crear entradas para blogger donde se muestra información básica de un mutante (nivel 1) y luego sus estadísticas completas al nivel 25 (fame level 25). El usuario solo necesita ingresar el código del specimen (ej: Specimen_A_01) y el sistema automáticamente obtiene los datos del CSV alojado en el repositorio de GitHub.

## Requisitos Previos
- El CSV `Stats.csv` debe estar disponible en el repositorio de GitHub en una URL raw (ej: `https://raw.githubusercontent.com/usuario/repo/main/Stats.csv`)
- La función `calculateMutantStats` debe modificarse para permitir niveles de fama menores a 25

## Modificaciones Necesarias

### 1. Modificar `calculateMutantStats` en `js/mutants.js`
Cambiar la línea que fuerza el nivel mínimo a 25 (restaurado según nueva petición):
```javascript
// Forzar nivel mínimo 25
fameLevel = Math.max(25, parseInt(fameLevel) || 25);
```

> Nota: el código para Blogger usará su propia copia de `calculateStats` y no depende de este archivo, de modo que puedes mantener esta versión sin afectar las entradas.
Esto permite calcular estadísticas para niveles de fama desde 1 hasta 25+.

### 2. Crear una nueva página/sección para Blogger
Agregar al HTML (`index.html`) una nueva sección:
```html
<!-- BLOGGER PAGE -->
<div id="blogger" class="page-content">
    <div class="container">
        <h2>🧬 Blogger Entry Generator</h2>
        <div class="blogger-form">
            <label for="specimenInput">Specimen Code:</label>
            <input type="text" id="specimenInput" placeholder="e.g., Specimen_A_01">
            <button id="generateEntryBtn" class="btn-primary">Generate Entry</button>
        </div>
        <div id="bloggerOutput" class="blogger-output">
            <!-- Se llenará con JavaScript -->
        </div>
    </div>
</div>
```

### 3. Agregar navegación
Actualizar el menú de navegación para incluir la página de blogger.

### 4. Crear módulo JavaScript independiente para el blogger
La funcionalidad de cálculo se copia a un archivo separado bajo `blogger/` para no mezclarla con el sitio principal. Crea `blogger/blogger.js` con contenido como el siguiente:
```javascript
// blogger/blogger.js
// Utilities to be used inside Blogger entries. The idea es incluir
// `<script src="/blogger/blogger.js"></script>` en la plantilla de la entrada.

// URL de tu CSV en GitHub (raw). Actualiza la ruta.
const BLOGGER_CSV_URL = 'https://raw.githubusercontent.com/usuario/repo/main/Stats.csv';
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
    const mutants = [];
    if (lines.length < 2) return mutants;
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
            abilityPct2: parseInt(vals[17]) || 0,
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
function calculateStats(mutantData, fameLevel = 1, starValueOverride = null) {
    if (!mutantData) return null;
    const globalAdjust = 100;
    const starValues = { platinum: 0 };
    const starValue = starValueOverride !== null ? starValueOverride : starValues.platinum;
    const bonusStar = 100 + starValue;
    fameLevel = Math.max(25, parseInt(fameLevel) || 25);
    let level = 100 + 10 * (fameLevel - 1);
    const extractNumber = (val) => { if (!val) return 0; const str = String(val).trim(); const match = str.match(/^(\d+)/); return parseInt(match ? match[1] : str) || 0; };
    const atk1pValue = extractNumber(mutantData.atk1p);
    const atk2pValue = extractNumber(mutantData.atk2p);
    const lifeValue = parseInt(mutantData.life) || 0;
    const speedValue = parseInt(mutantData.speed) || 0;
    const lifeF = Math.round((lifeValue * bonusStar * level * globalAdjust) / 1000000);
    const atk1F = Math.round(Math.abs(((atk1pValue * bonusStar * level * globalAdjust) / 1000000)));
    const atk2F = Math.round(Math.abs(((atk2pValue * bonusStar * level * globalAdjust) / 1000000)));
    const speedF = (speedValue > 0 ? 10 / (speedValue / 100) : 0).toFixed(2);
    return {
        lifeF, speedF, atk1F, atk2F,
        attack1p_name: mutantData.attack1p_name || 'Attack 1',
        attack2p_name: mutantData.attack2p_name || 'Attack 2',
        description: mutantData.description || ''
    };
}
window.BloggerUtils = { getMutantBySpecimen, calculateStats };
```

Este script puede cargarse directamente en una entrada de Blogger (basta con pegar la ruta completa al archivo y luego llamar a las funciones).

**Ejemplo de uso en la entrada:**
```html
<!-- incluir en el <head> o al final del body -->
<script src="https://tu-dominio.com/blogger/blogger.js"></script>
<script>
    document.addEventListener('DOMContentLoaded', async () => {
        const code = 'Specimen_AA_01'; // o tomarlo de un elemento <span> u otro dato de la plantilla
        const mutant = await window.BloggerUtils.getMutantBySpecimen(code);
        if (!mutant) return;
        const stats = window.BloggerUtils.calculateStats(mutant, 1);
        // insertar en el HTML de la entrada según tu diseño
        document.getElementById('mutant-name').textContent = mutant.name;
        document.getElementById('mutant-desc').textContent = mutant.description;
        document.getElementById('mutant-lv1-life').textContent = stats.lifeF;
        document.getElementById('mutant-lv1-speed').textContent = stats.speedF;
        // etc.
    });
</script>
```
### 5. Integrar en `main.js`
```javascript
// Importar el módulo blogger
import { loadBloggerData, generateBloggerEntry } from './blogger.js';

// Inicializar sección blogger
async function initBloggerSection() {
    const mutantsData = await loadBloggerData();
    
    const generateBtn = document.getElementById('generateEntryBtn');
    const specimenInput = document.getElementById('specimenInput');
    const outputDiv = document.getElementById('bloggerOutput');
    
    generateBtn.addEventListener('click', () => {
        const specimenCode = specimenInput.value.trim();
        if (specimenCode) {
            const entryHTML = generateBloggerEntry(specimenCode, mutantsData);
            outputDiv.innerHTML = entryHTML;
        }
    });
}

// Llamar a initBloggerSection cuando se carga la página
document.addEventListener('DOMContentLoaded', initBloggerSection);
```

## Estilos CSS adicionales
Agregar estilos en `styles.css`:
```css
.blogger-form {
    margin: 2rem 0;
    display: flex;
    gap: 1rem;
    align-items: center;
}

.blogger-form input {
    padding: 0.5rem;
    border: 2px solid #3498db;
    border-radius: 5px;
    background: #16213e;
    color: #ecf0f1;
}

.blogger-output {
    margin-top: 2rem;
}

.blogger-entry {
    background: #16213e;
    border: 2px solid #3498db;
    border-radius: 10px;
    padding: 1.5rem;
    margin: 1rem 0;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin: 1rem 0;
}

.stats-grid div {
    background: #0f3460;
    padding: 0.5rem;
    border-radius: 5px;
    text-align: center;
}
```

## Consideraciones
- Reemplazar `https://raw.githubusercontent.com/usuario/repo/main/Stats.csv` con la URL real del repositorio
- Asegurarse de que el CSV esté actualizado en GitHub
- La función `calculateMutantStats` debe estar disponible (importarla desde `mutants.js`)
- Para producción, considerar caching de los datos del CSV para mejorar rendimiento</content>
<parameter name="filePath">d:\Mutants\Web\blogger_implementation.md