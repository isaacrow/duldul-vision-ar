const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(targetPath, 'utf8');

// 1. Add Waze Turn Icon SVG templates and AI Voice Generation Engine
const wazeEngineJs = `
    // ---------------- Waze-Grade 3D Heading-Up Camera & AI Voice Engine ---------------- //
    let isCameraLocked = true;
    let userDragTimeout = null;
    let navAnimationFrameId = null;
    let currentInterpolatedHeading = 0;
    let currentProgressMeters = 0;
    let lastSpokenStepIndex = -1;
    let lastSpokenDistBucket = -1;

    function lockCameraToDriving(force = false) {
      isCameraLocked = true;
      const btn = document.getElementById('btnWazeRecenter');
      if (btn) btn.style.display = 'none';

      if (!map) return;
      map.setPadding({
        top: 90,
        bottom: Math.round(window.innerHeight * 0.44),
        left: 16,
        right: 16
      });

      const centerPt = userCoords || (currentPrimaryRoute && currentPrimaryRoute.geometry && currentPrimaryRoute.geometry.coordinates[0]);
      if (centerPt) {
        map.easeTo({
          center: centerPt,
          zoom: 18.4,
          pitch: 65,
          bearing: currentInterpolatedHeading,
          duration: force ? 700 : 350
        });
      }
    }

    function handleUserMapInteraction() {
      if (!isDrivingActive) return;
      isCameraLocked = false;
      const btn = document.getElementById('btnWazeRecenter');
      if (btn) btn.style.display = 'flex';

      if (userDragTimeout) clearTimeout(userDragTimeout);
      // Auto re-adjust after 4 seconds of inactivity (User Request: "re adjust by itself")
      userDragTimeout = setTimeout(() => {
        if (isDrivingActive) {
          lockCameraToDriving(true);
        }
      }, 4000);
    }

    // Dynamic AI Voice Generation with Natural Iraqi Dialect
    function generateAiIraqiSpeech(instruction, distanceM, isImmediate = false) {
      const inst = (instruction || '').toLowerCase();
      const dist = Math.max(0, Math.round(distanceM));

      if (inst.includes('وصلت') || inst.includes('arrive')) {
        return 'وصلت لوجهتك بالسلامة يا غالي!';
      }

      if (inst.includes('يمين') || inst.includes('right')) {
        if (isImmediate || dist <= 55) return 'لوف يمنة هسة!';
        if (dist <= 150) return 'بعد مية متر، لوف يمنة';
        return 'بعد ' + dist + ' متر، لوف يمنة';
      }

      if (inst.includes('يسار') || inst.includes('left')) {
        if (isImmediate || dist <= 55) return 'لوف يسرى هسة!';
        if (dist <= 150) return 'بعد مية متر، لوف يسرى';
        return 'بعد ' + dist + ' متر، لوف يسرى';
      }

      if (inst.includes('دوار') || inst.includes('roundabout')) {
        if (isImmediate || dist <= 55) return 'ادخل الدوار وخذ المخرج المحدد';
        return 'بعد ' + dist + ' متر، ادخل الدوار';
      }

      if (inst.includes('استدارة') || inst.includes('u-turn') || inst.includes('دوران')) {
        if (isImmediate || dist <= 55) return 'استدر للخلف هسة';
        return 'بعد ' + dist + ' متر، استدر للخلف';
      }

      if (isImmediate || dist <= 55) return 'واصل السير كبل للأمام';
      return 'امشي كبل لمسافة ' + dist + ' متر';
    }

    function speakAiNavigation(text) {
      if (isAudioMuted) return;
      playManeuverChime(); // Harmonic chime first

      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'ar-IQ'; // Iraqi Arabic tag

          const voices = window.speechSynthesis.getVoices();
          const neuralVoice = voices.find(v => v.lang === 'ar-IQ') ||
                              voices.find(v => v.lang.startsWith('ar') && (v.name.includes('Neural') || v.name.includes('Online'))) ||
                              voices.find(v => v.lang.startsWith('ar')) ||
                              voices[0];
          if (neuralVoice) utterance.voice = neuralVoice;
          utterance.rate = 1.02;
          utterance.pitch = 0.98;

          setTimeout(() => {
            window.speechSynthesis.speak(utterance);
          }, 180);
        } catch (e) {
          // Fallback to studio voice
          playStudioVoice('continue');
        }
      } else {
        playStudioVoice('continue');
      }
    }

    // Dynamic Turn Arrow SVGs for Waze Top HUD
    function updateWazeManeuverIcon(instruction) {
      const svg = document.getElementById('wazeManeuverSvg');
      if (!svg) return;
      const inst = (instruction || '').toLowerCase();

      if (inst.includes('يمين') || inst.includes('right')) {
        // Sharp turn right
        svg.innerHTML = '<path d=\"M10 28V16C10 11.5817 13.5817 8 18 8H26\" stroke=\"#ffffff\" stroke-width=\"4.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M20 3L27 8L20 13\" stroke=\"#ffffff\" stroke-width=\"4.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>';
      } else if (inst.includes('يسار') || inst.includes('left')) {
        // Sharp turn left
        svg.innerHTML = '<path d=\"M26 28V16C26 11.5817 22.4183 8 18 8H10\" stroke=\"#ffffff\" stroke-width=\"4.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M16 3L9 8L16 13\" stroke=\"#ffffff\" stroke-width=\"4.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>';
      } else if (inst.includes('استدارة') || inst.includes('u-turn') || inst.includes('دوران')) {
        // U-turn
        svg.innerHTML = '<path d=\"M24 28V14A8 8 0 0 0 8 14V26\" stroke=\"#ffffff\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M4 22L8 26L12 22\" stroke=\"#ffffff\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>';
      } else if (inst.includes('دوار') || inst.includes('roundabout')) {
        // Roundabout circle
        svg.innerHTML = '<path d=\"M18 6A12 12 0 1 0 30 18\" stroke=\"#ffffff\" stroke-width=\"3.5\" stroke-linecap=\"round\"/><path d=\"M30 11L30 18L23 18\" stroke=\"#ffffff\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>';
      } else if (inst.includes('وصلت') || inst.includes('arrive')) {
        // Flag
        svg.innerHTML = '<path d=\"M10 4V32M10 6H26L21 14L26 22H10\" fill=\"#34c759\" stroke=\"#ffffff\" stroke-width=\"2.5\" stroke-linejoin=\"round\"/>';
      } else {
        // Straight ahead
        svg.innerHTML = '<path d=\"M18 28V8M18 8L11 15M18 8L25 15\" stroke=\"#ffffff\" stroke-width=\"4.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>';
      }
    }

    // ---------------- 60 FPS Physics Simulation Engine (Smooth Gliding & Camera Track) ---------------- //
    function startSmoothDriveEngine() {
      if (!currentPrimaryRoute || !currentPrimaryRoute.geometry) return;
      const coords = currentPrimaryRoute.geometry.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) return;

      stopSmoothDriveEngine();

      // Compute total distance & segment lengths
      let totalRouteMeters = 0;
      const segmentLengths = [];
      for (let i = 0; i < coords.length - 1; i++) {
        const d = turf.distance(turf.point(coords[i]), turf.point(coords[i + 1]), { units: 'kilometers' }) * 1000;
        segmentLengths.push(d);
        totalRouteMeters += d;
      }

      currentProgressMeters = 0;
      navigationStepIndex = 0;
      lastSpokenStepIndex = -1;
      lastSpokenDistBucket = -1;
      let lastTimestamp = performance.now();
      const speedMetersPerSec = 14.5; // ~52 km/h realistic driving speed

      function frame(timestamp) {
        if (!isDrivingActive) {
          stopSmoothDriveEngine();
          return;
        }

        const dt = Math.min(0.08, (timestamp - lastTimestamp) / 1000);
        lastTimestamp = timestamp;

        currentProgressMeters += speedMetersPerSec * dt;

        if (currentProgressMeters >= totalRouteMeters) {
          stopSmoothDriveEngine();
          speakAiNavigation('وصلت لوجهتك بالسلامة يا غالي!');
          playArrivalFanfare();
          showToast(currentLang === 'en' ? 'You have arrived!' : 'وصلت إلى وجهتك بالسلامة يا غالي!');
          const distEl = document.getElementById('drivingDistance');
          const streetEl = document.getElementById('drivingStreet');
          if (distEl) distEl.innerText = currentLang === 'en' ? '0 m' : '0 م';
          if (streetEl) streetEl.innerText = currentLang === 'en' ? 'Arrived at destination' : 'وصلت إلى الوجهة';
          updateWazeManeuverIcon('وصلت');
          return;
        }

        // Find position along geometry
        let accumulated = 0;
        let segIdx = 0;
        for (let i = 0; i < segmentLengths.length; i++) {
          if (accumulated + segmentLengths[i] >= currentProgressMeters) {
            segIdx = i;
            break;
          }
          accumulated += segmentLengths[i];
        }

        const segRatio = segmentLengths[segIdx] > 0 ? (currentProgressMeters - accumulated) / segmentLengths[segIdx] : 0;
        const p1 = coords[segIdx];
        const p2 = coords[Math.min(segIdx + 1, coords.length - 1)];

        const curLng = p1[0] + (p2[0] - p1[0]) * segRatio;
        const curLat = p1[1] + (p2[1] - p1[1]) * segRatio;
        const curPt = [curLng, curLat];

        // Bearing of current segment
        const targetHeading = turf.bearing(turf.point(p1), turf.point(p2));

        // Circular angle lerp
        let diff = (targetHeading - currentInterpolatedHeading) % 360;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        currentInterpolatedHeading = (currentInterpolatedHeading + diff * 0.12 + 360) % 360;

        // Update 3D Waze Cyan Puck
        if (vehicleMarker) {
          vehicleMarker.setLngLat(curPt);
          vehicleMarker.setRotation(currentInterpolatedHeading);
          if (!vehicleMarker._map) vehicleMarker.addTo(map);
        }

        // Lock 3D Camera at 65° tilt, 18.4 zoom, heading-up!
        if (isCameraLocked && map) {
          map.setCenter(curPt);
          map.setBearing(currentInterpolatedHeading);
        }

        // Update Speedometer
        const speedValEl = document.getElementById('drivingSpeedValue');
        if (speedValEl) speedValEl.innerText = Math.round(48 + Math.sin(timestamp * 0.002) * 5);

        // Update Guidance and Step Countdown
        updateSmoothGuidance(curPt, currentProgressMeters, totalRouteMeters);

        navAnimationFrameId = requestAnimationFrame(frame);
      }

      navAnimationFrameId = requestAnimationFrame(frame);
    }

    function stopSmoothDriveEngine() {
      if (navAnimationFrameId) {
        cancelAnimationFrame(navAnimationFrameId);
        navAnimationFrameId = null;
      }
    }

    function updateSmoothGuidance(curPt, traveledMeters, totalMeters) {
      const steps = currentPrimaryRoute && currentPrimaryRoute.steps;
      if (!Array.isArray(steps) || !steps.length) return;

      const step = steps[navigationStepIndex];
      if (!step) return;

      const stepLoc = [step.location[1], step.location[0]];
      const distToStep = turf.distance(turf.point(curPt), turf.point(stepLoc), { units: 'kilometers' }) * 1000;
      const distM = Math.max(0, Math.round(distToStep));

      // Update top Waze HUD
      const distEl = document.getElementById('drivingDistance');
      const streetEl = document.getElementById('drivingStreet');
      if (distEl) distEl.innerText = distM < 1000 ? distM + ' م' : (distM / 1000).toFixed(1) + ' كم';
      if (streetEl) streetEl.innerText = step.instruction;

      const nextStep = steps[navigationStepIndex + 1];
      const subHint = document.getElementById('drivingSubHint');
      const subText = document.getElementById('drivingSubText');
      if (nextStep && subHint && subText) {
        subText.innerText = nextStep.instruction;
        subHint.style.display = 'flex';
      }

      updateWazeManeuverIcon(step.instruction);

      // AI Voice Announcements at 300m and 55m gates
      if (navigationStepIndex !== lastSpokenStepIndex) {
        lastSpokenStepIndex = navigationStepIndex;
        lastSpokenDistBucket = -1;
        const aiText = generateAiIraqiSpeech(step.instruction, distM);
        speakAiNavigation(aiText);
      } else if (distM <= 55 && lastSpokenDistBucket !== 55) {
        lastSpokenDistBucket = 55;
        const aiText = generateAiIraqiSpeech(step.instruction, distM, true);
        speakAiNavigation(aiText);
      }

      // Advance step when reached
      if (distM < 25 && navigationStepIndex < steps.length - 1) {
        navigationStepIndex++;
      }

      // Update Arrival Dock Stats
      const remainingMeters = Math.max(0, totalMeters - traveledMeters);
      const remainingKm = (remainingMeters / 1000).toFixed(1);
      const remainingMin = Math.max(1, Math.round(remainingMeters / (14.5 * 60)));

      const now = new Date();
      now.setMinutes(now.getMinutes() + remainingMin);
      const arrivalTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

      const etaEl = document.getElementById('cockpitEtaTime');
      if (etaEl) etaEl.innerText = arrivalTime;
      const distStatEl = document.getElementById('cockpitRemainingDist');
      if (distStatEl) distStatEl.innerText = remainingKm + ' كم';
      const minStatEl = document.getElementById('cockpitRemainingMin');
      if (minStatEl) minStatEl.innerText = remainingMin + ' دقيقة';
    }
`;

