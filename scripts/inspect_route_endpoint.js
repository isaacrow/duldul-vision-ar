const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const lines = code.split('\n');
const startIdx = lines.findIndex(l => l.includes("app.get('/api/route'"));
console.log('Route endpoint start line:', startIdx + 1);
console.log(lines.slice(startIdx, startIdx + 100).join('\n'));
