const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
const lines = html.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('map.') && !line.includes('//') && !line.includes('openstreetmap.org')) {
    console.log(`L${idx + 1}: ${line.trim()}`);
  }
});
