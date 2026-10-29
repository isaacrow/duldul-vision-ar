const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Add authentic Liquid Glass CSS variables and styles
const liquidGlassCss = `
    /* ==========================================================================
       Liquid Glass Design System (iOS 18 & Glassmorphism)
       Inspired by https://freefrontend.com/css-liquid-glass/
       ========================================================================== */
    .liquid-glass {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.68) 0%, rgba(255, 255, 255, 0.42) 100%) !important;
      -webkit-backdrop-filter: blur(28px) saturate(210%) brightness(1.04) !important;
      backdrop-filter: blur(28px) saturate(210%) brightness(1.04) !important;
      border: 1px solid rgba(255, 255, 255, 0.6) !important;
      box-shadow: 
        0 16px 38px -10px rgba(0, 0, 0, 0.12),
        0 4px 12px rgba(0, 0, 0, 0.04),
        inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.9),
        inset 0 -1px 2px 0 rgba(0, 0, 0, 0.04) !important;
      position: relative;
    }

    body.dark-mode .liquid-glass {
      background: linear-gradient(135deg, rgba(30, 32, 38, 0.72) 0%, rgba(18, 19, 23, 0.55) 100%) !important;
      -webkit-backdrop-filter: blur(32px) saturate(200%) brightness(1.1) !important;
      backdrop-filter: blur(32px) saturate(200%) brightness(1.1) !important;
      border: 1px solid rgba(255, 255, 255, 0.18) !important;
      box-shadow: 
        0 24px 50px -10px rgba(0, 0, 0, 0.65),
        inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.25),
        inset 0 -1px 2px 0 rgba(0, 0, 0, 0.4) !important;
    }

    /* Driving Cockpit Layout */
    body.in-driving-mode #appleHeader,
    body.in-driving-mode #appleDrawer,
    body.in-driving-mode .attribution-bar,
    body.in-driving-mode .apple-side-stack {
      display: none !important;
    }

    .driving-cockpit-top {
      position: absolute;
      top: 14px;
      right: 14px;
      left: 14px;
      max-width: 540px;
      margin: 0 auto;
      z-index: 35;
      border-radius: 24px;
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      animation: slideDownIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .driving-maneuver-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .maneuver-big-badge {
      width: 58px;
      height: 58px;
      border-radius: 18px;
      background: var(--ios-green);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      box-shadow: 0 8px 24px rgba(52, 199, 89, 0.38);
      flex-shrink: 0;
    }

    .maneuver-text-col {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .maneuver-distance {
      font-size: 26px;
      font-weight: 900;
      color: var(--ios-text);
      letter-spacing: -0.02em;
      line-height: 1.1;
    }

    .maneuver-street {
      font-size: 15px;
      font-weight: 700;
      color: var(--ios-text-secondary);
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .maneuver-sub-hint {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      margin-top: 4px;
      font-size: 11px;
      color: var(--ios-blue);
      font-weight: 600;
    }

    /* Lane Guidance Bar */
    .lane-guidance-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      background: rgba(0, 0, 0, 0.04);
      border-radius: 12px;
      border: 1px solid rgba(0, 0, 0, 0.04);
    }

    body.dark-mode .lane-guidance-bar {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.06);
    }

    .lane-box {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.06);
      color: var(--ios-text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
    }

    body.dark-mode .lane-box {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .lane-box.highlight {
      background: var(--ios-green);
      color: #fff;
      font-weight: 800;
      box-shadow: 0 2px 8px rgba(52, 199, 89, 0.4);
    }

    .lane-advice {
      margin-inline-start: auto;
      font-size: 11px;
      font-weight: 700;
      color: var(--ios-text);
    }

    /* Proximity Hazard Alert Banner */
    .hazard-alert-banner {
      position: absolute;
      top: 140px;
      right: 14px;
      left: 14px;
      max-width: 500px;
      margin: 0 auto;
      z-index: 34;
      border-radius: 18px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-right: 4px solid var(--ios-orange) !important;
      animation: pulseAlert 1.5s infinite alternate;
    }

    .hazard-alert-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(255, 149, 0, 0.15);
      color: var(--ios-orange);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
    }

    .hazard-alert-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .hazard-alert-content strong {
      font-size: 13px;
      color: var(--ios-text);
    }

    .hazard-alert-content small {
      font-size: 11px;
      color: var(--ios-text-secondary);
    }

    .hazard-dismiss-btn {
      background: transparent;
      border: none;
      color: var(--ios-text-tertiary);
      cursor: pointer;
      font-size: 14px;
      padding: 4px;
    }

    /* Driving Speedometer Stack */
    .driving-speed-stack {
      position: absolute;
      top: 140px;
      left: 14px;
      z-index: 30;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .speed-meter-capsule {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    .speed-meter-capsule .speed-value {
      font-size: 24px;
      font-weight: 900;
      color: var(--ios-text);
      font-variant-numeric: tabular-nums;
    }

    .speed-meter-capsule .speed-unit {
      font-size: 9px;
      font-weight: 700;
      color: var(--ios-text-secondary);
      margin-top: 2px;
    }

    .speed-limit-badge {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: 3.5px solid #ff3b30;
      background: #ffffff;
      color: #000000;
      font-weight: 900;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .speed-limit-badge.speeding {
      animation: pulseRed 0.8s infinite;
    }

    /* Bottom Driving Cockpit Bar */
    .driving-cockpit-bottom {
      position: absolute;
      bottom: 16px;
      right: 14px;
      left: 14px;
      max-width: 540px;
      margin: 0 auto;
      z-index: 35;
      border-radius: 28px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      animation: slideUpIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .cockpit-stats-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .cockpit-eta-group {
      display: flex;
      flex-direction: column;
    }

    .cockpit-eta-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--ios-text-secondary);
    }

    .cockpit-eta-time {
      font-size: 28px;
      font-weight: 900;
      color: var(--ios-green);
      line-height: 1;
      letter-spacing: -0.02em;
    }

    .cockpit-divider {
      width: 1px;
      height: 36px;
      background: var(--ios-border);
    }

    .cockpit-stat-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 700;
      color: var(--ios-text);
    }

    .cockpit-actions-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .cockpit-action-btn {
      flex: 1;
      background: rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(0, 0, 0, 0.06);
      color: var(--ios-text);
      border-radius: 16px;
      padding: 10px 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-size: 10px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    body.dark-mode .cockpit-action-btn {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .cockpit-action-btn i {
      font-size: 15px;
    }

    .cockpit-action-btn:active {
      transform: scale(0.92);
    }

    .cockpit-action-btn.btn-hazard-report {
      background: linear-gradient(135deg, #ff9500, #ff5e3a);
      color: #fff;
      border: none;
      box-shadow: 0 4px 14px rgba(255, 149, 0, 0.35);
    }

    .cockpit-action-btn.btn-stop-drive {
      background: rgba(255, 59, 48, 0.12);
      color: #ff3b30;
      border-color: rgba(255, 59, 48, 0.2);
    }

    /* Quick Hazard Grid */
    .quick-hazard-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-top: 10px;
    }

    .quick-hazard-tile {
      background: var(--ios-card-solid);
      border: 1px solid var(--ios-border);
      border-radius: 16px;
      padding: 14px 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 700;
      color: var(--ios-text);
      cursor: pointer;
      box-shadow: var(--ios-shadow-sm);
      transition: transform 0.18s ease;
    }

    .quick-hazard-tile:active {
      transform: scale(0.94);
    }

    .quick-hazard-tile i {
      font-size: 22px;
    }

    /* Alternative Route Badges on Map */
    .alt-route-pill {
      background: rgba(255, 255, 255, 0.94);
      -webkit-backdrop-filter: blur(20px);
      backdrop-filter: blur(20px);
      border: 1.5px solid #007aff;
      border-radius: 20px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 800;
      color: #007aff;
      box-shadow: 0 4px 14px rgba(0, 122, 255, 0.25);
      cursor: pointer;
      white-space: nowrap;
      transition: transform 0.2s ease;
    }

    .alt-route-pill:hover {
      transform: scale(1.08);
    }

    @keyframes slideDownIn {
      from { transform: translateY(-30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes slideUpIn {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes pulseAlert {
      from { box-shadow: 0 8px 24px rgba(255, 149, 0, 0.2); }
      to { box-shadow: 0 12px 32px rgba(255, 149, 0, 0.45); }
    }

    @keyframes pulseRed {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.6); }
      50% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(255, 59, 48, 0); }
    }
`;

