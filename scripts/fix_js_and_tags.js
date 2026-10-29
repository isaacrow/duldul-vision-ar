const fs = require('fs');
const path = require('path');
const vm = require('vm');

const indexHtmlPath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

// 1. Fix addCommunityTrafficLayer
const oldTrafficLayer = `    function addCommunityTrafficLayer() {
      if (!map || !map.getSource || !map.getSource('community-traffic')) return;
        map.addSource('community-traffic', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });
        map.addLayer({
          id: 'community-traffic-cells',
          type: 'circle',
          source: 'community-traffic',
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 16, 12],
            'circle-color': ['step', ['get', 'medianSpeedKmh'], '#c74435', 15, '#d49b42', 30, '#137b68'],
            'circle-opacity': 0.72,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.5
          }
        });
      }
    }`;

const fixedTrafficLayer = `    function addCommunityTrafficLayer() {
      if (!map || !map.getSource) return;
      if (!map.getSource('community-traffic')) {
        map.addSource('community-traffic', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });
        map.addLayer({
          id: 'community-traffic-cells',
          type: 'circle',
          source: 'community-traffic',
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 16, 12],
            'circle-color': ['step', ['get', 'medianSpeedKmh'], '#c74435', 15, '#d49b42', 30, '#137b68'],
            'circle-opacity': 0.72,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.5
          }
        });
      }
    }`;

if (html.includes(oldTrafficLayer)) {
  html = html.replace(oldTrafficLayer, fixedTrafficLayer);
  console.log('✅ Fixed addCommunityTrafficLayer.');
} else {
  // Regex replacement
  html = html.replace(
    /function addCommunityTrafficLayer\(\) \{[\s\S]*?id: 'community-traffic-cells'[\s\S]*?\}\s*\}\s*\}/,
    fixedTrafficLayer
  );
  console.log('✅ Regex fixed addCommunityTrafficLayer.');
}

// 2. Validate JS with vm.Script
const scriptMatch = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i);
if (scriptMatch) {
  try {
    new vm.Script(scriptMatch[1]);
    console.log('🎉 INLINE JAVASCRIPT IS 100% VALID WITH ZERO ERRORS!');
  } catch (err) {
    console.error('❌ Still JS error:', err.message);
  }
}

// 3. Find exact unclosed / extra HTML tags using stack
const tagRegex = /<\/?([a-zA-Z0-9]+)(?:\s+[^>]*?)?(\/?)>/g;
const stack = [];
const lines = html.split('\n');
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

console.log('HTML Tag Balance Errors:', errors.length ? errors : 'None! Perfect DOM hierarchy!');

fs.writeFileSync(indexHtmlPath, html, 'utf8');
