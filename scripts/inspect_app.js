const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');

console.log('=== INDEX.HTML INSPECTION ===');
console.log('Total characters:', html.length);
console.log('Total lines:', html.split('\n').length);

// Extract all getElementById
const idsDefined = new Set([...html.matchAll(/id=["']([^"']+)["']/g)].map(m => m[1]));
const idsReferenced = [...html.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
const missingIds = [...new Set(idsReferenced.filter(id => !idsDefined.has(id)))];
console.log('\n--- Missing DOM IDs referenced in JS ---');
console.log(missingIds);

// Extract all functions defined vs called in HTML onclick
const onClicks = [...html.matchAll(/onclick=["']([^"']+)["']/g)].map(m => m[1]);
console.log('\n--- OnClick handlers in DOM ---');
console.log([...new Set(onClicks)]);

// Check for duplicated function definitions in index.html
const funcDefs = [...html.matchAll(/function\s+([a-zA-Z0-9_$]+)\s*\(/g)].map(m => m[1]);
const funcCounts = {};
funcDefs.forEach(f => { funcCounts[f] = (funcCounts[f] || 0) + 1; });
const duplicates = Object.entries(funcCounts).filter(([f, c]) => c > 1);
console.log('\n--- Duplicate function definitions ---');
console.log(duplicates);

// Check server endpoints
console.log('\n=== SERVER.JS INSPECTION ===');
const endpoints = [...server.matchAll(/app\.(get|post|put|delete)\(['"]([^'"]+)['"]/g)].map(m => `${m[1].toUpperCase()} ${m[2]}`);
console.log('Registered endpoints:', endpoints);

// Check places count
const placesFile = path.join(root, 'data', 'iraq_places.json');
if (fs.existsSync(placesFile)) {
  const places = JSON.parse(fs.readFileSync(placesFile, 'utf8'));
  console.log('Total places in iraq_places.json:', places.length);
}