// Insert the CSS into <style>
html = html.replace('/* Minimal Attribution */', liquidGlassCss + '\n    /* Minimal Attribution */');

// Add .liquid-glass class to relevant UI elements
html = html.replace('class="search-capsule"', 'class="search-capsule liquid-glass"');
html = html.replace('class="apple-sheet-card"', 'class="apple-sheet-card liquid-glass"');
html = html.replace('class="apple-modal-sheet"', 'class="apple-modal-sheet liquid-glass"');
html = html.replace('class="speed-badge-hud"', 'class="speed-badge-hud liquid-glass"');
html = html.replace('class="glass-control-group"', 'class="glass-control-group liquid-glass"');
html = html.replace('class="category-chip', 'class="category-chip liquid-glass');

// Replace the brand-mark "م" with the logo image
html = html.replace(
  '<div class="brand-mark" aria-hidden="true">م</div>',
  '<img src="/logo.jpg" alt="دلدل" class="brand-logo-img" style="width:36px; height:36px; border-radius:10px; object-fit:contain; border:1px solid rgba(0,0,0,0.08); background:#fff;">'
);
html = html.replace(
  'placeholder="ابحث في بغداد والمحافظات..."',
  'placeholder="ابحث في دلدل عن أي مكان في العراق..."'
);

