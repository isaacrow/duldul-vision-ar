const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Add Default Origin constants and Origin Helpers
const originHelpers = `
    // ---------------- Verified Iraqi Anchor & Origin Management ---------------- //
    const DEFAULT_ORIGIN_IRAQ = {
      name_ar: 'ساحة التحرير (وسط بغداد)',
      name_en: 'Tahrir Square (Baghdad Center)',
      coords: [44.4009, 33.3275] // [lng, lat]
    };

    let manualOriginCoords = null;
    let manualOriginName = null;

    function isInsideIraqBounds(lat, lng) {
      return typeof lat === 'number' && typeof lng === 'number' &&
        lat >= 29.0 && lat <= 37.5 && lng >= 38.5 && lng <= 49.0;
    }

    function getActiveOrigin() {
      if (manualOriginCoords) {
        return {
          coords: manualOriginCoords,
          name: manualOriginName || (currentLang === 'en' ? 'Selected Origin' : 'نقطة الانطلاق المختارة'),
          isGps: false,
          isManual: true
        };
      }
      if (userCoords && isInsideIraqBounds(userCoords[1], userCoords[0])) {
        return {
          coords: userCoords,
          name: currentLang === 'en' ? 'My Location' : 'موقعي الحالي',
          isGps: true,
          isManual: false
        };
      }
      return {
        coords: DEFAULT_ORIGIN_IRAQ.coords,
        name: currentLang === 'en' ? DEFAULT_ORIGIN_IRAQ.name_en : DEFAULT_ORIGIN_IRAQ.name_ar,
        isGps: false,
        isFallback: true
      };
    }

    function toggleOriginSelector() {
      if (manualOriginCoords) {
        manualOriginCoords = null;
        manualOriginName = null;
        showToast(currentLang === 'en' ? 'Reset start point to automatic' : 'تمت إعادة نقطة البداية إلى الموقع التلقائي');
      } else {
        manualOriginCoords = [44.3661, 33.3152]; // Al-Mansour, Baghdad
        manualOriginName = currentLang === 'en' ? 'Al-Mansour (Baghdad)' : 'المنصور (بغداد)';
        showToast(currentLang === 'en' ? 'Start point set to Al-Mansour' : 'تم تعيين نقطة البداية: المنصور');
      }
      if (destinationCoords) {
        calculateRouteTo(destinationCoords[0], destinationCoords[1], destinationName);
      }
    }

    function updateRouteEndpointsDisplay(originName, destName) {
      const box = document.getElementById('routeEndpointsBox');
      const origEl = document.getElementById('endpointOriginLabel');
      const destEl = document.getElementById('endpointDestLabel');
      if (box) box.style.display = 'flex';
      if (origEl) origEl.innerText = originName || (currentLang === 'en' ? 'My Location' : 'موقعي الحالي');
      if (destEl) destEl.innerText = destName || (currentLang === 'en' ? 'Selected Destination' : 'الوجهة المحددة');
    }
`;

// Insert after let userCoords = null;
html = html.replace('let userCoords = null;', 'let userCoords = null;\n' + originHelpers);

// 2. Replace calculateRouteTo with robust, non-blocking implementation
const oldCalcRouteRegex = /async function calculateRouteTo\(destLng, destLat, name\)\s*\{[\s\S]*?availableRoutes = data\.routes;\s*renderRouteChoices\(\);\s*selectRoute\(0, true\);\s*document\.getElementById\('btnPreviewFly'\)\.style\.display = 'inline-flex';\s*\}\s*catch\s*\(err\)\s*\{[\s\S]*?showToast\(err\.message \|\| 'تعذر الاتصال بمحرك المسارات\.'\);\s*\}/;

