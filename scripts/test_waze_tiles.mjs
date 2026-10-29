async function testWazeTiles() {
  const z = 12, x = 2549, y = 1655;
  const layers = [
    'live/base',
    'live/traffic',
    'live/jams',
    'live/alerts',
    'live/hazards',
    'base',
    'traffic',
    'routing',
    'live/user'
  ];

  for (const layer of layers) {
    const url = `https://www.waze.com/row-tiles/${layer}/${z}/${x}/${y}/tile.png?highres=true`;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': 'https://www.waze.com/live-map'
        }
      });
      console.log(`[${res.status}] ${layer}: ${res.headers.get('content-type')}`);
    } catch (e) {
      console.log(`[ERR] ${layer}: ${e.message}`);
    }
  }
}

testWazeTiles();
