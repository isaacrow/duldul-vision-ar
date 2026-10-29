const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

function reportLoc(keyword) {
  const idx = html.indexOf(keyword);
  console.log(keyword, '=> index:', idx);
}

reportLoc('function calculateRouteTo');
reportLoc('function updateCockpitArrivalMetrics');
reportLoc('function updateCockpitManeuver');
reportLoc('function updateNavigationGuidance');
reportLoc('function startNavigationDrive');
reportLoc('function stopNavigationDrive');
reportLoc('searchInput.addEventListener');
reportLoc('async function openBridgesModal');
reportLoc('gpsWatchId = navigator.geolocation.watchPosition');
