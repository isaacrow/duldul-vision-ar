const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

const idx = html.indexOf('async function openBridgesModal');
console.log(html.slice(idx, idx + 1400));