const newCalcRoute = `async function calculateRouteTo(destLng, destLat, name) {
      const origin = getActiveOrigin();
      destinationCoords = [destLng, destLat];
      destinationName = name;
      currentPrimaryRoute = null;
      availableRoutes = [];

      updateRouteEndpointsDisplay(origin.name, name);

      if (origin.isFallback && !userCoords) {
        showToast(currentLang === 'en'
          ? 'Starting from Baghdad Center (GPS acquiring...)'
          : 'نقطة الانطلاق: ساحة التحرير (بانتظار تثبيت GPS)');
      }

      document.getElementById('btnStartNav').style.display = 'none';
      document.getElementById('btnPreviewFly').style.display = 'none';
      document.getElementById('routeOptions').style.display = 'none';
      document.getElementById('routeEstimate').style.display = 'none';
      map.getSource('route-path').setData({ type: 'FeatureCollection', features: [] });
      if (map.getSource('route-alt-path')) {
        map.getSource('route-alt-path').setData({ type: 'FeatureCollection', features: [] });
      }
      clearAlternativeRouteMarkers();

      document.getElementById('tripEta').innerText = currentLang === 'en' ? 'Calculating...' : 'جارٍ الحساب...';
      document.getElementById('tripDetails').innerText = name;

      try {
        const start = origin.coords[1] + ',' + origin.coords[0];
        const end = destLat + ',' + destLng;
        const response = await fetch('/api/route?start=' + start + '&end=' + end + '&lang=' + currentLang);
        const data = await response.json();
        if (!response.ok || data.status !== 'ok' || !Array.isArray(data.routes) || !data.routes.length) {
          throw new Error(data.message || (currentLang === 'en' ? 'No route available' : 'تعذر إيجاد مسار متاح.'));
        }
        availableRoutes = data.routes;
        renderRouteChoices();
        selectRoute(0, true);
        document.getElementById('btnPreviewFly').style.display = 'inline-flex';
        document.getElementById('btnStartNav').style.display = 'inline-flex';

        // Auto-fit camera bounds to show full route
        if (window.turf && data.routes[0].geometry) {
          const bbox = turf.bbox(data.routes[0].geometry);
          map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], {
            padding: { top: 120, bottom: 250, left: 40, right: 40 },
            duration: 900
          });
        }
      } catch (err) {
        document.getElementById('tripEta').innerText = '--';
        document.getElementById('tripDetails').innerText = currentLang === 'en' ? 'Route calculation failed' : 'لم يُحسب المسار';
        showToast(err.message || (currentLang === 'en' ? 'Route calculation failed' : 'تعذر الاتصال بمحرك المسارات.'));
      }`;

if (oldCalcRouteRegex.test(html)) {
  html = html.replace(oldCalcRouteRegex, newCalcRoute);
  console.log('Successfully replaced calculateRouteTo!');
} else {
  console.warn('Regex for calculateRouteTo did not match! Inspecting...');
}

// 3. Update watchPosition speed updates
html = html.replace(
  `document.getElementById('liveSpeedText').innerText = speed === null
            ? '--'
            : Math.round(speed * 3.6);`,
  `const speedKmh = speed === null ? 0 : Math.max(0, Math.round(speed * 3.6));
          const liveSpeedEl = document.getElementById('liveSpeedText');
          if (liveSpeedEl) liveSpeedEl.innerText = speed === null ? '--' : speedKmh;
          const drivingSpeedEl = document.getElementById('drivingSpeedValue');
          if (drivingSpeedEl) drivingSpeedEl.innerText = speedKmh;
          if (isSimulatingDrive && speed !== null && speed > 1) {
            stopSimulation();
          }`
);

// 4. Update updateCockpitManeuver and lane guidance honesty
const oldManeuverRegex = /function updateCockpitManeuver\(step, nextStep\)\s*\{[\s\S]*?updateLaneBoxes\('center'\);\s*\}\s*\}/;

