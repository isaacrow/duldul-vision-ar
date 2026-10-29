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
  console.log('Downloading Real Tesseract.js OCR engine...');
  await download('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js', path.join(vendorDir, 'tesseract.min.js'));
  console.log('Finished downloading Tesseract.js!');
}

main().catch(err => {
  console.error('Download error:', err.message);
  process.exit(1);
});