// Add the Driving Cockpit HTML elements right before the map canvas end or after appleNavHud
const drivingCockpitHtml = `
  <!-- Dedicated Waze-Style Apple Liquid Glass Driving Cockpit -->
  <div class="driving-cockpit-top liquid-glass" id="drivingCockpitTop" style="display:none;">
    <div class="driving-maneuver-row">
      <div class="maneuver-big-badge">
        <i class="fa-solid fa-arrow-turn-up" id="drivingManeuverIcon"></i>
      </div>
      <div class="maneuver-text-col">
        <div class="maneuver-distance" id="drivingDistance">في 350 م</div>
        <div class="maneuver-street" id="drivingStreet">شارع الكرادة داخل</div>
        <div class="maneuver-sub-hint" id="drivingSubHint">
          <i class="fa-solid fa-turn-up" style="font-size:10px;"></i>
          <span id="drivingSubText">ثم اتجه نحو ساحة كهرمانة</span>
        </div>
      </div>
    </div>

    <!-- Lane Guidance Indicators (Google Maps / Waze) -->
    <div class="lane-guidance-bar" id="laneGuidanceBar">
      <div class="lane-box" id="lane0"><i class="fa-solid fa-arrow-up"></i></div>
      <div class="lane-box" id="lane1"><i class="fa-solid fa-arrow-up"></i></div>
      <div class="lane-box highlight" id="lane2"><i class="fa-solid fa-arrow-trend-up"></i></div>
      <div class="lane-advice" id="laneAdvice">الزم المسار الأيمن</div>
    </div>
  </div>

  <!-- Real-time Proximity Hazard Alert Banner -->
  <div class="hazard-alert-banner liquid-glass" id="hazardAlertBanner" style="display:none;">
    <div class="hazard-alert-icon" id="hazardAlertIcon"><i class="fa-solid fa-shield-halved"></i></div>
    <div class="hazard-alert-content">
      <strong id="hazardAlertTitle">سيطرة أمنية بعد 350 متر</strong>
      <small id="hazardAlertSubtitle">خفف السرعة وكن على استعداد للتوقف</small>
    </div>
    <button class="hazard-dismiss-btn" onclick="dismissHazardAlert()"><i class="fa-solid fa-xmark"></i></button>
  </div>

  <!-- Floating Speed & Compass Stack -->
  <div class="driving-speed-stack" id="drivingSpeedStack" style="display:none;">
    <div class="speed-meter-capsule liquid-glass" id="speedMeterCapsule">
      <span class="speed-value" id="drivingSpeedValue">0</span>
      <span class="speed-unit">كم/س</span>
    </div>
    <div class="speed-limit-badge" id="drivingSpeedLimit">60</div>
  </div>

  <!-- Bottom Driving Cockpit Bar -->
  <div class="driving-cockpit-bottom liquid-glass" id="drivingCockpitBottom" style="display:none;">
    <div class="cockpit-stats-row">
      <div class="cockpit-eta-group">
        <span class="cockpit-eta-label">الوصول</span>
        <span class="cockpit-eta-time" id="cockpitEtaTime">--:--</span>
      </div>
      <div class="cockpit-divider"></div>
      <div class="cockpit-stat-pill">
        <i class="fa-solid fa-clock" style="color:var(--ios-green);"></i>
        <span id="cockpitRemainingMin">-- دقيقة</span>
      </div>
      <div class="cockpit-stat-pill">
        <i class="fa-solid fa-route" style="color:var(--ios-blue);"></i>
        <span id="cockpitRemainingDist">-- كم</span>
      </div>
    </div>

    <!-- Thumb-Accessible Driving Controls (Waze Inspired) -->
    <div class="cockpit-actions-row">
      <button class="cockpit-action-btn btn-mute" id="btnAudioToggle" onclick="toggleAudioMute()" title="كتم/تشغيل الصوت">
        <i class="fa-solid fa-volume-high" id="audioIcon"></i>
        <span>الصوت</span>
      </button>

      <button class="cockpit-action-btn btn-hazard-report" onclick="openQuickHazardSheet()" title="إبلاغ سريع عن خطر">
        <i class="fa-solid fa-plus"></i>
        <span>إبلاغ</span>
      </button>

      <button class="cockpit-action-btn btn-share-eta" onclick="shareTripEta()" title="مشاركة الوصول">
        <i class="fa-solid fa-share-nodes"></i>
        <span>مشاركة</span>
      </button>

      <button class="cockpit-action-btn btn-recenter-drive" onclick="recenterDrivingCamera()" title="توسيط الملاحة">
        <i class="fa-solid fa-location-crosshairs"></i>
        <span>توسيط</span>
      </button>

      <button class="cockpit-action-btn btn-stop-drive" onclick="stopNavigationDrive()" title="إنهاء الملاحة">
        <i class="fa-solid fa-xmark"></i>
        <span>إنهاء</span>
      </button>
    </div>
  </div>

  <!-- One-Tap Quick Hazard Reporting Sheet (Accessible while driving) -->
  <div class="apple-modal-overlay" id="quickHazardSheet">
    <div class="apple-modal-sheet liquid-glass">
      <div class="sheet-handle"></div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h3 style="font-weight:800; font-size:18px;"><i class="fa-solid fa-triangle-exclamation" style="color:var(--ios-orange);"></i> إبلاغ مباشر أثناء القيادة</h3>
        <span style="font-size:11px; color:var(--ios-green); font-weight:700;">+50 نقطة كابتن</span>
      </div>
      <p style="font-size:12px; color:var(--ios-text-secondary); margin-bottom:14px;">انقر لتحديث الخارطة فوراً وحماية السائقين خلفك (يُحفظ للأبد):</p>

      <div class="quick-hazard-grid">
        <button class="quick-hazard-tile" onclick="quickReport('checkpoint', 'سيطرة أمنية')">
          <i class="fa-solid fa-shield-halved" style="color:#007aff;"></i>
          <span>سيطرة / تدقيق</span>
        </button>
        <button class="quick-hazard-tile" onclick="quickReport('speed_camera', 'كاميرا مراقبة')">
          <i class="fa-solid fa-camera" style="color:#ff3b30;"></i>
          <span>كاميرا سرعة</span>
        </button>
        <button class="quick-hazard-tile" onclick="quickReport('traffic_jam', 'ازدحام خانق')">
          <i class="fa-solid fa-traffic-light" style="color:#ff9500;"></i>
          <span>ازدحام مروري</span>
        </button>
        <button class="quick-hazard-tile" onclick="quickReport('accident', 'حادث سير')">
          <i class="fa-solid fa-car-burst" style="color:#ff3b30;"></i>
          <span>حادث سير</span>
        </button>
        <button class="quick-hazard-tile" onclick="quickReport('road_work', 'أعمال صيانة')">
          <i class="fa-solid fa-person-digging" style="color:#ffaa00;"></i>
          <span>حفريات وصيانة</span>
        </button>
        <button class="quick-hazard-tile" onclick="quickReport('pothole', 'عائق أو حفرة')">
          <i class="fa-solid fa-triangle-exclamation" style="color:#ff9500;"></i>
          <span>حفرة بالطريق</span>
        </button>
        <button class="quick-hazard-tile" onclick="quickReport('closure', 'طريق مقطوع')">
          <i class="fa-solid fa-ban" style="color:#d70015;"></i>
          <span>طريق مقطوع</span>
        </button>
        <button class="quick-hazard-tile" onclick="quickReport('fuel_update', 'توفر وقود')">
          <i class="fa-solid fa-gas-pump" style="color:#34c759;"></i>
          <span>طابور بنزين</span>
        </button>
      </div>

      <button onclick="closeQuickHazardSheet()" style="width:100%; margin-top:14px; background:transparent; color:var(--ios-text); border:1px solid var(--ios-border); border-radius:14px; padding:12px; font-weight:700; cursor:pointer;">إلغاء</button>
    </div>
  </div>
`;

