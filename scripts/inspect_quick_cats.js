const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

const idx = html.indexOf('quickCategories');
console.log(html.slice(idx - 50, idx + 800));
