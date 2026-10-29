const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

// Normalize line endings to \n
html = html.replace(/\r\n/g, '\n');

// 1. Replace initTrafficConsent
const consentRegex = /function initTrafficConsent\(\) \{[\s\S]*?function updateLocationStatus/;
const safeConsent = `function initTrafficConsent() {
      contributionSessionId = getContributionSessionId();
      const checkbox = document.getElementById('trafficOptIn');
      if (!checkbox) return;
      try {
        checkbox.checked = localStorage.getItem('masar-traffic-opt-in') === 'true';
        checkbox.addEventListener('change', () => {
          try {
            localStorage.setItem('masar-traffic-opt-in', checkbox.checked ? 'true' : 'false');
          } catch (err) {}
        });
      } catch (err) {}
    }

    function updateLocationStatus`;

if (consentRegex.test(html)) {
  html = html.replace(consentRegex, safeConsent);
  console.log('✅ Patched initTrafficConsent safely.');
}

// 2. Patch initMap with retry & error boundary
const initMapRegex = /function initMap\(\) \{[\s\S]*?map = new maplibregl\.Map\(\{[\s\S]*?attributionControl: false\s*\}\);/;
const safeInitMap = `function initMap() {
      if (map) return;
      if (typeof maplibregl === 'undefined') {
        console.warn('MapLibre GL library loading, retrying init in 150ms...');
        setTimeout(initMap, 150);
        return;
      }
      try {
        if (maplibregl.getRTLTextPluginStatus && maplibregl.getRTLTextPluginStatus() === 'unavailable') {
          maplibregl.setRTLTextPlugin(
            'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js',
            null,
            true
          );
        }
      } catch (e) {}

      try {
        map = new maplibregl.Map({
          container: 'map',
          style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
          center: [44.3661, 33.3152], // Baghdad Core
          zoom: 14.0,
          pitch: is3DView ? 48 : 0,
          bearing: 0,
          attributionControl: false
        });

        map.on('error', (e) => {
          console.warn('MapLibre event note:', e ? (e.error || e.message) : '');
        });
      } catch (mErr) {
        console.error('Fatal map initialization error:', mErr);
      }`;

if (initMapRegex.test(html)) {
  html = html.replace(initMapRegex, safeInitMap);
  console.log('✅ Patched initMap safely.');
}

// 3. Remove .apple-side-stack (the 6-button vertical column that felt "so AI")
const sideStackRegex = /<!-- Apple Side Control Stack -->[\s\S]*?<div class="apple-side-stack">[\s\S]*?<\/div>\s*<\/div>/;
const nativeControls = `<!-- Native iOS Map Floating Action Controls (Clean & Ergonomic) -->
  <div class="native-map-controls" id="nativeMapControls">
    <button class="native-map-fab" onclick="playHapticClick(); toggle3DView()" id="btn3D" title="3D / 2D">
      <span id="label3D">3D</span>
    </button>
    <button class="native-map-fab" onclick="playHapticClick(); recenterLocation()" title="موقعي الحالي">
      <i class="fa-solid fa-location-crosshairs" id="gpsIcon"></i>
    </button>
  </div>`;

if (sideStackRegex.test(html)) {
  html = html.replace(sideStackRegex, nativeControls);
  console.log('✅ Replaced AI-looking side stack with clean native iOS floating FABs.');
}

// 4. Update brand row in header with language & theme pills
const brandRowRegex = /<div class="brand-row">[\s\S]*?<span class="location-status" id="locationStatus" role="status">بانتظار GPS<\/span>\s*<\/div>/;
const newBrandRow = `<div class="brand-row">
      <div style="display:flex; align-items:center; gap:8px;">
        <img src="/logo.jpg" alt="دلدل" class="brand-logo-img" style="width:34px; height:34px; border-radius:10px; object-fit:contain; border:1px solid rgba(0,0,0,0.08); background:#fff;">
        <div class="brand-copy"><strong>دلدل</strong><small>الملاحة الذكية في العراق</small></div>
      </div>
      <div style="display:flex; align-items:center; gap:6px;">
        <button class="header-pill-btn" onclick="playHapticClick(); toggleDarkMode()" title="نهاري / ليلي">
          <i class="fa-solid fa-moon" id="themeIcon"></i>
        </button>
        <button class="header-pill-btn" onclick="playHapticClick(); toggleLanguage()" id="langBtn" title="Language">
          <span>EN</span>
        </button>
        <button class="header-pill-btn btn-hazard-pill" onclick="playHapticClick(); openReportModal()" title="إبلاغ">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>إبلاغ</span>
        </button>
      </div>
    </div>`;

if (brandRowRegex.test(html)) {
  html = html.replace(brandRowRegex, newBrandRow);
  console.log('✅ Replaced header brand row with clean action pills.');
}

// 5. Replace vendor CDN tags with local vendor scripts
html = html.replace(/<link href="https:\/\/unpkg\.com\/maplibre-gl[^"]*" rel="stylesheet" \/>/, '<link href="/vendor/maplibre-gl.css" rel="stylesheet" />');
html = html.replace(/<script src="https:\/\/unpkg\.com\/@turf\/turf[^"]*"><\/script>/, '<script src="/vendor/turf.min.js"></script>');
html = html.replace(/<script src="https:\/\/unpkg\.com\/maplibre-gl[^"]*"><\/script>/, '<script src="/vendor/maplibre-gl.js"></script>');

// 6. Replace window.onload with robust bootstrapApp
const onloadRegex = /window\.onload\s*=\s*\(\)\s*=>\s*\{[\s\S]*?initTrafficConsent\(\);[\s\S]*?initMap\(\);[\s\S]*?\};/;
const robustBootstrap = `function bootstrapApp() {
      try { initTrafficConsent(); } catch (e) {}
      try { initMap(); } catch (e) {}
      if ('serviceWorker' in navigator && location.protocol !== 'file:') {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootstrapApp);
    } else {
      bootstrapApp();
    }
    window.addEventListener('load', bootstrapApp);`;

if (onloadRegex.test(html)) {
  html = html.replace(onloadRegex, robustBootstrap);
  console.log('✅ Replaced window.onload with robust bootstrapApp.');
}

fs.writeFileSync(indexHtmlPath, html, 'utf8');
console.log('🎉 public/index.html completely patched with safe line endings! Final size:', html.length);