// Replace old simulation logic
const oldSimIndex = html.indexOf('// ---------------- Interactive Route Simulation Engine');
const oldStartNavIndex = html.indexOf('function startNavigationDrive()');

if (oldSimIndex !== -1 && oldStartNavIndex !== -1) {
  html = html.slice(0, oldSimIndex) + wazeEngineJs + '\n' + html.slice(oldStartNavIndex);
  console.log('Injected Waze 3D Engine & AI Voice Synthesis!');
}

// Update startNavigationDrive to switch to 3D Waze Cockpit and start smooth engine
const newStartNav = `function startNavigationDrive() {
      if (!currentPrimaryRoute) return;

      isDrivingActive = true;
      navigationStepIndex = 0;
      stopFlyThroughPreview();
      stopSmoothDriveEngine();
      getAudioContext();

      clearAlternativeRouteMarkers();
      if (map.getSource('route-alt-path')) {
        map.getSource('route-alt-path').setData({ type: 'FeatureCollection', features: [] });
      }

      document.body.classList.add('in-driving-mode');
      document.getElementById('appleHeader').style.display = 'none';
      document.getElementById('appleDrawer').style.display = 'none';
      document.getElementById('drivingCockpitTop').style.display = 'block';
      document.getElementById('drivingCockpitBottom').style.display = 'flex';
      const recenterBtn = document.getElementById('btnWazeRecenter');
      if (recenterBtn) recenterBtn.style.display = 'none';

      // Switch map style to high-contrast Dark Matter for authentic Waze aesthetic!
      map.setStyle('https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json');
      map.once('style.load', () => {
        // Re-attach route layers with radiant cyan glow
        if (!map.getSource('route-path')) {
          map.addSource('route-path', { type: 'geojson', data: currentPrimaryRoute.geometry });
          map.addLayer({
            id: 'route-glow',
            type: 'line',
            source: 'route-path',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#0088cc', 'line-width': 16, 'line-opacity': 0.45, 'line-blur': 3 }
          });
          map.addLayer({
            id: 'route-core',
            type: 'line',
            source: 'route-path',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#00e5ff', 'line-width': 8 }
          });
        }
      });

      // Position camera close to the road at 65° tilt and anchor vehicle at bottom third
      lockCameraToDriving(true);

      // Start 60 FPS smooth gliding engine & AI voice navigation
      startSmoothDriveEngine();
    }`;

