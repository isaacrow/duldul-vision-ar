import puppeteer from '../scraper/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function testWazeSearch() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  });

  const page = await browser.newPage();
  
  page.on('response', async res => {
    const u = res.url();
    if (u.includes('waze.com') && (u.includes('Search') || u.includes('autocomplete') || u.includes('suggest') || u.includes('mozi') || u.includes('routing') || u.includes('RoutingManager'))) {
      console.log('Intercepted API:', res.status(), u);
      try {
        const text = await res.text();
        console.log('Content:', text.substring(0, 300));
      } catch(e){}
    }
  });

  await page.goto('https://www.waze.com/live-map', { waitUntil: 'networkidle2' });

  // Try direct endpoints from inside the page
  const testEndpoints = [
    'https://www.waze.com/SearchServer/mozi?q=Baghdad&lang=ar&lat=33.3152&lon=44.3661',
    'https://www.waze.com/SearchServer/mozi?q=%D8%A8%D8%BA%D8%AF%D8%A7%D8%AF&lang=ar',
    'https://www.waze.com/row-RoutingManager/routingRequest?from=x%3A44.3661+y%3A33.3152&to=x%3A44.0248+y%3A32.6160&returnJSON=true&returnGeometries=true&returnInstructions=true&timeout=60000&nPaths=3',
    'https://www.waze.com/live-map/api/routing?from=x%3A44.3661+y%3A33.3152&to=x%3A44.0248+y%3A32.6160',
    'https://www.waze.com/live-map/api/autocomplete?q=Baghdad&env=row'
  ];

  const results = await page.evaluate(async (urls) => {
    const resList = [];
    for (const url of urls) {
      try {
        const r = await fetch(url);
        const text = await r.text();
        resList.push({ url, status: r.status, text: text.substring(0, 300) });
      } catch (err) {
        resList.push({ url, error: err.message });
      }
    }
    return resList;
  }, testEndpoints);

  console.log('Test Endpoints Results:');
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
}

testWazeSearch();
