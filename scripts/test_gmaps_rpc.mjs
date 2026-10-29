async function parseGmapsSearch(query) {
  const url = `https://www.google.com/search?tbm=map&authuser=0&hl=ar&gl=iq&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en;q=0.9'
      }
    });
    console.log('Status:', res.status);
    const raw = await res.text();
    console.log('Length:', raw.length);
    // Google Maps RPC prefixes responses with )]}'
    const cleanJson = raw.replace(/^\)\]\}'/, '').trim();
    const data = JSON.parse(cleanJson);
    console.log('Parsed successfully! Root array length:', data.length);
    console.log('Sample item:', JSON.stringify(data[0]).substring(0, 500));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

parseGmapsSearch('مول المنصور بغداد');
