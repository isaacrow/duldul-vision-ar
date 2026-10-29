const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

const idx = html.indexOf('function startNavigationDrive');
console.log(html.slice(idx, idx + 2000));
