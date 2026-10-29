import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_FILE = path.join(__dirname, 'places_iraq.json');

export async function scrapeCategory(query, maxItems = 10) {
  console.log(`\n🔍 Searching Google Maps for: "${query}"...`);

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--lang=ar-IQ,ar,en-US',
      '--window-size=1280,800'
    ]
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=ar`;

  try {
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 35000 });

    const feedSelector = 'div[role="feed"]';
    try {
      await page.waitForSelector(feedSelector, { timeout: 10000 });
    } catch {
      console.log('⚠️ Feed container not found directly, checking for results...');
    }

    // Scroll feed to load items
    for (let i = 0; i < 3; i++) {
      await page.evaluate((sel) => {
        const feed = document.querySelector(sel);
        if (feed) feed.scrollBy(0, 1000);
      }, feedSelector);
      await new Promise(r => setTimeout(r, 1200));
    }

    // Extract items
    const rawItems = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('div[role="article"]');

      cards.forEach(card => {
        const titleEl = card.querySelector('.fontHeadlineSmall, [aria-label]');
        const name = titleEl ? (titleEl.getAttribute('aria-label') || titleEl.innerText) : null;
        const linkEl = card.querySelector('a[href*="/maps/place/"]');
        const href = linkEl ? linkEl.getAttribute('href') : null;

        results.push({
          name: name ? name.trim() : null,
          url: href
        });
      });

      return results;
    });

    console.log(`📦 Found ${rawItems.length} raw cards from Google Maps.`);

    const cleanedResults = [];
    for (const item of rawItems) {
      if (!item.name || !item.url) continue;

      let lat = null;
      let lng = null;

      const coordMatch = item.url.match(/!3d([0-9.-]+)!4d([0-9.-]+)/) || item.url.match(/@([0-9.-]+),([0-9.-]+)/);
      if (coordMatch) {
        lat = parseFloat(coordMatch[1]);
        lng = parseFloat(coordMatch[2]);
      }

      cleanedResults.push({
        id: `gmaps-${Buffer.from(item.name).toString('base64').substring(0, 10)}`,
        name: item.name,
        queryCategory: query,
        lat,
        lng,
        country: 'Iraq',
        googleMapsUrl: item.url,
        scrapedAt: new Date().toISOString()
      });

      if (cleanedResults.length >= maxItems) break;
    }

    await browser.close();
    return cleanedResults;
  } catch (err) {
    console.error(`❌ Error scraping "${query}":`, err.message);
    await browser.close();
    return [];
  }
}

export async function runScraper() {
  const queries = [
    'مطاعم في الكرادة بغداد',
    'مستشفيات في بغداد'
  ];

  let allPlaces = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      allPlaces = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
    } catch {}
  }

  for (const q of queries) {
    const places = await scrapeCategory(q, 8);
    allPlaces.push(...places);
  }

  const seen = new Set();
  const uniquePlaces = allPlaces.filter(p => {
    const key = `${p.name}-${p.lat}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(uniquePlaces, null, 2), 'utf-8');
  console.log(`\n✅ Finished scraping! Saved ${uniquePlaces.length} verified places to: ${OUTPUT_FILE}`);
}

runScraper();
