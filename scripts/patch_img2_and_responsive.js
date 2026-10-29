const fs = require('fs');
const path = 'C:/Users/MK/.gemini/antigravity/scratch/waze-iraq/public/index.html';
let html = fs.readFileSync(path, 'utf8');

// 1. CSS to add before </style>
const cssToAdd = `
    /* ==========================================================================
       Image 2 (Native Modern Dark Map, Amber Highways & Circular POIs)
       ========================================================================== */
    .floating-layer-fab {
      position: absolute;
      top: 86px;
      left: 16px;
      z-index: 25;
      width: 46px;
      height: 46px;
      border-radius: 23px;
      background: rgba(255, 255, 255, 0.92);
      -webkit-backdrop-filter: blur(20px);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.6);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 17px;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    body.dark-mode .floating-layer-fab {
      background: rgba(26, 32, 44, 0.88);
      border-color: rgba(255, 255, 255, 0.18);
      color: #ffffff;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
    }
    body.lang-en .floating-layer-fab {
      left: auto;
      right: 16px;
    }
    .floating-layer-fab:active {
      transform: scale(0.92);
    }

    .floating-voice-fab {
      position: absolute;
      bottom: calc(44vh + 18px);
      right: 16px;
      z-index: 25;
      width: 48px;
      height: 48px;
      border-radius: 24px;
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.08);
      box-shadow: 0 6px 22px rgba(0, 0, 0, 0.2);
      color: #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 19px;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    body.dark-mode .floating-voice-fab {
      background: #ffffff;
      color: #10b981;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    }
    body.lang-en .floating-voice-fab {
      right: auto;
      left: 16px;
    }
    .floating-voice-fab:active {
      transform: scale(0.92);
    }
    .floating-voice-fab.muted {
      color: #94a3b8 !important;
    }

    /* Shortcuts Row (Img 2 Bottom Sheet Style) */
    .shortcuts-row {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding: 4px 2px 8px 2px;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      margin-top: 4px;
    }
    .shortcuts-row::-webkit-scrollbar {
      display: none;
    }

    .shortcut-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: rgba(0, 0, 0, 0.04);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 18px;
      padding: 7px 13px;
      font-size: 12px;
      font-weight: 700;
      color: var(--ios-text);
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      font-family: inherit;
    }
    body.dark-mode .shortcut-pill {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.14);
      color: #ffffff;
    }
    .shortcut-pill:hover {
      background: rgba(0, 0, 0, 0.08);
    }
    body.dark-mode .shortcut-pill:hover {
      background: rgba(255, 255, 255, 0.14);
    }
    .shortcut-pill:active {
      transform: scale(0.94);
    }
    .shortcut-pill i {
      font-size: 13px;
      color: var(--ios-blue);
    }
    body.dark-mode .shortcut-pill i {
      color: #38bdf8;
    }

    /* Map Style Selection Grid */
    .map-style-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 6px;
    }
    .style-choice-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 14px;
      border-radius: 16px;
      background: rgba(0, 0, 0, 0.03);
      border: 1.5px solid rgba(0, 0, 0, 0.08);
      cursor: pointer;
      position: relative;
      transition: all 0.22s ease;
    }
    body.dark-mode .style-choice-card {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.12);
    }
    .style-choice-card.active {
      border-color: var(--ios-green);
      background: rgba(52, 199, 89, 0.08);
    }
    body.dark-mode .style-choice-card.active {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.14);
    }
    .style-preview-icon {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .style-card-info {
      flex: 1;
      text-align: right;
    }
    body.lang-en .style-card-info {
      text-align: left;
    }
    .style-card-title {
      font-size: 14px;
      font-weight: 800;
      color: var(--ios-text);
      margin-bottom: 2px;
    }
    .style-card-desc {
      font-size: 11px;
      color: var(--ios-text-secondary);
      line-height: 1.35;
    }
    .style-badge-indicator {
      width: 22px;
      height: 22px;
      border-radius: 11px;
      background: transparent;
      border: 2px solid var(--ios-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      color: transparent;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }
    .style-choice-card.active .style-badge-indicator {
      background: var(--ios-green);
      border-color: var(--ios-green);
      color: #ffffff;
    }

    /* Circular POI Badges Matching Image 2 */
    .circular-poi-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      user-select: none;
      transform: translate(-50%, -100%);
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .circular-poi-badge:hover,
    .circular-poi-badge:active {
      transform: translate(-50%, -100%) scale(1.12);
      z-index: 50;
    }
    .circular-poi-icon {
      width: 36px;
      height: 36px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      color: #ffffff;
      border: 2px solid #ffffff;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.38);
    }
    .circular-poi-label {
      margin-top: 4px;
      background: rgba(255, 255, 255, 0.96);
      color: #0f172a;
      font-weight: 800;
      font-size: 10.5px;
      padding: 2.5px 8px;
      border-radius: 12px;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.22);
      white-space: nowrap;
      border: 0.5px solid rgba(0, 0, 0, 0.08);
      max-width: 130px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    body.dark-mode .circular-poi-label {
      background: rgba(18, 22, 34, 0.94);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.2);
    }

    /* Glass Toast Notification */
    .glass-toast-pill {
      position: fixed;
      top: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      opacity: 0;
      pointer-events: none;
      z-index: 100;
      background: rgba(18, 22, 34, 0.88);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.22);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      -webkit-backdrop-filter: blur(20px);
      backdrop-filter: blur(20px);
      padding: 10px 20px;
      border-radius: 24px;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .glass-toast-pill.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
`;

