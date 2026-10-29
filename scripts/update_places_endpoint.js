const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, '..', 'server.js');
let s = fs.readFileSync(serverFile, 'utf8');

const targetStr = "app.get('/api/places', (req, res) => {";

const replacementStr = `// Search Places & POIs (Verified Civic Data + Google/Waze/Facebook Hotspots)
const PLACES_DB_FILE = path.join(DATA_DIR, 'iraq_places.json');
let ALL_IRAQ_PLACES = VERIFIED_IRAQ_POIS;
try {
  if (fs.existsSync(PLACES_DB_FILE)) {
    const rawPlaces = JSON.parse(fs.readFileSync(PLACES_DB_FILE, 'utf-8'));
    if (Array.isArray(rawPlaces) && rawPlaces.length > 0) {
      ALL_IRAQ_PLACES = rawPlaces;
    }
  }
} catch (e) {}

app.get('/api/places', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  if (!q) {
    return res.json(ALL_IRAQ_PLACES.slice(0, 15));
  }

  const results = ALL_IRAQ_PLACES.filter(p =>
    (p.name && p.name.toLowerCase().includes(q)) ||
    (p.name_en && p.name_en.toLowerCase().includes(q)) ||
    (p.city && p.city.toLowerCase().includes(q)) ||
    (p.category && p.category.toLowerCase().includes(q))
  );

  return res.json(results.slice(0, 20));
});

function _old_places(req, res) {`;

s = s.replace(targetStr, replacementStr);

fs.writeFileSync(serverFile, s, 'utf8');
console.log('Successfully updated places endpoint in server.js');
