const fs = require('fs');
const path = 'C:/Users/MK/.gemini/antigravity/scratch/waze-iraq/public/index.html';
let html = fs.readFileSync(path, 'utf8');

// 1. Add emerald pulsing halo css
const emeraldCss = `
    .emerald-puck-halo {
      position: absolute;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.35);
      border: 2px solid #10b981;
      animation: emeraldPulse 2s infinite ease-out;
      pointer-events: none;
    }
    @keyframes emeraldPulse {
      0% { transform: scale(0.85); opacity: 0.95; }
      100% { transform: scale(2.4); opacity: 0; }
    }
`;

if (!html.includes('.emerald-puck-halo')) {
  html = html.replace('.waze-puck-container {', emeraldCss + '\n    .waze-puck-container {');
  console.log('Added emerald halo CSS');
}

// 2. Add emerald halo to vehicle puck markup
if (!html.includes('class="emerald-puck-halo"')) {
  html = html.replace('<div class="waze-puck-beam"></div>', '<div class="emerald-puck-halo"></div>\n          <div class="waze-puck-beam"></div>');
  console.log('Added emerald halo element');
}

// 3. Update initMap to respect currentMapStyle and call applyModernAmberHighways
html = html.replace(
  "style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',",
  `style: currentMapStyle === 'dark_modern'
            ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
            : 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',`
);

// In map.on('load')
if (!html.includes('if (currentMapStyle === \'dark_modern\') applyModernAmberHighways();')) {
  html = html.replace(
    'loadIncidents();\n        loadTrafficSignals();',
    `if (currentMapStyle === 'dark_modern') {
          applyModernAmberHighways();
        }
        renderCircularPOIMarkers();
        loadIncidents();
        loadTrafficSignals();`
  );
  console.log('Added load hooks for modern dark style');
}

// 4. Synchronize toggleAudioMute and toggleVoiceGuidanceMute
html = html.replace(
  `function toggleAudioMute() {
      isAudioMuted = !isAudioMuted;
      const icon = document.getElementById('audioIcon');
      if (icon) {
        icon.className = isAudioMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
        icon.style.color = isAudioMuted ? 'var(--ios-red)' : 'var(--ios-text)';
      }
      showToast(isAudioMuted ? 'تم كتم التوجيه الصوتي' : 'تم تفعيل التوجيه الصوتي');
    }`,
  `function toggleAudioMute() {
      isAudioMuted = !isAudioMuted;
      isVoiceMuted = isAudioMuted;
      const icon = document.getElementById('audioIcon');
      const fab = document.getElementById('btnVoiceMute');
      const floatingIcon = document.getElementById('floatingVoiceIcon');
      if (icon) {
        icon.className = isAudioMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
        icon.style.color = isAudioMuted ? 'var(--ios-red)' : 'var(--ios-text)';
      }
      if (fab) {
        if (isAudioMuted) fab.classList.add('muted');
        else fab.classList.remove('muted');
      }
      if (floatingIcon) {
        floatingIcon.className = isAudioMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
      }
      showGlassToast(isAudioMuted ? 'تم كتم التوجيه الصوتي 🔇' : 'تم تفعيل التوجيه الصوتي 🔊', isAudioMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high');
    }`
);

fs.writeFileSync(path, html, 'utf8');
console.log('Successfully refined index.html, new size:', fs.statSync(path).size);
