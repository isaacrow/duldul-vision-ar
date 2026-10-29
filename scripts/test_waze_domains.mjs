const domains = [
  'https://www.waze.com/live-map/api/georss',
  'https://row-georss.waze.com/georss',
  'https://world-georss.waze.com/georss',
  'https://www.waze.com/row-viewproxy/mapproxy/traffic',
  'https://www.waze.com/descartes-livemap/api/v1/alerts',
  'https://www.waze.com/util/snippet/routingRequest',
  'https://feed.waze.com/feed',
  'https://waze.com/api/v1/traffic'
];

async function checkDomains() {
  for (const base of domains) {
    try {
      const url = `${base}?top=33.4&bottom=33.2&left=44.2&right=44.5&env=row`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': 'https://www.waze.com/live-map',
          'Accept': 'application/json, text/plain, */*'
        }
      });
      console.log(`[${res.status}] ${base} (${res.headers.get('content-type')})`);
    } catch (e) {
      console.log(`[ERR] ${base}: ${e.message}`);
    }
  }
}

checkDomains();
