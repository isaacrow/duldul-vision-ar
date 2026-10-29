const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(targetPath, 'utf8');

// 1. Re-insert routeEndpointsBox inside bottomSheetCard before routeLoadingBox
const endpointsBoxHtml = `
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

if (!html.includes('id="routeEndpointsBox"')) {
  html = html.replace('<!-- Route Loading State -->', endpointsBoxHtml + '\n      <!-- Route Loading State -->');
  console.log('Restored routeEndpointsBox in HTML!');
}

// 2. Remove obsolete updateLaneBoxes function
html = html.replace(/function updateLaneBoxes[\s\S]*?advice\.innerText = 'تابع السير في المسار الأوسط';\s*\}\s*\}/, '');

// 3. Fix loadTrafficSignals to not expect trafficStatus and trafficLegend elements
html = html.replace(
  /document\.getElementById\('trafficStatus'\)\.textContent = features\.length[\s\S]*?document\.getElementById\('trafficLegend'\)\.style\.display = features\.length \? 'flex' : 'none';/,
  `const statusEl = document.getElementById('trafficStatus');
        if (statusEl) statusEl.textContent = features.length ? 'إشارات مجتمعية: ' + features.length : '';
        const legendEl = document.getElementById('trafficLegend');
        if (legendEl) legendEl.style.display = features.length ? 'flex' : 'none';`
);

// 4. Fix initTrafficConsent to safely guard trafficOptIn
html = html.replace(
  /function initTrafficConsent\(\)\s*\{[\s\S]*?optIn\.addEventListener\('change',[\s\S]*?\}\s*\}/,
  `function initTrafficConsent() {
      const optIn = document.getElementById('trafficOptIn');
      if (optIn) {
        optIn.checked = hasExplicitTrafficConsent();
        optIn.addEventListener('change', () => {
          localStorage.setItem(CONSENT_KEY, optIn.checked ? 'true' : 'false');
        });
      }
    }`
);

// 5. Clean checkNearbyHazards to use showToast / Audio rather than missing hazardAlertBanner
html = html.replace(
  /const banner = document\.getElementById\('hazardAlertBanner'\);[\s\S]*?setTimeout\(\(\) => \{ banner\.style\.display = 'none'; \}, 9000\);\s*\}\s*break;/,
  `playStudioVoice('checkpoint');
          showToast('تنبيه أمان: خطر على بعد ' + Math.round(distKm * 1000) + ' متر (خفف السرعة)');
          break;`
);

fs.writeFileSync(targetPath, html, 'utf8');
console.log('Repairs complete. Total file length:', html.length);
