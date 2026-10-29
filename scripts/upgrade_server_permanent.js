const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, '..', 'server.js');
let code = fs.readFileSync(serverFile, 'utf8');

// 1. Permanent data storage paths
const storageHeader = `
const PERMANENT_INCIDENTS_ARCHIVE = path.join(DATA_DIR, 'crowdsourced_incidents_forever.json');
const PERMANENT_TRAFFIC_ARCHIVE = path.join(DATA_DIR, 'permanent_traffic_histograms.json');
const DRIVER_CONTRIBUTIONS_FILE = path.join(DATA_DIR, 'user_contributions_forever.json');

function savePermanentIncident(inc) {
  try {
    let list = [];
    if (fs.existsSync(PERMANENT_INCIDENTS_ARCHIVE)) {
      list = JSON.parse(fs.readFileSync(PERMANENT_INCIDENTS_ARCHIVE, 'utf-8'));
    }
    const idx = list.findIndex(item => item.id === inc.id);
    if (idx >= 0) {
      list[idx] = inc;
    } else {
      list.push(inc);
    }
    fs.writeFileSync(PERMANENT_INCIDENTS_ARCHIVE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving permanent incident archive:', e.message);
  }
}

function recordUserContribution(sessionId, points, actionType, details) {
  try {
    let profiles = {};
    if (fs.existsSync(DRIVER_CONTRIBUTIONS_FILE)) {
      profiles = JSON.parse(fs.readFileSync(DRIVER_CONTRIBUTIONS_FILE, 'utf-8'));
    }
    if (!profiles[sessionId]) {
      profiles[sessionId] = {
        sessionId,
        points: 0,
        reportsCount: 0,
        votesCount: 0,
        distanceTraveledKm: 0,
        level: 'مبتدئ دلدل',
        levelCode: 'rookie',
        firstSeen: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        history: []
      };
    }
    const p = profiles[sessionId];
    p.points += (points || 10);
    p.lastActive = new Date().toISOString();
    if (actionType === 'report') p.reportsCount++;
    if (actionType === 'vote') p.votesCount++;
    if (actionType === 'distance' && details && details.km) p.distanceTraveledKm += Number(details.km);

    // Dynamic Rank Computation
    if (p.points >= 1500) {
      p.level = 'أسطورة دلدل';
      p.levelCode = 'legend';
    } else if (p.points >= 500) {
      p.level = 'صقر الشوارع';
      p.levelCode = 'hawk';
    } else if (p.points >= 100) {
      p.level = 'كابتن الطريق';
      p.levelCode = 'captain';
    } else {
      p.level = 'مبتدئ دلدل';
      p.levelCode = 'rookie';
    }

    p.history.unshift({
      actionType,
      points,
      details: details || {},
      timestamp: new Date().toISOString()
    });
    if (p.history.length > 50) p.history.pop();

    fs.writeFileSync(DRIVER_CONTRIBUTIONS_FILE, JSON.stringify(profiles, null, 2), 'utf-8');
    return p;
  } catch (e) {
    return { points, level: 'كابتن دلدل' };
  }
}

function getUserProfile(sessionId) {
  try {
    if (fs.existsSync(DRIVER_CONTRIBUTIONS_FILE)) {
      const profiles = JSON.parse(fs.readFileSync(DRIVER_CONTRIBUTIONS_FILE, 'utf-8'));
      if (profiles[sessionId]) return profiles[sessionId];
    }
  } catch (e) {}
  return {
    sessionId,
    points: 0,
    reportsCount: 0,
    votesCount: 0,
    distanceTraveledKm: 0,
    level: 'مبتدئ دلدل',
    levelCode: 'rookie',
    firstSeen: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    history: []
  };
}
`;

code = code.replace(
  "const DEMO_FILE = path.join(DATA_DIR, 'demo_incidents.json');",
  "const DEMO_FILE = path.join(DATA_DIR, 'demo_incidents.json');" + storageHeader
);

// 2. Remove cutoffs in incident filtering - keep data forever!
code = code.replace(
  "const cutoff = Date.now() - 12 * 3600 * 1000;\n  const active = incidents.filter(i => i.timestamp > cutoff && i.votes >= -2);",
  "// Data collected is saved forever, never deleted. Only heavily downvoted spam (< -2) is suppressed.\n  const active = incidents.filter(i => i.votes >= -2);"
);

// Also in WebSocket handshake
code = code.replace(
  "const cutoff = Date.now() - 12 * 3600 * 1000;\n  ws.send(JSON.stringify({\n    event: 'init_bundle',\n    data: {\n      incidents: incidents.filter(i => i.timestamp > cutoff && i.votes >= -2)\n    }\n  }));",
  "// Send all permanently saved community incidents\n  ws.send(JSON.stringify({\n    event: 'init_bundle',\n    data: {\n      incidents: incidents.filter(i => i.votes >= -2)\n    }\n  }));"
);

// 3. Expand allowedTypes in incident submission to include Waze tools
code = code.replace(
  "const allowedTypes = ['accident', 'traffic_jam', 'road_work', 'hazard', 'closure'];",
  "const allowedTypes = ['accident', 'traffic_jam', 'road_work', 'hazard', 'closure', 'checkpoint', 'speed_camera', 'pothole', 'fuel_update', 'missing_road'];"
);

// 4. Save to permanent archive on incident creation
code = code.replace(
  "saveIncidents();\n\n  // Broadcast over WebSocket to live drivers",
  "saveIncidents();\n  savePermanentIncident(newIncident);\n\n  // Broadcast over WebSocket to live drivers"
);

// Also on incident vote
code = code.replace(
  "incident.confirmedSessions.push(sid);\n    saveIncidents();",
  "incident.confirmedSessions.push(sid);\n    saveIncidents();\n    savePermanentIncident(incident);"
);

// 5. Add user contribution endpoints
const userEndpoints = `
// ---------------- Driver XP & Permanent Gamification ---------------- //
app.post('/api/user/contribute', (req, res) => {
  const { sessionId, pointsEarned, actionType, details } = req.body;
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'معرّف الجلسة مطلوب' });
  }
  const profile = recordUserContribution(sessionId, Number(pointsEarned) || 10, actionType, details);
  res.json({ status: 'ok', profile });
});

app.get('/api/user/profile/:sessionId', (req, res) => {
  const profile = getUserProfile(req.params.sessionId);
  res.json(profile);
});
`;

code = code.replace(
  "// Maneuver translation helper",
  userEndpoints + "\n// Maneuver translation helper"
);

// 6. Update OSRM route request to fetch 3 alternatives and add deltaMinutes
code = code.replace(
  "&steps=true&alternatives=true",
  "&steps=true&alternatives=3"
);

fs.writeFileSync(serverFile, code, 'utf8');
console.log('Successfully upgraded server.js with permanent persistence and driver XP endpoints.');
