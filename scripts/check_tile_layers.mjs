async function checkTileLayersInJs() {
  const url = 'https://web-assets.waze.com/livemap/prod/waze-vendor-0cd1c0f8267049380d61.js';
  const res = await fetch(url);
  const text = await res.text();

  const matches = text.match(/\/row-tiles\/[a-zA-Z0-9_\-\/]+/g) || [];
  console.log('Tile patterns in waze-vendor:', Array.from(new Set(matches)));
}

checkTileLayersInJs();
