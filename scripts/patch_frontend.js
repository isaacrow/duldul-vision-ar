const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

console.log('Original HTML size:', html.length);

// 1. Remove the orphaned .cockpit-actions-row block (lines ~1670-1698)
const strayBlockRegex = /<!-- Thumb-Accessible Driving Controls \(Waze Inspired\) -->[\s\S]*?<div class="cockpit-actions-row">[\s\S]*?<\/div>\s*<\/div>/;
if (strayBlockRegex.test(html)) {
  html = html.replace(strayBlockRegex, '');
  console.log('✅ Removed orphaned .cockpit-actions-row block.');
} else {
  console.log('⚠️ Could not match stray block via regex, checking manual string...');
  const needle = '<div class="cockpit-actions-row">';
  const idx = html.indexOf(needle);
  if (idx !== -1) {
    const endIdx = html.indexOf('<!-- One-Tap Quick Hazard Reporting Sheet', idx);
    if (endIdx !== -1) {
      // Find comment before needle
      const commentIdx = html.lastIndexOf('<!--', idx);
      html = html.slice(0, commentIdx) + html.slice(endIdx);
      console.log('✅ Removed orphaned block manually.');
    }
  }
}

// 2. Fix premature closing </div> in #appleDrawer
// Find cityChipsContainer and check for double </div>
const chipsPattern = `<div id="cityChipsContainer" style="display:flex; gap:6px; overflow-x:auto; padding-bottom:4px; scrollbar-width:none;">
        <button class="category-chip active" onclick="playHapticClick(); jumpToCity('baghdad')">بغداد</button>
        <button class="category-chip" onclick="playHapticClick(); jumpToCity('erbil')">أربيل</button>
        <button class="category-chip" onclick="playHapticClick(); jumpToCity('basra')">البصرة</button>
        <button class="category-chip" onclick="playHapticClick(); jumpToCity('najaf')">النجف</button>
        <button class="category-chip" onclick="playHapticClick(); jumpToCity('karbala')">كربلاء</button>
        <button class="category-chip" onclick="playHapticClick(); jumpToCity('mosul')">الموصل</button>
      </div>

      </div>`;

if (html.includes(chipsPattern)) {
  const correctedChips = `<div id="cityChipsContainer" style="display:flex; gap:6px; overflow-x:auto; padding-bottom:4px; scrollbar-width:none;">
        <button class="category-chip active" onclick="playHapticClick(); jumpToCity('baghdad')">بغداد</button>
        <button class="category-chip" onclick="playHapticClick(); jumpToCity('erbil')">أربيل</button>
        <button class="category-chip" onclick="playHapticClick(); jumpToCity('basra')">البصرة</button>
        <button class="category-chip" onclick="playHapticClick(); jumpToCity('najaf')">النجف</button>
        <button class="category-chip" onclick="playHapticClick(); jumpToCity('karbala')">كربلاء</button>
        <button class="category-chip" onclick="playHapticClick(); jumpToCity('mosul')">الموصل</button>
      </div>`;
  html = html.replace(chipsPattern, correctedChips);
  console.log('✅ Removed premature </div> after cityChipsContainer.');
} else {
  // Regex version
  html = html.replace(/(<\/div>\s*<\/div>)(\s*<!-- Route Endpoints)/, '</div>$2');
  console.log('✅ Regex checked for premature closing tag before Route Endpoints.');
}

// 3. Update CSS for .apple-bottom-drawer and .apple-sheet-card to ensure map is never covered
html = html.replace(
  /\.apple-bottom-drawer\s*\{[\s\S]*?max-height: 75vh;[\s\S]*?overflow-y: auto;[\s\S]*?\}/,
  `.apple-bottom-drawer {
      position: absolute;
      bottom: 0;
      right: 0;
      left: 0;
      max-width: 540px;
      margin: 0 auto;
      z-index: 20;
      display: flex;
      flex-direction: column;
      pointer-events: none;
    }

    .apple-sheet-card {
      pointer-events: auto;
      background: var(--ios-card);
      -webkit-backdrop-filter: var(--ios-blur);
      backdrop-filter: var(--ios-blur);
      border-top: 1px solid var(--ios-border);
      border-radius: 28px 28px 0 0;
      padding: 10px 18px 20px 18px;
      box-shadow: var(--ios-shadow);
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 44vh;
      overflow-y: auto;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }`
);
console.log('✅ Updated .apple-bottom-drawer and .apple-sheet-card styles.');

// 4. Null-safety in calculateRouteTo and selectRoute
const oldCalcStart = `      map.getSource('route-path').setData({ type: 'FeatureCollection', features: [] });
      if (map.getSource('route-alt-path')) {
        map.getSource('route-alt-path').setData({ type: 'FeatureCollection', features: [] });
      }`;

const newCalcStart = `      if (map && map.getSource && map.getSource('route-path')) {
        map.getSource('route-path').setData({ type: 'FeatureCollection', features: [] });
      }
      if (map && map.getSource && map.getSource('route-alt-path')) {
        map.getSource('route-alt-path').setData({ type: 'FeatureCollection', features: [] });
      }`;

