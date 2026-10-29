const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'public', 'index.html');
const html = fs.readFileSync(targetPath, 'utf8');

const initMapIdx = html.indexOf('function initMap');
console.log(html.slice(initMapIdx, initMapIdx + 1500));
