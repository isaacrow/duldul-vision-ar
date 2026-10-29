const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(targetPath, 'utf8');

console.log('Original length:', html.length);

// 1. Remove the ugly contribution panel completely
const contribRegex = /<div class="contribution-panel">[\s\S]*?<\/div>\s*<\/div>/;
if (contribRegex.test(html)) {
  html = html.replace(contribRegex, '</div>');
  console.log('Removed contribution-panel!');
} else {
  // Try alternative match
  const cIdx = html.indexOf('<div class="contribution-panel">');
  if (cIdx !== -1) {
    const endIdx = html.indexOf('</div>', html.indexOf('</p>', cIdx));
    html = html.slice(0, cIdx) + html.slice(endIdx + 6);
    console.log('Removed contribution-panel via slice!');
  }
}

// 2. Remove trafficStatus banner under search categories
html = html.replace(
  /<div class="traffic-status" id="trafficStatus" role="status">[\s\S]*?<\/div>\s*<div class="traffic-legend" id="trafficLegend" style="display:none;">[\s\S]*?<\/div>/,
  ''
);

// 3. Add Waze Cockpit Styles
const wazeCss = `
    /* ==========================================================================
       WAZE-GRADE 3D IMMERSIVE NAVIGATION COCKPIT & ROAD TRACKING
       ========================================================================== */
    .waze-cockpit-top {
      position: absolute;
      top: 14px;
      left: 14px;
      right: 14px;
      max-width: 520px;
      margin: 0 auto;
      z-index: 40;
      background: rgba(14, 17, 24, 0.96);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 22px;
      padding: 12px 18px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(24px);
      animation: slideDownIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      display: none;
    }
    .waze-maneuver-row {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .waze-turn-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .waze-maneuver-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1px;
      overflow: hidden;
    }
    .waze-distance-big {
      font-size: 26px;
      font-weight: 900;
      color: #ffffff;
      line-height: 1.1;
      font-family: -apple-system, BlinkMacSystemFont, "Cairo", sans-serif;
    }
    .waze-street-name {
      font-size: 14px;
      font-weight: 700;
      color: #e2e8f0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .waze-sub-hint {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .waze-then-badge {
      font-size: 9px;
      font-weight: 800;
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
      padding: 1px 5px;
      border-radius: 5px;
    }

    /* Floating Re-center Button (Waze Auto Re-adjust) */
    .waze-recenter-btn {
      position: absolute;
      bottom: 96px;
      right: 16px;
      z-index: 38;
      background: rgba(14, 17, 24, 0.94);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 24px;
      padding: 10px 18px;
      font-weight: 700;
      font-size: 13px;
      display: none;
      align-items: center;
      gap: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      cursor: pointer;
      animation: fadeIn 0.25s ease;
    }
    .waze-recenter-btn:hover {
      background: rgba(30, 35, 48, 0.98);
    }

    /* Waze Bottom Navigation Dock */
    .waze-cockpit-bottom {
      position: absolute;
      bottom: 16px;
      left: 14px;
      right: 14px;
      max-width: 520px;
      margin: 0 auto;
      z-index: 40;
      background: rgba(14, 17, 24, 0.96);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 24px;
      padding: 10px 16px;
      display: none;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(24px);
      animation: slideUpIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .waze-speed-pill {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      line-height: 1;
    }
    .waze-speed-val {
      font-size: 18px;
      font-weight: 900;
      color: #00e5ff;
    }
    .waze-speed-unit {
      font-size: 8px;
      color: #94a3b8;
      font-weight: 700;
      margin-top: 2px;
    }
    .waze-stats-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .waze-eta-time {
      font-size: 20px;
      font-weight: 900;
      color: #34c759;
      line-height: 1.1;
    }
    .waze-eta-sub {
      font-size: 11px;
      color: #cbd5e1;
      font-weight: 700;
      margin-top: 2px;
    }
    .waze-actions-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .waze-btn-icon {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      cursor: pointer;
    }
    .waze-btn-icon.btn-hazard {
      background: #ff9500;
      border-color: #ffaa33;
      color: #ffffff;
      font-size: 16px;
    }
    .waze-btn-stop {
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(255, 59, 48, 0.18);
      border: 1px solid rgba(255, 59, 48, 0.4);
      color: #ff453a;
      border-radius: 18px;
      padding: 8px 12px;
      font-weight: 800;
      font-size: 12px;
      cursor: pointer;
    }

    /* 3D Isometric Cyan Waze Vehicle Puck */
    .waze-puck-container {
      position: relative;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    .waze-puck-beam {
      position: absolute;
      top: -26px;
      width: 0;
      height: 0;
      border-left: 16px solid transparent;
      border-right: 16px solid transparent;
      border-bottom: 36px solid rgba(0, 229, 255, 0.28);
      filter: blur(4px);
    }
    .waze-puck-shadow {
      position: absolute;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.5);
      filter: blur(5px);
      transform: translateY(6px);
    }
    .waze-puck-svg {
      position: relative;
      width: 40px;
      height: 40px;
      filter: drop-shadow(0 4px 10px rgba(0, 229, 255, 0.5));
    }
`;

html = html.replace('</style>', wazeCss + '\n  </style>');

// 4. Replace old driving-cockpit HTML with Waze Cockpit Markup
const oldCockpitMarkupRegex = /<!-- Dedicated Waze-Style Apple Liquid Glass Driving Cockpit -->[\s\S]*?<!-- Bottom Driving Cockpit Bar -->[\s\S]*?<\/div>\s*<\/div>/;