const newManeuver = `function updateCockpitManeuver(step, nextStep, currentMeters) {
      if (!step) return;
      const distEl = document.getElementById('drivingDistance');
      const streetEl = document.getElementById('drivingStreet');
      const iconEl = document.getElementById('drivingManeuverIcon');
      const subTextEl = document.getElementById('drivingSubText');
      const subHintEl = document.getElementById('drivingSubHint');

      const distM = currentMeters !== undefined && currentMeters !== null
        ? Math.max(0, Math.round(currentMeters))
        : (step.distanceMeters || 300);

      if (distEl) {
        if (distM < 1000) {
          distEl.innerText = (currentLang === 'en' ? 'In ' : 'في ') + distM + (currentLang === 'en' ? ' m' : ' م');
        } else {
          distEl.innerText = (currentLang === 'en' ? 'In ' : 'في ') + (distM / 1000).toFixed(1) + (currentLang === 'en' ? ' km' : ' كم');
        }
      }

      if (streetEl) streetEl.innerText = step.instruction || (currentLang === 'en' ? 'Continue along route' : 'انطلق نحو الوجهة');

      if (nextStep && nextStep.instruction) {
        if (subTextEl) subTextEl.innerText = (currentLang === 'en' ? 'Then: ' : 'ثم: ') + nextStep.instruction;
        if (subHintEl) subHintEl.style.display = 'flex';
      } else {
        if (subHintEl) subHintEl.style.display = 'none';
      }

      const inst = (step.instruction || '').toLowerCase();
      if (iconEl) {
        if (inst.includes('يمين') || inst.includes('right')) {
          iconEl.className = 'fa-solid fa-arrow-turn-up';
          iconEl.style.transform = 'scaleX(1)';
        } else if (inst.includes('يسار') || inst.includes('left')) {
          iconEl.className = 'fa-solid fa-arrow-turn-up';
          iconEl.style.transform = 'scaleX(-1)';
        } else if (inst.includes('استدارة') || inst.includes('u-turn') || inst.includes('دوران')) {
          iconEl.className = 'fa-solid fa-rotate-left';
          iconEl.style.transform = 'none';
        } else if (inst.includes('دوار') || inst.includes('roundabout')) {
          iconEl.className = 'fa-solid fa-arrows-spin';
          iconEl.style.transform = 'none';
        } else if (inst.includes('وصلت') || inst.includes('arrive')) {
          iconEl.className = 'fa-solid fa-flag-checkered';
          iconEl.style.transform = 'none';
        } else {
          iconEl.className = 'fa-solid fa-arrow-up';
          iconEl.style.transform = 'none';
        }
      }

      // Real Lane Guidance Honesty: Only display if real lane data exists
      const laneBar = document.getElementById('laneGuidanceBar');
      if (laneBar) {
        if (Array.isArray(step.lanes) && step.lanes.length > 0) {
          laneBar.style.display = 'flex';
        } else {
          laneBar.style.display = 'none';
        }
      }
    }`;

if (oldManeuverRegex.test(html)) {
  html = html.replace(oldManeuverRegex, newManeuver);
  console.log('Successfully replaced updateCockpitManeuver!');
} else {
  console.warn('Regex for updateCockpitManeuver did not match!');
}

// 5. Add Simulation engine and update startNavigationDrive & stopNavigationDrive
const simulationEngine = `
    // ---------------- Interactive Route Simulation Engine (No GPS fallback) ---------------- //
    let isSimulatingDrive = false;
    let simIntervalId = null;

    function stopSimulation() {
      if (simIntervalId) {
        clearInterval(simIntervalId);
        simIntervalId = null;
      }
      isSimulatingDrive = false;
    }

    function runRouteSimulation() {
      if (!currentPrimaryRoute || !currentPrimaryRoute.geometry) return;
      const coords = currentPrimaryRoute.geometry.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) return;
      let curIdx = 0;

      stopSimulation();

      simIntervalId = setInterval(() => {
        if (!isDrivingActive || !isSimulatingDrive) {
          stopSimulation();
          return;
        }
        curIdx += 1;
        if (curIdx >= coords.length) {
          stopSimulation();
          playStudioVoice('arrive');
          playArrivalFanfare();
          showToast(currentLang === 'en' ? 'You have arrived!' : 'وصلت إلى وجهتك بالسلامة يا غالي!');
          const distEl = document.getElementById('drivingDistance');
          const streetEl = document.getElementById('drivingStreet');
          if (distEl) distEl.innerText = currentLang === 'en' ? '0 m' : '0 م';
          if (streetEl) streetEl.innerText = currentLang === 'en' ? 'Arrived at destination' : 'وصلت إلى الوجهة';
          return;
        }

        const pt = coords[curIdx];
        const nextPt = coords[Math.min(curIdx + 1, coords.length - 1)];
        let heading = 0;
        if (window.turf && pt && nextPt) {
          heading = turf.bearing(turf.point(pt), turf.point(nextPt));
        }

        const mockSpeed = Math.round(42 + Math.sin(curIdx * 0.4) * 8);
        const speedEl = document.getElementById('drivingSpeedValue');
        if (speedEl) speedEl.innerText = mockSpeed;

        if (vehicleTracker) {
          vehicleTracker.setTarget(pt[0], pt[1], heading);
        } else if (vehicleMarker) {
          vehicleMarker.setLngLat(pt);
          vehicleMarker.setRotation(heading);
          if (!vehicleMarker._map) vehicleMarker.addTo(map);
        }

        handleNavigationStep(pt, heading);
        updateTripStats(pt);
      }, 1200);
    }
`;

