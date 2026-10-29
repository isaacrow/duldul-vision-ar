import puppeteer from '../scraper/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function testRealUserFlow() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('request', req => {
    const u = req.url();
    if (!u.endsWith('.png') && !u.endsWith('.jpg') && !u.endsWith('.svg') && !u.endsWith('.woff2') && !u.includes('google-analytics') && !u.includes('doubleclick')) {
      console.log('REQ:', req.method(), u);
    }
  });

  page.on('response', async res => {
    const u = res.url();
    if (!u.endsWith('.png') && !u.endsWith('.jpg') && !u.endsWith('.svg') && !u.endsWith('.woff2') && !u.includes('google-analytics') && !u.includes('doubleclick')) {
      console.log('RES:', res.status(), u);
      try {
        const ct = res.headers()['content-type'] || '';
        if (ct.includes('json') || ct.includes('text')) {
          const body = await res.text();
          if (body.length < 1000) console.log('BODY:', body);
          else console.log('BODY (truncated):', body.substring(0, 300));
        }
      } catch(e){}
    }
  });

  console.log('1. Going to Waze live map...');
  await page.goto('https://www.waze.com/live-map', { waitUntil: 'networkidle2' });

  console.log('2. Inspecting all input elements on page...');
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(el => ({
      tagName: el.tagName,
      type: el.type,
      placeholder: el.placeholder,
      className: el.className,
      id: el.id
    }));
  });
  console.log('Inputs found:', JSON.stringify(inputs, null, 2));

  // If there's an input, type Baghdad
  if (inputs.length > 0) {
    console.log('3. Typing "Baghdad" into first input...');
    await page.type('input', 'Baghdad');
    await new Promise(r => setTimeout(r, 4000));
  }

  await browser.close();
}

testRealUserFlow();
