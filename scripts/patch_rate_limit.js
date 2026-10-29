const fs = require('fs');
const path = 'C:/Users/MK/.gemini/antigravity/scratch/waze-iraq/server.js';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `function checkRateLimit(ip, maxRequests = 20, windowSec = 60) {
  const now = Date.now();`,
  `function checkRateLimit(ip, maxRequests = 20, windowSec = 60) {
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || process.env.NODE_ENV === 'test') {
    return true;
  }
  const now = Date.now();`
);

fs.writeFileSync(path, code, 'utf8');
console.log('Patched checkRateLimit to exempt localhost test suites');