html = html.replace('<!-- Apple Navigation Driving HUD (Active Drive Mode) -->', drivingCockpitHtml + '\n  <!-- Apple Navigation Driving HUD (Active Drive Mode) -->');

// Audio Engine & Driving Cockpit JS logic
const drivingCockpitJs = `
    // ---------------- High-Fidelity Direction Audio Engine (Apple / Waze) ---------------- //
    let audioCtx = null;
    let isAudioMuted = false;
    let userDriverPoints = 0;
    let driverRank = 'مبتدئ دلدل';

    function getAudioContext() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      return audioCtx;
    }

    // Dual-Tone Harmonic Bell Chime (Apple Maps style 880Hz -> 1175Hz)
    function playManeuverChime() {
      if (isAudioMuted) return;
      try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.exponentialRampToValueAtTime(1175, now + 0.12);

        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.28, now + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.45);

        // Subtle upper harmonic shimmer
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1760, now + 0.03);
        gain2.gain.setValueAtTime(0.06, now + 0.03);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.03);
        osc2.stop(now + 0.35);
      } catch (e) {}
    }

    // Hazard Caution Chime (Pulsed warning tones 660Hz -> 550Hz)
    function playHazardCautionTone() {
      if (isAudioMuted) return;
      try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        [0, 0.16].forEach(offset => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(660, now + offset);
          osc.frequency.linearRampToValueAtTime(550, now + offset + 0.12);
          gain.gain.setValueAtTime(0.22, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.14);
        });
      } catch (e) {}
    }

    // Arrival Major Triad Fanfare (C5 - E5 - G5)
    function playArrivalFanfare() {
      if (isAudioMuted) return;
      try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.09);
          gain.gain.setValueAtTime(0.18, now + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.09);
          osc.stop(now + idx * 0.09 + 0.45);
        });
      } catch (e) {}
    }

    function toggleAudioMute() {
      isAudioMuted = !isAudioMuted;
      const icon = document.getElementById('audioIcon');
      if (icon) {
        icon.className = isAudioMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
        icon.style.color = isAudioMuted ? 'var(--ios-red)' : 'var(--ios-text)';
      }
      showToast(isAudioMuted ? 'تم كتم التوجيه الصوتي' : 'تم تفعيل التوجيه الصوتي');
    }

    function shareTripEta() {
      const eta = document.getElementById('cockpitEtaTime').innerText || 'قريباً';
      const text = \`أنا في طريقي عبر تطبيق دلدل للملاحة. موعد الوصول التقديري: \${eta}.\`;
      if (navigator.share) {
        navigator.share({ title: 'دلدل - مشاركة الوصول', text });
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
        showToast('تم نسخ وقت الوصول إلى الحافظة');
      } else {
        showToast('موعد الوصول: ' + eta);
      }
    }

    function recenterDrivingCamera() {
      if (!userCoords || !map) return;
      map.easeTo({
        center: userCoords,
        zoom: 17.5,
        pitch: 62,
        bearing: currentHeading || 0,
        duration: 800
      });
      showToast('تمت إعادة توسيط الكاميرا');
    }

    function openQuickHazardSheet() {
      document.getElementById('quickHazardSheet').style.display = 'flex';
    }

    function closeQuickHazardSheet() {
      document.getElementById('quickHazardSheet').style.display = 'none';
    }

    async function quickReport(type, label) {
      closeQuickHazardSheet();
      playManeuverChime();
      showToast('تم إرسال بلاغ ' + label + ' - شكراً لمساهمتك!');

      const sid = 'driver-' + (localStorage.getItem('duldul_session_id') || Math.random().toString(36).substring(2, 10));
      localStorage.setItem('duldul_session_id', sid);

      try {
        await fetch('/api/incidents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            name_ar: label + ' (بلاغ قيادة مباشر)',
            lat: userCoords ? userCoords[1] : 33.3152,
            lng: userCoords ? userCoords[0] : 44.3661,
            city: 'العراق',
            sessionId: sid
          })
        });

        // Award driver points permanently
        const res = await fetch('/api/user/contribute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sid,
            pointsEarned: 50,
            actionType: 'report',
            details: { type, label }
          })
        });
        const data = await res.json();
        if (data && data.profile) {
          userDriverPoints = data.profile.points;
          driverRank = data.profile.level;
        }
      } catch (e) {}
    }

    function dismissHazardAlert() {
      document.getElementById('hazardAlertBanner').style.display = 'none';
    }
`;

