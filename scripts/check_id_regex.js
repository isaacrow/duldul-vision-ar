const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(targetPath, 'utf8');

const idMatches = [...html.matchAll(/id=['"]([^'"]+)['"]/g)].map(m => m[1]);
console.log('Is routeEndpointsBox in idMatches?', idMatches.includes('routeEndpointsBox'));
const idx = html.indexOf('routeEndpointsBox');
if (idx !== -1) {
  console.log('Snippet:', html.slice(idx - 20, idx + 40));
} else {
  console.log('routeEndpointsBox NOT FOUND');
}
