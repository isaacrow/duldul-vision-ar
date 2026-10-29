const fs = require('fs');
const path = require('path');

const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

const endpoints = [
  '/api/config',
  '/api/health',
  '/api/bridges',
  '/api/fuel',
  '/api/telemetry/ping',
  '/api/traffic',
  '/api/incidents',
  '/api/places',
  '/api/route',
  '/api/offline/packs',
  '/api/offline/pack/:id/download',
  '/api/viterbi/match',
  '/api/engine/stats',
  '/api/demo/scenarios'
];

endpoints.forEach(ep => {
  const idx = server.indexOf(ep);
  if (idx !== -1) {
    console.log(`\n================= ${ep} =================`);
    console.log(server.slice(idx, idx + 450).trim());
  } else {
    console.log(`\n================= ${ep} (NOT FOUND) =================`);
  }
});
