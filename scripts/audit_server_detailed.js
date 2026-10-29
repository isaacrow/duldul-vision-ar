const fs = require('fs');
const path = require('path');

const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

const routeMatches = [...server.matchAll(/app\.(get|post|put|delete)\(['"]([^'"]+)['"]/g)];
console.log('--- Express Endpoints in server.js ---');
routeMatches.forEach(m => console.log(m[1].toUpperCase(), m[2]));

// Check data stores and files referenced
const fileMatches = [...server.matchAll(/['"]([^'"]+\.json)['"]/g)].map(m => m[1]);
console.log('\n--- JSON files referenced in server.js ---');
console.log([...new Set(fileMatches)]);

// Check environment variables referenced
const envMatches = [...server.matchAll(/process\.env\.([A-Z0-9_]+)/g)].map(m => m[1]);
console.log('\n--- Environment variables referenced in server.js ---');
console.log([...new Set(envMatches)]);
