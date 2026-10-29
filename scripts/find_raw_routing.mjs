async function findRawRouting() {
  const url = 'https://web-assets.waze.com/livemap/prod/livemap-1d8e7dc9c76a07bfa639.js';
  const res = await fetch(url);
  const text = await res.text();

  const idx = text.indexOf('rawRoutingResponse');
  if (idx !== -1) {
    console.log('Snippet around rawRoutingResponse:');
    console.log(text.substring(Math.max(0, idx - 300), idx + 300));
  } else {
    console.log('Not found');
  }
}

findRawRouting();
