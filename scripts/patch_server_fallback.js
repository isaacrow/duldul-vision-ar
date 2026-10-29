const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'server.js');
let content = fs.readFileSync(file, 'utf-8');

const target = `  } catch (err) {
    console.error('OSRM upstream routing error:', err.message);
  }

  // Truthful failure response`;

const replacement = `  } catch (err) {
    console.error('OSRM upstream routing error:', err.message);
  }

  // Strategy C: Autonomous Duldul Pareto Routing Engine (Zero-Latency Local Fallback)
  try {
    duldulEngine.updateBridgeConditions(BAGHDAD_BRIDGES);
    duldulEngine.applyCrowdsourcedIncidents([...incidents, ...wazeReverseEngine.getLiveIncidents()]);
    const duldulRoutes = duldulEngine.findEveryRoute(startLat, startLng, endLat, endLng);
    if (Array.isArray(duldulRoutes) && duldulRoutes.length > 0) {
      duldulRoutes.forEach(applyCommunityTrafficEstimate);
      return res.json({
        status: 'ok',
        provider: 'دلدل (Duldul Autonomous Pareto Routing)',
        profile: 'duldul/car-fastest',
        trafficState: 'live',
        trafficSource: 'Duldul Real-Time Iraqi Road Network & Waze Telemetry',
        routes: duldulRoutes
      });
    }
  } catch (dErr) {
    console.error('Duldul autonomous routing fallback error:', dErr.message);
  }

  // Truthful failure response`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content, 'utf-8');
  console.log('Successfully patched server.js with Duldul fallback routing!');
} else {
  // Normalize \r\n and try
  const normContent = content.replace(/\r\n/g, '\n');
  if (normContent.includes(target)) {
    const updated = normContent.replace(target, replacement);
    fs.writeFileSync(file, updated, 'utf-8');
    console.log('Successfully patched server.js (normalized CRLF)!');
  } else {
    console.error('Target not found in server.js');
  }
}
