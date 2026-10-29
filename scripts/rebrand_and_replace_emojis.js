const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(filePath, 'utf8');

// Title & Meta
html = html.replace('<title>مسار العراق — Masar Iraq Navigation</title>', '<title>دلدل — Duldul Navigation</title>');
html = html.replace('<link rel="icon" href="/icon.svg" type="image/svg+xml">', '<link rel="icon" href="/logo.jpg" type="image/jpeg">\n  <link rel="apple-touch-icon" href="/logo.jpg">');

// Branding Comment
html = html.replace(
  '/* ==========================================================================\n       🇮🇶 مسار العراق (Masar Iraq) — Authentic Apple Maps Human Design System',
  '/* ==========================================================================\n       دلدل (Duldul Navigation) — Authentic Apple Maps Human Design System'
);

// Attribution (replace © with HTML entity &copy;)
html = html.replace(
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors | © <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO Voyager</a>',
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors | &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO Voyager</a>'
);

// Logo CSS
const logoCss = `
    .brand-logo-img {
      width: 34px;
      height: 34px;
      border-radius: 9px;
      object-fit: contain;
      background: #ffffff;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(0, 0, 0, 0.06);
      flex-shrink: 0;
      transition: transform 0.2s ease;
    }
    .brand-logo-img:hover {
      transform: scale(1.05);
    }
`;

html = html.replace('.search-capsule {', logoCss + '\n    .search-capsule {');

// Search bar input with logo
const oldSearch = `<div class="search-capsule">
      <i class="fa-solid fa-magnifying-glass search-icon"></i>
      <input type="text" id="searchInput" class="search-input" placeholder="ابحث في بغداد والمحافظات..." autocomplete="off">
      <i class="fa-solid fa-circle-xmark" id="btnClearSearch" style="color:var(--ios-text-tertiary); cursor:pointer; display:none;" onclick="clearSearch()"></i>
    </div>`;

const newSearch = `<div class="search-capsule">
      <img src="/logo.jpg" alt="دلدل" class="brand-logo-img">
      <i class="fa-solid fa-magnifying-glass search-icon"></i>
      <input type="text" id="searchInput" class="search-input" placeholder="ابحث في دلدل عن أي مكان في العراق..." autocomplete="off">
      <i class="fa-solid fa-circle-xmark" id="btnClearSearch" style="color:var(--ios-text-tertiary); cursor:pointer; display:none;" onclick="clearSearch()"></i>
    </div>`;

html = html.replace(oldSearch, newSearch);

// Category chips: Replace all emojis with FontAwesome SVG icons
html = html.replace('<button class="category-chip chip-radar" onclick="openBridgesModal()"><i class="fa-solid fa-bridge"></i> جسور بغداد</button>', '<button class="category-chip chip-radar" onclick="openBridgesModal()"><i class="fa-solid fa-bridge-water"></i> جسور بغداد</button>');
html = html.replace('<button class="category-chip" onclick="searchCategory(\'وقود\')">⛽ محطات وقود</button>', '<button class="category-chip" onclick="searchCategory(\'وقود\')"><i class="fa-solid fa-gas-pump"></i> محطات وقود</button>');
html = html.replace('<button class="category-chip" onclick="searchCategory(\'مستشفى\')">🏥 مستشفيات</button>', '<button class="category-chip" onclick="searchCategory(\'مستشفى\')"><i class="fa-solid fa-hospital"></i> مستشفيات</button>');
html = html.replace('<button class="category-chip" onclick="searchCategory(\'مطعم\')">☕ مطاعم ومقاهي</button>', '<button class="category-chip" onclick="searchCategory(\'مطعم\')"><i class="fa-solid fa-utensils"></i> مطاعم ومقاهي</button>');
html = html.replace('<button class="category-chip" onclick="searchCategory(\'مطار\')">✈️ مطارات</button>', '<button class="category-chip" onclick="searchCategory(\'مطار\')"><i class="fa-solid fa-plane-departure"></i> مطارات</button>');

// Drawer brand badge
const oldHandle = '<div class="sheet-handle" id="sheetHandle"></div>';
const newHandle = `<div class="sheet-handle" id="sheetHandle"></div>
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <img src="/logo.jpg" alt="دلدل" style="width:26px; height:26px; border-radius:7px; object-fit:contain; border:1px solid var(--ios-border);">
          <span style="font-weight:800; font-size:16px; color:var(--ios-text);">دلدل</span>
          <span style="font-size:11px; color:var(--ios-green-dark); background:rgba(52,199,89,0.12); padding:2px 8px; border-radius:12px; font-weight:700;">الملاحة الذكية</span>
        </div>
      </div>`;
