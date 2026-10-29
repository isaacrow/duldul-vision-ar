const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const idMatches = [...html.matchAll(/id=["']([^"']+)["']/g)].map(m => m[1]);
const definedIds = new Set(idMatches);

const accessedMatches = [...html.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
const accessedIds = new Set(accessedMatches);

const missing = [];
for (const id of accessedIds) {
  if (!definedIds.has(id)) {
    missing.push(id);
  }
}

console.log('Defined IDs count:', definedIds.size);
console.log('Accessed IDs count:', accessedIds.size);
console.log('MISSING IDs accessed via getElementById:', missing);

// Also check onclick handlers
const onclickMatches = [...html.matchAll(/onclick=["']([^"']+)["']/g)].map(m => m[1]);
console.log('Onclick handlers count:', onclickMatches.length);

const fnCalls = [...new Set(onclickMatches.map(c => c.split('(')[0].trim()))];
console.log('Unique functions called from HTML:', fnCalls);

// Check if these functions exist in script
const missingFns = [];
for (const fn of fnCalls) {
  if (fn.includes(';')) {
    // Multiple statements
    const subFns = fn.split(';').map(s => s.trim().split('(')[0].trim()).filter(Boolean);
    for (const sf of subFns) {
      if (!html.includes('function ' + sf) && !html.includes(sf + ' =') && !html.includes(sf + '=') && !['document', 'console', 'window'].some(k => sf.startsWith(k))) {
        missingFns.push(sf);
      }
    }
  } else {
    if (!html.includes('function ' + fn) && !html.includes(fn + ' =') && !html.includes(fn + '=') && !['document', 'console', 'window'].some(k => fn.startsWith(k))) {
      missingFns.push(fn);
    }
  }
}
console.log('MISSING or undefined functions called from onclick:', missingFns);
