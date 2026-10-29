const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

files.forEach(f => {
  const p = path.join(dataDir, f);
  const content = fs.readFileSync(p, 'utf8');
  const hasMojibake = content.includes('O"') || content.includes('O');
  console.log(`${f}: ${content.length} bytes, Mojibake detected: ${hasMojibake}`);
});
