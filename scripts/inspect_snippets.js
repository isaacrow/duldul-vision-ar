const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');

// Find all occurrences of startNavigationDrive and related functions
function printSnippet(title, searchStr, len = 40) {
  console.log(`\n=================== ${title} ===================`);
  const idx = html.indexOf(searchStr);
  if (idx === -1) {
    console.log('NOT FOUND: ' + searchStr);
    return;
  }
  const lines = html.substring(idx - 200, idx + 1200).split('\n');
  console.log(lines.slice(0, len).join('\n'));
}

printSnippet('startNavigationDrive definition', 'function startNavigationDrive()');
printSnippet('selectRoute definition', 'function selectRoute(');
printSnippet('calculateRouteTo definition', 'async function calculateRouteTo(');
printSnippet('updateCockpitArrivalMetrics definition', 'function updateCockpitArrivalMetrics(');