html = html.replace('function startNavigationDrive()', simulationEngine + '\n    function startNavigationDrive()');

// Replace startNavigationDrive body
const oldStartNavRegex = /function startNavigationDrive\(\)\s*\{[\s\S]*?speakIraqiManeuver\(first\.instruction, first\.distanceMeters\);\s*\}\s*\}/;

const newStartNav = `function startNavigationDrive() {
      if (!currentPrimaryRoute) return;

      isDrivingActive = true;
      navigationStepIndex = 0;
      stopFlyThroughPreview();
      stopSimulation();
      getAudioContext();

      clearAlternativeRouteMarkers();
      if (map.getSource('route-alt-path')) {
        map.getSource('route-alt-path').setData({ type: 'FeatureCollection', features: [] });
      }

      document.body.classList.add('in-driving-mode');
      document.getElementById('drivingCockpitTop').style.display = 'flex';
      document.getElementById('drivingCockpitBottom').style.display = 'flex';
      document.getElementById('drivingSpeedStack').style.display = 'flex';
      document.getElementById('appleNavHud').style.display = 'none';
      document.getElementById('speedBadgeHud').style.display = 'none';
      document.getElementById('tripActiveCapsule').style.display = 'none';
      document.getElementById('appleHeader').style.display = 'none';
      document.getElementById('appleDrawer').style.display = 'none';

      // Synchronous metrics calculation
      updateCockpitArrivalMetrics(currentPrimaryRoute.durationMin, currentPrimaryRoute.distanceKm);

      if (currentPrimaryRoute.steps && currentPrimaryRoute.steps.length > 0) {
        const first = currentPrimaryRoute.steps[0];
        const second = currentPrimaryRoute.steps[1] || null;
        updateCockpitManeuver(first, second, first.distanceMeters);
        speakIraqiManeuver(first.instruction, first.distanceMeters);
      } else {
        const distEl = document.getElementById('drivingDistance');
        const streetEl = document.getElementById('drivingStreet');
        if (distEl) distEl.innerText = currentPrimaryRoute.distanceKm + (currentLang === 'en' ? ' km' : ' كم');
        if (streetEl) streetEl.innerText = destinationName || (currentLang === 'en' ? 'Head towards destination' : 'اتجه نحو الوجهة المحددة');
      }

      const origin = getActiveOrigin();
      const startCenter = (userCoords && isInsideIraqBounds(userCoords[1], userCoords[0])) ? userCoords : origin.coords;

      map.easeTo({
        center: startCenter,
        zoom: 17.5,
        pitch: 62,
        duration: 900
      });

      // If user has no live GPS or is outside Iraq, start driving simulation
      if (!userCoords || !isInsideIraqBounds(userCoords[1], userCoords[0])) {
        isSimulatingDrive = true;
        showToast(currentLang === 'en' ? 'Driving simulation active (no GPS)' : 'بدأت محاكاة القيادة على طول المسار');
        runRouteSimulation();
      }
    }`;

if (oldStartNavRegex.test(html)) {
  html = html.replace(oldStartNavRegex, newStartNav);
  console.log('Successfully replaced startNavigationDrive!');
} else {
  console.warn('Regex for startNavigationDrive did not match!');
}

// 6. Update stopNavigationDrive
html = html.replace(
  `function stopNavigationDrive() {
      isDrivingActive = false;`,
  `function stopNavigationDrive() {
      isDrivingActive = false;
      stopSimulation();`
);

