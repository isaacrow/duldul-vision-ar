const fs = require('fs');
const path = require('path');

const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

const idx = server.indexOf("app.post('/api/incidents'");
console.log(server.slice(idx, idx + 1000));
