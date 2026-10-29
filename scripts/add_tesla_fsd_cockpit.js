const fs = require('fs');
const path = 'C:/Users/MK/.gemini/antigravity/scratch/waze-iraq/public/index.html';
let html = fs.readFileSync(path, 'utf8');

// 1. Add vendor scripts
if (!html.includes('/vendor/three.min.js')) {
  html = html.replace(
    '<script src="/vendor/tesla_vision_ar.js"></script>',
    '<script src="/vendor/three.min.js"></script>\n  <script src="/vendor/tesla_fsd_vector_space.js"></script>\n  <script src="/vendor/tesla_vision_ar.js"></script>'
  );
  console.log('Added Three.js and Tesla FSD scripts');
}

// 2. Add Tesla Cockpit CSS
const teslaCss = `
    /* ==========================================================================
       Tesla FSD V12 / Cybercab 3D Vector Space & Real-Time Computer Vision
       Matches exact cockpit visualization from user screenshots.
       ========================================================================== */
    .tesla-fsd-overlay {
      position: fixed;
      inset: 0;
      z-index: 200;
      background: #0a0d14;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Cairo', 'Inter', system-ui, sans-serif;
      user-select: none;
    }

    .tesla-3d-scene {
      position: absolute;
      inset: 0;
      z-index: 1;
    }

    .tesla-vector-canvas {
      width: 100% !important;
      height: 100% !important;
      display: block;
    }

    /* Tesla Top-Left HUD (PRND & Speedometer) */
    .tesla-hud-top-left {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 20;
      display: flex;
      flex-direction: column;
      gap: 6px;
      pointer-events: none;
    }
    body.lang-en .tesla-hud-top-left {
      left: 20px;
      right: auto;
    }

    .tesla-prnd-row {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.4);
      letter-spacing: 0.12em;
    }
    .prnd-item.active {
      color: #38bdf8;
      text-shadow: 0 0 10px rgba(56, 189, 248, 0.6);
    }
    .tesla-ready-pill {
      background: rgba(16, 185, 129, 0.16);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.35);
      border-radius: 6px;
      padding: 1px 6px;
      font-size: 10.5px;
      font-weight: 800;
      margin-left: 4px;
    }
    .tesla-battery-pill {
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .tesla-speedo-row {
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin-top: 2px;
    }
    .tesla-speed-big {
      font-size: 58px;
      font-weight: 900;
      color: #ffffff;
      line-height: 0.95;
      letter-spacing: -0.04em;
    }
    .tesla-speed-unit {
      font-size: 13px;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.5);
    }
    .tesla-speed-limit-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #ffffff;
      border: 3.5px solid #ef4444;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      color: #0f172a;
      line-height: 1;
      transform: translateY(-6px);
    }
    .limit-val {
      font-size: 13px;
      font-weight: 900;
    }
    .limit-sub {
      font-size: 7px;
      font-weight: 800;
      color: #64748b;
    }

    /* Tesla Navigation Maneuver Banner (Top Center) */
    .tesla-hud-maneuver {
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 20;
      background: rgba(18, 22, 32, 0.88);
      -webkit-backdrop-filter: blur(25px);
      backdrop-filter: blur(25px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 18px;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      max-width: 90vw;
    }
    .tesla-maneuver-icon {
      font-size: 24px;
      color: #38bdf8;
    }
    .tesla-maneuver-col {
      display: flex;
      flex-direction: column;
      text-align: right;
    }
    body.lang-en .tesla-maneuver-col {
      text-align: left;
    }
    .tesla-maneuver-dist {
      font-size: 18px;
      font-weight: 900;
      color: #ffffff;
    }
    .tesla-maneuver-street {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      white-space: nowrap;
    }

    /* Tesla Top-Right Action Controls */
    .tesla-hud-top-right {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 20;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    body.lang-en .tesla-hud-top-right {
      right: 20px;
      left: auto;
    }
    .tesla-btn-pill {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: #ffffff;
      border-radius: 20px;
      padding: 8px 14px;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      -webkit-backdrop-filter: blur(20px);
      backdrop-filter: blur(20px);
      transition: all 0.2s ease;
    }
    .tesla-btn-pill:active {
      transform: scale(0.94);
      background: rgba(255, 255, 255, 0.22);
    }
    .tesla-btn-pill.btn-close-tesla {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.4);
      color: #f87171;
    }

    /* Picture-in-Picture (PIP) Camera AI Detection Frame */
    .tesla-pip-container {
      position: absolute;
      bottom: 95px;
      left: 20px;
      z-index: 25;
      background: rgba(15, 20, 28, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.6);
      width: 220px;
    }
    body.lang-en .tesla-pip-container {
      left: 20px;
      right: auto;
    }
    .pip-header {
      background: rgba(0, 0, 0, 0.4);
      padding: 6px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.8);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .pip-header button {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 11px;
    }
    #teslaPipCanvas {
      width: 100%;
      height: 120px;
      display: block;
      background: #000;
    }
    .pip-footer {
      padding: 4px 8px;
      font-size: 9.5px;
      font-weight: 700;
      color: #38bdf8;
      background: rgba(0, 0, 0, 0.3);
    }

    /* Tesla Bottom Media & Status Bar */
    .tesla-bottom-cockpit-bar {
      position: absolute;
      bottom: 18px;
      left: 20px;
      right: 20px;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: space-between;
      pointer-events: none;
    }
    .tesla-bottom-media-card {
      pointer-events: auto;
      background: rgba(18, 22, 32, 0.88);
      -webkit-backdrop-filter: blur(25px);
      backdrop-filter: blur(25px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .media-art {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(0, 229, 255, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
    }
    .media-info {
      display: flex;
      flex-direction: column;
    }
    .media-title {
      font-size: 12px;
      font-weight: 800;
      color: #ffffff;
    }
    .media-artist {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.6);
    }
    .tesla-vision-status-capsule {
      pointer-events: auto;
      background: rgba(18, 22, 32, 0.88);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 700;
      color: #ffffff;
    }

    /* Floating Tesla FSD Launch Button on Map */
    .floating-tesla-fsd-btn {
      position: absolute;
      bottom: calc(26vh + 72px);
      right: 16px;
      z-index: 24;
      background: linear-gradient(135deg, #1e293b, #0f172a);
      border: 1.5px solid rgba(56, 189, 248, 0.6);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45), 0 0 16px rgba(56, 189, 248, 0.25);
      border-radius: 22px;
      padding: 10px 16px;
      color: #ffffff;
      font-size: 13px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      font-family: inherit;
    }
    body.lang-en .floating-tesla-fsd-btn {
      right: auto;
      left: 16px;
    }
    .floating-tesla-fsd-btn:active {
      transform: scale(0.94);
    }
    .floating-tesla-fsd-btn i {
      color: #38bdf8;
      font-size: 15px;
    }
`;

