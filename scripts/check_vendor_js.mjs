async function checkVendorJs() {
  const url = 'https://web-assets.waze.com/livemap/prod/waze-vendor-0cd1c0f8267049380d61.js';
  const res = await fetch(url);
  const text = await res.text();
  console.log('Vendor length:', text.length);

  const routingApi = text.match(/https:\/\/[^"'\s]*routing[^"'\s]*/gi) || [];
  console.log('Routing URLs:', Array.from(new Set(routingApi)));

  const apis = text.match(/https:\/\/www\.waze\.com\/[a-zA-Z0-9_\-\/]+/g) || [];
  console.log('Waze URLs:', Array.from(new Set(apis)).slice(0, 20));
}

checkVendorJs();
