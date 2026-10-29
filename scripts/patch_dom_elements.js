const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'public', 'index.html.bak');
let html = fs.readFileSync(srcPath, 'utf8');

console.log('Original length:', html.length);

// 1. Update CSS: Position driving-speed-stack at bottom left above the dock
html = html.replace(
  /\.driving-speed-stack\s*\{[\s\S]*?top:\s*140px;[\s\S]*?\}/,
  `.driving-speed-stack {
      position: absolute;
      bottom: 122px;
      left: 16px;
      z-index: 36;
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      pointer-events: auto;
    }`
);

// 2. Hide lane-guidance-bar by default so fake lanes never show
html = html.replace(
  /\.lane-guidance-bar\s*\{/,
  `.lane-guidance-bar {
      display: none;`
);

// 3. Hide speed limit badge by default so hardcoded 60 never misleads
html = html.replace(
  /\.speed-limit-badge\s*\{[\s\S]*?display:\s*flex;/,
  `.speed-limit-badge {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: 3.5px solid #ff3b30;
      background: #ffffff;
      color: #000000;
      font-weight: 900;
      font-size: 14px;
      display: none;`
);

// 4. Add route-endpoints-box CSS
const endpointsCss = `
    /* Route Origin/Destination Capsule */
    .route-endpoints-box {
      background: rgba(0, 0, 0, 0.03);
      border: 1px solid var(--ios-border);
      border-radius: 16px;
      padding: 10px 14px;
      margin-bottom: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    body.dark-mode .route-endpoints-box {
      background: rgba(255, 255, 255, 0.05);
    }
    .endpoint-item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
    }
    .endpoint-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      color: var(--ios-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .endpoint-action-btn {
      background: rgba(0, 122, 255, 0.1);
      border: none;
      color: var(--ios-blue);
      font-size: 11px;
      font-weight: 700;
      border-radius: 8px;
      padding: 4px 10px;
      cursor: pointer;
      flex-shrink: 0;
    }
    .endpoint-action-btn:hover {
      background: rgba(0, 122, 255, 0.18);
    }
`;

html = html.replace('</style>', endpointsCss + '\n  </style>');

// 5. Update HTML: Replace static placeholders in driving-cockpit-top
html = html.replace(
  /<div class="maneuver-distance" id="drivingDistance">في 350 م<\/div>\s*<div class="maneuver-street" id="drivingStreet">شارع الكرادة داخل<\/div>\s*<div class="maneuver-sub-hint" id="drivingSubHint">\s*<i class="fa-solid fa-turn-up" style="font-size:10px;"><\/i>\s*<span id="drivingSubText">ثم اتجه نحو ساحة كهرمانة<\/span>\s*<\/div>/,
  `<div class="maneuver-distance" id="drivingDistance">--</div>
        <div class="maneuver-street" id="drivingStreet">جارٍ بدء التوجيه...</div>
        <div class="maneuver-sub-hint" id="drivingSubHint" style="display:none;">
          <i class="fa-solid fa-turn-up" style="font-size:10px;"></i>
          <span id="drivingSubText"></span>
        </div>`
);

// 6. Update HTML: Remove hardcoded 60 in drivingSpeedLimit
html = html.replace(
  /<div class="speed-limit-badge" id="drivingSpeedLimit">60<\/div>/,
  `<div class="speed-limit-badge" id="drivingSpeedLimit" style="display:none;">--</div>`
);

// 7. Update HTML: Insert route-endpoints-box inside bottomSheetCard before drawer-content-row
const endpointsHtml = `
      <!-- Route Endpoints (Origin & Destination) -->
      <div class="route-endpoints-box" id="routeEndpointsBox" style="display:none;">
        <div class="endpoint-item-row">
          <div class="endpoint-badge">
            <i class="fa-solid fa-circle-dot" style="color:var(--ios-blue); font-size:12px;"></i>
            <span id="endpointOriginLabel">موقعي الحالي</span>
          </div>
          <button class="endpoint-action-btn" onclick="playHapticClick(); toggleOriginSelector()" id="btnToggleOrigin">تغيير نقطة البداية</button>
        </div>
        <div style="border-top:1px dashed var(--ios-border); margin:2px 0;"></div>
        <div class="endpoint-item-row">
          <div class="endpoint-badge">
            <i class="fa-solid fa-location-dot" style="color:var(--ios-red); font-size:12px;"></i>
            <span id="endpointDestLabel">انقر لتحديد وجهة</span>
          </div>
          <span style="font-size:11px; color:var(--ios-text-secondary);" id="endpointDistanceLabel">-- كم</span>
        </div>
      </div>
`;

html = html.replace(
  '<!-- Route Details (Appears when destination is picked) -->',
  endpointsHtml + '\n      <!-- Route Details (Appears when destination is picked) -->'
);

// Write intermediate to test
fs.writeFileSync(path.join(__dirname, '..', 'public', 'index.html'), html, 'utf8');
console.log('Applied CSS and HTML enhancements. New length:', html.length);
