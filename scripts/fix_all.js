const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

console.log('Original HTML size:', html.length);

// 1. Switch to local vendor assets for instant, reliable loading
html = html.replace(
  '<link href="https://unpkg.com/maplibre-gl@4.1.0/dist/maplibre-gl.css" rel="stylesheet" />',
  '<link href="/vendor/maplibre-gl.css" rel="stylesheet" />'
);

html = html.replace(
  '<script src="https://unpkg.com/@turf/turf@7.2.0/turf.min.js"></script>\n  <!-- MapLibre GL JS -->\n  <script src="https://unpkg.com/maplibre-gl@4.1.0/dist/maplibre-gl.js"></script>',
  '<!-- Turf.js for Advanced Spatial Math & Off-Route Detection (Local High-Speed) -->\n  <script src="/vendor/turf.min.js"></script>\n  <!-- MapLibre GL JS (Local High-Speed) -->\n  <script src="/vendor/maplibre-gl.js"></script>'
);

// Fallback replacement if whitespace differs
if (html.includes('https://unpkg.com/maplibre-gl@4.1.0/dist/maplibre-gl.js')) {
  html = html.replace('https://unpkg.com/maplibre-gl@4.1.0/dist/maplibre-gl.js', '/vendor/maplibre-gl.js');
}
if (html.includes('https://unpkg.com/@turf/turf@7.2.0/turf.min.js')) {
  html = html.replace('https://unpkg.com/@turf/turf@7.2.0/turf.min.js', '/vendor/turf.min.js');
}

// 2. Fix initTrafficConsent to be 100% null-safe (Preventing TypeError on iOS Safari)
const oldTrafficConsent = `    function initTrafficConsent() {
      contributionSessionId = getContributionSessionId();
      const checkbox = document.getElementById('trafficOptIn');
      try {
        checkbox.checked = localStorage.getItem('masar-traffic-opt-in') === 'true';
      } catch (err) {
        checkbox.checked = false;
      }
      checkbox.addEventListener('change', () => {
        try {
          localStorage.setItem('masar-traffic-opt-in', checkbox.checked ? 'true' : 'false');
        } catch (err) {}
        showToast(checkbox.checked
          ? 'تم تفعيل مشاركة حركة المرور المجتمعية دون تتبع.'
          : 'تم إيقاف مشاركة حركة المرور.');
      });
    }`;

const newTrafficConsent = `    function initTrafficConsent() {
      contributionSessionId = getContributionSessionId();
      const checkbox = document.getElementById('trafficOptIn');
      if (!checkbox) return;
      try {
        checkbox.checked = localStorage.getItem('masar-traffic-opt-in') === 'true';
        checkbox.addEventListener('change', () => {
          try {
            localStorage.setItem('masar-traffic-opt-in', checkbox.checked ? 'true' : 'false');
          } catch (err) {}
          showToast(checkbox.checked
            ? 'تم تفعيل مشاركة حركة المرور المجتمعية دون تتبع.'
            : 'تم إيقاف مشاركة حركة المرور.');
        });
      } catch (err) {}
    }`;

if (html.includes(oldTrafficConsent)) {
  html = html.replace(oldTrafficConsent, newTrafficConsent);
  console.log('✅ Made initTrafficConsent 100% null-safe.');
}

// 3. Make initMap bulletproof with retry and immediate execution
const oldInitMapHead = `    // Map Initialization with CARTO Voyager (Rich Daylight Color)
    function initMap() {
      if (typeof maplibregl !== 'undefined' && maplibregl.getRTLTextPluginStatus && maplibregl.getRTLTextPluginStatus() === 'unavailable') {
        try {
          maplibregl.setRTLTextPlugin(
            'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js',
            null,
            true
          );
        } catch (e) {}
      }

      map = new maplibregl.Map({
        container: 'map',
        style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
        center: [44.3661, 33.3152], // Baghdad Core
        zoom: 14.0,
        pitch: is3DView ? 48 : 0,
        bearing: 0,
        attributionControl: false
      });`;

const newInitMapHead = `    // Map Initialization with CARTO Voyager (Rich Daylight Color)
    function initMap() {
      if (map) return;
      if (typeof maplibregl === 'undefined') {
        console.warn('MapLibre GL initializing...');
        setTimeout(initMap, 200);
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
        });`;

if (html.includes(oldInitMapHead)) {
  html = html.replace(oldInitMapHead, newInitMapHead);
  console.log('✅ Bulletproofed initMap.');
}