if (!html.includes('Tesla FSD V12 / Cybercab 3D Vector Space')) {
  html = html.replace('</style>', teslaCss + '\n  </style>');
  console.log('Added Tesla FSD CSS');
}

// 3. Add Tesla FSD Overlay HTML Modal and floating launch button
const teslaModalHtml = `
  <!-- Floating Tesla FSD Cockpit Button (Direct Access to Screenshots 1, 2, 3) -->
  <button class="floating-tesla-fsd-btn" id="btnLaunchTeslaFSD" onclick="playHapticClick(); openTeslaCockpit()" title="تشغيل فضاء تسلا ثلاثي الأبعاد">
    <i class="fa-solid fa-car-rear"></i>
    <span>فضاء تسلا 3D</span>
  </button>

  <!-- Full-Screen Tesla FSD 3D Vector Space & AR Vision Cockpit (Screenshots 1, 2, 3) -->
  <div id="teslaCockpitModal" style="display:none;" class="tesla-fsd-overlay">
    <!-- 3D Three.js Container -->
    <div id="tesla3DContainer" class="tesla-3d-scene"></div>

    <!-- Tesla Cockpit Top-Left HUD -->
    <div class="tesla-hud-top-left">
      <div class="tesla-prnd-row">
        <span class="prnd-item">P</span>
        <span class="prnd-item">R</span>
        <span class="prnd-item">N</span>
        <span class="prnd-item active">D</span>
        <span class="tesla-ready-pill">READY</span>
        <span class="tesla-battery-pill"><i class="fa-solid fa-battery-three-quarters"></i> 86%</span>
      </div>
      <div class="tesla-speedo-row">
        <div class="tesla-speed-big" id="teslaLiveSpeed">88</div>
        <div class="tesla-speed-unit">KM/H</div>
        <div class="tesla-speed-limit-badge">
          <span class="limit-val" id="teslaSpeedLimit">100</span>
          <span class="limit-sub">MAX</span>
        </div>
      </div>
    </div>

    <!-- Tesla Navigation Maneuver Pill (Top Center) -->
    <div class="tesla-hud-maneuver" id="teslaManeuverHud">
      <div class="tesla-maneuver-icon"><i class="fa-solid fa-diamond-turn-right" id="teslaTurnIcon"></i></div>
      <div class="tesla-maneuver-col">
        <div class="tesla-maneuver-dist" id="teslaTurnDist">2.5 كم</div>
        <div class="tesla-maneuver-street" id="teslaTurnStreet">طريق محمد القاسم السريع</div>
      </div>
    </div>

    <!-- Tesla Controls (Top Right) -->
    <div class="tesla-hud-top-right">
      <button class="tesla-btn-pill" onclick="playHapticClick(); toggleCameraArPip()" title="تبديل الكاميرا">
        <i class="fa-solid fa-camera"></i> <span>الكاميرا AI</span>
      </button>
      <button class="tesla-btn-pill btn-close-tesla" onclick="playHapticClick(); closeTeslaCockpit()" title="الرجوع للخريطة">
        <i class="fa-solid fa-xmark"></i> <span>الخريطة</span>
      </button>
    </div>

    <!-- Tesla Bottom Bar -->
    <div class="tesla-bottom-cockpit-bar">
      <div class="tesla-bottom-media-card">
        <div class="media-art"><i class="fa-solid fa-shield-halved" style="color:#00e5ff;"></i></div>
        <div class="media-info">
          <div class="media-title">نظام دلدل للرؤية المكانية (Duldul Vision V12)</div>
          <div class="media-artist">رصد المركبات والعوائق ثلاثية الأبعاد نشط (Three.js WebGL)</div>
        </div>
      </div>
      <div class="tesla-vision-status-capsule">
        <i class="fa-solid fa-eye" style="color:#10b981;"></i>
        <span>المستشعرات: كاميرا + عمق + رادار 60 FPS</span>
      </div>
    </div>
  </div>
`;

