import puppeteer from '../scraper/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function inspectAllTraffic() {
  console.log('Launching browser to monitor all requests...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: false, // Let's test headless: false or see what headers/cookies are needed
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    ]
  });

  const page = await browser.newPage();
  const allReqs = [];

  page.on('response', async res => {
    const url = res.url();
    const status = res.status();
    const contentType = res.headers()['content-type'] || '';
    if (url.includes('waze.com') && !url.endsWith('.js') && !url.endsWith('.css') && !url.endsWith('.png') && !url.endsWith('.svg') && !url.endsWith('.woff2')) {
      console.log(`[${status}] ${contentType} -> ${url}`);
      try {
        if (contentType.includes('json') || contentType.includes('javascript') || contentType.includes('xml')) {
          const text = await res.text();
          allReqs.push({ url, status, body: text.substring(0, 300) });
        }
      } catch(e){}
    }
  });

  console.log('Navigating to LiveMap...');
  await page.goto('https://www.waze.com/live-map', { waitUntil: 'networkidle2', timeout: 35000 });

  // Let's interact with search bar: search Baghdad
  try {
    console.log('Searching Baghdad on Waze...');
    const searchInput = await page.$('input[type="search"], input[placeholder*="Search"], input[class*="search"]');
    if (searchInput) {
      await searchInput.type('Baghdad', { delay: 100 });
      await page.keyboard.press('Enter');
      await page.waitForTimeout ? page.waitForTimeout(5000) : new Promise(r => setTimeout(r, 5000));
    }
  } catch (err) {
    console.log('Search interaction note:', err.message);
  }

  // Check cookies
  const cookies = await page.cookies();
  console.log('\nCookies acquired from Waze:');
  cookies.forEach(c => console.log(`  ${c.name} = ${c.value.substring(0, 30)}... (domain: ${c.domain})`));

  console.log('\nCaptured JSON/API Responses:');
  allReqs.forEach(r => {
    console.log(`- ${r.status} ${r.url}`);
    console.log(`  Sample: ${r.body.substring(0, 150)}`);
  });

  await browser.close();
}

inspectAllTraffic();
