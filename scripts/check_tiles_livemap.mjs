async function checkTilesInLivemap() {
  const url = 'https://web-assets.waze.com/livemap/prod/livemap-1d8e7dc9c76a07bfa639.js';
  const res = await fetch(url);
  const text = await res.text();

  const matches = text.match(/tile\.png[^\s"']*/g) || [];
  console.log('Matches for tile.png:', Array.from(new Set(matches)));

  const regex = /.{0,60}row-tiles.{0,60}/g;
  let m;
  const snippets = [];
  while ((m = regex.exec(text)) !== null) {
    snippets.push(m[0]);
  }
  console.log('Snippets for row-tiles:', snippets.slice(0, 10));
}

checkTilesInLivemap();
