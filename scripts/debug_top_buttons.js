const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'public', 'index.html');
const html = fs.readFileSync(targetPath, 'utf8');

const matches = [];
['بانتظار GPS', 'توسيط', 'مشاركة', 'btn-stop-drive', 'cockpit-action-btn'].forEach(term => {
  const idx = html.indexOf(term);
  console.log(term, '=>', idx);
});
