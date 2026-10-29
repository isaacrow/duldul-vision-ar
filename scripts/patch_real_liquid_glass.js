const fs = require('fs');
const path = 'C:/Users/MK/.gemini/antigravity/scratch/waze-iraq/public/index.html';
let html = fs.readFileSync(path, 'utf8');

const realLiquidGlassCss = `
    /* ==========================================================================
       REAL LIQUID GLASS DESIGN SYSTEM (Apple iOS 18 & Specular Caustics)
       Engineered with multi-layer specular bevels, saturation boost, and optical depth.
       ========================================================================== */
    .css-glass,
    .liquid-glass {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0.16) 100%) !important;
      backdrop-filter: blur(28px) saturate(190%) contrast(105%) !important;
      -webkit-backdrop-filter: blur(28px) saturate(190%) contrast(105%) !important;
      border-radius: 22px !important;
      border-top: 1.5px solid rgba(255, 255, 255, 0.75) !important;
      border-left: 1.2px solid rgba(255, 255, 255, 0.55) !important;
      border-right: 1px solid rgba(255, 255, 255, 0.35) !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.22) !important;
      box-shadow: 
        inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.65),
        inset 0 -1px 1px 0 rgba(0, 0, 0, 0.04),
        0 10px 36px 0 rgba(0, 0, 0, 0.14),
        0 2px 10px 0 rgba(0, 0, 0, 0.06) !important;
      position: relative;
    }

    body.dark-mode .css-glass,
    body.dark-mode .liquid-glass,
    body.dark-mode .apple-sheet-card,
    body.dark-mode .search-capsule,
    body.dark-mode .native-map-fab,
    body.dark-mode .floating-layer-fab,
    body.dark-mode .tesla-bottom-media-card,
    body.dark-mode .tesla-hud-maneuver {
      background: linear-gradient(135deg, rgba(24, 32, 46, 0.72) 0%, rgba(13, 17, 26, 0.84) 100%) !important;
      backdrop-filter: blur(32px) saturate(210%) contrast(108%) !important;
      -webkit-backdrop-filter: blur(32px) saturate(210%) contrast(108%) !important;
      border-top: 1.5px solid rgba(255, 255, 255, 0.32) !important;
      border-left: 1.2px solid rgba(255, 255, 255, 0.20) !important;
      border-right: 1px solid rgba(255, 255, 255, 0.10) !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
      box-shadow: 
        inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.26),
        inset 0 -1px 1px 0 rgba(0, 0, 0, 0.35),
        0 14px 44px 0 rgba(0, 0, 0, 0.65),
        0 4px 16px 0 rgba(0, 0, 0, 0.4) !important;
    }

    /* Floating Liquid Glass Controls */
    .floating-layer-fab,
    .native-map-fab {
      border-radius: 50% !important;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    .floating-layer-fab:hover,
    .native-map-fab:hover {
      box-shadow: 
        inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.4),
        0 16px 40px 0 rgba(0, 0, 0, 0.5) !important;
      transform: translateY(-2px);
    }
    .floating-layer-fab:active,
    .native-map-fab:active {
      transform: scale(0.92) !important;
    }

    /* Real Liquid Glass Shortcut Pills */
    .shortcut-pill {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%) !important;
      backdrop-filter: blur(20px) saturate(180%) !important;
      -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
      border-top: 1px solid rgba(255, 255, 255, 0.25) !important;
      border-left: 1px solid rgba(255, 255, 255, 0.18) !important;
      border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
      box-shadow: 
        inset 0 1px 0.5px 0 rgba(255, 255, 255, 0.2),
        0 4px 14px 0 rgba(0, 0, 0, 0.25) !important;
      border-radius: 18px !important;
    }
    .shortcut-pill:hover {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.08) 100%) !important;
    }
`;

// Replace existing .liquid-glass block with REAL liquid glass
if (!html.includes('REAL LIQUID GLASS DESIGN SYSTEM')) {
  html = html.replace('/* From https://css.glass */', realLiquidGlassCss + '\n    /* From https://css.glass */');
  console.log('Injected REAL LIQUID GLASS CSS');
}

fs.writeFileSync(path, html, 'utf8');
console.log('Successfully patched index.html with Real Liquid Glass');
