const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'public', 'index.html');
const backupPath = path.join(__dirname, '..', 'public', 'index.html.bak');

// Read current file
const currentContent = fs.readFileSync(targetPath, 'utf8');
fs.writeFileSync(backupPath, currentContent, 'utf8');
console.log('Backed up index.html to index.html.bak');
