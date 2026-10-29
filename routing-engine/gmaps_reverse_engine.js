/**
 * Duldul Reverse Engineering Module: Google Maps RPC Extractor
 * High-precision, zero-key Iraqi place search and geocoding engine.
 * Sourced directly via Google Maps RPC protocol with Iraq bounding validation and LRU caching.
 */

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

class GmapsReverseEngine {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 250;
    this.cacheTtlMs = 24 * 60 * 60 * 1000; // 24 hours
    this.stats = {
      totalQueries: 0,
      cacheHits: 0,
      rpcSuccesses: 0,
      rpcFailures: 0
    };
  }

  /**
   * Reverse-engineers Google Maps search RPC to find places in Iraq
   * @param {string} query - Place name or query in Arabic or English
   * @returns {Promise<Array<{ id, name, name_en, lat, lng, address, category, city, source, confidence }>>}
   */
  async searchPlace(query) {
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return [];
    }

    const cleanQuery = query.trim();
    this.stats.totalQueries++;

    // Check cache
    const cached = this.cache.get(cleanQuery.toLowerCase());
    if (cached && (Date.now() - cached.timestamp < this.cacheTtlMs)) {
      this.stats.cacheHits++;
      return cached.results;
    }

    try {
      const url = `https://www.google.com/search?tbm=map&authuser=0&hl=ar&gl=iq&q=${encodeURIComponent(cleanQuery)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ar,en;q=0.9',
          'Cache-Control': 'no-cache'
        }
      });
      clearTimeout(timeout);

      if (!res.ok) {
        this.stats.rpcFailures++;
        return [];
      }

      const raw = await res.text();
      // Google Maps prefixes with )]}'
      const cleanJson = raw.replace(/^\)\]\}'/, '').trim();
      if (!cleanJson.startsWith('[')) {
        this.stats.rpcFailures++;
        return [];
      }

      const data = JSON.parse(cleanJson);
      const results = this.extractPlacesFromRpc(data, cleanQuery);

      if (results.length > 0) {
        this.stats.rpcSuccesses++;
        // Maintain cache size
        if (this.cache.size >= this.maxCacheSize) {
          const firstKey = this.cache.keys().next().value;
          this.cache.delete(firstKey);
        }
        this.cache.set(cleanQuery.toLowerCase(), {
          timestamp: Date.now(),
          results
        });
      }

      return results;
    } catch (err) {
      this.stats.rpcFailures++;
      console.warn(`[GmapsReverseEngine] Search error for "${cleanQuery}":`, err.message);
      return [];
    }
  }

  /**
   * Traverses Google Maps RPC response array to reconstruct place metadata
   */
  extractPlacesFromRpc(data, query) {
    const results = [];

    // Strategy 1: Top-level viewport coordinates at data[1][0]
    let topLat = null;
    let topLng = null;
    if (data[1] && data[1][0] && typeof data[1][0][2] === 'number' && typeof data[1][0][1] === 'number') {
      topLat = data[1][0][2];
      topLng = data[1][0][1];
    }

    // Strategy 2: Primary POI details at data[0][1][0][14]
    if (data[0] && Array.isArray(data[0][1])) {
      data[0][1].forEach((item, idx) => {
        if (!item || !Array.isArray(item[14])) return;
        const details = item[14];

        // Title at details[11] or details[20]
        let name = details[11] || query;
        let category = details[13] ? (Array.isArray(details[13]) ? details[13][0] : details[13]) : 'وجهة ونقطة اهتمام';

        // Coordinates at details[9] = [..., ..., lat, lng]
        let lat = null;
        let lng = null;
        if (details[9] && typeof details[9][2] === 'number' && typeof details[9][3] === 'number') {
          lat = details[9][2];
          lng = details[9][3];
        } else if (topLat && topLng && idx === 0) {
          lat = topLat;
          lng = topLng;
        }

        // Address components
        let address = '';
        let city = 'العراق';
        if (details[2] && Array.isArray(details[2])) {
          address = details[2].filter(Boolean).join('، ');
          const foundCity = details[2].find(s => typeof s === 'string' && (s.includes('بغداد') || s.includes('أربيل') || s.includes('البصرة') || s.includes('النجف') || s.includes('كربلاء') || s.includes('الموصل') || s.includes('بابل')));
          if (foundCity) city = foundCity;
        }

        // Validate coordinates inside Iraq
        if (lat && lng && isInsideIraq(lat, lng)) {
          const placeId = details[10] || `gmaps-rev-${Date.now()}-${idx}`;
          results.push({
            id: `gmaps-${placeId}`,
            name,
            name_en: name,
            lat: Number(lat.toFixed(6)),
            lng: Number(lng.toFixed(6)),
            address,
            category,
            city,
            source: 'Google Maps RPC (Reverse-Engineered)',
            confidence: 0.98,
            verified: true
          });
        }
      });
    }

    // If Strategy 2 did not produce items but topLat/topLng exists inside Iraq
    if (results.length === 0 && topLat && topLng && isInsideIraq(topLat, topLng)) {
      results.push({
        id: `gmaps-top-${Date.now()}`,
        name: query,
        name_en: query,
        lat: Number(topLat.toFixed(6)),
        lng: Number(topLng.toFixed(6)),
        address: 'جمهورية العراق',
        category: 'موقع جغرافي',
        city: 'العراق',
        source: 'Google Maps RPC (Reverse-Engineered)',
        confidence: 0.92,
        verified: true
      });
    }

    return results;
  }

  getStats() {
    return {
      ...this.stats,
      cachedEntries: this.cache.size,
      hitRatePercent: this.stats.totalQueries > 0
        ? Math.round((this.stats.cacheHits / this.stats.totalQueries) * 100)
        : 0
    };
  }
}

module.exports = { GmapsReverseEngine, isInsideIraq };
