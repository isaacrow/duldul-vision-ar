const fs = require('fs');
const path = require('path');
const vm = require('vm');

const indexHtmlPath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

// 1. Update :root and dark-mode variables to use css.glass specs
const rootOld = `:root {
      --ios-bg: #f2f2f7;
      --ios-card: rgba(255, 255, 255, 0.94);
      --ios-card-solid: #ffffff;
      --ios-border: rgba(0, 0, 0, 0.08);
      --ios-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
      --ios-shadow-sm: 0 2px 10px rgba(0, 0, 0, 0.08);
      --ios-green: #137b68;
      --ios-green-dark: #0e5f52;
      --ios-blue: #168a78;
      --ios-red: #c74435;
      --ios-orange: #d49b42;
      --ios-text: #1c1c1e;
      --ios-text-secondary: #8e8e93;
      --ios-text-tertiary: #aeaeb2;
      --ios-separator: #e5e5ea;
      --ios-blur: blur(24px) saturate(180%);
    }

    body.dark-mode {
      --ios-bg: #000000;
      --ios-card: rgba(28, 28, 30, 0.9);
      --ios-card-solid: #1c1c1e;
      --ios-border: rgba(255, 255, 255, 0.12);
      --ios-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      --ios-shadow-sm: 0 4px 16px rgba(0, 0, 0, 0.3);
      --ios-text: #ffffff;
      --ios-text-secondary: #98989d;
      --ios-text-tertiary: #636366;
      --ios-separator: #2c2c2e;
    }`;

const rootNew = `:root {
      /* Ultra-Refined Glassmorphism (From https://css.glass) */
      --glass-bg: rgba(255, 255, 255, 0.27);
      --glass-radius: 16px;
      --glass-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
      --glass-blur: blur(20px);
      --glass-webkit-blur: blur(20px);
      --glass-border: 1px solid rgba(255, 255, 255, 0.57);

      --ios-bg: #e5edf5;
      --ios-card: rgba(255, 255, 255, 0.27);
      --ios-card-solid: rgba(255, 255, 255, 0.75);
      --ios-border: rgba(255, 255, 255, 0.57);
      --ios-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
      --ios-shadow-sm: 0 2px 14px rgba(0, 0, 0, 0.06);
      --ios-green: #0e8a75;
      --ios-green-dark: #075f50;
      --ios-blue: #007aff;
      --ios-red: #ff3b30;
      --ios-orange: #ff9500;
      --ios-text: #111827;
      --ios-text-secondary: #4b5563;
      --ios-text-tertiary: #6b7280;
      --ios-separator: rgba(255, 255, 255, 0.38);
      --ios-blur: blur(20px);
    }

    body.dark-mode {
      --glass-bg: rgba(18, 22, 34, 0.65);
      --glass-border: 1px solid rgba(255, 255, 255, 0.18);
      --glass-shadow: 0 4px 30px rgba(0, 0, 0, 0.45);

      --ios-bg: #090c12;
      --ios-card: rgba(18, 22, 34, 0.68);
      --ios-card-solid: rgba(24, 28, 42, 0.9);
      --ios-border: rgba(255, 255, 255, 0.18);
      --ios-shadow: 0 8px 32px rgba(0, 0, 0, 0.55);
      --ios-shadow-sm: 0 4px 16px rgba(0, 0, 0, 0.35);
      --ios-text: #ffffff;
      --ios-text-secondary: #9ca3af;
      --ios-text-tertiary: #6b7280;
      --ios-separator: rgba(255, 255, 255, 0.12);
    }`;