if (!html.includes('Image 2 (Native Modern Dark Map')) {
  html = html.replace('</style>', cssToAdd + '\n  </style>');
  console.log('Added CSS');
}

// 2. HTML to add: Floating buttons and Bottom Sheet shortcuts
// Top-Left Stacked Layer Switcher Button
if (!html.includes('id="btnLayerSwitcher"')) {
  const topLayerButton = `
  <!-- Top-Left Floating Map Layer Switcher (Image 2) -->
  <button class="floating-layer-fab" id="btnLayerSwitcher" onclick="playHapticClick(); openMapStyleModal()" title="تغيير نمط الخريطة">
    <i class="fa-solid fa-layer-group"></i>
  </button>
  `;
  html = html.replace('<div class="native-map-controls"', topLayerButton + '\n  <div class="native-map-controls"');
  console.log('Added top-left layer button');
}

// Bottom-Right Floating Voice Speaker FAB
if (!html.includes('id="btnVoiceMute"')) {
  const voiceMuteFab = `
  <!-- Floating Voice Guidance Mute FAB (Image 2) -->
  <button class="floating-voice-fab" id="btnVoiceMute" onclick="playHapticClick(); toggleVoiceGuidanceMute()" title="كتم/تشغيل التوجيه الصوتي">
    <i class="fa-solid fa-volume-high" id="floatingVoiceIcon"></i>
  </button>
  `;
  html = html.replace('<div class="apple-bottom-drawer"', voiceMuteFab + '\n  <div class="apple-bottom-drawer"');
  console.log('Added bottom-right voice FAB');
}

// Add Shortcuts Row into apple-bottom-drawer
if (!html.includes('id="shortcutsRow"')) {
  const shortcutsRowHtml = `
      <!-- Img 2 Shortcuts Row -->
      <div class="shortcuts-row" id="shortcutsRow">
        <button class="shortcut-pill" onclick="playHapticClick(); handleShortcutClick('home')">
          <i class="fa-solid fa-house"></i>
          <span>أضف المنزل</span>
        </button>
        <button class="shortcut-pill" onclick="playHapticClick(); handleShortcutClick('work')">
          <i class="fa-solid fa-briefcase"></i>
          <span>أضف العمل</span>
        </button>
        <button class="shortcut-pill" onclick="playHapticClick(); handleShortcutClick('favorites')">
          <i class="fa-solid fa-star"></i>
          <span>المفضلة</span>
        </button>
        <button class="shortcut-pill" onclick="playHapticClick(); handleShortcutClick('recent')">
          <i class="fa-solid fa-clock-rotate-left"></i>
          <span>الأخيرة</span>
        </button>
        <button class="shortcut-pill" onclick="playHapticClick(); handleShortcutClick('explore')">
          <i class="fa-solid fa-compass"></i>
          <span>اكتشف ما حولك</span>
        </button>
      </div>
  `;
  html = html.replace('</div>\n\n      <!-- Route Endpoints', '</div>\n' + shortcutsRowHtml + '\n      <!-- Route Endpoints');
  console.log('Added shortcuts row');
}

