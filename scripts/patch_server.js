const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, '..', 'server.js');
let code = fs.readFileSync(serverFile, 'utf8');

// 1. Ensure AiPlacesEngine is imported
if (!code.includes('AiPlacesEngine')) {
  code = code.replace(
    "const { ViterbiMapMatcher } = require('./routing-engine/viterbi_matcher');",
    "const { ViterbiMapMatcher } = require('./routing-engine/viterbi_matcher');\nconst { AiPlacesEngine } = require('./routing-engine/ai_places_engine');\nconst aiPlacesEngine = new AiPlacesEngine();"
  );
}

// 2. Replace /api/places implementation
const oldPlacesRegex = /\/\/ Search Places & POIs \(Verified Civic Data Only\)[\s\S]*?app\.get\('\/api\/places'[\s\S]*?return res\.json\(results\.slice\(0, 20\)\);\s*\}\);/;

const newPlacesCode = `// Search Places & POIs (AI-Powered Multi-Source Geocoding Engine)
app.get('/api/places', async (req, res) => {
  const q = req.query.q || '';
  const lat = req.query.lat ? parseFloat(req.query.lat) : null;
  const lng = req.query.lng ? parseFloat(req.query.lng) : null;
  const limit = req.query.limit ? Math.min(50, parseInt(req.query.limit, 10)) : 20;

  try {
    const results = await aiPlacesEngine.search(q, lat, lng, limit);
    return res.json(results);
  } catch (err) {
    console.error('Error in /api/places:', err.message);
    return res.json(aiPlacesEngine.places.slice(0, 15));
  }
});

// Dedicated AI Search Endpoint with Semantic Diagnostics
app.get('/api/places/ai-search', async (req, res) => {
  const q = req.query.q || '';
  const lat = req.query.lat ? parseFloat(req.query.lat) : null;
  const lng = req.query.lng ? parseFloat(req.query.lng) : null;
  const startTime = performance.now();
  
  const results = await aiPlacesEngine.search(q, lat, lng, 25);
  const latencyMs = Number((performance.now() - startTime).toFixed(1));
  
  res.json({
    status: 'ok',
    query: q,
    latencyMs,
    totalResults: results.length,
    coverage: 'Republic of Iraq',
    places: results
  });
});`;

if (oldPlacesRegex.test(code)) {
  code = code.replace(oldPlacesRegex, newPlacesCode);
  console.log('✅ Successfully patched /api/places with AiPlacesEngine');
} else {
  console.log('⚠️ oldPlacesRegex did not match directly, checking fallback...');
  // Manual string search
  const idx = code.indexOf("app.get('/api/places'");
  if (idx !== -1) {
    const endIdx = code.indexOf("app.get('/api/route'", idx);
    if (endIdx !== -1) {
      code = code.slice(0, idx) + newPlacesCode + '\n\n' + code.slice(endIdx);
      console.log('✅ Fallback slice replacement for /api/places succeeded');
    }
  }
}

// 3. Integrate DuldulEngine as Strategy C in /api/route before 503
const fallbackTarget = `  // Truthful failure response
  return res.status(503).json({`;

const duldulStrategy = `  // Strategy C: Duldul Autonomous Multi-Criterion Pareto Engine (Zero-Cost & Offline Reliable)
  try {
    duldulEngine.updateBridgeConditions(BAGHDAD_BRIDGES);
    duldulEngine.applyCrowdsourcedIncidents(incidents);
    const duldulRoutes = duldulEngine.findEveryRoute(startLat, startLng, endLat, endLng);
    if (Array.isArray(duldulRoutes) && duldulRoutes.length > 0) {
      duldulRoutes.forEach(applyCommunityTrafficEstimate);
      const hasCommunityEstimate = duldulRoutes.some(route => route.communityTraffic && route.communityTraffic.applied);
      return res.json({
        status: 'ok',
        provider: 'محرك دلدل المستقل (Duldul Engine)',
        profile: 'duldul/multi-criterion-pareto',
        trafficState: hasCommunityEstimate ? 'community_estimate' : 'live_bridges_and_incidents',
        trafficSource: hasCommunityEstimate
          ? 'Aggregated opted-in community speeds'
          : 'مؤشرات جسور بغداد وبلاغات الطرق المباشرة',
        routes: duldulRoutes
      });
    }
  } catch (dErr) {
    console.warn('Duldul graph engine fallback notice:', dErr.message);
  }

  // Truthful failure response
  return res.status(503).json({`;

if (code.includes(fallbackTarget) && !code.includes('Strategy C: Duldul Autonomous Multi-Criterion Pareto Engine')) {
  code = code.replace(fallbackTarget, duldulStrategy);
  console.log('✅ Successfully integrated Strategy C (DuldulEngine) into /api/route');
}

fs.writeFileSync(serverFile, code, 'utf8');
console.log('🎉 server.js updated successfully!');