if (!html.includes('id="teslaCockpitModal"')) {
  html = html.replace('<!-- Native iOS Map Floating Action Controls', teslaModalHtml + '\n  <!-- Native iOS Map Floating Action Controls');
  console.log('Added Tesla Cockpit Modal markup');
}

// 4. Add JS functions to manage Tesla Cockpit
const teslaJs = `
    /* ==========================================================================
       Tesla FSD Vector Space & WebGL Vision Controller
       ========================================================================== */
    let teslaVectorEngine = null;

    function openTeslaCockpit() {
      const modal = document.getElementById('teslaCockpitModal');
      const container = document.getElementById('tesla3DContainer');
      if (!modal || !container) return;

      modal.style.display = 'block';

      if (!teslaVectorEngine) {
        teslaVectorEngine = new TeslaVectorSpaceEngine();
        teslaVectorEngine.init(container);
      }

      // Sync with current navigation if active
      if (currentPrimaryRoute) {
        document.getElementById('teslaTurnDist').innerText = (currentPrimaryRoute.distanceKm || 2.5) + ' كم';
        document.getElementById('teslaTurnStreet').innerText = currentDestinationName || 'المسار المحدد';
      }

      // Update speed display
      const speed = liveGpsSpeed > 0 ? Math.round(liveGpsSpeed) : 88;
      document.getElementById('teslaLiveSpeed').innerText = speed;

      teslaVectorEngine.start();
      showGlassToast('تم تشغيل فضاء تسلا ثلاثي الأبعاد 🚗', 'fa-solid fa-car-rear');
    }

    function closeTeslaCockpit() {
      const modal = document.getElementById('teslaCockpitModal');
      if (modal) modal.style.display = 'none';
      if (teslaVectorEngine) teslaVectorEngine.stop();
      showGlassToast('الرجوع إلى الخريطة', 'fa-solid fa-map');
    }

    function toggleCameraArPip() {
      if (!teslaVectorEngine || !teslaVectorEngine.pipContainer) return;
      const c = teslaVectorEngine.pipContainer;
      c.style.display = c.style.display === 'none' ? 'block' : 'none';
      showGlassToast(c.style.display === 'none' ? 'إخفاء معاينة الكاميرا' : 'إظهار معاينة الكاميرا', 'fa-solid fa-camera');
    }
`;

if (!html.includes('Tesla FSD Vector Space & WebGL Vision Controller')) {
  html = html.replace('function bootstrapApp() {', teslaJs + '\n    function bootstrapApp() {');
  console.log('Added Tesla FSD JS controller');
}

fs.writeFileSync(path, html, 'utf8');
console.log('Successfully patched index.html with Tesla FSD Cockpit');