// Map Style Modal Overlay
if (!html.includes('id="mapStyleModal"')) {
  const mapStyleModalHtml = `
  <!-- Map Style Switcher Modal (Image 2 Multi-Style Options) -->
  <div class="apple-modal-overlay" id="mapStyleModal" style="display:none;">
    <div class="apple-modal-sheet liquid-glass" style="max-width:440px;">
      <div class="sheet-handle" style="margin-bottom:12px;"></div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 style="font-weight:800; font-size:19px; display:flex; align-items:center; gap:8px;">
          <i class="fa-solid fa-layer-group" style="color:var(--ios-blue);"></i>
          <span>أنماط الخريطة (Map Styles)</span>
        </h3>
        <button class="apple-btn-close" onclick="closeMapStyleModal()" title="إغلاق">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <p style="font-size:12px; color:var(--ios-text-secondary); margin-bottom:14px;">
        اختر المظهر المفضل للتنقل. يمكنك التبديل بين النمط العصري الجديد والنمط الكلاسيكي في أي وقت:
      </p>

      <div class="map-style-grid">
        <!-- Option 1: Modern Dark (Image 2) -->
        <div class="style-choice-card active" id="styleCardDarkModern" onclick="playHapticClick(); selectMapStyle('dark_modern')">
          <div class="style-badge-indicator"><i class="fa-solid fa-check"></i></div>
          <div class="style-preview-icon" style="background:#191e24; color:#d99b43;">
            <i class="fa-solid fa-moon"></i>
          </div>
          <div class="style-card-info">
            <div class="style-card-title">النمط العصري الداكن (مثل الصورة 2)</div>
            <div class="style-card-desc">شرايين كهرمانية ذهبية، أيقونات دائرية مميزة، وتباين عالي للرؤية الليلية</div>
          </div>
        </div>

        <!-- Option 2: Classic Daylight (Old) -->
        <div class="style-choice-card" id="styleCardClassicDaylight" onclick="playHapticClick(); selectMapStyle('classic_daylight')">
          <div class="style-badge-indicator"><i class="fa-solid fa-check"></i></div>
          <div class="style-preview-icon" style="background:#f1f5f9; color:#0284c7;">
            <i class="fa-solid fa-sun"></i>
          </div>
          <div class="style-card-info">
            <div class="style-card-title">النمط النهاري الكلاسيكي (القديم)</div>
            <div class="style-card-desc">خريطة كارتو فوياجر النهارية، واضحة ومشرقة أثناء القيادة تحت الشمس</div>
          </div>
        </div>

        <!-- Option 3: Waze Live Layer -->
        <div class="style-choice-card" id="styleCardWazeLive" onclick="playHapticClick(); selectMapStyle('waze_live')">
          <div class="style-badge-indicator"><i class="fa-solid fa-check"></i></div>
          <div class="style-preview-icon" style="background:#0f172a; color:#38bdf8;">
            <i class="fa-solid fa-satellite-dish"></i>
          </div>
          <div class="style-card-info">
            <div class="style-card-title">طبقة وايز المباشرة (Waze Live)</div>
            <div class="style-card-desc">تراكب مباشر لازدحامات وايز، كاميرات المراقبة، وتنبيهات السائقين اللحظية</div>
          </div>
        </div>

        <!-- Option 4: Satellite Imagery -->
        <div class="style-choice-card" id="styleCardSatellite" onclick="selectMapStyle('satellite_hybrid')">
          <div class="style-badge-indicator"><i class="fa-solid fa-check"></i></div>
          <div class="style-preview-icon" style="background:#022c22; color:#34d399;">
            <i class="fa-solid fa-earth-americas"></i>
          </div>
          <div class="style-card-info">
            <div class="style-card-title">صور الأقمار الصناعية (Satellite)</div>
            <div class="style-card-desc">صور أقمار صناعية واقعية من ESRI مع طبقة أسماء الشوارع والمعالم</div>
          </div>
        </div>
      </div>
      
      <button onclick="closeMapStyleModal()" style="width:100%; margin-top:16px; background:var(--ios-green); color:#fff; border:none; border-radius:14px; padding:12px; font-weight:700; cursor:pointer;">تطبيق النمط</button>
    </div>
  </div>

  <!-- Toast Notification Pill -->
  <div class="glass-toast-pill" id="glassToast">
    <i class="fa-solid fa-circle-check" style="color:var(--ios-green);"></i>
    <span id="glassToastText">تم تحديث الإعدادات</span>
  </div>
  `;
  html = html.replace('<!-- Baghdad Bridges Live Radar Modal -->', mapStyleModalHtml + '\n  <!-- Baghdad Bridges Live Radar Modal -->');
  console.log('Added map style modal');
}

