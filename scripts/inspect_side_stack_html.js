const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

const idx = html.indexOf('<div class="apple-side-stack">');
console.log(html.slice(idx - 20, idx + 800));
