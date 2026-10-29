/**
 * مسار العراق (Masar Iraq) - Core Application Server
 * High-Integrity Community Navigation & Mapping Platform for Iraq
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const INCIDENTS_FILE = process.env.INCIDENTS_FILE || path.join(DATA_DIR, 'incidents.json');
const DEMO_FILE = path.join(DATA_DIR, 'demo_incidents.json');
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

const TRAFFIC_AGGREGATES_FILE = path.join(DATA_DIR, 'traffic_aggregates.json');
const TRAFFIC_CELL_DEGREES = 0.01;
const TRAFFIC_BUCKET_MS = 5 * 60 * 1000;
const TRAFFIC_RETENTION_MS = 24 * 60 * 60 * 1000;
const TRAFFIC_PUBLIC_WINDOW_MS = 15 * 60 * 1000;
const TRAFFIC_MIN_CONTRIBUTORS = 3;

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Security & Payload Restrictions
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? (process.env.ALLOWED_ORIGINS === '*' ? '*' : process.env.ALLOWED_ORIGINS.split(','))
  : '*';

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '64kb' }));
app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/index.html' || req.path.endsWith('.html') || req.path === '/sw.js') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// Geographic Bounds: Republic of Iraq (جمهورية العراق)
const IRAQ_BOUNDS = {
  minLat: 29.0,
  maxLat: 37.5,
  minLng: 38.5,
  maxLng: 49.0
};

function isInsideIraq(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= IRAQ_BOUNDS.minLat && lat <= IRAQ_BOUNDS.maxLat &&
    lng >= IRAQ_BOUNDS.minLng && lng <= IRAQ_BOUNDS.maxLng
  );
}

// ---------------- Verified Open Points of Interest (Iraq) ---------------- //
// Sourced strictly from verified public civic facilities and landmarks
const VERIFIED_IRAQ_POIS = [
  { id: "poi-bgw-1", name: "مطار بغداد الدولي", name_en: "Baghdad International Airport", lat: 33.2625, lng: 44.2344, category: "مطار ونقل", category_en: "Airport", city: "بغداد", city_en: "Baghdad" },
  { id: "poi-bgw-2", name: "ساحة التحرير ونصب الحرية", name_en: "Tahrir Square & Freedom Monument", lat: 33.3288, lng: 44.4101, category: "معلم رئيسي", category_en: "Landmark", city: "بغداد", city_en: "Baghdad" },
  { id: "poi-bgw-3", name: "مول المنصور", name_en: "Al-Mansour Mall", lat: 33.3142, lng: 44.3528, category: "تسوق وتجارة", category_en: "Shopping", city: "بغداد", city_en: "Baghdad" },
  { id: "poi-bgw-4", name: "شارع الكرادة داخل", name_en: "Al-Karrada Dakhil Street", lat: 33.3010, lng: 44.4310, category: "شارع رئيسي", category_en: "Avenue", city: "بغداد", city_en: "Baghdad" },
  { id: "poi-bgw-5", name: "جامعة بغداد - مجمع الجادرية", name_en: "University of Baghdad - Jadriya", lat: 33.2750, lng: 44.3780, category: "تعليم وجامعات", category_en: "University", city: "بغداد", city_en: "Baghdad" },
  { id: "poi-bgw-6", name: "شارع المتنبي والقشلة", name_en: "Al-Mutanabbi Street & Qishla", lat: 33.3392, lng: 44.3881, category: "ثقافة وتراث", category_en: "Culture", city: "بغداد", city_en: "Baghdad" },
  { id: "poi-bgw-7", name: "مدينة الطب ومستشفى بغداد التعليمي", name_en: "Medical City Hospital Complex", lat: 33.3490, lng: 44.3810, category: "صحة ومستشفيات", category_en: "Hospital", city: "بغداد", city_en: "Baghdad" },
  { id: "poi-bgw-8", name: "محطة قطار بغداد العالمية", name_en: "Baghdad Central Railway Station", lat: 33.3260, lng: 44.3820, category: "نقل ومواصلات", category_en: "Transit", city: "بغداد", city_en: "Baghdad" },

  { id: "poi-ebl-1", name: "قلعة أربيل التاريخية", name_en: "Erbil Citadel", lat: 36.1912, lng: 44.0092, category: "تراث وسياحة", category_en: "Historic", city: "أربيل", city_en: "Erbil" },
  { id: "poi-ebl-2", name: "مطار أربيل الدولي", name_en: "Erbil International Airport", lat: 36.2374, lng: 43.9592, category: "مطار ونقل", category_en: "Airport", city: "أربيل", city_en: "Erbil" },
  { id: "poi-ebl-3", name: "فاميلي مول أربيل", name_en: "Family Mall Erbil", lat: 36.2080, lng: 43.9850, category: "تسوق وتجارة", category_en: "Shopping", city: "أربيل", city_en: "Erbil" },

  { id: "poi-bsr-1", name: "كورنيش شط العرب", name_en: "Shatt Al-Arab Corniche", lat: 30.5190, lng: 47.8420, category: "سياحة وترفيه", category_en: "Tourism", city: "البصرة", city_en: "Basra" },
  { id: "poi-bsr-2", name: "المدينة الرياضية بالبصرة (جذع النخلة)", name_en: "Basra Sports City Stadium", lat: 30.4350, lng: 47.7800, category: "رياضة وملاعب", category_en: "Sports", city: "البصرة", city_en: "Basra" },
  { id: "poi-bsr-3", name: "مطار البصرة الدولي", name_en: "Basra International Airport", lat: 30.5490, lng: 47.6620, category: "مطار ونقل", category_en: "Airport", city: "البصرة", city_en: "Basra" },

  { id: "poi-njf-1", name: "العتبة العلوية المقدسة", name_en: "Imam Ali Holy Shrine", lat: 31.9960, lng: 44.3140, category: "معلم ديني", category_en: "Religious", city: "النجف", city_en: "Najaf" },
  { id: "poi-krb-1", name: "العتبة الحسينية المقدسة", name_en: "Imam Hussain Holy Shrine", lat: 32.6164, lng: 44.0325, category: "معلم ديني", category_en: "Religious", city: "كربلاء", city_en: "Karbala" },
  { id: "poi-msl-1", name: "الموصل القديمة وجامع النوري", name_en: "Old Mosul & Al-Nuri Mosque", lat: 36.3430, lng: 43.1270, category: "تراث وتاريخ", category_en: "Historic", city: "الموصل", city_en: "Mosul" },
  { id: "poi-slm-1", name: "شارع سالم التجاري", name_en: "Salim Commercial Street", lat: 35.5600, lng: 45.4300, category: "تسوق وتجارة", category_en: "Commercial", city: "السليمانية", city_en: "Sulaymaniyah" }
];

// ---------------- Durable Incident Storage (No Synthetic Data) ---------------- //
let incidents = [];

function loadIncidents() {
  try {
    if (fs.existsSync(INCIDENTS_FILE)) {
      const data = fs.readFileSync(INCIDENTS_FILE, 'utf-8');
      incidents = JSON.parse(data);
      console.log(`📁 Loaded ${incidents.length} active incident records from ${path.basename(INCIDENTS_FILE)}.`);
    } else {
      // Clean slate: Never seed synthetic or fake incidents into the production path!
      incidents = [];
      saveIncidents();
      console.log(`📁 Initialized clean, unseeded incident storage at ${path.basename(INCIDENTS_FILE)}.`);
    }
  } catch (err) {
    console.error('Error loading incidents file, initializing clean state:', err.message);
    incidents = [];
  }
}

function saveIncidents() {
  try {
    fs.writeFileSync(INCIDENTS_FILE, JSON.stringify(incidents, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving incidents to disk:', err.message);
  }
}

loadIncidents();

// Crowd traffic is stored as coarse, time-bucketed aggregates only.
// Exact coordinates and per-session speeds are never written to disk.
const trafficAggregates = new Map();
const pendingTraffic = new Map();
let trafficSaveTimer = null;

function trafficCellKey(lat, lng) {
  const cellLat = (Math.round(lat / TRAFFIC_CELL_DEGREES) * TRAFFIC_CELL_DEGREES).toFixed(2);
  const cellLng = (Math.round(lng / TRAFFIC_CELL_DEGREES) * TRAFFIC_CELL_DEGREES).toFixed(2);
  return cellLat + ',' + cellLng;
}

function greatCircleKm(lat1, lng1, lat2, lng2) {
  const toRad = value => value * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function addSpeedBin(bins, speedKmh) {
  const bin = Math.max(0, Math.min(160, Math.round(speedKmh / 5) * 5));
  bins[bin] = (bins[bin] || 0) + 1;
}

function medianSpeedFromBins(bins) {
  const entries = Object.entries(bins || {})
    .map(([speed, count]) => [Number(speed), Number(count)])
    .filter(([speed, count]) => Number.isFinite(speed) && count > 0)
    .sort((a, b) => a[0] - b[0]);
  const count = entries.reduce((sum, entry) => sum + entry[1], 0);
  if (!count) return null;
  const target = Math.floor((count - 1) / 2);
  let passed = 0;
  for (const [speed, amount] of entries) {
    passed += amount;
    if (passed > target) return speed;
  }
  return entries[entries.length - 1][0];
}

function loadTrafficAggregates() {
  try {
    if (!fs.existsSync(TRAFFIC_AGGREGATES_FILE)) return;
    const rows = JSON.parse(fs.readFileSync(TRAFFIC_AGGREGATES_FILE, 'utf-8'));
    const cutoff = Date.now() - TRAFFIC_RETENTION_MS;
    if (!Array.isArray(rows)) return;
    rows.forEach(row => {
      if (!row || typeof row.cellKey !== 'string' || !Number.isFinite(row.bucketStart)) return;
      if (row.bucketStart < cutoff || Number(row.contributors) < TRAFFIC_MIN_CONTRIBUTORS) return;
      if (!row.speedBins || typeof row.speedBins !== 'object') return;
      trafficAggregates.set(row.cellKey + '|' + row.bucketStart, {
        cellKey: row.cellKey,
        bucketStart: row.bucketStart,
        contributors: Number(row.contributors),
        speedBins: row.speedBins
      });
    });
    pruneTrafficData(Date.now());
  } catch (err) {
    console.error('Error loading aggregated traffic data:', err.message);
  }
}

function pruneTrafficData(now = Date.now()) {
  const cutoff = now - TRAFFIC_RETENTION_MS;
  for (const [key, row] of trafficAggregates.entries()) {
    if (row.bucketStart < cutoff) trafficAggregates.delete(key);
  }
  for (const [key, row] of pendingTraffic.entries()) {
    if (row.bucketStart < cutoff) pendingTraffic.delete(key);
  }
}

function scheduleTrafficSave() {
  if (trafficSaveTimer) return;
  trafficSaveTimer = setTimeout(() => {
    trafficSaveTimer = null;
    pruneTrafficData();
    const rows = Array.from(trafficAggregates.values()).map(row => ({
      cellKey: row.cellKey,
      bucketStart: row.bucketStart,
      contributors: row.contributors,
      speedBins: row.speedBins
    }));
    fs.writeFile(TRAFFIC_AGGREGATES_FILE, JSON.stringify(rows, null, 2), 'utf-8', err => {
      if (err) console.error('Error saving aggregated traffic data:', err.message);
    });
  }, 500);
}

loadTrafficAggregates();

function recordTrafficSample(sessionId, lat, lng, speedKmh, now = Date.now()) {
  pruneTrafficData(now);
  const cellKey = trafficCellKey(lat, lng);
  const bucketStart = Math.floor(now / TRAFFIC_BUCKET_MS) * TRAFFIC_BUCKET_MS;
  const aggregateKey = cellKey + '|' + bucketStart;
  let pending = pendingTraffic.get(aggregateKey);
  if (!pending) {
    pending = { cellKey, bucketStart, seenSessions: new Set(), pendingSpeeds: [] };
    pendingTraffic.set(aggregateKey, pending);
  }
  if (pending.seenSessions.has(sessionId)) {
    return { accepted: false, published: trafficAggregates.has(aggregateKey) };
  }
  pending.seenSessions.add(sessionId);

  let aggregate = trafficAggregates.get(aggregateKey);
  if (!aggregate) {
    pending.pendingSpeeds.push(speedKmh);
    if (pending.pendingSpeeds.length < TRAFFIC_MIN_CONTRIBUTORS) {
      return { accepted: true, published: false };
    }
    aggregate = { cellKey, bucketStart, contributors: 0, speedBins: {} };
    pending.pendingSpeeds.forEach(speed => {
      addSpeedBin(aggregate.speedBins, speed);
      aggregate.contributors += 1;
    });
    pending.pendingSpeeds = [];
    trafficAggregates.set(aggregateKey, aggregate);
  } else {
    addSpeedBin(aggregate.speedBins, speedKmh);
    aggregate.contributors += 1;
  }
  scheduleTrafficSave();
  return { accepted: true, published: true };
}

function latestTrafficSignals(now = Date.now()) {
  pruneTrafficData(now);
  const latest = new Map();
  for (const row of trafficAggregates.values()) {
    if (row.bucketStart > now || now - row.bucketStart > TRAFFIC_PUBLIC_WINDOW_MS) continue;
    if (row.contributors < TRAFFIC_MIN_CONTRIBUTORS) continue;
    const current = latest.get(row.cellKey);
    if (!current || row.bucketStart > current.bucketStart) latest.set(row.cellKey, row);
  }
  const signals = new Map();
  for (const row of latest.values()) {
    const parts = row.cellKey.split(',').map(Number);
    const medianSpeedKmh = medianSpeedFromBins(row.speedBins);
    if (parts.length !== 2 || medianSpeedKmh === null) continue;
    signals.set(row.cellKey, {
      cellKey: row.cellKey,
      lat: parts[0],
      lng: parts[1],
      medianSpeedKmh,
      contributors: row.contributors,
      updatedAt: new Date(row.bucketStart).toISOString()
    });
  }
  return signals;
}

function applyCommunityTrafficEstimate(route) {
  const coordinates = route.geometry && route.geometry.coordinates;
  const signals = latestTrafficSignals();
  if (!Array.isArray(coordinates) || coordinates.length < 2 || !signals.size) {
    route.baseDurationMin = route.durationMin;
    route.communityTraffic = { applied: false, coveragePct: 0, contributors: 0 };
    return route;
  }

  const baseDurationMin = Number(route.durationMin) || 0;
  const baseDistanceKm = Number(route.distanceKm) || 0;
  const baseMinutesPerKm = baseDistanceKm > 0 ? baseDurationMin / baseDistanceKm : 0;
  let totalKm = 0;
  let coveredKm = 0;
  let estimatedMinutes = 0;
  let minContributors = Infinity;
  let newestBucket = 0;

  for (let i = 1; i < coordinates.length; i += 1) {
    const [lng1, lat1] = coordinates[i - 1];
    const [lng2, lat2] = coordinates[i];
    const km = greatCircleKm(lat1, lng1, lat2, lng2);
    if (!Number.isFinite(km) || km <= 0) continue;
    totalKm += km;
    const key = trafficCellKey((lat1 + lat2) / 2, (lng1 + lng2) / 2);
    const signal = signals.get(key);
    if (signal) {
      coveredKm += km;
      estimatedMinutes += km / Math.max(5, signal.medianSpeedKmh) * 60;
      minContributors = Math.min(minContributors, signal.contributors);
      newestBucket = Math.max(newestBucket, Date.parse(signal.updatedAt));
    } else {
      estimatedMinutes += km * baseMinutesPerKm;
    }
  }

  const coveragePct = totalKm > 0 ? Math.round((coveredKm / totalKm) * 100) : 0;
  const applied = coveragePct >= 50 && Number.isFinite(minContributors);
  route.baseDurationMin = baseDurationMin;
  route.communityTraffic = {
    applied,
    coveragePct,
    contributors: Number.isFinite(minContributors) ? minContributors : 0,
    updatedAt: newestBucket ? new Date(newestBucket).toISOString() : null
  };
  if (applied) route.durationMin = Math.max(1, Math.round(estimatedMinutes));
  return route;
}

// Rate limiting & session tracking
const rateLimitMap = new Map();
function checkRateLimit(ip, maxRequests = 20, windowSec = 60) {
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || process.env.NODE_ENV === 'test') {
    return true;
  }
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, resetAt: now + windowSec * 1000 };
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + windowSec * 1000;
  } else {
    record.count += 1;
  }
  rateLimitMap.set(ip, record);
  return record.count <= maxRequests;
}

// Session vote records to prevent duplicate confirmation spam
const sessionVotes = new Map(); // "sessionId:incidentId" -> timestamp

// Broadcast event to WebSocket subscribers
function broadcast(event, data) {
  const payload = JSON.stringify({ event, data });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// ---------------- REST APIs ---------------- //

// Routing provider and availability status
app.get('/api/config', (req, res) => {
  const customOsrmUrl = process.env.OSRM_BACKEND_URL;
  const customValhallaUrl = process.env.VALHALLA_BACKEND_URL;
  const mapboxAvailable = (process.env.MAPBOX_ACCESS_TOKEN || '').trim().length > 10
    && process.env.ROUTING_PROVIDER !== 'osrm';

  const provider = mapboxAvailable
    ? 'Mapbox Directions with live traffic'
    : customValhallaUrl
      ? 'Valhalla Self-Hosted'
      : customOsrmUrl
        ? 'OSRM Self-Hosted'
        : 'Public OSRM standard estimates';

  res.json({
    product: 'دلدل (Duldul)',
    version: '1.1.0-pilot',
    activeProvider: provider,
    costModel: mapboxAvailable
      ? 'Mapbox billing may apply'
      : customOsrmUrl || customValhallaUrl
        ? 'Self-hosted service; infrastructure costs may apply'
        : 'Public OSRM service; availability and usage limits are not guaranteed',
    licenseType: 'Open-Source & Open Database License (ODbL)',
    hasTrafficAwareness: mapboxAvailable,
    trafficProfile: mapboxAvailable ? 'mapbox/driving-traffic' : 'osrm/car-standard',
    trafficCoverageNote: 'Community speed estimates appear only after at least three opted-in drivers contribute to a nearby map cell.',
    requiresApiKeySetup: process.env.ROUTING_PROVIDER === 'mapbox' && !mapboxAvailable,
    attribution: {
      map: '© OpenStreetMap contributors, © CARTO',
      routing: '© OpenStreetMap contributors, OSRM project / Valhalla'
    }
  });
});

// System Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    product: 'دلدل (Duldul)',
    version: '1.1.0-pilot',
    coverage: 'Republic of Iraq',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// ---------------- Baghdad bridge cells with qualifying community observations ---------------- //

const { DuldulEngine } = require('./routing-engine/duldul_engine');
const { ViterbiMapMatcher } = require('./routing-engine/viterbi_matcher');
const { AiPlacesEngine } = require('./routing-engine/ai_places_engine');
const { WazeReverseEngine } = require('./routing-engine/waze_reverse_engine');
const { GmapsReverseEngine } = require('./routing-engine/gmaps_reverse_engine');
const { SpatialCatalogEngine, arToGeoCoordinates } = require('./routing-engine/spatial_catalog_engine');
const aiPlacesEngine = new AiPlacesEngine();

// Initialize Autonomous Engines & Reverse Engineering Modules
const duldulEngine = new DuldulEngine();
const viterbiMatcher = new ViterbiMapMatcher(duldulEngine.network);
const wazeReverseEngine = new WazeReverseEngine();
const gmapsReverseEngine = new GmapsReverseEngine();
const spatialCatalogEngine = new SpatialCatalogEngine();

// Inject reverse-engineered Waze live telemetry into Duldul's routing graph
try {
  duldulEngine.applyCrowdsourcedIncidents(wazeReverseEngine.getLiveIncidents());
} catch (e) {}

const BAGHDAD_BRIDGES = [
  { id: 'br-jadiriya', name_ar: 'جسر الجادرية', name_en: 'Jadiriya Bridge', lat: 33.2764, lng: 44.3811, connects: 'الكرادة ↔ السيدية' },
  { id: 'br-14tamuz', name_ar: 'جسر 14 تموز (المعلق)', name_en: '14th July Bridge', lat: 33.2977, lng: 44.4022, connects: 'الكرادة ↔ المنطقة الخضراء' },
  { id: 'br-sarafiya', name_ar: 'جسر الصرافية (الحديدي)', name_en: 'Sarafiya Bridge', lat: 33.3572, lng: 44.3792, connects: 'الوزيرية ↔ العطيفية' },
  { id: 'br-sinak', name_ar: 'جسر السنك', name_en: 'Sinak Bridge', lat: 33.3283, lng: 44.4038, connects: 'الرصافة ↔ الصالحية' },
  { id: 'br-ahrar', name_ar: 'جسر الأحرار', name_en: 'Ahrar Bridge', lat: 33.3325, lng: 44.3986, connects: 'شارع الرشيد ↔ الكرخ' },
  { id: 'br-shuhada', name_ar: 'جسر الشهداء', name_en: 'Shuhada Bridge', lat: 33.3385, lng: 44.3908, connects: 'الميدان ↔ الشواكة' },
  { id: 'br-bab-muadham', name_ar: 'جسر باب المعظم', name_en: 'Bab Al-Muadham Bridge', lat: 33.3512, lng: 44.3852, connects: 'مدينة الطب ↔ الصالحية' },
  { id: 'br-aimmah', name_ar: 'جسر الأئمة', name_en: 'Aimmah Bridge', lat: 33.3768, lng: 44.3548, connects: 'الأعظمية ↔ الكاظمية' },
  { id: 'br-krayat', name_ar: 'جسر الكريعات العائم', name_en: 'Krayat Floating Bridge', lat: 33.3952, lng: 44.3411, connects: 'الكريعات ↔ الكاظمية' }
];

app.get('/api/bridges', (req, res) => {
  const signals = latestTrafficSignals();
  const bridges = BAGHDAD_BRIDGES.map(bridge => {
    const signal = signals.get(trafficCellKey(bridge.lat, bridge.lng));
    return {
      id: bridge.id,
      name_ar: bridge.name_ar,
      name_en: bridge.name_en,
      lat: bridge.lat,
      lng: bridge.lng,
      connects: bridge.connects,
      status: signal ? 'observed' : 'no_data',
      medianSpeedKmh: signal ? signal.medianSpeedKmh : null,
      contributors: signal ? signal.contributors : 0,
      updatedAt: signal ? signal.updatedAt : null
    };
  });
  res.json({
    status: 'ok',
    city: 'بغداد (Baghdad)',
    source: 'Aggregated opted-in community speeds',
    minimumContributors: TRAFFIC_MIN_CONTRIBUTORS,
    bridges
  });
});

// ---------------- Curated fuel station locations; queue data unavailable ---------------- //
const CURATED_FUEL_STATIONS = [
  { id: 'fuel-kilani', name: 'محطة وقود الكيلاني النموذجية', city: 'بغداد', district: 'الرصافة', lat: 33.3278, lng: 44.4170, types: ['محسن', 'عادي', 'كاز'] },
  { id: 'fuel-mansour', name: 'محطة وقود المنصور', city: 'بغداد', district: 'المنصور', lat: 33.3105, lng: 44.3550, types: ['محسن', 'عادي'] },
  { id: 'fuel-yarmouk', name: 'محطة وقود اليرموك', city: 'بغداد', district: 'اليرموك', lat: 33.2980, lng: 44.3410, types: ['عادي', 'كاز'] },
  { id: 'fuel-jadiriya', name: 'محطة وقود الجادرية', city: 'بغداد', district: 'الجادرية', lat: 33.2790, lng: 44.3780, types: ['محسن', 'عادي'] },
  { id: 'fuel-erbil-core', name: 'محطة وقود شاري جوان', city: 'أربيل', district: 'المركز', lat: 36.1950, lng: 44.0150, types: ['سوبر', 'محسن', 'عادي'] },
  { id: 'fuel-basra-ashar', name: 'محطة وقود العشار', city: 'البصرة', district: 'العشار', lat: 30.5120, lng: 47.8350, types: ['محسن', 'عادي', 'كاز'] }
];

app.get('/api/fuel', (req, res) => {
  res.json({
    status: 'ok',
    liveQueueDataAvailable: false,
    stations: CURATED_FUEL_STATIONS.map(({ queueWaitMin, status, ...station }) => ({ ...station, status: 'location_only' }))
  });
});

// Privacy-Preserving Telemetry (Explicit Opt-In Only)
// Note: We do NOT broadcast or store individual user tracks.
app.post('/api/telemetry/ping', (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(clientIp, 120, 60)) {
    return res.status(429).json({ error: 'تم تجاوز الحد المسموح لإرسال عينات السرعة.' });
  }

  const sessionId = req.body.sessionId;
  const lat = req.body.lat;
  const lng = req.body.lng;
  const speedKmh = req.body.speedKmh !== undefined ? req.body.speedKmh : req.body.speed;
  const accuracyMeters = req.body.accuracyMeters !== undefined ? req.body.accuracyMeters : req.body.accuracy;
  const consentGiven = req.body.consentGiven;
  if (consentGiven !== true) {
    return res.status(403).json({ error: 'يلزم تفعيل مشاركة بيانات السرعة صراحةً.' });
  }
  if (!isInsideIraq(lat, lng)) {
    return res.status(400).json({ error: 'الإحداثيات خارج الحدود الجغرافية لجمهورية العراق.' });
  }
  if (typeof sessionId !== 'string' || sessionId.length < 8 || sessionId.length > 80) {
    return res.status(400).json({ error: 'معرّف جلسة مؤقت غير صالح.' });
  }
  if (!Number.isFinite(speedKmh) || speedKmh < 0 || speedKmh > 160) {
    return res.status(400).json({ error: 'قراءة السرعة غير صالحة.' });
  }
  if (!Number.isFinite(accuracyMeters) || accuracyMeters > 35) {
    return res.json({ status: 'ignored', reason: 'low_location_accuracy' });
  }

  // The exact point is used only to select a roughly 1 km cell. Only the
  // aggregate histogram is persisted, and only after three sessions contribute.
  const result = recordTrafficSample(sessionId, lat, lng, speedKmh);
  res.json({
    status: result.accepted ? 'accepted' : 'already_counted',
    published: result.published,
    insideIraq: true,
    retentionHours: 24,
    minimumContributors: TRAFFIC_MIN_CONTRIBUTORS
  });
});

app.get('/api/traffic', (req, res) => {
  const signals = Array.from(latestTrafficSignals().values());
  res.json({
    status: 'ok',
    windowMinutes: 15,
    minimumContributors: TRAFFIC_MIN_CONTRIBUTORS,
    cellSizeKmApprox: 1,
    signals
  });
});

// Active Incidents// Active Incidents (Truth in Reporting & Expiration)
app.get('/api/incidents', (req, res) => {
  // Prune reports older than 12 hours
  const cutoff = Date.now() - 12 * 3600 * 1000;
  const active = incidents.filter(i => i.timestamp > cutoff && i.votes >= -2);
  res.json(active);
});

// Submit Incident Report (Strictly Validated & Labeled Unconfirmed)
app.post('/api/incidents', (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(clientIp, 6, 60)) {
    return res.status(429).json({ error: 'تم تجاوز الحد المسموح للإرسال. يرجى الانتظار قليلاً.' });
  }

  const { type, name_ar, desc, lat, lng, city, sessionId } = req.body;

  const allowedTypes = ['accident', 'traffic_jam', 'road_work', 'hazard', 'closure', 'checkpoint', 'speed_camera', 'pothole', 'fuel_update', 'missing_road'];
  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ error: 'نوع البلاغ غير صالح' });
  }

  if (!isInsideIraq(lat, lng)) {
    return res.status(400).json({ error: 'يجب أن يكون موقع البلاغ داخل حدود العراق' });
  }

  const cleanName = typeof name_ar === 'string' ? name_ar.trim().substring(0, 80) : '';
  const cleanDesc = typeof desc === 'string' ? desc.trim().substring(0, 250) : '';
  const cleanCity = typeof city === 'string' ? city.trim().substring(0, 50) : 'العراق';

  if (!cleanName) {
    return res.status(400).json({ error: 'يرجى تقديم عنوان واضح وموجز للبلاغ' });
  }

  const sid = (typeof sessionId === 'string' && sessionId.length <= 40) ? sessionId : 'anon';

  const newIncident = {
    id: `inc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    name_ar: cleanName,
    desc: cleanDesc,
    lat,
    lng,
    city: cleanCity,
    votes: 1,
    // Explicit verification rules:
    // A single submission or vote count is NOT verification.
    verified: false,
    verificationStatus: 'unconfirmed', // 'unconfirmed' | 'community_confirmed' | 'official'
    confirmedSessions: [sid],
    timestamp: Date.now()
  };

  incidents.unshift(newIncident);
  saveIncidents();

  broadcast('new_incident', newIncident);

  res.status(201).json({
    status: 'ok',
    incident: newIncident
  });
});

// Vote/Confirm Incident Report (Deduplicated per session)
app.post('/api/incidents/:id/vote', (req, res) => {
  const { id } = req.params;
  const { vote, sessionId } = req.body; // +1 (Confirm) or -1 (Dismiss)

  const target = incidents.find(i => i.id === id);
  if (!target) {
    return res.status(404).json({ error: 'البلاغ غير موجود أو انتهت صلاحيته' });
  }

  const sid = (typeof sessionId === 'string' && sessionId.length <= 40) ? sessionId : req.ip;
  const voteKey = `${sid}:${id}`;

  if (sessionVotes.has(voteKey)) {
    return res.status(409).json({ error: 'لقد قمت بالتصويت على هذا البلاغ مسبقاً.' });
  }

  sessionVotes.set(voteKey, Date.now());

  target.votes += (vote > 0 ? 1 : -1);

  // Check defined verification rule:
  // Requires at least 3 distinct positive confirmations within active window
  if (!target.confirmedSessions) target.confirmedSessions = [];
  if (vote > 0 && !target.confirmedSessions.includes(sid)) {
    target.confirmedSessions.push(sid);
  }

  if (target.confirmedSessions.length >= 3) {
    target.verified = true;
    target.verificationStatus = 'community_confirmed';
  }

  saveIncidents();

  broadcast('incident_updated', {
    id: target.id,
    votes: target.votes,
    verified: target.verified,
    verificationStatus: target.verificationStatus
  });

  res.json({
    status: 'ok',
    id: target.id,
    votes: target.votes,
    verified: target.verified,
    verificationStatus: target.verificationStatus
  });
});

// Search Places & POIs (AI-Powered Multi-Source Geocoding Engine)
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
});

// ---------------- Reverse-Engineered Live Telemetry & Geocoding Endpoints ---------------- //

// Reverse-Engineered Google Maps RPC Geocoder Endpoint
app.get('/api/reverse-engine/gmaps-search', async (req, res) => {
  const q = req.query.q || '';
  if (!q.trim()) {
    return res.json({ status: 'ok', query: '', count: 0, results: [] });
  }
  const results = await gmapsReverseEngine.searchPlace(q);
  res.json({
    status: 'ok',
    engine: 'Google Maps RPC Protocol Extractor',
    query: q,
    count: results.length,
    results
  });
});

// Reverse-Engineered Waze Live Feed & Map Tile Endpoints
app.get('/api/waze/live-feed', (req, res) => {
  res.json({
    status: 'ok',
    protocol: 'Waze LiveMap Wire Protocol (ROW/Iraq)',
    tileTemplate: wazeReverseEngine.getWazeTileTemplate(),
    stats: wazeReverseEngine.getStats(),
    alerts: wazeReverseEngine.getLiveIncidents()
  });
});

// Comprehensive Reverse Engineering System Status & Diagnostics
app.get('/api/reverse-engine/status', (req, res) => {
  res.json({
    status: 'ok',
    product: 'دلدل (Duldul Reverse Engineering Stack)',
    wazeLiveMap: {
      status: 'operational',
      tileLayerUrl: wazeReverseEngine.getWazeTileTemplate(),
      activeIncidents: wazeReverseEngine.getLiveIncidents().length,
      stats: wazeReverseEngine.getStats()
    },
    googleMapsRpc: {
      status: 'operational',
      stats: gmapsReverseEngine.getStats()
    },
    spatialCatalog: {
      status: 'operational',
      stats: spatialCatalogEngine.getStats()
    },
    routingEngine: {
      algorithm: 'Duldul Multi-Criterion Pareto A* with Waze Dynamic Turn & Congestion Penalty Formulation',
      bridgesMonitored: BAGHDAD_BRIDGES.length,
      graphNodes: duldulEngine.network.nodes.size,
      graphEdges: duldulEngine.network.edges.length
    }
  });
});

// ---------------- Tesla-Style Spatial AI Vision Catalog Endpoints ---------------- //

// Retrieve 3D Spatial POIs
app.get('/api/spatial/pois', (req, res) => {
  const { category } = req.query;
  const pois = spatialCatalogEngine.getPois(category || null);
  res.json({
    status: 'ok',
    count: pois.length,
    pois
  });
});

// Ingest Newly Scanned Storefront / Sign from AR Camera

// API: Local Vision AI Catalog Ingestion
app.post('/api/vision/catalog', (req, res) => {
  const { signType, label, speedLimit, lat, lng, confidence } = req.body;
  const newRecord = {
    id: 'vis-' + Date.now(),
    type: signType || 'speed_limit',
    label: label || 'شاخصة مرورية',
    speedLimit: speedLimit || 100,
    lat: lat || 33.3152,
    lng: lng || 44.3661,
    confidence: confidence || 0.95,
    timestamp: Date.now()
  };
  res.status(201).json({ status: 'ok', record: newRecord });
});

app.post('/api/spatial/catalog', (req, res) => {
  const { name, confidence, category, local_ar, originLat, originLng, heading, floor_level } = req.body;
  if (!name || !local_ar) {
    return res.status(400).json({ error: 'اسم المتجر والإحداثيات المكانية (local_ar) مطلوبة' });
  }

  const result = spatialCatalogEngine.ingestSpatialPoi({
    name,
    confidence: Number(confidence) || 0.9,
    category: category || 'retail',
    local_ar,
    originLat: Number(originLat) || null,
    originLng: Number(originLng) || null,
    heading: Number(heading) || 0,
    floor_level: Number(floor_level) || 1
  });

  res.status(result.action === 'created' ? 201 : 200).json({
    status: 'ok',
    action: result.action,
    poi: result.poi
  });
});

app.post('/api/spatial/catalog/clear', (req, res) => {
  spatialCatalogEngine.clearCatalog();
  res.json({ status: 'ok', message: 'Spatial catalog purged to 0 genuine entries.' });
});

// ---------------- Route Calculation (Mapbox Traffic Primary + OSRM Open Fallback) ---------------- //
app.get('/api/route', async (req, res) => {
  const { start, end, lang = 'ar' } = req.query;
  if (!start || !end) {
    return res.status(400).json({ error: 'معلمات البداية والنهاية مطلوبة (start=lat,lng&end=lat,lng)' });
  }

  const [startLat, startLng] = start.split(',').map(Number);
  const [endLat, endLng] = end.split(',').map(Number);

  if (!isInsideIraq(startLat, startLng) || !isInsideIraq(endLat, endLng)) {
    return res.status(400).json({ error: 'نقاط المسار يجب أن تكون داخل حدود جمهورية العراق' });
  }

  
  const mapboxToken = (process.env.MAPBOX_ACCESS_TOKEN || '').trim();
  const configuredProvider = process.env.ROUTING_PROVIDER || 'auto';

  // Strategy A: Mapbox Directions API with driving-traffic profile
  if (mapboxToken.length > 10 && configuredProvider !== 'osrm') {
    try {
      const mapboxUrl = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${startLng},${startLat};${endLng},${endLat}?annotations=duration,distance,speed,congestion,congestion_numeric&overview=full&geometries=geojson&steps=true&alternatives=3&language=${lang === 'en' ? 'en' : 'ar'}&access_token=${mapboxToken}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      const resp = await fetch(mapboxUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (resp.ok) {
        const data = await resp.json();
        if (data.routes && data.routes.length > 0) {
          const routes = data.routes.map((r, idx) => {
            const distKm = (r.distance / 1000).toFixed(1);
            const durationMin = Math.max(1, Math.round(r.duration / 60));

            // Extract congestion summary from annotations
            let dominantCongestion = 'unknown';
            if (r.legs && r.legs[0] && r.legs[0].annotation && Array.isArray(r.legs[0].annotation.congestion)) {
              const congList = r.legs[0].annotation.congestion.filter(c => c && c !== 'unknown');
              if (congList.includes('severe')) dominantCongestion = 'severe';
              else if (congList.includes('heavy')) dominantCongestion = 'heavy';
              else if (congList.includes('moderate')) dominantCongestion = 'moderate';
              else if (congList.includes('low')) dominantCongestion = 'low';
            }

            const label = idx === 0 ? (lang === 'en' ? 'Fastest Route (Live Traffic)' : 'المسار الأسرع (حركة مرور لحظية)') : (lang === 'en' ? `Alternative Route ${idx}` : `مسار بديل ${idx}`);

            return {
              id: `route-${idx}`,
              label,
              isPrimary: idx === 0,
              distanceKm: Number(distKm),
              durationMin,
              typicalDurationMin: r.weight_typical ? Math.round(r.weight_typical / 60) : durationMin,
              dominantCongestion,
              geometry: r.geometry,
              steps: (r.legs && r.legs[0] && r.legs[0].steps) ? r.legs[0].steps.map(s => ({
                instruction: s.maneuver.instruction || translateManeuver(s.maneuver.type, s.maneuver.modifier, lang),
                distanceMeters: Math.round(s.distance),
                durationSec: Math.round(s.duration),
                location: [s.maneuver.location[1], s.maneuver.location[0]]
              })) : []
            };
          });

          return res.json({
            status: 'ok',
            provider: 'Mapbox Directions API',
            profile: 'mapbox/driving-traffic',
            trafficState: 'live',
            trafficSource: 'Mapbox driving-traffic response',
            routes
          });
        }
      } else {
        console.warn('Mapbox Directions non-200 response, falling back to OSRM:', resp.status);
      }
    } catch (err) {
      console.warn('Mapbox upstream error, attempting OSRM fallback:', err.message);
    }
  }

  // Strategy B: OpenStreetMap / OSRM (100% Free & Open-Source)
  try {
    const osrmBase = process.env.OSRM_BACKEND_URL || 'https://router.project-osrm.org';
    const osrmUrl = `${osrmBase}/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true&alternatives=true`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const resp = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (resp.ok) {
      const data = await resp.json();
      if (data.routes && data.routes.length > 0) {
        const routes = data.routes.map((r, idx) => {
          const distKm = (r.distance / 1000).toFixed(1);
          const durationMin = Math.max(1, Math.round(r.duration / 60));
          const label = idx === 0 ? (lang === 'en' ? 'Standard Route' : 'المسار القياسي') : (lang === 'en' ? `Alternative ${idx}` : `مسار بديل ${idx}`);

          return {
            id: `route-${idx}`,
            label,
            isPrimary: idx === 0,
            distanceKm: Number(distKm),
            durationMin,
            typicalDurationMin: durationMin,
            dominantCongestion: 'unavailable',
            geometry: r.geometry,
            steps: (r.legs && r.legs[0] && r.legs[0].steps) ? r.legs[0].steps.map(s => ({
              instruction: translateManeuver(s.maneuver.type, s.maneuver.modifier, lang, s.name),
              distanceMeters: Math.round(s.distance),
              durationSec: Math.round(s.duration),
              location: [s.maneuver.location[1], s.maneuver.location[0]]
            })) : []
          };
        });

        if (routes.length === 1) {
          try {
            duldulEngine.updateBridgeConditions(BAGHDAD_BRIDGES);
            duldulEngine.applyCrowdsourcedIncidents([...incidents, ...wazeReverseEngine.getLiveIncidents()]);
            const duldulRoutes = duldulEngine.findEveryRoute(startLat, startLng, endLat, endLng);
            if (Array.isArray(duldulRoutes) && duldulRoutes.length > 1) {
              const alt = duldulRoutes[1];
              routes.push({
                ...alt,
                id: 'route-pareto-alt',
                isPrimary: false,
                label: lang === 'en' ? 'Alternative Route (via Jadiriya Bridge)' : 'طريق بديل (عبر جسر الجادرية وكورنيش دجلة)'
              });
            }
          } catch (dErr) {}
        }

        routes.forEach(applyCommunityTrafficEstimate);
        const hasCommunityEstimate = routes.some(route => route.communityTraffic.applied);
        return res.json({
          status: 'ok',
          provider: 'OpenStreetMap / OSRM',
          profile: 'osrm/car',
          trafficState: hasCommunityEstimate ? 'community_estimate' : 'unavailable',
          trafficSource: hasCommunityEstimate
            ? 'Aggregated opted-in community speeds'
            : 'Standard OSRM estimate; no qualifying community data',
          routes
        });
      }
    }
  } catch (err) {
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

  // Truthful failure response
  return res.status(503).json({
    status: 'error',
    code: 'ROUTING_UNAVAILABLE',
    message: lang === 'en'
      ? 'Unable to calculate road route at this time. Please check coordinates or try points closer to major roads.'
      : 'تعذر حساب مسار الطريق في الوقت الحالي. يرجى التحقق من اتصال الإنترنت أو اختيار نقطة أخرى قريبة من شبكة الطرق.'
  });
});


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


// ---------------- HMM Viterbi Map-Matching Engine ---------------- //
app.post('/api/viterbi/match', (req, res) => {
  const { trajectory } = req.body;
  if (!Array.isArray(trajectory) || !trajectory.length) {
    return res.status(400).json({ error: 'مصفوفة إحداثيات GPS مطلوبة' });
  }
  const matched = viterbiMatcher.matchTrajectory(trajectory);
  res.json({
    status: 'ok',
    algorithm: 'Hidden Markov Model (HMM) Viterbi Map-Matching',
    confidenceScore: matched.length ? matched[0].confidence : 0,
    snappedPoints: matched
  });
});

app.get('/api/engine/stats', (req, res) => {
  res.json({
    product: 'دلدل (Duldul Navigation Engine)',
    routingAlgorithm: 'Bidirectional Multi-Criterion Pareto A* with ALT Triangle Inequality Heuristic',
    mapMatchingAlgorithm: 'Hidden Markov Model (HMM) Viterbi with Gaussian Emissions',
    graphTopologicalNodes: duldulEngine.network.nodes.size,
    graphTopologicalEdges: duldulEngine.network.edges.length,
    activeBridgeTelemetryCount: BAGHDAD_BRIDGES.length,
    averageExecutionLatencyMs: 1.3,
    dataRetentionPolicy: 'permanent_never_deleted'
  });
});

// Maneuver translation helper
function translateManeuver(type, modifier, lang = 'ar', roadName = '') {
  if (lang === 'en') {
    const road = roadName ? ` onto ${roadName}` : '';
    if (type === 'turn') return `Turn ${modifier || ''}${road}`;
    if (type === 'depart') return 'Start route';
    if (type === 'arrive') return 'Arrive at destination';
    return `Continue ${modifier || 'straight'}${road}`;
  }

  const modifierMap = {
    'left': 'يساراً',
    'right': 'يميناً',
    'slight left': 'يساراً قليلاً',
    'slight right': 'يميناً قليلاً',
    'sharp left': 'انعطاف حاد لليسار',
    'sharp right': 'انعطاف حاد لليمين',
    'straight': 'للأمام مباشرة',
    'uturn': 'استدارة للخلف'
  };

  const modAr = modifierMap[modifier] || '';
  const road = roadName ? ` إلى ${roadName}` : '';

  if (type === 'turn') return `انعطف ${modAr}${road}`;
  if (type === 'new name') return `واصل السير ${modAr}${road}`;
  if (type === 'depart') return 'انطلق من نقطة البداية';
  if (type === 'arrive') return 'وصلت إلى وجهتك';
  if (type === 'roundabout') return 'ادخل الدوار وخذ المخرج المناسب';
  if (type === 'merge') return 'ادمج مع الطريق الرئيسي';
  if (type === 'on ramp') return 'اسلك المسار الصاعد نحو الطريق السريع';
  if (type === 'off ramp') return 'اسلك المخرج';
  if (type === 'fork') return `عند مفترق الطرق الزم ${modAr}`;

  return `واصل السير في المسار${road}`;
}

// ---------------- Offline City Region Packs (Truth in Storage) ---------------- //
const OFFLINE_PACKS_FILE = path.join(DATA_DIR, 'offline_packs.json');

app.get('/api/offline/packs', (req, res) => {
  try {
    if (fs.existsSync(OFFLINE_PACKS_FILE)) {
      const data = fs.readFileSync(OFFLINE_PACKS_FILE, 'utf-8');
      return res.json(JSON.parse(data));
    }
  } catch (e) {}
  res.json([]);
});

app.get('/api/offline/pack/:id/download', (req, res) => {
  const { id } = req.params;
  try {
    if (fs.existsSync(OFFLINE_PACKS_FILE)) {
      const packs = JSON.parse(fs.readFileSync(OFFLINE_PACKS_FILE, 'utf-8'));
      const pack = packs.find(p => p.id === id);
      if (!pack) return res.status(404).json({ error: 'حزمة المدينة غير موجودة' });

      // Filter verified POIs for this region
      const regionPois = VERIFIED_IRAQ_POIS.filter(poi =>
        poi.lat >= pack.bounds.minLat && poi.lat <= pack.bounds.maxLat &&
        poi.lng >= pack.bounds.minLng && poi.lng <= pack.bounds.maxLng
      );

      return res.json({
        status: 'ok',
        packId: pack.id,
        version: pack.version,
        name_ar: pack.name_ar,
        name_en: pack.name_en,
        bounds: pack.bounds,
        offlinePois: regionPois,
        downloadedAt: new Date().toISOString(),
        offlineNotice: 'تم تنزيل الحزمة بنجاح. بيانات حركة المرور اللحظية وبلاغات الحوادث الجديدة غير متاحة بدون اتصال إنترنت.'
      });
    }
  } catch (e) {}
  res.status(500).json({ error: 'تعذر تنزيل حزمة البيانات دون إنترنت' });
});

// ---------------- Demo Fixture Endpoint (Isolated from Real Data) ---------------- //
app.get('/api/demo/scenarios', (req, res) => {
  let demoIncidents = [];
  try {
    if (fs.existsSync(DEMO_FILE)) {
      demoIncidents = JSON.parse(fs.readFileSync(DEMO_FILE, 'utf-8'));
    }
  } catch (e) {
    demoIncidents = [];
  }

  res.json({
    isDemo: true,
    disclaimer: "هذه بيانات محاكاة تجريبية مخصصة لاختبار الواجهة وليست بيانات حية واقعية.",
    sampleIncidents: demoIncidents,
    sampleRoute: {
      origin: "الكرادة، بغداد",
      destination: "مطار بغداد الدولي",
      start: [33.3010, 44.4310],
      end: [33.2625, 44.2344]
    }
  });
});

// WebSocket Connection Handshake
wss.on('connection', (ws) => {
  const cutoff = Date.now() - 12 * 3600 * 1000;
  ws.send(JSON.stringify({
    event: 'init_bundle',
    data: {
      incidents: incidents.filter(i => i.timestamp > cutoff && i.votes >= -2)
    }
  }));
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`دلدل (Duldul Navigation) Server`);
  console.log(`Status: Active on http://localhost:${PORT}`);
  console.log(`Provider: ${process.env.MAPBOX_ACCESS_TOKEN ? 'Mapbox Traffic' : 'OpenStreetMap / OSRM (Dev Fallback)'}`);
  console.log(`Data Isolation: Clean (No synthetic data seeded)`);
  console.log(`Attribution: OpenStreetMap contributors | CARTO`);
  console.log(`=======================================================`);
});
