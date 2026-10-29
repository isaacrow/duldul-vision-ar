async function findRoutingUrl() {
  const url = 'https://web-assets.waze.com/livemap/prod/livemap-1d8e7dc9c76a07bfa639.js';
  const res = await fetch(url);
  const text = await res.text();

  // Search around rawRoutingResponse or routingRequest
  const regex = /.{0,100}(?:routingRequest|routingManager|row-RoutingManager|web-routing|RoutingManager).{0,100}/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    console.log('Match:', match[0]);
  }
}

findRoutingUrl();
