const fs = require('fs');
const path = require('path');
const vm = require('vm');

const indexHtmlPath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

const marker = '<!-- Native iOS Map Floating Action Controls (Clean & Ergonomic) -->';
const markerIdx = html.indexOf(marker);

const cityChipsMarker = '<!-- City Quick-Jump Chips (Idle State) -->';
const cityChipsIdx = html.indexOf(cityChipsMarker);

if (markerIdx !== -1 && cityChipsIdx !== -1) {
  const between = html.slice(markerIdx, cityChipsIdx);
  console.log('Current section between markers:\n', between);

  const cleanSection = `<!-- Native iOS Map Floating Action Controls (Clean & Ergonomic) -->
  <div class="native-map-controls" id="nativeMapControls">
    <button class="native-map-fab" onclick="playHapticClick(); toggle3DView()" id="btn3D" title="3D / 2D">
      <span id="label3D">3D</span>
    </button>
    <button class="native-map-fab" onclick="playHapticClick(); recenterLocation()" title="موقعي الحالي">
      <i class="fa-solid fa-location-crosshairs" id="gpsIcon"></i>
    </button>
  </div>

  <!-- Apple Bottom Drawer Sheet -->
  <div class="apple-bottom-drawer" id="appleDrawer">
    <div class="apple-sheet-card liquid-glass" id="bottomSheetCard">
      <div class="sheet-handle" id="sheetHandle"></div>
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <img src="/logo.jpg" alt="دلدل" style="width:26px; height:26px; border-radius:7px; object-fit:contain; border:1px solid var(--ios-border);">
          <span style="font-weight:800; font-size:16px; color:var(--ios-text);">دلدل</span>
          <span style="font-size:11px; color:var(--ios-green-dark); background:rgba(52,199,89,0.12); padding:2px 8px; border-radius:12px; font-weight:700;">الملاحة الذكية</span>
        </div>
      </div>

      `;

  html = html.slice(0, markerIdx) + cleanSection + html.slice(cityChipsIdx);
  fs.writeFileSync(indexHtmlPath, html, 'utf8');
  console.log('✅ Cleanly inserted appleDrawer and bottomSheetCard opening tags!');
}

// Check tag balance now!
const tagRegex = /<\/?([a-zA-Z0-9]+)(?:\s+[^>]*?)?(\/?)>/g;
const stack = [];
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

let match;
const errors = [];
while ((match = tagRegex.exec(html)) !== null) {
  const tagName = match[1].toLowerCase();
  const isClosing = match[0].startsWith('</');
  const isSelfClosing = match[2] === '/' || voidTags.has(tagName);

  if (isSelfClosing) continue;

  if (!isClosing) {
    stack.push({ tag: tagName, index: match.index });
  } else {
    if (stack.length === 0) {
      errors.push(`Extra closing tag </${tagName}> at char ${match.index}`);
    } else {
      const last = stack.pop();
      if (last.tag !== tagName) {
        errors.push(`Mismatched tag: expected </${last.tag}>, found </${tagName}> at char ${match.index}`);
      }
    }
  }
}

if (stack.length > 0) {
  stack.forEach(s => errors.push(`Unclosed tag <${s.tag}> at char ${s.index}`));
}

console.log('Final HTML Tag Balance Errors:', errors.length ? errors : '🎉 100% PERFECT HTML STRUCTURE! ZERO ERRORS!');

// Check JS syntax
const scriptMatch = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i);
if (scriptMatch) {
  try {
    new vm.Script(scriptMatch[1]);
    console.log('🎉 FINAL INLINE JAVASCRIPT IS 100% VALID WITH ZERO ERRORS!');
  } catch (err) {
    console.error('❌ JS syntax error:', err.message);
  }
}
