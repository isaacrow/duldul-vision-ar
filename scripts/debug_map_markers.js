const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'public', 'index.html');
const html = fs.readFileSync(targetPath, 'utf8');

const idx = html.indexOf("vehicleMarker = new maplibregl.Marker");
console.log(html.slice(idx, idx + 1800));