// 7. Update updateNavigationGuidance to sync top maneuver card
const oldNavGuidanceRegex = /function updateNavigationGuidance\(coords, speakOnStart = false\)\s*\{[\s\S]*?if \(speakOnStart \|\| previousIndex !== navigationStepIndex\) \{[\s\S]*?speakIraqiManeuver\(step\.instruction, meters === null \? step\.distanceMeters : Math\.round\(meters\)\);\s*\}\s*\}/;

const newNavGuidance = `function updateNavigationGuidance(coords, speakOnStart = false) {
      const steps = currentPrimaryRoute && currentPrimaryRoute.steps;
      if (!Array.isArray(steps) || !steps.length) {
        const distEl = document.getElementById('drivingDistance');
        const streetEl = document.getElementById('drivingStreet');
        if (distEl) distEl.innerText = currentPrimaryRoute.distanceKm + (currentLang === 'en' ? ' km' : ' كم');
        if (streetEl) streetEl.innerText = destinationName || (currentLang === 'en' ? 'Follow route on map' : 'تابع المسار على الخريطة');
        return;
      }
      const previousIndex = navigationStepIndex;
      while (navigationStepIndex < steps.length - 1) {
        const meters = distanceToStepMeters(coords, steps[navigationStepIndex]);
        if (meters === null || meters >= 35) break;
        navigationStepIndex += 1;
      }
      const step = steps[navigationStepIndex];
      const nextStep = steps[navigationStepIndex + 1] || null;
      const meters = distanceToStepMeters(coords, step);

      // Update driving cockpit maneuver card continuously!
      updateCockpitManeuver(step, nextStep, meters);

      document.getElementById('hudInstruction').innerText = step.instruction;
      document.getElementById('hudDistance').innerText = meters === null
        ? 'المسافة التالية ' + step.distanceMeters + ' م'
        : 'بعد ' + Math.max(0, Math.round(meters)) + ' م';

      if (speakOnStart || previousIndex !== navigationStepIndex) {
        speakIraqiManeuver(step.instruction, meters === null ? step.distanceMeters : Math.round(meters));
      }
    }`;

if (oldNavGuidanceRegex.test(html)) {
  html = html.replace(oldNavGuidanceRegex, newNavGuidance);
  console.log('Successfully replaced updateNavigationGuidance!');
} else {
  console.warn('Regex for updateNavigationGuidance did not match!');
}

// 8. Update search input to show suggestions on focus and helpful empty state
const oldSearchInputRegex = /searchInput\.addEventListener\('input', async \(e\) => \{[\s\S]*?searchResults\.style\.display = 'none';\s*\}\s*\}\);/;