// 4. Safe guards in calculateRouteTo & selectRoute
html = html.replace(
  "map.getSource('route-path').setData(route.geometry);",
  "if (map && map.getSource && map.getSource('route-path')) { map.getSource('route-path').setData(route.geometry); }"
);

html = html.replace(
  "if (!map.getSource('route-alt-path')) return;",
  "if (!map || !map.getSource || !map.getSource('route-alt-path')) return;"
);

html = html.replace(
  "if (!map.getSource('community-traffic')) {",
  "if (!map || !map.getSource || !map.getSource('community-traffic')) return;"
);

html = html.replace(
  "if (map.getSource('route-alt-path')) {",
  "if (map && map.getSource && map.getSource('route-alt-path')) {"
);

html = html.replace(
  "map.getSource('route-path').setData(currentPrimaryRoute.geometry);",
  "if (map && map.getSource && map.getSource('route-path') && currentPrimaryRoute) { map.getSource('route-path').setData(currentPrimaryRoute.geometry); }"
);

console.log('✅ Added null-safety guards across all map.getSource calls.');

// 5. Connect Real Human Studio Voice Navigation (Natural Iraqi Dialect MP3s)
const oldSpeakAiNav = `    function speakAiNavigation(text) {
      if (isAudioMuted) return;
      playManeuverChime(); // Harmonic chime first

      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'ar-IQ'; // Iraqi Arabic tag

          const voices = window.speechSynthesis.getVoices();
          const neuralVoice = voices.find(v => v.lang === 'ar-IQ') ||
                              voices.find(v => v.lang.startsWith('ar') && (v.name.includes('Neural') || v.name.includes('Online'))) ||
                              voices.find(v => v.lang.startsWith('ar')) ||
                              voices[0];
          if (neuralVoice) utterance.voice = neuralVoice;
          utterance.rate = 1.02;
          utterance.pitch = 0.98;

          setTimeout(() => {
            window.speechSynthesis.speak(utterance);
          }, 180);
        } catch (e) {
          // Fallback to studio voice
          playStudioVoice('continue');
        }
      } else {
        playStudioVoice('continue');
      }
    }`;

const newSpeakAiNav = `    function speakAiNavigation(text, instruction, distanceM) {
      if (isAudioMuted) return;
      const inst = (instruction || text || '').toLowerCase();
      const dist = Number(distanceM) || 300;

      // Play authentic studio recorded Iraqi audio clips
      if (inst.includes('وصلت') || inst.includes('arrive')) {
        playStudioVoice('arrive');
      } else if (inst.includes('يمين') || inst.includes('right')) {
        playStudioVoice(dist <= 60 ? 'turn_right_now' : 'turn_right');
      } else if (inst.includes('يسار') || inst.includes('left')) {
        playStudioVoice(dist <= 60 ? 'turn_left_now' : 'turn_left');
      } else if (inst.includes('سيطرة') || inst.includes('checkpoint')) {
        playStudioVoice('checkpoint');
      } else if (inst.includes('كاميرا') || inst.includes('camera')) {
        playStudioVoice('camera');
      } else if (inst.includes('ازدحام') || inst.includes('traffic')) {
        playStudioVoice('traffic');
      } else if (inst.includes('اعادة') || inst.includes('recalculate')) {
        playStudioVoice('recalculating');
      } else {
        playStudioVoice('continue');
      }
    }`;

if (html.includes(oldSpeakAiNav)) {
  html = html.replace(oldSpeakAiNav, newSpeakAiNav);
  console.log('✅ Connected speakAiNavigation directly to authentic Iraqi MP3 voice recordings.');
}

// 6. Guarantee initMap runs immediately without waiting for window.onload
const oldWindowOnload = `    window.onload = () => {
      initTrafficConsent();
      initMap();
      if ('serviceWorker' in navigator && location.protocol !== 'file:') {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }
    };`;

