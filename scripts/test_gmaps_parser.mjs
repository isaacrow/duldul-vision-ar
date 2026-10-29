async function testIraqiPlaces(query) {
  const url = `https://www.google.com/search?tbm=map&authuser=0&hl=ar&gl=iq&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
  });
  const raw = await res.text();
  const cleanJson = raw.replace(/^\)\]\}'/, '').trim();
  const data = JSON.parse(cleanJson);

  let lat = null;
  let lng = null;
  let name = query;

  // Pattern 1: [1][0] contains [viewport, lng, lat, zoom]
  if (data[1] && data[1][0] && typeof data[1][0][2] === 'number' && typeof data[1][0][1] === 'number') {
    lat = data[1][0][2];
    lng = data[1][0][1];
  }

  // Pattern 2: [0][1][0][14][9] contains [..., ..., lat, lng]
  if (!lat && data[0] && data[0][1] && data[0][1][0] && data[0][1][0][14] && data[0][1][0][14][9]) {
    const coords = data[0][1][0][14][9];
    if (typeof coords[2] === 'number' && typeof coords[3] === 'number') {
      lat = coords[2];
      lng = coords[3];
    }
  }

  // Pattern 3: place title from [0][1][0][14][11]
  let title = query;
  try {
    if (data[0][1][0][14][11]) title = data[0][1][0][14][11];
  } catch(e){}

  console.log(`Query: "${query}" -> Found: "${title}" @ Lat: ${lat}, Lng: ${lng}`);
  return { title, lat, lng };
}

async function run() {
  await testIraqiPlaces('مستشفى اليرموك التعليمي بغداد');
  await testIraqiPlaces('سوق الشورجة بغداد');
  await testIraqiPlaces('بوابة عشتار الأثرية الحلة');
  await testIraqiPlaces('جامعة الكوفة النجف');
}
run();