if (html.includes(oldCalcStart)) {
  html = html.replace(oldCalcStart, newCalcStart);
  console.log('✅ Null-checked calculateRouteTo map sources.');
}

const oldSelectRoute = `      currentPrimaryRoute = route;
      navigationStepIndex = 0;
      map.getSource('route-path').setData(route.geometry);`;

const newSelectRoute = `      currentPrimaryRoute = route;
      navigationStepIndex = 0;
      if (map && map.getSource && map.getSource('route-path')) {
        map.getSource('route-path').setData(route.geometry);
      }`;

if (html.includes(oldSelectRoute)) {
  html = html.replace(oldSelectRoute, newSelectRoute);
  console.log('✅ Null-checked selectRoute map source.');
}

// 5. Remove map.setStyle in startNavigationDrive to prevent blank screen flash
const oldStartNavDrive = `      // Switch map style to high-contrast Dark Matter for authentic Waze aesthetic!
      map.setStyle('https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json');
      map.once('style.load', () => {
        // Re-attach route layers with radiant cyan glow
        if (!map.getSource('route-path')) {
          map.addSource('route-path', { type: 'geojson', data: currentPrimaryRoute.geometry });
          map.addLayer({
            id: 'route-glow',
            type: 'line',
            source: 'route-path',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#0088cc', 'line-width': 16, 'line-opacity': 0.45, 'line-blur': 3 }
          });
          map.addLayer({
            id: 'route-core',
            type: 'line',
            source: 'route-path',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#00e5ff', 'line-width': 8 }
          });
        }
      });`;

const newStartNavDrive = `      // Seamless Waze Navigation: Keep map stable & ensure route path glows
      if (map && map.getSource && map.getSource('route-path') && currentPrimaryRoute) {
        map.getSource('route-path').setData(currentPrimaryRoute.geometry);
      }`;

if (html.includes(oldStartNavDrive)) {
  html = html.replace(oldStartNavDrive, newStartNavDrive);
  console.log('✅ Removed map.setStyle reload in startNavigationDrive to prevent blank map.');
}

// 6. Camera lock padding in driving mode
const oldLockCam = `      map.setPadding({
        top: 90,
        bottom: Math.round(window.innerHeight * 0.44),
        left: 16,
        right: 16
      });`;

const newLockCam = `      map.setPadding({
        top: 80,
        bottom: 120,
        left: 16,
        right: 16
      });`;

if (html.includes(oldLockCam)) {
  html = html.replace(oldLockCam, newLockCam);
  console.log('✅ Adjusted driving camera padding.');
}

// 7. Update jumpTo to smooth 60fps in startSmoothDriveEngine
const oldSetCenter = `        // Lock 3D Camera at 65° tilt, 18.4 zoom, heading-up!
        if (isCameraLocked && map) {
          map.setCenter(curPt);
          map.setBearing(currentInterpolatedHeading);
        }`;

const newSetCenter = `        // Lock 3D Camera at 62° tilt, heading-up smoothly!
        if (isCameraLocked && map) {
          map.jumpTo({
            center: curPt,
            bearing: currentInterpolatedHeading
          });
        }`;

if (html.includes(oldSetCenter)) {
  html = html.replace(oldSetCenter, newSetCenter);
  console.log('✅ Replaced setCenter with jumpTo for butter-smooth camera follow.');
}

// 8. Enhance Search Input with Debounce & Distance Pill
const oldSearchInput = `    searchInput.addEventListener('input', async (e) => {
      const q = e.target.value.trim();
      btnClearSearch.style.display = q.length > 0 ? 'inline' : 'none';

      if (q.length < 2) {
        if (q.length === 0) {
          renderSearchSuggestions();
        } else {
          searchResults.style.display = 'none';
        }
        return;
      }

      try {
        const res = await fetch(\`/api/places?q=\${encodeURIComponent(q)}\`);
        const places = await res.json();`;

const newSearchInput = `    let searchDebounceTimer = null;

    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      btnClearSearch.style.display = q.length > 0 ? 'inline' : 'none';

      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);

      if (q.length < 2) {
        if (q.length === 0) {
          renderSearchSuggestions();
        } else {
          searchResults.style.display = 'none';
        }
        return;
      }

      searchDebounceTimer = setTimeout(async () => {
        try {
          const originCoords = userCoords || (lastKnownGpsCoords ? [lastKnownGpsCoords.lng, lastKnownGpsCoords.lat] : null);
          const coordsParam = originCoords ? \`&lng=\${originCoords[0]}&lat=\${originCoords[1]}\` : '';
          const res = await fetch(\`/api/places?q=\${encodeURIComponent(q)}\${coordsParam}\`);
          const places = await res.json();`;

if (html.includes(oldSearchInput)) {
  html = html.replace(oldSearchInput, newSearchInput);
  console.log('✅ Added debounced search with user coordinate enrichment.');
}

// Write patched HTML
fs.writeFileSync(indexHtmlPath, html, 'utf8');
console.log('🎉 public/index.html patched successfully! New size:', html.length);