const newWazeCockpitHtml = `<!-- Dedicated Waze-Style 3D Driving Cockpit Top HUD (Dark Glass) -->
  <div class="waze-cockpit-top" id="drivingCockpitTop" style="display:none;">
    <div class="waze-maneuver-row">
      <div class="waze-turn-icon-wrap" id="drivingManeuverIconWrap">
        <svg id="wazeManeuverSvg" width="32" height="32" viewBox="0 0 36 36" fill="none">
          <path d="M12 28V16C12 11.5817 15.5817 8 20 8H26" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M21 3L27 8L21 13" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="waze-maneuver-info">
        <div class="waze-distance-big" id="drivingDistance">310 م</div>
        <div class="waze-street-name" id="drivingStreet">شارع 40</div>
        <div class="waze-sub-hint" id="drivingSubHint" style="display:none;">
          <span class="waze-then-badge">ثم</span>
          <span id="drivingSubText">واصل السير للأمام</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Floating Re-center Button (Waze Auto Re-adjust) -->
  <button class="waze-recenter-btn" id="btnWazeRecenter" onclick="playHapticClick(); lockCameraToDriving(true)">
    <i class="fa-solid fa-crosshairs"></i>
    <span>إعادة التوسيط</span>
  </button>

  <!-- Dedicated Waze-Style Bottom Navigation Dock (Dark Glass) -->
  <div class="waze-cockpit-bottom" id="drivingCockpitBottom" style="display:none;">
    <div class="waze-speed-pill">
      <span class="waze-speed-val" id="drivingSpeedValue">45</span>
      <span class="waze-speed-unit">كم/س</span>
    </div>

    <div class="waze-stats-center">
      <div class="waze-eta-time" id="cockpitEtaTime">23:59</div>
      <div class="waze-eta-sub">
        <span id="cockpitRemainingDist">7.5 كم</span> • <span id="cockpitRemainingMin">9 دقيقة</span>
      </div>
    </div>

    <div class="waze-actions-group">
      <button class="waze-btn-icon btn-hazard" onclick="playHapticClick(); openQuickHazardSheet()" title="إبلاغ مباشر">
        <i class="fa-solid fa-plus"></i>
      </button>
      <button class="waze-btn-icon" id="btnAudioToggle" onclick="playHapticClick(); toggleAudioMute()" title="كتم/تشغيل الصوت">
        <i class="fa-solid fa-volume-high" id="audioIcon"></i>
      </button>
      <button class="waze-btn-stop" onclick="playHapticClick(); stopNavigationDrive()" title="إنهاء الرحلة">
        <i class="fa-solid fa-xmark"></i>
        <span>إنهاء</span>
      </button>
    </div>
  </div>`;

if (oldCockpitMarkupRegex.test(html)) {
  html = html.replace(oldCockpitMarkupRegex, newWazeCockpitHtml);
  console.log('Replaced cockpit markup with Waze markup!');
} else {
  console.warn('oldCockpitMarkupRegex did not match directly, searching for drivingCockpitTop...');
  const topIdx = html.indexOf('<div class="driving-cockpit-top');
  const btmEndIdx = html.indexOf('</div>', html.indexOf('id="drivingCockpitBottom"'));
  if (topIdx !== -1 && btmEndIdx !== -1) {
    const fullEnd = html.indexOf('</div>', btmEndIdx + 6) + 6;
    html = html.slice(0, topIdx) + newWazeCockpitHtml + html.slice(fullEnd);
    console.log('Replaced cockpit markup via slice!');
  }
}

// 5. Replace Vehicle Puck Creation with Waze 3D Isometric Cyan Arrowhead
const oldPuckRegex = /const el = document\.createElement\('div'\);\s*el\.className = 'vehicle-puck';\s*el\.innerHTML = '<i class="fa-solid fa-location-arrow"><\/i>';\s*vehicleMarker = new maplibregl\.Marker\(\{ element: el, rotationAlignment: 'map' \}\);/;

const newWazePuck = `const el = document.createElement('div');
        el.className = 'waze-puck-container';
        el.innerHTML = \`
          <div class="waze-puck-beam"></div>
          <div class="waze-puck-shadow"></div>
          <svg class="waze-puck-svg" viewBox="0 0 42 42" fill="none">
            <polygon points="21,5 37,35 21,28 5,35" fill="#0099cc" />
            <polygon points="21,3 36,33 21,26 6,33" fill="#00e5ff" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round" />
            <circle cx="21" cy="20" r="3" fill="#ffffff" />
          </svg>
        \`;
        vehicleMarker = new maplibregl.Marker({ element: el, rotationAlignment: 'map' });`;

if (oldPuckRegex.test(html)) {
  html = html.replace(oldPuckRegex, newWazePuck);
  console.log('Replaced vehicle puck with Waze 3D cyan arrowhead!');
} else {
  console.warn('oldPuckRegex did not match directly!');
}

// 6. Update Route Line to Glowing Waze Cyan Ribbon
html = html.replace(
  `paint: { 'line-color': '#007aff', 'line-width': 14, 'line-opacity': 0.38, 'line-blur': 3 }`,
  `paint: { 'line-color': '#0088cc', 'line-width': 16, 'line-opacity': 0.45, 'line-blur': 3 }`
);
html = html.replace(
  `paint: { 'line-color': '#007aff', 'line-width': 7 }`,
  `paint: { 'line-color': '#00e5ff', 'line-width': 8 }`
);

fs.writeFileSync(targetPath, html, 'utf8');
console.log('Saved intermediate Waze UI changes. Length:', html.length);
