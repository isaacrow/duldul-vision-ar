const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Upgrade Puck CSS with Navigational Photon Cone & Radar Pulse
const puckCss = `
    /* Advanced Apple/Waze Navigational Photon Puck */
    .vehicle-puck-container {
      position: relative;
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .vehicle-light-beam {
      position: absolute;
      top: -24px;
      width: 0;
      height: 0;
      border-left: 14px solid transparent;
      border-right: 14px solid transparent;
      border-bottom: 32px solid rgba(0, 122, 255, 0.28);
      filter: blur(3px);
      pointer-events: none;
    }

    .vehicle-pulse-ring {
      position: absolute;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(0, 122, 255, 0.22);
      animation: vehiclePulse 2.2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
      pointer-events: none;
    }

    .vehicle-puck-core {
      position: relative;
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #007aff, #0056b3);
      border: 3px solid #ffffff;
      border-radius: 50%;
      box-shadow: 
        0 4px 18px rgba(0, 122, 255, 0.55),
        0 2px 6px rgba(0, 0, 0, 0.25),
        inset 0 1px 1px rgba(255, 255, 255, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 13px;
      transition: transform 0.15s ease;
    }

    @keyframes vehiclePulse {
      0% { transform: scale(0.65); opacity: 0.9; }
      100% { transform: scale(2.3); opacity: 0; }
    }

    /* Draggable Bottom Sheet Snapping */
    .apple-sheet-card {
      transition: height 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .sheet-handle {
      cursor: grab;
      padding: 6px;
      margin: -6px auto 8px;
    }
    .sheet-handle:active {
      cursor: grabbing;
    }

    /* Quick Nav Action inside POI Search Results */
    .poi-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-radius: 14px;
      cursor: pointer;
      transition: background 0.18s ease;
    }
    .poi-item:hover {
      background: rgba(0, 122, 255, 0.08);
    }
    .poi-icon-box {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: rgba(0, 122, 255, 0.1);
      color: var(--ios-blue);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }
`;

html = html.replace('/* Vehicle Avatar */', puckCss + '\n    /* Vehicle Avatar */');

// 2. Replace the vehicle puck DOM creation with the Photon Puck
const oldPuckDom = `// Vehicle Puck Marker
        const el = document.createElement('div');
        el.className = 'vehicle-puck';
        el.innerHTML = '<i class="fa-solid fa-location-arrow"></i>';
        vehicleMarker = new maplibregl.Marker({ element: el, rotationAlignment: 'map' });`;

const newPuckDom = `// High-Precision Navigational Photon Puck
        const el = document.createElement('div');
        el.className = 'vehicle-puck-container';
        el.innerHTML = \`
          <div class="vehicle-light-beam"></div>
          <div class="vehicle-pulse-ring"></div>
          <div class="vehicle-puck-core"><i class="fa-solid fa-location-arrow"></i></div>
        \`;
        vehicleMarker = new maplibregl.Marker({ element: el, rotationAlignment: 'map' });`;

html = html.replace(oldPuckDom, newPuckDom);

// 3. Add 60 FPS SmoothGpsTracker and Haptic Clicks
const smoothTrackerCode = `
    // ---------------- 60 FPS Fluid GPS Motion & Haptic Physics ---------------- //
    function playHapticClick() {
      if (isAudioMuted) return;
      try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1300, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.014);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.014);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.014);
      } catch (e) {}
    }

    class SmoothGpsTracker {
      constructor() {
        this.currentLng = 44.3661;
        this.currentLat = 33.3152;
        this.targetLng = 44.3661;
        this.targetLat = 33.3152;
        this.currentBearing = 0;
        this.targetBearing = 0;
        this.isInitialized = false;
        this.rafId = null;
        this.startLoop();
      }

      setTarget(lng, lat, bearing) {
        this.targetLng = lng;
        this.targetLat = lat;
        if (bearing !== undefined && Number.isFinite(bearing)) {
          this.targetBearing = bearing;
        }
        if (!this.isInitialized) {
          this.currentLng = lng;
          this.currentLat = lat;
          this.currentBearing = this.targetBearing;
          this.isInitialized = true;
        }
      }

      startLoop() {
        const step = () => {
          // Smooth Lerp at 60 FPS (damping factor 0.1 for liquid motion)
          this.currentLng += (this.targetLng - this.currentLng) * 0.1;
          this.currentLat += (this.targetLat - this.currentLat) * 0.1;

          // Shortest Angular Interpolation for compass
          let diff = (this.targetBearing - this.currentBearing + 180) % 360 - 180;
          if (diff < -180) diff += 360;
          this.currentBearing += diff * 0.1;

          if (vehicleMarker) {
            vehicleMarker.setLngLat([this.currentLng, this.currentLat]);
            vehicleMarker.setRotation(this.currentBearing);
            if (!vehicleMarker._map && map) vehicleMarker.addTo(map);
          }

          if (isDrivingActive && !isFlyPreviewActive && map) {
            map.setCenter([this.currentLng, this.currentLat]);
            map.setBearing(this.currentBearing);
          }

          this.rafId = requestAnimationFrame(step);
        };
        this.rafId = requestAnimationFrame(step);
      }
    }

    const smoothTracker = new SmoothGpsTracker();
`;

html = html.replace('let vehicleMarker = null;', 'let vehicleMarker = null;\n' + smoothTrackerCode);

