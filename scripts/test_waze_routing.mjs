import puppeteer from '../scraper/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function testWazeRouting() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    ]
  });

  const page = await browser.newPage();
  
  page.on('request', req => {
    const u = req.url();
    if (u.includes('Routing') || u.includes('routing') || u.includes('directions') || u.includes('georss') || u.includes('alerts') || u.includes('autocomplete') || u.includes('search')) {
      console.log('REQUEST:', req.method(), u);
      console.log('Headers:', JSON.stringify(req.headers()));
    }
  });

  page.on('response', async res => {
    const u = res.url();
    if (u.includes('Routing') || u.includes('routing') || u.includes('directions') || u.includes('georss') || u.includes('alerts') || u.includes('autocomplete') || u.includes('search')) {
      console.log('RESPONSE:', res.status(), u);
      try {
        const text = await res.text();
        console.log('BODY:', text.substring(0, 400));
      } catch(e){}
    }
  });

  console.log('Navigating directly to Waze directions URL...');
  // Waze directions URL between Baghdad coords and Karbala coords
  await page.goto('https://www.waze.com/live-map/directions?navigate=yes&to=ll.32.616035%2C44.024876&from=ll.33.315241%2C44.366071', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  console.log('Checking page content and requests after directions navigation...');
  await new Promise(r => setTimeout(r, 6000));

  await browser.close();
}

testWazeRouting();
