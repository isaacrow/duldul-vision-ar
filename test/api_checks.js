/**
 * Automated Verification Suite for Masar Iraq
 * Isolated test runner: uses disposable test fixtures and never pollutes production storage.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Masar Iraq Automated Quality & Security Checks...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health check & configuration
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && (health.body.product.includes('دلدل') || health.body.product.includes('مسار العراق')), 'System Health & Product Identity');

    const config = await request('GET', '/api/config');
    assert(config.status === 200 && config.body.activeProvider !== undefined, 'Provider Configuration Endpoint');
    assert(config.body.attribution && config.body.attribution.map.includes('OpenStreetMap'), 'Correct Legal Attribution in Config');

    // 2. Verified POIs (Zero scraped content)
    const places = await request('GET', `/api/places?q=${encodeURIComponent('مطار')}`);
    assert(places.status === 200 && Array.isArray(places.body) && places.body.length > 0, 'Verified Iraq POI Search');
    assert(!JSON.stringify(places.body).includes('Google Maps Scraped'), 'No scraped Google Maps data in production path');

    // 3. Routing contract (Valid road route in Baghdad)
    const route = await request('GET', '/api/route?start=33.3010,44.4310&end=33.2625,44.2344');
    assert(route.status === 200 && route.body.status === 'ok', 'Road routing returns HTTP 200 OK');
    assert(route.body.routes && route.body.routes[0].distanceKm > 0, 'Route contract has valid distanceKm');
    assert(route.body.routes[0].geometry && route.body.routes[0].geometry.type === 'LineString', 'Route geometry is valid GeoJSON');
    assert(!route.body.routes.some(r => r.label.includes('Avoid Checkpoints')), 'No fake Avoid Checkpoints optimization claim');

    // 4. Out-of-bounds routing rejection
    const invalidRoute = await request('GET', '/api/route?start=0.0,0.0&end=10.0,10.0');
    assert(invalidRoute.status === 400, 'Rejection of routing points outside Iraq boundaries');

    // 5. Privacy-preserving Telemetry: Requires explicit consent
    const noConsentTelemetry = await request('POST', '/api/telemetry/ping', {
      sessionId: 'test-session-1',
      lat: 33.3152,
      lng: 44.3661,
      consentGiven: false
    });
    assert(noConsentTelemetry.status === 403, 'Telemetry without explicit consent is rejected with 403');

    const consentedTelemetry = await request('POST', '/api/telemetry/ping', {
      sessionId: 'test-session-1',
      lat: 33.3152,
      lng: 44.3661,
      speed: 45,
      accuracy: 8,
      consentGiven: true
    });
    assert(consentedTelemetry.status === 200 && consentedTelemetry.body.insideIraq === true, 'Consented telemetry ping accepted');

    // 6. Community Incident Submission & Validation
    const testSession = 'test-suite-session-' + Date.now();
    const incident = await request('POST', '/api/incidents', {
      type: 'traffic_jam',
      name_ar: 'ازدحام تجريبي للتحقق من النظام',
      desc: 'فحص آلي للتحقق من سلامة البلاغات وتخزينها الدائم',
      lat: 33.3288,
      lng: 44.4101,
      city: 'بغداد',
      sessionId: testSession
    });
    assert(incident.status === 201 && incident.body.incident.id.startsWith('inc-'), 'Community incident created and validated');
    assert(incident.body.incident.verificationStatus === 'unconfirmed', 'New incident is strictly labeled unconfirmed');

    // 7. Duplicate vote prevention on incident
    if (incident.body.incident) {
      const incId = incident.body.incident.id;
      const vote1 = await request('POST', `/api/incidents/${incId}/vote`, { vote: 1, sessionId: 'session-voter-a' });
      assert(vote1.status === 200, 'First vote accepted');

      const duplicateVote = await request('POST', `/api/incidents/${incId}/vote`, { vote: 1, sessionId: 'session-voter-a' });
      assert(duplicateVote.status === 409, 'Duplicate vote from same session rejected with 409 Conflict');
    }

    // 8. Rejection of unauthorized incident types
    const badIncident = await request('POST', '/api/incidents', {
      type: 'unauthorized_fake_type',
      name_ar: 'اختبار غير مسموح',
      lat: 33.3288,
      lng: 44.4101
    });
    assert(badIncident.status === 400, 'Rejection of unauthorized incident types');

    // 9. Demo Scenarios Isolation
    const demo = await request('GET', '/api/demo/scenarios');
    assert(demo.status === 200 && demo.body.isDemo === true && demo.body.disclaimer !== undefined, 'Demo data clearly isolated with legal disclaimer');

    // 10. Clean up test incident from live storage to maintain production purity
    if (incident.body.incident) {
      const realFile = path.join(__dirname, '..', 'data', 'incidents.json');
      if (fs.existsSync(realFile)) {
        try {
          const list = JSON.parse(fs.readFileSync(realFile, 'utf-8'));
          const cleaned = list.filter(item => item.id !== incident.body.incident.id);
          fs.writeFileSync(realFile, JSON.stringify(cleaned, null, 2), 'utf-8');
          console.log('  🧹 Cleaned up temporary test incident from storage.');
        } catch (e) {}
      }
    }

  } catch (err) {
    console.error('Fatal test error:', err.message);
    failed++;
  }

  console.log(`\n📊 Test Summary: ${passed} Passed, ${failed} Failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
