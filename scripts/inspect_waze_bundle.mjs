async function inspectWazeJsBundle() {
  const url = 'https://web-assets.waze.com/livemap/prod/livemap-1d8e7dc9c76a07bfa639.js';
  console.log('Downloading Waze JS bundle...');
  const res = await fetch(url);
  const text = await res.text();
  console.log('Bundle length:', text.length);

  // Search for API paths
  const apiMatches = text.match(/\/api\/[a-zA-Z0-9_\-\/]+/g) || [];
  console.log('API Paths found:', Array.from(new Set(apiMatches)));

  // Search for routing paths
  const routeMatches = text.match(/[\/a-zA-Z0-9_\-]+Routing[a-zA-Z0-9_\-\/]*/gi) || [];
  console.log('Routing keywords found:', Array.from(new Set(routeMatches)).slice(0, 20));

  // Search for traffic / alerts paths
  const trafficMatches = text.match(/"[^"]*(?:georss|traffic|alerts|jams|hazard)[^"]*"/gi) || [];
  console.log('Traffic keywords found:', Array.from(new Set(trafficMatches)).slice(0, 20));
}

inspectWazeJsBundle();
