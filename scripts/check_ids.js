const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

// Find all document.getElementById('...')
const regex = /getElementById\(['"]([^'"]+)['"]\)/g;
const uniqueIds = new Set();
let match;
while ((match = regex.exec(html)) !== null) {
  uniqueIds.add(match[1]);
}

console.log('Total unique IDs referenced in JS:', uniqueIds.size);
const missing = [];
for (const id of uniqueIds) {
  const hasId = html.includes(`id="${id}"`) || html.includes(`id='${id}'`);
  if (!hasId) {
    missing.push(id);
  }
}

console.log('MISSING IDs in HTML markup:', missing);
