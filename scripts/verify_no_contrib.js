const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'public', 'index.html');
const html = fs.readFileSync(targetPath, 'utf8');

console.log('HTML tag contains contribution-panel:', html.includes('class="contribution-panel"'));
console.log('HTML contains trafficOptIn in markup:', html.includes('id="trafficOptIn"'));
console.log('HTML contains "ساهم بتحسين حركة الطرق":', html.includes('ساهم بتحسين حركة الطرق'));