// 3. JavaScript Logic: Map Style Manager, Draggable Sheet, Circular POIs, Voice Mute
const jsToAdd = `
    /* ==========================================================================
       Image 2 Map Style Controller & POI Engine
       ========================================================================== */
    let currentMapStyle = 'dark_modern'; // Default to Image 2 Modern Dark Slate
    let isVoiceMuted = false;
    let circularPoiMarkers = [];

    // Curated Iraqi Hubs & Landmark POIs for Circular Badges (Image 2)
    const curatedImage2POIs = [
      { name: 'عشتار مول', category: 'mall', icon: 'fa-bag-shopping', color: '#0284c7', coords: [44.4023, 33.3082], desc: 'مركز تسوق وترفيه في بغداد' },
      { name: 'د. علي الزيدي', category: 'clinic', icon: 'fa-user-doctor', color: '#ef4444', coords: [44.3812, 33.3145], desc: 'عيادة استشارية تخصصية' },
      { name: 'قاعة النقيب', category: 'hall', icon: 'fa-landmark', color: '#0d9488', coords: [44.3645, 33.3298], desc: 'قاعة مناسبات ومؤتمرات' },
      { name: 'مول المنصور', category: 'mall', icon: 'fa-bag-shopping', color: '#8b5cf6', coords: [44.3546, 33.3142], desc: 'أكبر مركز تسوق في الكرخ' },
      { name: 'جامعة بغداد - الجادرية', category: 'edu', icon: 'fa-graduation-cap', color: '#4f46e5', coords: [44.3789, 33.2711], desc: 'المجمع الرئيسي لجامعة بغداد' },
      { name: 'مستشفى اليرموك التعليمي', category: 'hospital', icon: 'fa-hospital', color: '#10b981', coords: [44.3815, 33.3060], desc: 'مركز طبي تعليمي متكامل' },
      { name: 'ساحة التحرير', category: 'square', icon: 'fa-monument', color: '#f59e0b', coords: [44.4081, 33.3283], desc: 'قلب بغداد ونصب الحرية' },
      { name: 'مطار بغداد الدولي', category: 'airport', icon: 'fa-plane-departure', color: '#0ea5e9', coords: [44.2344, 33.2625], desc: 'بوابة العراق الجوية' },
      { name: 'حديقة الزوراء', category: 'park', icon: 'fa-tree', color: '#16a34a', coords: [44.3820, 33.3190], desc: 'متنزه ترفيهي وبرج الزوراء' },
      { name: 'محطة قطار بغداد العالمية', category: 'station', icon: 'fa-train', color: '#d97706', coords: [44.3792, 33.3325], desc: 'محطة سكك حديد بغداد' }
    ];

    function showGlassToast(text, iconClass) {
      const toast = document.getElementById('glassToast');
      const toastText = document.getElementById('glassToastText');
      if (!toast || !toastText) return;
      toastText.innerText = text;
      if (iconClass) {
        const iconEl = toast.querySelector('i');
        if (iconEl) iconEl.className = iconClass;
      }
      toast.classList.add('show');
      setTimeout(() => { toast.classList.remove('show'); }, 2600);
    }

    function openMapStyleModal() {
      const m = document.getElementById('mapStyleModal');
      if (m) m.style.display = 'flex';
      updateStyleCardsUI();
    }

    function closeMapStyleModal() {
      const m = document.getElementById('mapStyleModal');
      if (m) m.style.display = 'none';
    }

    function updateStyleCardsUI() {
      ['DarkModern', 'ClassicDaylight', 'WazeLive', 'Satellite'].forEach(id => {
        const el = document.getElementById('styleCard' + id);
        if (el) el.classList.remove('active');
      });
      if (currentMapStyle === 'dark_modern') {
        const el = document.getElementById('styleCardDarkModern');
        if (el) el.classList.add('active');
      } else if (currentMapStyle === 'classic_daylight') {
        const el = document.getElementById('styleCardClassicDaylight');
        if (el) el.classList.add('active');
      } else if (currentMapStyle === 'waze_live') {
        const el = document.getElementById('styleCardWazeLive');
        if (el) el.classList.add('active');
      } else if (currentMapStyle === 'satellite_hybrid') {
        const el = document.getElementById('styleCardSatellite');
        if (el) el.classList.add('active');
      }
    }

    function selectMapStyle(styleKey) {
      currentMapStyle = styleKey;
      updateStyleCardsUI();
      closeMapStyleModal();

      if (!map) return;

      if (styleKey === 'dark_modern') {
        isDarkTheme = true;
        document.body.classList.add('dark-mode');
        document.getElementById('themeIcon').className = 'fa-solid fa-sun';
        map.setStyle('https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json');
        map.once('style.load', () => {
          applyModernAmberHighways();
          addCommunityTrafficLayer();
          loadTrafficSignals();
          renderCircularPOIMarkers();
          reattachActiveRouteLayer();
        });
        showGlassToast('تم تفعيل النمط العصري الداكن (الصورة 2)', 'fa-solid fa-moon');
      } else if (styleKey === 'classic_daylight') {
        isDarkTheme = false;
        document.body.classList.remove('dark-mode');
        document.getElementById('themeIcon').className = 'fa-solid fa-moon';
        map.setStyle('https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json');
        map.once('style.load', () => {
          addCommunityTrafficLayer();
          loadTrafficSignals();
          renderCircularPOIMarkers();
          reattachActiveRouteLayer();
        });
        showGlassToast('تم تفعيل النمط النهاري الكلاسيكي (القديم)', 'fa-solid fa-sun');
      } else if (styleKey === 'waze_live') {
        if (!isWazeLayerActive) toggleWazeLayer();
        showGlassToast('تم تفعيل طبقة وايز اللحظية', 'fa-solid fa-satellite-dish');
      } else if (styleKey === 'satellite_hybrid') {
        // ESRI World Imagery Raster Satellite
        const satelliteStyle = {
          version: 8,
          sources: {
            'esri-satellite': {
              type: 'raster',
              tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
              tileSize: 256,
              attribution: 'Esri, Maxar, Earthstar Geographics'
            }
          },
          layers: [
            { id: 'satellite-tiles', type: 'raster', source: 'esri-satellite', minzoom: 0, maxzoom: 19 }
          ]
        };
        map.setStyle(satelliteStyle);
        map.once('style.load', () => {
          renderCircularPOIMarkers();
          reattachActiveRouteLayer();
        });
        showGlassToast('تم تفعيل صور الأقمار الصناعية', 'fa-solid fa-earth-americas');
      }
    }

    function applyModernAmberHighways() {
      if (!map) return;
      const layers = map.getStyle().layers || [];
      layers.forEach(l => {
        if (l.type === 'line') {
          const id = l.id.toLowerCase();
          if (id.includes('motorway') || id.includes('trunk') || id.includes('primary') || id.includes('highway')) {
            try {
              map.setPaintProperty(l.id, 'line-color', '#d99b43'); // Golden amber from image 2
              map.setPaintProperty(l.id, 'line-width', 4);
            } catch (e) {}
          } else if (id.includes('secondary') || id.includes('tertiary')) {
            try {
              map.setPaintProperty(l.id, 'line-color', '#9e7330');
            } catch (e) {}
          }
        }
      });
    }

    function renderCircularPOIMarkers() {
      clearCircularPOIMarkers();
      if (!map) return;

      curatedImage2POIs.forEach(poi => {
        const el = document.createElement('div');
        el.className = 'circular-poi-badge';
        el.title = poi.name + ' - ' + poi.desc;
        el.innerHTML = \`
          <div class="circular-poi-icon" style="background:\${poi.color};">
            <i class="fa-solid \${poi.icon}"></i>
          </div>
          <div class="circular-poi-label">\${poi.name}</div>
        \`;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          playHapticClick();
          map.flyTo({ center: poi.coords, zoom: 15.5, pitch: 45, duration: 1200 });
          calculateRouteTo(poi.coords[0], poi.coords[1], poi.name);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(poi.coords)
          .addTo(map);

        circularPoiMarkers.push(marker);
      });
    }

    function clearCircularPOIMarkers() {
      circularPoiMarkers.forEach(m => m.remove());
      circularPoiMarkers = [];
    }

    function reattachActiveRouteLayer() {
      if (!map) return;
      if (!map.getSource('route-path')) {
        map.addSource('route-path', {
          type: 'geojson',
          data: currentPrimaryRoute ? currentPrimaryRoute.geometry : { type: 'FeatureCollection', features: [] }
        });
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
    }

    // Floating Audio Guidance Mute Controller (Image 2)
    function toggleVoiceGuidanceMute() {
      isVoiceMuted = !isVoiceMuted;
      const fab = document.getElementById('btnVoiceMute');
      const icon = document.getElementById('floatingVoiceIcon');
      if (isVoiceMuted) {
        if (fab) fab.classList.add('muted');
        if (icon) icon.className = 'fa-solid fa-volume-xmark';
        showGlassToast('تم كتم التوجيه الصوتي 🔇', 'fa-solid fa-volume-xmark');
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      } else {
        if (fab) fab.classList.remove('muted');
        if (icon) icon.className = 'fa-solid fa-volume-high';
        showGlassToast('تم تفعيل التوجيه الصوتي 🔊', 'fa-solid fa-volume-high');
        announceVoiceGuidance('تم تفعيل التوجيه الصوتي لدلدل');
      }
    }

    // Draggable Bottom Sheet with Spring Snapping (Responsiveness & Better Move)
    let sheetStartY = 0;
    let sheetCurrentHeight = 0;
    let isDraggingSheet = false;

    function initDraggableSheet() {
      const handle = document.getElementById('sheetHandle');
      const card = document.getElementById('bottomSheetCard');
      const drawer = document.getElementById('appleDrawer');
      if (!card || !handle) return;

      const snapPoints = {
        peek: 110,
        half: window.innerHeight * 0.44,
        full: window.innerHeight * 0.80
      };

      function onPointerDown(e) {
        isDraggingSheet = true;
        sheetStartY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
        sheetCurrentHeight = card.offsetHeight;
        card.style.transition = 'none';
      }

      function onPointerMove(e) {
        if (!isDraggingSheet) return;
        const currentY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
        const delta = sheetStartY - currentY;
        const newHeight = Math.max(90, Math.min(window.innerHeight * 0.85, sheetCurrentHeight + delta));
        card.style.maxHeight = newHeight + 'px';

        // Adjust floating audio button and native map controls so they fluidly track above sheet
        const fabVoice = document.getElementById('btnVoiceMute');
        const mapControls = document.getElementById('nativeMapControls');
        if (fabVoice) fabVoice.style.bottom = (newHeight + 16) + 'px';
        if (mapControls) mapControls.style.bottom = (newHeight + 16) + 'px';
      }

      function onPointerUp(e) {
        if (!isDraggingSheet) return;
        isDraggingSheet = false;
        card.style.transition = 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)';

        const currentH = card.offsetHeight;
        let targetSnap = snapPoints.half;

        if (currentH < (snapPoints.peek + snapPoints.half) / 2) {
          targetSnap = snapPoints.peek;
        } else if (currentH > (snapPoints.half + snapPoints.full) / 2) {
          targetSnap = snapPoints.full;
        } else {
          targetSnap = snapPoints.half;
        }

        card.style.maxHeight = targetSnap + 'px';
        const fabVoice = document.getElementById('btnVoiceMute');
        const mapControls = document.getElementById('nativeMapControls');
        if (fabVoice) {
          fabVoice.style.transition = 'bottom 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
          fabVoice.style.bottom = (targetSnap + 16) + 'px';
        }
        if (mapControls) {
          mapControls.style.transition = 'bottom 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
          mapControls.style.bottom = (targetSnap + 16) + 'px';
        }
      }

      handle.addEventListener('mousedown', onPointerDown);
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);

      handle.addEventListener('touchstart', onPointerDown, { passive: true });
      window.addEventListener('touchmove', onPointerMove, { passive: true });
      window.addEventListener('touchend', onPointerUp, { passive: true });
    }

    // Shortcuts Row Action Handler (Img 2)
    function handleShortcutClick(action) {
      if (action === 'home') {
        const savedHome = localStorage.getItem('duldul_home_coords');
        if (savedHome) {
          const coords = JSON.parse(savedHome);
          calculateRouteTo(coords[0], coords[1], 'المنزل');
          showGlassToast('جارٍ الملاحة إلى المنزل 🏠', 'fa-solid fa-house');
        } else {
          const loc = prompt('أدخل اسم أو عنوان منزلك في العراق:', 'المنصور، بغداد');
          if (loc) {
            searchCategory(loc);
            showGlassToast('اختر موقع المنزل من القائمة', 'fa-solid fa-magnifying-glass');
          }
        }
      } else if (action === 'work') {
        const savedWork = localStorage.getItem('duldul_work_coords');
        if (savedWork) {
          const coords = JSON.parse(savedWork);
          calculateRouteTo(coords[0], coords[1], 'مكان العمل');
          showGlassToast('جارٍ الملاحة إلى مكان العمل 💼', 'fa-solid fa-briefcase');
        } else {
          const loc = prompt('أدخل عنوان عملك:', 'الجادرية، بغداد');
          if (loc) {
            searchCategory(loc);
            showGlassToast('اختر موقع العمل من القائمة', 'fa-solid fa-magnifying-glass');
          }
        }
      } else if (action === 'favorites') {
        searchCategory('مول');
        showGlassToast('عرض الأماكن المفضلة ومراكز التسوق ⭐', 'fa-solid fa-star');
      } else if (action === 'recent') {
        showGlassToast('عرض الوجهات الأخيرة ⏱️', 'fa-solid fa-clock-rotate-left');
        searchCategory('بغداد');
      } else if (action === 'explore') {
        if (map) map.flyTo({ center: [44.3820, 33.3150], zoom: 13.8, pitch: 48, duration: 1400 });
        renderCircularPOIMarkers();
        showGlassToast('استكشف معالم بغداد والعراق 🧭', 'fa-solid fa-compass');
      }
    }
`;

if (!html.includes('Image 2 Map Style Controller')) {
  html = html.replace('function bootstrapApp() {', jsToAdd + '\n    function bootstrapApp() {\n      try { initDraggableSheet(); } catch(e){}\n      try { renderCircularPOIMarkers(); } catch(e){}\n');
  console.log('Added JS logic');
}

fs.writeFileSync(path, html, 'utf8');
console.log('Successfully written index.html, new size:', fs.statSync(path).size);