const oldStartNavFullRegex = /function startNavigationDrive\(\)\s*\{[\s\S]*?runRouteSimulation\(\);\s*\}\s*\}/;
if (oldStartNavFullRegex.test(html)) {
  html = html.replace(oldStartNavFullRegex, newStartNav);
  console.log('Updated startNavigationDrive!');
}

// Update stopNavigationDrive
const newStopNav = `function stopNavigationDrive() {
      isDrivingActive = false;
      stopSmoothDriveEngine();
      document.body.classList.remove('in-driving-mode');
      document.getElementById('drivingCockpitTop').style.display = 'none';
      document.getElementById('drivingCockpitBottom').style.display = 'none';
      const recenterBtn = document.getElementById('btnWazeRecenter');
      if (recenterBtn) recenterBtn.style.display = 'none';

      document.getElementById('appleHeader').style.display = 'flex';
      document.getElementById('appleDrawer').style.display = 'flex';

      // Reset camera padding and tilt
      map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
      map.easeTo({ pitch: is3DView ? 48 : 0, bearing: 0, duration: 800 });
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      showToast('تم إنهاء الملاحة');

      renderAlternativeRouteLines();
    }`;

const oldStopNavRegex = /function stopNavigationDrive\(\)\s*\{[\s\S]*?renderAlternativeRouteLines\(\);\s*\}/;
if (oldStopNavRegex.test(html)) {
  html = html.replace(oldStopNavRegex, newStopNav);
  console.log('Updated stopNavigationDrive!');
}

// Add user drag/interaction listener to map for Auto Re-adjust
const mapInteractionCode = `
        map.on('dragstart', handleUserMapInteraction);
        map.on('touchstart', handleUserMapInteraction);
        map.on('wheel', handleUserMapInteraction);
`;
html = html.replace('setInterval(loadTrafficSignals, 30000);', 'setInterval(loadTrafficSignals, 30000);\n' + mapInteractionCode);

fs.writeFileSync(targetPath, html, 'utf8');
console.log('Saved final Waze Engine code. Total length:', html.length);
