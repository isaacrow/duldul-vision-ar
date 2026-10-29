async function inspectGmapsStructure(query) {
  const url = `https://www.google.com/search?tbm=map&authuser=0&hl=ar&gl=iq&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'ar,en;q=0.9'
    }
  });
  const raw = await res.text();
  const cleanJson = raw.replace(/^\)\]\}'/, '').trim();
  const data = JSON.parse(cleanJson);

  // Traverse array looking for lat/lng pairs around Iraq bounds (lat: 29-38, lng: 38-49)
  const hits = [];
  function searchCoord(obj, path = '') {
    if (!obj) return;
    if (Array.isArray(obj)) {
      if (obj.length >= 2 && typeof obj[0] === 'number' && typeof obj[1] === 'number') {
        const [a, b] = obj;
        // Check if lat/lng or lng/lat
        if (a >= 29 && a <= 38 && b >= 38 && b <= 49) {
          hits.push({ type: '[lat, lng]', lat: a, lng: b, path });
        } else if (b >= 29 && b <= 38 && a >= 38 && a <= 49) {
          hits.push({ type: '[lng, lat]', lat: b, lng: a, path });
        }
      }
      obj.forEach((item, idx) => searchCoord(item, `${path}[${idx}]`));
    } else if (typeof obj === 'object') {
      Object.keys(obj).forEach(k => searchCoord(obj[k], `${path}.${k}`));
    }
  }

  searchCoord(data);
  console.log('Coordinates identified in Google Maps RPC payload:');
  console.log(JSON.stringify(hits.slice(0, 5), null, 2));

  // Let's also check place name and title
  console.log('\nTop-level strings found:');
  const strings = [];
  function searchStrings(obj, depth = 0) {
    if (depth > 6) return;
    if (typeof obj === 'string' && obj.length > 2 && obj.length < 80) {
      strings.push(obj);
    } else if (Array.isArray(obj)) {
      obj.forEach(i => searchStrings(i, depth + 1));
    }
  }
  searchStrings(data);
  console.log(strings.slice(0, 15));
}

inspectGmapsStructure('مول المنصور بغداد');