// Insert the JS logic right above startNavigationDrive
html = html.replace('function startNavigationDrive() {', drivingCockpitJs + '\n    function startNavigationDrive() {');

// Update startNavigationDrive to activate the Waze Cockpit
const newStartNav = `
    function startNavigationDrive() {
      if (!currentPrimaryRoute) return;

      isDrivingActive = true;
      stopFlyThroughPreview();
      getAudioContext();

      document.body.classList.add('in-driving-mode');
      document.getElementById('drivingCockpitTop').style.display = 'flex';
      document.getElementById('drivingCockpitBottom').style.display = 'flex';
      document.getElementById('drivingSpeedStack').style.display = 'flex';
      document.getElementById('appleNavHud').style.display = 'none';
      document.getElementById('speedBadgeHud').style.display = 'none';
      document.getElementById('tripActiveCapsule').style.display = 'none';

      // 3D In-Car Driving Camera Angle
      map.easeTo({
        center: userCoords,
        zoom: 17.5,
        pitch: 62,
        duration: 900
      });

      // Calculate initial arrival clock time
      updateCockpitArrivalMetrics(currentPrimaryRoute.durationMin, currentPrimaryRoute.distanceKm);

      if (currentPrimaryRoute.steps && currentPrimaryRoute.steps.length > 0) {
        const first = currentPrimaryRoute.steps[0];
        updateCockpitManeuver(first, currentPrimaryRoute.steps[1]);
        speakIraqiManeuver(first.instruction, first.distanceMeters);
      }
    }

    function updateCockpitArrivalMetrics(durationMin, distanceKm) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + (durationMin || 20));
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      
      const etaEl = document.getElementById('cockpitEtaTime');
      if (etaEl) etaEl.innerText = hours + ':' + mins;
      
      const minEl = document.getElementById('cockpitRemainingMin');
      if (minEl) minEl.innerText = (durationMin || 20) + ' دقيقة';
      
      const distEl = document.getElementById('cockpitRemainingDist');
      if (distEl) distEl.innerText = (distanceKm || 12) + ' كم';
    }

    function updateCockpitManeuver(step, nextStep) {
      if (!step) return;
      const distEl = document.getElementById('drivingDistance');
      const streetEl = document.getElementById('drivingStreet');
      const iconEl = document.getElementById('drivingManeuverIcon');
      const subTextEl = document.getElementById('drivingSubText');

      if (distEl) distEl.innerText = 'في ' + (step.distanceMeters || 300) + ' م';
      if (streetEl) streetEl.innerText = step.instruction || 'انطلق نحو الوجهة';
      if (subTextEl && nextStep) {
        subTextEl.innerText = 'ثم: ' + nextStep.instruction;
      }

      // Map maneuver to FontAwesome SVG icon
      const inst = (step.instruction || '').toLowerCase();
      if (inst.includes('يمين') || inst.includes('right')) {
        if (iconEl) iconEl.className = 'fa-solid fa-arrow-turn-up';
        updateLaneBoxes('right');
      } else if (inst.includes('يسار') || inst.includes('left')) {
        if (iconEl) iconEl.className = 'fa-solid fa-arrow-turn-down';
        updateLaneBoxes('left');
      } else if (inst.includes('دوران') || inst.includes('u-turn')) {
        if (iconEl) iconEl.className = 'fa-solid fa-rotate-left';
        updateLaneBoxes('left');
      } else {
        if (iconEl) iconEl.className = 'fa-solid fa-arrow-up';
        updateLaneBoxes('center');
      }
    }

    function updateLaneBoxes(dir) {
      const l0 = document.getElementById('lane0');
      const l1 = document.getElementById('lane1');
      const l2 = document.getElementById('lane2');
      const advice = document.getElementById('laneAdvice');

      if (!l0 || !l1 || !l2) return;
      l0.className = 'lane-box';
      l1.className = 'lane-box';
      l2.className = 'lane-box';

      if (dir === 'right') {
        l2.className = 'lane-box highlight';
        if (advice) advice.innerText = 'الزم المسار الأيمن';
      } else if (dir === 'left') {
        l0.className = 'lane-box highlight';
        if (advice) advice.innerText = 'الزم المسار الأيسر';
      } else {
        l1.className = 'lane-box highlight';
        if (advice) advice.innerText = 'تابع السير في المسار الأوسط';
      }
    }
`;

