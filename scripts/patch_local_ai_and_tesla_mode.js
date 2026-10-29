const fs = require('fs');

// 1. Patch public/index.html to include local_road_ai_model.js and add the prominent Tesla Mode button
const indexPath = 'C:/Users/MK/.gemini/antigravity/scratch/waze-iraq/public/index.html';
let indexHtml = fs.readFileSync(indexPath, 'utf8');

if (!indexHtml.includes('/vendor/local_road_ai_model.js')) {
  indexHtml = indexHtml.replace(
    '<script src="/vendor/three.min.js"></script>',
    '<script src="/vendor/three.min.js"></script>\n  <script src="/vendor/local_road_ai_model.js"></script>'
  );
  console.log('Added local_road_ai_model.js script tag');
}

// Add Tesla Mode Top Switcher Pill right next to the search capsule
const teslaPillButton = `
      <!-- Prominent Tesla FSD Mode Switcher Button (Requested Mode) -->
      <button class="tesla-mode-entry-pill" onclick="playHapticClick(); openTeslaCockpit()" title="تشغيل نمط تسلا الكامل (Tesla FSD Cockpit)">
        <i class="fa-solid fa-car-rear" style="color:#00e5ff;"></i>
        <span>وضع تسلا (Tesla Mode)</span>
      </button>`;

if (!indexHtml.includes('class="tesla-mode-entry-pill"')) {
  indexHtml = indexHtml.replace(
    '</div>\n\n    <!-- Quick Filter Categories -->',
    '</div>\n' + teslaPillButton + '\n\n    <!-- Quick Filter Categories -->'
  );
  console.log('Added tesla-mode-entry-pill button');
}

// Add CSS for tesla-mode-entry-pill
const teslaPillCss = `
    .tesla-mode-entry-pill {
      margin-top: 8px;
      align-self: center;
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%);
      -webkit-backdrop-filter: blur(25px);
      backdrop-filter: blur(25px);
      border: 1.5px solid rgba(56, 189, 248, 0.5);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.25);
      border-radius: 20px;
      padding: 8px 18px;
      color: #ffffff;
      font-size: 13px;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      pointer-events: auto;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .tesla-mode-entry-pill:hover {
      border-color: #38bdf8;
      box-shadow: 0 8px 30px rgba(56, 189, 248, 0.35);
      transform: translateY(-1px);
    }
    .tesla-mode-entry-pill:active {
      transform: scale(0.95);
    }
`;

if (!indexHtml.includes('.tesla-mode-entry-pill {')) {
  indexHtml = indexHtml.replace('</style>', teslaPillCss + '\n  </style>');
  console.log('Added CSS for tesla-mode-entry-pill');
}

fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('Patched index.html');

// 2. Patch public/vendor/tesla_fsd_vector_space.js to hook DuldulLocalVisionAI
const fsdPath = 'C:/Users/MK/.gemini/antigravity/scratch/waze-iraq/public/vendor/tesla_fsd_vector_space.js';
let fsdJs = fs.readFileSync(fsdPath, 'utf8');

if (!fsdJs.includes('window.DuldulLocalVisionAI.init')) {
  fsdJs = fsdJs.replace(
    'this.startCameraVision();',
    `this.startCameraVision();
    if (window.DuldulLocalVisionAI) {
      window.DuldulLocalVisionAI.init(this.video);
      window.DuldulLocalVisionAI.start(12);
      window.DuldulLocalVisionAI.on('frame', (data) => {
        if (data && data.vehicles && data.vehicles.length > 0 && this.surroundingVehicles.length > 0) {
          const lead = data.vehicles.find(v => v.id === 'veh-lead');
          if (lead) {
            this.surroundingVehicles[0].targetZ = -lead.distanceMeters;
          }
        }
        if (data && data.signs && data.signs.length > 0) {
          const sign = data.signs[0];
          const badge = document.getElementById('teslaSpeedLimit');
          if (badge && sign.speedValue) badge.innerText = sign.speedValue;
        }
      });
    }`
  );
  fs.writeFileSync(fsdPath, fsdJs, 'utf8');
  console.log('Wired DuldulLocalVisionAI into tesla_fsd_vector_space.js');
}

// 3. Patch server.js to add POST /api/vision/catalog endpoint for local AI detections
const serverPath = 'C:/Users/MK/.gemini/antigravity/scratch/waze-iraq/server.js';
let serverJs = fs.readFileSync(serverPath, 'utf8');

const visionApiEndpoint = `
// API: Local Vision AI Catalog Ingestion
app.post('/api/vision/catalog', (req, res) => {
  const { signType, label, speedLimit, lat, lng, confidence } = req.body;
  const newRecord = {
    id: 'vis-' + Date.now(),
    type: signType || 'speed_limit',
    label: label || 'شاخصة مرورية',
    speedLimit: speedLimit || 100,
    lat: lat || 33.3152,
    lng: lng || 44.3661,
    confidence: confidence || 0.95,
    timestamp: Date.now()
  };
  res.status(201).json({ status: 'ok', record: newRecord });
});
`;

if (!serverJs.includes('/api/vision/catalog')) {
  serverJs = serverJs.replace("app.post('/api/spatial/catalog'", visionApiEndpoint + "\napp.post('/api/spatial/catalog'");
  fs.writeFileSync(serverPath, serverJs, 'utf8');
  console.log('Added /api/vision/catalog endpoint to server.js');
}
