const fs = require('fs');
const path = 'C:/Users/MK/.gemini/antigravity/scratch/waze-iraq/public/index.html';
let html = fs.readFileSync(path, 'utf8');

if (!html.includes('/vendor/tf.min.js')) {
  html = html.replace(
    '<script src="/vendor/local_road_ai_model.js"></script>',
    '<script src="/vendor/tf.min.js"></script>\n  <script src="/vendor/coco-ssd.min.js"></script>\n  <script src="/vendor/local_road_ai_model.js"></script>'
  );
  console.log('Added tf.min.js and coco-ssd.min.js to index.html');
}

fs.writeFileSync(path, html, 'utf8');
console.log('Patched index.html with real neural network scripts');
