const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(targetPath, 'utf8');

// Replace any remaining getElementById('drivingManeuverIcon')
html = html.replace(/const iconEl = document\.getElementById\('drivingManeuverIcon'\);[\s\S]*?iconEl\.style\.transform = 'none';\s*\}\s*\}/, '');

// Replace any remaining getElementById('laneGuidanceBar')
html = html.replace(/const laneBar = document\.getElementById\('laneGuidanceBar'\);[\s\S]*?laneBar\.style\.display = 'none';\s*\}\s*\}/, '');

// Replace any remaining getElementById('hazardAlertBanner')
html = html.replace(/document\.getElementById\('hazardAlertBanner'\)\.style\.display = 'none';/g, '');

fs.writeFileSync(targetPath, html, 'utf8');
console.log('Cleaned leftover obsolete getElementById references.');
