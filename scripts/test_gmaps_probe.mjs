import puppeteer from '../scraper/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function testGoogleMapsProbe() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('response', async res => {
    const u = res.url();
    if (u.includes('google.com/maps/preview') || u.includes('/maps/rpc/') || u.includes('search?tbm=map') || u.includes('directions')) {
      console.log('GMAPS RES:', res.status(), u.substring(0, 120));
      try {
        const text = await res.text();
        console.log('GMAPS SAMPLE:', text.substring(0, 200));
      } catch(e){}
    }
  });

  console.log('Navigating to Google Maps search for Baghdad...');
  await page.goto('https://www.google.com/maps/search/Baghdad/@33.3152,44.3661,12z?hl=ar', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  console.log('Google Maps Page Title:', await page.title());

  // Extract page title and coordinates
  const currentUrl = page.url();
  console.log('Final URL:', currentUrl);

  await browser.close();
}

testGoogleMapsProbe();
