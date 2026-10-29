const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, '..', 'data', 'iraq_places.json');
const content = fs.readFileSync(p, 'utf8');
const places = JSON.parse(content);
console.log('Places count:', places.length);
console.log('Place 0:', places[0]);
console.log('Place 10:', places[10]);
console.log('Contains \\uFFFD (replacement char):', content.includes('\uFFFD'));
