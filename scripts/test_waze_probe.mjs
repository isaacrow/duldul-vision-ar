import puppeteer from '../scraper/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function testWaze() {
  console.log('Testing Edge Headless launch...');
  try {
    const browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1280,800',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      ]
    });

    console.log('Edge launched! Opening page...');
    const page = await browser.newPage();
    
    // Listen to network responses
    const captured = [];
    page.on('response', async res => {
      const url = res.url();
      if (url.includes('waze') && (url.includes('georss') || url.includes('Routing') || url.includes('web-routing') || url.includes('api') || url.includes('descartes'))) {
        console.log('Captured Response:', res.status(), url.substring(0, 100));
        try {
          const text = await res.text();
          captured.push({ url, status: res.status(), length: text.length, sample: text.substring(0, 200) });
        } catch(e) {}
      }
    });

    // Navigate to Waze live map centered on Baghdad
    console.log('Navigating to Waze LiveMap Baghdad...');
    await page.goto('https://www.waze.com/live-map?lat=33.3152&lng=44.3661&zoom=12', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('Page loaded! Title:', await page.title());
    console.log('Captured endpoints count:', captured.length);
    for (const c of captured) {
      console.log('--> Endpoint:', c.url);
      console.log('    Sample:', c.sample);
    }

    // Now let's test evaluating in the browser context (has all cookies/tokens)
    const georssResult = await page.evaluate(async () => {
      try {
        // Iraq bounding box: Baghdad region
        const testUrl = 'https://www.waze.com/live-map/api/georss?top=33.45&bottom=33.2&left=44.2&right=44.55&env=row&types=alerts,traffic';
        const res = await fetch(testUrl);
        const data = await res.json();
        return { success: true, alertsCount: (data.alerts || []).length, jamsCount: (data.jams || []).length, data };
      } catch (err) {
        return { success: false, error: err.message };
      }
    });

    console.log('Direct in-browser fetch of georss:', JSON.stringify(georssResult, null, 2).substring(0, 500));

    await browser.close();
  } catch (err) {
    console.error('Test error:', err);
  }
}

testWaze();
