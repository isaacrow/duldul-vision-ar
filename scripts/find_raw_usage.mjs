async function findRawRoutingUsage() {
  const url = 'https://web-assets.waze.com/livemap/prod/livemap-1d8e7dc9c76a07bfa639.js';
  const res = await fetch(url);
  const text = await res.text();

  let pos = 0;
  while ((pos = text.indexOf('rawRoutingResponse', pos)) !== -1) {
    console.log('--- At pos', pos, '---');
    console.log(text.substring(Math.max(0, pos - 150), pos + 250));
    pos += 18;
  }
}

findRawRoutingUsage();
