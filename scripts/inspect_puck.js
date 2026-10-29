const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

const idx = html.indexOf('vehicle-puck-container');
console.log(html.slice(idx - 100, idx + 800));
