const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'public', 'index.html');
const html = fs.readFileSync(targetPath, 'utf8');

const idx = html.indexOf('const response = await fetch(\'/api/route');
console.log(html.slice(idx, idx + 1800));
