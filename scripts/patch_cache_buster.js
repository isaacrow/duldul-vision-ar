const fs = require('fs');

// 1. Patch public/index.html
const indexPath = 'C:/Users/MK/.gemini/antigravity/scratch/waze-iraq/public/index.html';
let indexHtml = fs.readFileSync(indexPath, 'utf8');

const headCacheBuster = `
  <script>
    // Immediate Cache Buster & Service Worker Purge
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(regs) {
        for (var r of regs) { r.unregister(); }
      });
    }
    if ('caches' in window) {
      caches.keys().then(function(names) {
        for (var n of names) { caches.delete(n); }
      });
    }
  </script>`;

if (!indexHtml.includes('Immediate Cache Buster & Service Worker Purge')) {
  indexHtml = indexHtml.replace('<head>', '<head>' + headCacheBuster);
}

// Replace serviceWorker.register with unregister in bootstrapApp
indexHtml = indexHtml.replace(
  `      if ('serviceWorker' in navigator && location.protocol !== 'file:') {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }`,
  `      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
      }`
);

fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('Patched index.html with cache buster');

// 2. Patch server.js
const serverPath = 'C:/Users/MK/.gemini/antigravity/scratch/waze-iraq/server.js';
let serverJs = fs.readFileSync(serverPath, 'utf8');

const cacheControlMiddleware = `app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/index.html' || req.path.endsWith('.html') || req.path === '/sw.js') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public')));`;

if (!serverJs.includes('no-cache, no-store, must-revalidate')) {
  serverJs = serverJs.replace('app.use(express.static(path.join(__dirname, \'public\')));', cacheControlMiddleware);
  fs.writeFileSync(serverPath, serverJs, 'utf8');
  console.log('Patched server.js with Cache-Control headers');
} else {
  console.log('server.js already has Cache-Control');
}
