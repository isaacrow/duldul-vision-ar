const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

if (!html.includes('id="trafficOptIn"')) {
  const hiddenFallbacks = `
  <!-- Hidden telemetry & status anchors for zero JS exceptions -->
  <div style="display:none;">
    <input type="checkbox" id="trafficOptIn" checked />
    <span class="location-status" id="locationStatus">بانتظار GPS</span>
    <span id="trafficStatus"></span>
    <div id="trafficLegend"></div>
  </div>
</body>`;

  html = html.replace('</body>', hiddenFallbacks);
  fs.writeFileSync(indexHtmlPath, html, 'utf8');
  console.log('✅ Added fallback anchors for trafficOptIn, locationStatus, trafficStatus, trafficLegend');
}
