const https = require('https');
const fs = require('fs');
const path = require('path');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log(`Downloaded ${path.basename(dest)}, size: ${fs.statSync(dest).size} bytes`);
          resolve();
        });
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  const vendorDir = 'C:/Users/MK/.gemini/antigravity/scratch/waze-iraq/public/vendor';
  console.log('Downloading Real TensorFlow.js and COCO-SSD...');
  await download('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js', path.join(vendorDir, 'tf.min.js'));
  await download('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js', path.join(vendorDir, 'coco-ssd.min.js'));
  console.log('Finished downloading real AI models!');
}

main().catch(err => {
  console.error('Download error:', err.message);
  process.exit(1);
});
