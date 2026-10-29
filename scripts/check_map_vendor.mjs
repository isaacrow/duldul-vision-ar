async function checkMapVendor() {
  const url = 'https://web-assets.waze.com/livemap/prod/vendor-cf486a61c7f2b29f516d.js';
  const res = await fetch(url);
  const text = await res.text();
  console.log('Vendor length:', text.length);

  const maplibs = ['openlayers', 'ol.', 'leaflet', 'L.', 'mapboxgl', 'maplibre', 'google.maps'];
  for (const lib of maplibs) {
    if (text.includes(lib)) console.log('Contains maplib:', lib);
  }

  const tileMatches = text.match(/row-tiles[^\s"'`]*/g) || [];
  console.log('Tile matches:', Array.from(new Set(tileMatches)));
}

checkMapVendor();
