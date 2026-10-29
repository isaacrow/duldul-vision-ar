const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

const idx = html.indexOf('gpsWatchId = navigator.geolocation.watchPosition');
console.log(html.slice(idx - 150, idx + 1400));