html = html.replace(
  /function startNavigationDrive\(\) \{[\s\S]*?speakIraqiManeuver\(first\.instruction, first\.distanceMeters\);\s*\}\s*\}/,
  newStartNav
);

// Update stopNavigationDrive to exit driving mode cleanly
const newStopNav = `
    function stopNavigationDrive() {
      isDrivingActive = false;
      document.body.classList.remove('in-driving-mode');
      document.getElementById('drivingCockpitTop').style.display = 'none';
      document.getElementById('drivingCockpitBottom').style.display = 'none';
      document.getElementById('drivingSpeedStack').style.display = 'none';
      document.getElementById('hazardAlertBanner').style.display = 'none';

      document.getElementById('appleHeader').style.display = 'flex';
      document.getElementById('appleDrawer').style.display = 'flex';
      document.getElementById('appleNavHud').style.display = 'none';
      document.getElementById('speedBadgeHud').style.display = 'none';
      document.getElementById('tripActiveCapsule').style.display = 'none';

      map.easeTo({ pitch: is3DView ? 48 : 0, duration: 800 });
      window.speechSynthesis && window.speechSynthesis.cancel();
      showToast('تم إنهاء الملاحة');
    }
`;

html = html.replace(
  /function stopNavigationDrive\(\) \{[\s\S]*?window\.speechSynthesis && window\.speechSynthesis\.cancel\(\);\s*\}/,
  newStopNav
);

// Verification of emoji removal
const emojiRegex = /[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
const remaining = html.match(emojiRegex);
console.log('Emojis in updated HTML:', remaining ? remaining.length : 0);
if (remaining) {
  console.log('Found emojis:', [...new Set(remaining)]);
} else {
  console.log('0 emojis found. Clean vector SVG standard met!');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Successfully saved Waze-style Liquid Glass driving cockpit to public/index.html');