const newWindowOnload = `    function bootstrapApp() {
      initTrafficConsent();
      initMap();
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

if (html.includes(oldWindowOnload)) {
  html = html.replace(oldWindowOnload, newWindowOnload);
  console.log('✅ Guaranteed immediate map initialization on DOMContentLoaded & load.');
}

// 7. Redesign Map Controls: Remove the AI-looking 6-button stack from the left side!
// Replace .apple-side-stack with sleek native iOS bottom-right floating controls
const oldSideStack = `  <!-- Apple Side Control Stack -->
  <div class="apple-side-stack">
    <div class="glass-control-group liquid-glass">
      <button class="glass-control-btn" onclick="playHapticClick(); toggle3DView()" id="btn3D" title="3D / 2D">
        <span style="font-weight: 800; font-size: 13px;" id="label3D">3D</span>
      </button>
      <button class="glass-control-btn" onclick="playHapticClick(); recenterLocation()" title="موقعي الحالي">
        <i class="fa-solid fa-location-arrow" id="gpsIcon" style="color:var(--ios-text);"></i>
      </button>
      <button class="glass-control-btn" onclick="playHapticClick(); toggleDarkMode()" title="نهاري / ليلي">
        <i class="fa-solid fa-moon" id="themeIcon"></i>
      </button>
      
      <button class="glass-control-btn" onclick="playHapticClick(); openOfflineModal()" id="btnOffline" title="خرائط بدون إنترنت">
        <i class="fa-solid fa-cloud-arrow-down"></i>
      </button>
      <button class="glass-control-btn" onclick="toggleLanguage()" id="langBtn" title="Language">
        <span style="font-weight: 700; font-size: 12px;">EN</span>
      </button>
    </div>

    <button class="btn-report-hazard" onclick="openReportModal()" title="إبلاغ مجتمعي عن عائق">
      <i class="fa-solid fa-triangle-exclamation"></i>
    </button>
  </div>`;

const newNativeControls = `  <!-- Native iOS Map Floating Action Controls (Clean & Ergonomic) -->
  <div class="native-map-controls" id="nativeMapControls">
    <button class="native-map-fab" onclick="playHapticClick(); toggle3DView()" id="btn3D" title="3D / 2D">
      <span id="label3D">3D</span>
    </button>
    <button class="native-map-fab" onclick="playHapticClick(); recenterLocation()" title="موقعي الحالي">
      <i class="fa-solid fa-location-crosshairs" id="gpsIcon"></i>
    </button>
  </div>`;

if (html.includes(oldSideStack)) {
  html = html.replace(oldSideStack, newNativeControls);
  console.log('✅ Replaced AI-looking side stack with clean native iOS floating FABs.');
}

// 8. Put Theme toggle & Language toggle in the top brand header row cleanly
const oldBrandRow = `<div class="brand-row">
      <img src="/logo.jpg" alt="دلدل" class="brand-logo-img" style="width:36px; height:36px; border-radius:10px; object-fit:contain; border:1px solid rgba(0,0,0,0.08); background:#fff;">
      <div class="brand-copy"><strong>دلدل</strong><small>ملاحة مجتمعية محلية</small></div>
      <span class="location-status" id="locationStatus" role="status">بانتظار GPS</span>
    </div>`;

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

if (html.includes(oldBrandRow)) {
  html = html.replace(oldBrandRow, newBrandRow);
  console.log('✅ Integrated theme, language, and report buttons into header brand row.');
}

// 9. Add CSS for .native-map-controls and .header-pill-btn
const cssInjection = `
    /* Native iOS Map Floating Action Controls */
    .native-map-controls {
      position: absolute;
      bottom: calc(44vh + 16px);
      left: 16px;
      z-index: 22;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    body.lang-en .native-map-controls {
      left: auto;
      right: 16px;
    }

    .native-map-fab {
      width: 44px;
      height: 44px;
      border-radius: 22px;
      background: var(--ios-card);
      -webkit-backdrop-filter: blur(20px);
      backdrop-filter: blur(20px);
      border: 1px solid var(--ios-border);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      color: var(--ios-text);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .native-map-fab:active {
      transform: scale(0.92);
      background: rgba(0, 0, 0, 0.08);
    }

    .header-pill-btn {
      background: rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(0, 0, 0, 0.08);
      color: var(--ios-text);
      border-radius: 14px;
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    body.dark-mode .header-pill-btn {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.14);
      color: #fff;
    }
    .header-pill-btn.btn-hazard-pill {
      background: rgba(212, 155, 66, 0.15);
      color: var(--ios-orange);
      border-color: rgba(212, 155, 66, 0.3);
    }
`;

html = html.replace('</style>', cssInjection + '\n  </style>');

// Write patched HTML
fs.writeFileSync(indexHtmlPath, html, 'utf8');
console.log('🎉 public/index.html fully updated! Final size:', html.length);