// 4. Update GPS Position callback to feed smoothTracker
const oldGpsCallback = `userCoords = [position.coords.longitude, position.coords.latitude];
          locationAccuracyMeters = position.coords.accuracy;
          const heading = Number.isFinite(position.coords.heading) ? position.coords.heading : 0;
          const speed = position.coords.speed;
          const speedKmh = speed === null ? 0 : Math.round(speed * 3.6);
          document.getElementById('liveSpeedText').innerText = speedKmh;
          const drivingSpeedEl = document.getElementById('drivingSpeedValue');
          if (drivingSpeedEl) drivingSpeedEl.innerText = speedKmh;
          const limitBadge = document.getElementById('drivingSpeedLimit');
          if (limitBadge) {
            limitBadge.classList.toggle('speeding', speedKmh > 65);
          }
          if (vehicleMarker) {
            vehicleMarker.setLngLat(userCoords);
            vehicleMarker.setRotation(heading);
            if (!vehicleMarker._map) vehicleMarker.addTo(map);
          }`;

const newGpsCallback = `userCoords = [position.coords.longitude, position.coords.latitude];
          locationAccuracyMeters = position.coords.accuracy;
          const heading = Number.isFinite(position.coords.heading) ? position.coords.heading : 0;
          const speed = position.coords.speed;
          const speedKmh = speed === null ? 0 : Math.round(speed * 3.6);
          document.getElementById('liveSpeedText').innerText = speedKmh;
          const drivingSpeedEl = document.getElementById('drivingSpeedValue');
          if (drivingSpeedEl) drivingSpeedEl.innerText = speedKmh;
          const limitBadge = document.getElementById('drivingSpeedLimit');
          if (limitBadge) {
            limitBadge.classList.toggle('speeding', speedKmh > 65);
          }
          // Smooth 60 FPS interpolation without jerky jumps
          smoothTracker.setTarget(userCoords[0], userCoords[1], heading);`;

html = html.replace(oldGpsCallback, newGpsCallback);

// 5. Enhance Search Results with POI Category Icons & Distance
const oldPoiRender = `searchResults.innerHTML = places.map(p => \`
            <div class="poi-item" onclick="selectPoi(\${p.lng}, \${p.lat}, '\${escapeHtml(p.name)}')">
              <div>
                <div style="font-weight:700; font-size:14px;">\${escapeHtml(p.name)}</div>
                <div style="font-size:12px; color:var(--ios-text-secondary);">\${escapeHtml(p.city)} • \${escapeHtml(p.category)}</div>
              </div>
              <i class="fa-solid fa-diamond-turn-right" style="color:var(--ios-blue);"></i>
            </div>
          \`).join('');`;

const newPoiRender = `searchResults.innerHTML = places.map(p => {
            const cat = (p.category || '').toLowerCase();
            let catIcon = 'fa-location-dot';
            if (cat.includes('مطار') || cat.includes('airport')) catIcon = 'fa-plane-departure';
            else if (cat.includes('مستشفى') || cat.includes('صح')) catIcon = 'fa-hospital';
            else if (cat.includes('وقود') || cat.includes('gas')) catIcon = 'fa-gas-pump';
            else if (cat.includes('تسوق') || cat.includes('مول')) catIcon = 'fa-bag-shopping';
            else if (cat.includes('مطعم') || cat.includes('مقهى')) catIcon = 'fa-utensils';
            else if (cat.includes('تراث') || cat.includes('ديني') || cat.includes('معلم')) catIcon = 'fa-landmark';

            let distStr = '';
            if (userCoords && window.turf) {
              const dKm = turf.distance(turf.point(userCoords), turf.point([p.lng, p.lat]), { units: 'kilometers' });
              distStr = dKm < 1 ? (' • على بعد ' + Math.round(dKm * 1000) + ' م') : (' • على بعد ' + dKm.toFixed(1) + ' كم');
            }

            return \`
              <div class="poi-item" onclick="playHapticClick(); selectPoi(\${p.lng}, \${p.lat}, '\${escapeHtml(p.name)}')">
                <div style="display:flex; align-items:center; gap:12px;">
                  <div class="poi-icon-box"><i class="fa-solid \${catIcon}"></i></div>
                  <div>
                    <div style="font-weight:700; font-size:14px; color:var(--ios-text);">\${escapeHtml(p.name)}</div>
                    <div style="font-size:11px; color:var(--ios-text-secondary); margin-top:2px;">\${escapeHtml(p.city)} • \${escapeHtml(p.category)}\${distStr}</div>
                  </div>
                </div>
                <button style="background:var(--ios-blue); color:#fff; border:none; border-radius:10px; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer;" title="انطلق">\n                  <i class="fa-solid fa-arrow-turn-up"></i>\n                </button>
              </div>
            \`;
          }).join('');`;

html = html.replace(oldPoiRender, newPoiRender);

// 6. Connect haptic clicks to all interactive elements
html = html.replace(/onclick="jumpToCity\(/g, 'onclick="playHapticClick(); jumpToCity(');
html = html.replace(/onclick="searchCategory\(/g, 'onclick="playHapticClick(); searchCategory(');
html = html.replace(/onclick="toggle3DView\(\)"/g, 'onclick="playHapticClick(); toggle3DView()"');
html = html.replace(/onclick="recenterLocation\(\)"/g, 'onclick="playHapticClick(); recenterLocation()"');
html = html.replace(/onclick="toggleDarkMode\(\)"/g, 'onclick="playHapticClick(); toggleDarkMode()"');
html = html.replace(/onclick="openBridgesModal\(\)"/g, 'onclick="playHapticClick(); openBridgesModal()"');
html = html.replace(/onclick="openDialectModal\(\)"/g, 'onclick="playHapticClick(); openDialectModal()"');

// 7. Verify zero emojis
const emojiRegex = /[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
const remaining = html.match(emojiRegex);
console.log('Emojis in polished index.html:', remaining ? remaining.length : 0);

fs.writeFileSync(filePath, html, 'utf8');
console.log('Saved world-class tech polish to index.html successfully!');