const newSearchInput = `// Suggested Iraqi places on empty query
    const SUGGESTED_IRAQ_PLACES = [
      { name: 'مول الحارثية (بغداد مول)', city: 'بغداد', category: 'تسوق وتجارة', lng: 44.3661, lat: 33.3152, icon: 'fa-bag-shopping' },
      { name: 'مطار بغداد الدولي (BIAP)', city: 'بغداد', category: 'مطارات ونقل', lng: 44.2344, lat: 33.2625, icon: 'fa-plane-departure' },
      { name: 'ساحة التحرير ونصب الحرية', city: 'بغداد', category: 'ثقافة وتراث', lng: 44.4009, lat: 33.3275, icon: 'fa-landmark' },
      { name: 'متنزه ومدينة ألعاب الزوراء', city: 'بغداد', category: 'سياحة وترفيه', lng: 44.3855, lat: 33.3155, icon: 'fa-tree' },
      { name: 'مستشفى الكرخ العام', city: 'بغداد', category: 'مستشفيات', lng: 44.3810, lat: 33.3280, icon: 'fa-hospital' },
      { name: 'محطة وقود الكيلاني النموذجية', city: 'بغداد', category: 'محطات وقود', lng: 44.4170, lat: 33.3278, icon: 'fa-gas-pump' }
    ];

    function renderSearchSuggestions() {
      searchResults.innerHTML = '<div style="padding:10px 14px 6px; font-weight:800; font-size:12px; color:var(--ios-text-secondary);"><i class="fa-solid fa-star" style="color:var(--ios-orange); margin-left:6px;"></i>وجهات مقترحة في العراق</div>' +
        SUGGESTED_IRAQ_PLACES.map(p => \`
          <div class="poi-item" onclick="selectPoi(\${p.lng}, \${p.lat}, '\${escapeHtml(p.name)}')">
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="width:32px; height:32px; border-radius:10px; background:rgba(0,122,255,0.08); display:flex; align-items:center; justify-content:center; color:var(--ios-blue);">
                <i class="fa-solid \${p.icon}"></i>
              </div>
              <div>
                <div style="font-weight:700; font-size:14px;">\${escapeHtml(p.name)}</div>
                <div style="font-size:12px; color:var(--ios-text-secondary);">\${escapeHtml(p.city)} • \${escapeHtml(p.category)}</div>
              </div>
            </div>
            <i class="fa-solid fa-diamond-turn-right" style="color:var(--ios-blue);"></i>
          </div>
        \`).join('');
      searchResults.style.display = 'block';
    }

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim().length === 0) {
        renderSearchSuggestions();
      }
    });

    searchInput.addEventListener('input', async (e) => {
      const q = e.target.value.trim();
      btnClearSearch.style.display = q.length > 0 ? 'inline' : 'none';

      if (q.length < 2) {
        if (q.length === 0) {
          renderSearchSuggestions();
        } else {
          searchResults.style.display = 'none';
        }
        return;
      }

      try {
        const res = await fetch(\`/api/places?q=\${encodeURIComponent(q)}\`);
        const places = await res.json();

        if (places.length === 0) {
          searchResults.innerHTML = \`
            <div style="padding:20px 14px; text-align:center;">
              <i class="fa-solid fa-map-location-dot" style="font-size:26px; color:var(--ios-text-tertiary); margin-bottom:8px;"></i>
              <div style="font-weight:700; font-size:14px; color:var(--ios-text); margin-bottom:4px;">لم نجد نتائج مطابقة لـ "\${escapeHtml(q)}"</div>
              <div style="font-size:12px; color:var(--ios-text-secondary); line-height:1.5;">جرب البحث بأسماء المدن أو المعالم مثل: المنصور، الكرادة، مول، مستشفى، وقود، أربيل، البصرة</div>
            </div>
          \`;
        } else {
          searchResults.innerHTML = places.map(p => {
            let catIcon = 'fa-location-dot';
            if (p.category.includes('تسوق')) catIcon = 'fa-bag-shopping';
            else if (p.category.includes('وقود')) catIcon = 'fa-gas-pump';
            else if (p.category.includes('مستشفى') || p.category.includes('طب')) catIcon = 'fa-hospital';
            else if (p.category.includes('مطعم') || p.category.includes('مقهى')) catIcon = 'fa-utensils';
            else if (p.category.includes('مطار') || p.category.includes('نقل')) catIcon = 'fa-plane-departure';
            else if (p.category.includes('ثقافة') || p.category.includes('تراث')) catIcon = 'fa-landmark';

            return \`
              <div class="poi-item" onclick="selectPoi(\${p.lng}, \${p.lat}, '\${escapeHtml(p.name)}')">
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="width:32px; height:32px; border-radius:10px; background:rgba(0,122,255,0.08); display:flex; align-items:center; justify-content:center; color:var(--ios-blue);">
                    <i class="fa-solid \${catIcon}"></i>
                  </div>
                  <div>
                    <div style="font-weight:700; font-size:14px;">\${escapeHtml(p.name)}</div>
                    <div style="font-size:12px; color:var(--ios-text-secondary);">\${escapeHtml(p.city)} • \${escapeHtml(p.category)}</div>
                  </div>
                </div>
                <i class="fa-solid fa-diamond-turn-right" style="color:var(--ios-blue);"></i>
              </div>
            \`;
          }).join('');
        }
        searchResults.style.display = 'block';
      } catch (err) {
        searchResults.style.display = 'none';
      }
    });

    // Close search results on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#appleHeader')) {
        searchResults.style.display = 'none';
      }
    });`;

if (oldSearchInputRegex.test(html)) {
  html = html.replace(oldSearchInputRegex, newSearchInput);
  console.log('Successfully replaced search input handler!');
} else {
  console.warn('Regex for search input did not match!');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Finished applying improvements. Total file length:', html.length);
