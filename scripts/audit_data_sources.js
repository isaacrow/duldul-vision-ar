const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');

console.log('=== CHECKING FOR HARDCODED MOCKS / FAKE DATA ===');

// Check BAGHDAD_BRIDGES in server.js
const bridgesMatch = server.match(/const BAGHDAD_BRIDGES = \[([\s\S]*?)\];/);
if (bridgesMatch) {
  console.log('--- BAGHDAD_BRIDGES ---');
  console.log(bridgesMatch[0].substring(0, 500) + '...');
}

// Check FUEL_STATIONS in server.js
const fuelMatch = server.match(/const VERIFIED_FUEL_STATIONS = \[([\s\S]*?)\];/);
if (fuelMatch) {
  console.log('--- FUEL_STATIONS ---');
  console.log(fuelMatch[0].substring(0, 500) + '...');
}

// Check how traffic data is generated
console.log('--- TRAFFIC ENDPOINT ---');
const trafficEndpoint = server.match(/app\.get\('\/api\/traffic'[\s\S]*?\}\);/);
if (trafficEndpoint) {
  console.log(trafficEndpoint[0]);
}

// Check demo scenarios
console.log('--- DEMO SCENARIOS ---');
const demoEndpoint = server.match(/app\.get\('\/api\/demo\/scenarios'[\s\S]*?\}\);/);
if (demoEndpoint) {
  console.log(demoEndpoint[0]);
}

// Check offline packs
console.log('--- OFFLINE PACKS ---');
const offlineEndpoint = server.match(/app\.get\('\/api\/offline\/packs'[\s\S]*?\}\);/);
if (offlineEndpoint) {
  console.log(offlineEndpoint[0]);
}
