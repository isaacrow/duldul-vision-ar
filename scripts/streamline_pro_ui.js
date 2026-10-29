const fs = require('fs');
const path = 'C:/Users/MK/.gemini/antigravity/scratch/waze-iraq/public/index.html';
let html = fs.readFileSync(path, 'utf8');

// 1. Hide the noisy brand-row and quick-categories from the top header in CSS
const proCss = `
    /* ==========================================================================
       Ultra-Clean Automotive Design (Tesla & Apple Maps Standard)
       Eliminating toy-like clutter and visual noise.
       ========================================================================== */
    .brand-row {
      display: none !important;
    }
    .quick-categories {
      display: none !important;
    }
    #cityChipsContainer {
      display: none !important;
    }

    /* Minimalist Top Search Floating Capsule */
    .apple-header {
      top: 16px !important;
      right: 16px !important;
      left: 16px !important;
      max-width: 480px !important;
      margin: 0 auto !important;
      gap: 0 !important;
      pointer-events: none;
    }
    .search-capsule {
      pointer-events: auto;
      background: rgba(18, 22, 32, 0.85) !important;
      -webkit-backdrop-filter: blur(28px) !important;
      backdrop-filter: blur(28px) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      border-radius: 24px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35) !important;
      padding: 10px 16px !important;
      height: 48px !important;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .search-icon {
      color: #38bdf8 !important;
      font-size: 15px !important;
    }
    .search-input {
      color: #ffffff !important;
      font-size: 14.5px !important;
      font-weight: 600 !important;
      letter-spacing: -0.01em;
    }
    .search-input::placeholder {
      color: rgba(255, 255, 255, 0.5) !important;
    }

    /* Top Left Floating Controls Group */
    .floating-layer-fab {
      top: 16px !important;
      left: 16px !important;
      width: 48px !important;
      height: 48px !important;
      border-radius: 24px !important;
      background: rgba(18, 22, 32, 0.85) !important;
      -webkit-backdrop-filter: blur(28px) !important;
      backdrop-filter: blur(28px) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35) !important;
      color: #ffffff !important;
    }
    body.lang-en .floating-layer-fab {
      left: auto !important;
      right: 16px !important;
    }

    /* Refined Native Map Side Stack */
    .native-map-controls {
      bottom: calc(26vh + 16px) !important;
      left: 16px !important;
      gap: 8px !important;
    }
    body.lang-en .native-map-controls {
      left: auto !important;
      right: 16px !important;
    }
    .native-map-fab {
      width: 44px !important;
      height: 44px !important;
      border-radius: 22px !important;
      background: rgba(18, 22, 32, 0.85) !important;
      -webkit-backdrop-filter: blur(28px) !important;
      backdrop-filter: blur(28px) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.3) !important;
      color: #ffffff !important;
      font-size: 14px !important;
    }
    .native-map-fab:active {
      transform: scale(0.92) !important;
      background: rgba(30, 36, 50, 0.95) !important;
    }

    /* Pro Bottom Drawer Sheet */
    .apple-bottom-drawer {
      max-width: 500px !important;
      pointer-events: none;
    }
    .apple-sheet-card {
      pointer-events: auto;
      background: rgba(18, 22, 32, 0.88) !important;
      -webkit-backdrop-filter: blur(30px) !important;
      backdrop-filter: blur(30px) !important;
      border-radius: 28px 28px 0 0 !important;
      border-top: 1px solid rgba(255, 255, 255, 0.14) !important;
      border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
      border-left: 1px solid rgba(255, 255, 255, 0.08) !important;
      box-shadow: 0 -8px 36px rgba(0, 0, 0, 0.45) !important;
      padding: 10px 18px 26px 18px !important;
      gap: 10px !important;
    }
    .sheet-handle {
      width: 36px !important;
      height: 4px !important;
      border-radius: 2px !important;
      background: rgba(255, 255, 255, 0.28) !important;
      margin: 0 auto 4px auto !important;
    }

    /* Shortcuts Row */
    .shortcuts-row {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding: 2px 0 4px 0;
      scrollbar-width: none;
    }
    .shortcut-pill {
      background: rgba(255, 255, 255, 0.07) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      border-radius: 16px !important;
      padding: 8px 14px !important;
      color: #ffffff !important;
      font-size: 12px !important;
      font-weight: 700 !important;
    }
    .shortcut-pill i {
      color: #38bdf8 !important;
      font-size: 13px !important;
    }
    .shortcut-pill:active {
      transform: scale(0.94);
      background: rgba(255, 255, 255, 0.14) !important;
    }

    /* Floating Voice Mute FAB */
    .floating-voice-fab {
      bottom: calc(26vh + 16px) !important;
      right: 16px !important;
      width: 48px !important;
      height: 48px !important;
      border-radius: 24px !important;
      background: #ffffff !important;
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.4) !important;
      border: 1px solid rgba(0, 0, 0, 0.06) !important;
    }
    body.lang-en .floating-voice-fab {
      right: auto !important;
      left: 16px !important;
    }

    /* Remove drawer header duplication */
    .apple-sheet-card > div:nth-child(2) {
      display: none !important;
    }
`;

if (!html.includes('Ultra-Clean Automotive Design (Tesla & Apple Maps Standard)')) {
  html = html.replace('</style>', proCss + '\n  </style>');
  console.log('Added pro automotive CSS');
}

// Update search placeholder to Apple Maps style
html = html.replace(
  'placeholder="ابحث في دلدل عن أي مكان في العراق..."',
  'placeholder="إلى أين؟ | ابحث عن وجهة في العراق..."'
);

fs.writeFileSync(path, html, 'utf8');
console.log('Successfully wrote streamlined pro UI');
