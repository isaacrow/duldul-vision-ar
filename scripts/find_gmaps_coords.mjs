import fs from 'fs';

async function findCoords() {
  const url = `https://www.google.com/search?tbm=map&authuser=0&hl=ar&gl=iq&q=${encodeURIComponent('مول المنصور بغداد')}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
  });
  const raw = await res.text();
  const cleanJson = raw.replace(/^\)\]\}'/, '').trim();
  const data = JSON.parse(cleanJson);

  fs.writeFileSync('./scripts/gmaps_dump.json', JSON.stringify(data, null, 2), 'utf-8');

  // Search for any numbers close to Mansour Mall: lat ~33.31, lng ~44.35
  const numbers = [];
  function dig(val, path = '') {
    if (typeof val === 'number') {
      if ((val > 33.0 && val < 34.0) || (val > 44.0 && val < 45.0)) {
        numbers.push({ val, path });
      }
    } else if (Array.isArray(val)) {
      val.forEach((item, idx) => dig(item, `${path}[${idx}]`));
    } else if (typeof val === 'object' && val !== null) {
      Object.keys(val).forEach(k => dig(val[k], `${path}.${k}`));
    }
  }

  dig(data);
  console.log('Numbers matched:', JSON.stringify(numbers, null, 2));
}

findCoords();