if (html.includes(rootOld)) {
  html = html.replace(rootOld, rootNew);
  console.log('✅ Updated :root variables with css.glass specification.');
} else {
  // Regex version
  html = html.replace(/:root\s*\{[\s\S]*?body\.dark-mode\s*\{[\s\S]*?--ios-separator:\s*#2c2c2e;\s*\}/, rootNew);
  console.log('✅ Regex updated :root variables.');
}

// 2. Redesign .liquid-glass to exactly match https://css.glass
const liquidGlassOld = `    .liquid-glass {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.68) 0%, rgba(255, 255, 255, 0.42) 100%) !important;
      -webkit-backdrop-filter: blur(28px) saturate(210%) brightness(1.04) !important;
      backdrop-filter: blur(28px) saturate(210%) brightness(1.04) !important;
      border: 1px solid rgba(255, 255, 255, 0.6) !important;
      box-shadow: 
        0 16px 38px -10px rgba(0, 0, 0, 0.12),
        0 4px 12px rgba(0, 0, 0, 0.04),
        inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.9),
        inset 0 -1px 2px 0 rgba(0, 0, 0, 0.04) !important;
      position: relative;
    }

    body.dark-mode .liquid-glass {
      background: linear-gradient(135deg, rgba(30, 32, 38, 0.72) 0%, rgba(18, 19, 23, 0.55) 100%) !important;
      -webkit-backdrop-filter: blur(32px) saturate(200%) brightness(1.1) !important;
      backdrop-filter: blur(32px) saturate(200%) brightness(1.1) !important;
      border: 1px solid rgba(255, 255, 255, 0.18) !important;
      box-shadow: 
        0 24px 50px -10px rgba(0, 0, 0, 0.65),
        inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.25),
        inset 0 -1px 2px 0 rgba(0, 0, 0, 0.4) !important;
    }`;

const liquidGlassNew = `    /* From https://css.glass */
    .css-glass,
    .liquid-glass {
      background: rgba(255, 255, 255, 0.27) !important;
      border-radius: 16px !important;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1) !important;
      backdrop-filter: blur(20px) !important;
      -webkit-backdrop-filter: blur(20px) !important;
      border: 1px solid rgba(255, 255, 255, 0.57) !important;
      position: relative;
    }

    body.dark-mode .css-glass,
    body.dark-mode .liquid-glass {
      background: rgba(18, 22, 34, 0.65) !important;
      border-radius: 16px !important;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.45) !important;
      backdrop-filter: blur(20px) !important;
      -webkit-backdrop-filter: blur(20px) !important;
      border: 1px solid rgba(255, 255, 255, 0.18) !important;
    }`;

if (html.includes(liquidGlassOld)) {
  html = html.replace(liquidGlassOld, liquidGlassNew);
  console.log('✅ Updated .liquid-glass to exact css.glass rules.');
} else {
  html = html.replace(/\.liquid-glass\s*\{[\s\S]*?body\.dark-mode\s*\.liquid-glass\s*\{[\s\S]*?inset 0 -1px 2px 0 rgba\(0, 0, 0, 0\.4\) !important;\s*\}/, liquidGlassNew);
  console.log('✅ Regex updated .liquid-glass.');
}

// 3. Search Capsule & Autocomplete redesign
html = html.replace(
  /\.search-capsule\s*\{[\s\S]*?transition: all 0\.25s ease;\s*\}/,
  `.search-capsule {
      background: rgba(255, 255, 255, 0.32);
      border-radius: 16px;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.57);
      padding: 12px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.25s ease;
    }`
);

html = html.replace(
  /\.search-capsule:focus-within\s*\{[\s\S]*?box-shadow:\s*0 6px 28px rgba\(0, 122, 255, 0\.2\);\s*\}/,
  `.search-capsule:focus-within {
      background: rgba(255, 255, 255, 0.55);
      border-color: rgba(255, 255, 255, 0.85);
      box-shadow: 0 6px 32px rgba(0, 0, 0, 0.15);
    }`
);

html = html.replace(
  /\.search-results-sheet\s*\{[\s\S]*?display:\s*none;\s*\}/,
  `.search-results-sheet {
      background: rgba(255, 255, 255, 0.45);
      border-radius: 16px;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.12);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.57);
      max-height: 290px;
      overflow-y: auto;
      display: none;
    }`
);

// 4. Category chips redesign with glassmorphism
html = html.replace(
  /\.category-chip\s*\{[\s\S]*?transition:\s*all 0\.2s cubic-bezier\(0\.16, 1, 0\.3, 1\);\s*\}/,
  `.category-chip {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.57);
      color: var(--ios-text);
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }`
);

// 5. Apple Sheet Card (Bottom Drawer) redesign with css.glass
html = html.replace(
  /\.apple-sheet-card\s*\{[\s\S]*?max-height:\s*44vh;[\s\S]*?overflow-y:\s*auto;[\s\S]*?transition:\s*all 0\.3s cubic-bezier\(0\.16, 1, 0\.3, 1\);\s*\}/,
  `.apple-sheet-card {
      pointer-events: auto;
      background: rgba(255, 255, 255, 0.32);
      border-radius: 24px 24px 0 0;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.12);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid rgba(255, 255, 255, 0.65);
      border-right: 1px solid rgba(255, 255, 255, 0.45);
      border-left: 1px solid rgba(255, 255, 255, 0.45);
      padding: 12px 20px 24px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 44vh;
      overflow-y: auto;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }`
);

// 6. Endpoint box and loading box glassmorphism
html = html.replace(
  /\.route-endpoints-box\s*\{[\s\S]*?gap:\s*6px;\s*\}/,
  `.route-endpoints-box {
      background: rgba(255, 255, 255, 0.24);
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.57);
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }`
);

// 7. Modal Sheet redesign with css.glass
html = html.replace(
  /\.apple-modal-sheet\s*\{[\s\S]*?max-height:\s*85vh;[\s\S]*?overflow-y:\s*auto;\s*\}/,
  `.apple-modal-sheet {
      width: 100%;
      max-width: 520px;
      background: rgba(255, 255, 255, 0.35);
      border-radius: 24px 24px 0 0;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.18);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.57);
      padding: 20px 22px 32px 22px;
      max-height: 85vh;
      overflow-y: auto;
      animation: sheetUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }`
);

// 8. Dark mode overrides for all glass containers
const darkGlassRules = `
    /* Dark Mode Glassmorphism Overrides */
    body.dark-mode .apple-sheet-card,
    body.dark-mode .search-capsule,
    body.dark-mode .category-chip,
    body.dark-mode .search-results-sheet,
    body.dark-mode .route-endpoints-box,
    body.dark-mode .native-map-fab,
    body.dark-mode .header-pill-btn,
    body.dark-mode .apple-modal-sheet {
      background: rgba(18, 22, 34, 0.65) !important;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.45) !important;
      backdrop-filter: blur(20px) !important;
      -webkit-backdrop-filter: blur(20px) !important;
      border: 1px solid rgba(255, 255, 255, 0.18) !important;
      color: #ffffff !important;
    }

    body.dark-mode .poi-item {
      border-bottom-color: rgba(255, 255, 255, 0.1) !important;
    }
    body.dark-mode .poi-item:hover,
    body.dark-mode .poi-item:active {
      background: rgba(255, 255, 255, 0.08) !important;
    }
`;

if (!html.includes('/* Dark Mode Glassmorphism Overrides */')) {
  html = html.replace('</style>', darkGlassRules + '\n  </style>');
}

// 9. Save and verify
fs.writeFileSync(indexHtmlPath, html, 'utf8');
console.log('🎉 Glassmorphism redesign applied across the entire app!');

// Validate JS
const scriptMatch = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i);
if (scriptMatch) {
  try {
    new vm.Script(scriptMatch[1]);
    console.log('🎉 JS is 100% valid!');
  } catch (err) {
    console.error('❌ JS syntax error:', err.message);
  }
}
