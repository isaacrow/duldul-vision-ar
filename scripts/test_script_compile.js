const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'public', 'index.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Check script execution
const scriptMatch = html.match(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/i);
if (scriptMatch) {
  const code = scriptMatch[1];
  try {
    new Function(code);
    console.log('Script compiles cleanly without syntax error!');
  } catch (e) {
    console.error('Script syntax error:', e);
  }
}