html = html.replace(oldHandle, newHandle);

// Bridges modal pill
html = html.replace(
  '<span class="bridge-status-pill status-open">مباشر 🟢</span>',
  '<span class="bridge-status-pill status-open"><i class="fa-solid fa-circle-dot" style="color:var(--ios-green); font-size:10px; margin-left:4px;"></i> مباشر</span>'
);

// Dialect modal icons
html = html.replace(
  '🇮🇶 اللهجة العراقية البغدادية (موصى بها)',
  '<i class="fa-solid fa-location-dot" style="color:var(--ios-green); margin-left:6px;"></i> اللهجة العراقية البغدادية (موصى بها)'
);
html = html.replace(
  '🌐 اللغة العربية الفصحى',
  '<i class="fa-solid fa-earth-americas" style="color:var(--ios-blue); margin-left:6px;"></i> اللغة العربية الفصحى'
);
html = html.replace(
  '🇬🇧 English',
  '<i class="fa-solid fa-language" style="color:var(--ios-orange); margin-left:6px;"></i> English'
);

// Incident report modal options (clean text, no emojis)
html = html.replace('<option value="accident">💥 حادث سير (Accident)</option>', '<option value="accident">حادث سير (Accident)</option>');
html = html.replace('<option value="traffic_jam">🚗 ازدحام مروري خانق (Traffic Jam)</option>', '<option value="traffic_jam">ازدحام مروري خانق (Traffic Jam)</option>');
html = html.replace('<option value="road_work">🚧 أعمال صيانة وإكساء (Roadwork)</option>', '<option value="road_work">أعمال صيانة وإكساء (Roadwork)</option>');
html = html.replace('<option value="hazard">⚠️ عائق أو حفرة في الطريق (Hazard)</option>', '<option value="hazard">عائق أو حفرة في الطريق (Hazard)</option>');
html = html.replace('<option value="closure">🛑 قطع مسار أو شارع (Closure)</option>', '<option value="closure">قطع مسار أو شارع (Closure)</option>');

// Comments and JS code
html = html.replace(
  "document.getElementById('btnPreviewFly').innerText = '⏸ إيقاف المعاينة';",
  "document.getElementById('btnPreviewFly').innerHTML = '<i class=\"fa-solid fa-pause\"></i> إيقاف المعاينة';"
);
html = html.replace('// 🎥 3D Fly-Through Route Preview', '// 3D Fly-Through Route Preview');
html = html.replace('// 🎙️ Iraqi Dialect Voice Co-Pilot', '// Iraqi Dialect Voice Co-Pilot');
html = html.replace('// 🌉 Baghdad Bridges Live Radar Flow', '// Baghdad Bridges Live Radar Flow');

// Bridge list dynamic status
html = html.replace(
  "${b.status === 'open' ? '🟢 سالك' : (b.status === 'congested' ? '🟡 ازدحام' : '🔴 مقطوع')}",
  "${b.status === 'open' ? '<i class=\"fa-solid fa-circle\" style=\"font-size:8px; color:var(--ios-green); margin-left:4px;\"></i> سالك' : (b.status === 'congested' ? '<i class=\"fa-solid fa-circle\" style=\"font-size:8px; color:var(--ios-orange); margin-left:4px;\"></i> ازدحام' : '<i class=\"fa-solid fa-circle\" style=\"font-size:8px; color:var(--ios-red); margin-left:4px;\"></i> مقطوع')}"
);

// IndexedDB name update
html = html.replace("indexedDB.open('MasarIraqOfflineDB', 1)", "indexedDB.open('DuldulOfflineDB', 1)");

// Verification of emoji removal
const emojiRegex = /[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
const remaining = html.match(emojiRegex);
console.log('Remaining emojis count:', remaining ? remaining.length : 0);

if (remaining) {
  console.log('Remaining emojis:', [...new Set(remaining)]);
  // Let's locate line numbers of remaining emojis
  const lines = html.split('\n');
  lines.forEach((l, i) => {
    const m = l.match(emojiRegex);
    if (m) console.log(`Line ${i + 1}: [${m.join(',')}] ${l.trim()}`);
  });
} else {
  console.log('PERFECT: Exactly 0 emojis remain in public/index.html!');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Saved updated public/index.html successfully!');
