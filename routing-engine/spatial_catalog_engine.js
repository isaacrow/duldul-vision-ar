/**
 * Duldul Spatial Computing & Tesla-Style Vision Catalog Engine
 * Stores and transforms 6DoF AR spatial points into real-world geographic coordinates
 * with 1.5-meter spatial deduplication and permanent persistence.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SPATIAL_CATALOG_FILE = path.join(__dirname, '..', 'data', 'spatial_catalog_forever.json');

// Metric offset to Geographic coordinates transformation
function arToGeoCoordinates(originLat, originLng, headingDegrees, arX, arY, arZ) {
  // Heading in radians (0 = North, 90 = East, 180 = South, 270 = West)
  const headingRad = (headingDegrees * Math.PI) / 180;
  
  // In AR camera frame: +X is right, +Y is up, -Z is forward in front of camera
  // Ground forward distance = -arZ, ground lateral distance = arX
  const forwardMeters = -arZ;
  const lateralMeters = arX;

  // Rotate metric offsets by camera heading
  const deltaNorth = forwardMeters * Math.cos(headingRad) - lateralMeters * Math.sin(headingRad);
  const deltaEast  = forwardMeters * Math.sin(headingRad) + lateralMeters * Math.cos(headingRad);

  // 1 degree latitude ~= 111,139 meters
  const deltaLat = deltaNorth / 111139;
  // 1 degree longitude ~= 111,139 * cos(lat) meters
  const deltaLng = deltaEast / (111139 * Math.cos((originLat * Math.PI) / 180));

  return {
    latitude: Number((originLat + deltaLat).toFixed(7)),
    longitude: Number((originLng + deltaLng).toFixed(7))
  };
}

function calculate3dDistance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = (p1.y || 0) - (p2.y || 0);
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

class SpatialCatalogEngine {
  constructor() {
    this.pois = [];
    this.loadCatalog();
  }

  loadCatalog() {
    try {
      if (fs.existsSync(SPATIAL_CATALOG_FILE)) {
        const raw = fs.readFileSync(SPATIAL_CATALOG_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          // Reject legacy mock names if any existed
          const legacyNames = ['زارا - الطابق الأرضي', 'صيدلية المنصور المركزية', 'مطعم ومقهى دجلة والفرات'];
          this.pois = data.filter(p => !legacyNames.includes(p.name));
          console.log(`[SpatialCatalog] Loaded ${this.pois.length} genuine spatial POIs from archive.`);
        }
      }
    } catch (err) {
      console.warn('[SpatialCatalog] Failed to load catalog file:', err.message);
      this.pois = [];
    }
  }

  clearCatalog() {
    this.pois = [];
    this.saveCatalog();
  }

  saveCatalog() {
    try {
      const dir = path.dirname(SPATIAL_CATALOG_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(SPATIAL_CATALOG_FILE, JSON.stringify(this.pois, null, 2), 'utf-8');
    } catch (err) {
      console.error('[SpatialCatalog] Failed to save catalog:', err.message);
    }
  }

  /**
   * Ingest a detected spatial POI with 1.5-meter deduplication
   */
  ingestSpatialPoi({ name, confidence = 0.9, category = 'retail', local_ar, originLat, originLng, heading = 0, floor_level = 1 }) {
    if (!name || !local_ar) return null;

    const legacyNames = ['زارا - الطابق الأرضي', 'صيدلية المنصور المركزية', 'مطعم ومقهى دجلة والفرات'];
    if (legacyNames.includes(name)) {
      return { action: 'rejected', reason: 'legacy_mock_data_blocked' };
    }

    const distMeters = Math.sqrt(
      (local_ar.x * local_ar.x) + 
      ((local_ar.y || 0) * (local_ar.y || 0)) + 
      (local_ar.z * local_ar.z)
    );

    // Calculate estimated geographic coordinates if origin provided
    let estimatedGeo = { latitude: originLat || 33.3152, longitude: originLng || 44.3661 };
    if (originLat && originLng) {
      estimatedGeo = arToGeoCoordinates(originLat, originLng, heading, local_ar.x, local_ar.y, local_ar.z);
    }

    // Deduplication: look for existing POI within 1.5 meters with similar name
    const DEDUP_RADIUS_METERS = 1.5;
    const existing = this.pois.find(p => {
      const dist = calculate3dDistance(p.spatial_coordinates.local_ar, local_ar);
      const nameSimilarity = p.name.includes(name) || name.includes(p.name);
      return dist <= DEDUP_RADIUS_METERS || (dist <= 3.0 && nameSimilarity);
    });

    const now = Date.now();

    if (existing) {
      // Merge observation
      existing.name = name.length > existing.name.length ? name : existing.name;
      existing.confidence = Math.max(existing.confidence, confidence);
      existing.visual_anchor.distance_meters = Number(distMeters.toFixed(2));
      existing.visual_anchor.last_seen_timestamp = now;
      existing.spatial_coordinates.estimated_geo = estimatedGeo;
      this.saveCatalog();
      return { action: 'merged', poi: existing };
    }

    const newPoi = {
      id: `sp-${crypto.randomUUID().slice(0, 8)}`,
      name,
      confidence: Number(confidence.toFixed(2)),
      category: category || 'retail',
      spatial_coordinates: {
        local_ar: {
          x: Number(local_ar.x.toFixed(2)),
          y: Number((local_ar.y || 0).toFixed(2)),
          z: Number(local_ar.z.toFixed(2))
        },
        estimated_geo: estimatedGeo,
        floor_level: floor_level || 1
      },
      visual_anchor: {
        distance_meters: Number(distMeters.toFixed(2)),
        first_seen_timestamp: now,
        last_seen_timestamp: now
      }
    };

    this.pois.unshift(newPoi);
    this.saveCatalog();
    return { action: 'created', poi: newPoi };
  }

  getPois(filterCategory = null) {
    if (filterCategory) {
      return this.pois.filter(p => p.category === filterCategory);
    }
    return this.pois;
  }

  getStats() {
    return {
      totalSpatialPois: this.pois.length,
      storageFile: path.basename(SPATIAL_CATALOG_FILE),
      status: 'active'
    };
  }
}

module.exports = { SpatialCatalogEngine, arToGeoCoordinates };
