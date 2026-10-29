const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Clean duplicate startNavigationDrive and stopNavigationDrive
const duplicateFunctionsRegex = /function startNavigationDrive\(\) \{[\s\S]*?updateTripStats\(userCoords\);\s*\}\s*function stopNavigationDrive\(\) \{[\s\S]*?window\.speechSynthesis\.cancel\(\);\s*\}/;

const unifiedDrivingController = `
    function startNavigationDrive() {
      if (!currentPrimaryRoute) return;

      isDrivingActive = true;
      navigationStepIndex = 0;
      stopFlyThroughPreview();
      getAudioContext();

      // Clear alternative route lines and badges for distraction-free cockpit
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

      // 3D In-Car Driving Camera Angle
      map.easeTo({
        center: userCoords || IRAQ_CITIES.baghdad.center,
        zoom: 17.5,
        pitch: 62,
        duration: 900
      });

      updateCockpitArrivalMetrics(currentPrimaryRoute.durationMin, currentPrimaryRoute.distanceKm);

      if (currentPrimaryRoute.steps && currentPrimaryRoute.steps.length > 0) {
        const first = currentPrimaryRoute.steps[0];
        updateCockpitManeuver(first, currentPrimaryRoute.steps[1]);
        speakIraqiManeuver(first.instruction, first.distanceMeters);
      }
    }

    function stopNavigationDrive() {
      isDrivingActive = false;
      document.body.classList.remove('in-driving-mode');
      document.getElementById('drivingCockpitTop').style.display = 'none';
      document.getElementById('drivingCockpitBottom').style.display = 'none';
      document.getElementById('drivingSpeedStack').style.display = 'none';
      document.getElementById('hazardAlertBanner').style.display = 'none';

      document.getElementById('appleHeader').style.display = 'flex';
      document.getElementById('appleDrawer').style.display = 'flex';
      document.getElementById('appleNavHud').style.display = 'none';
      document.getElementById('speedBadgeHud').style.display = 'none';
      document.getElementById('tripActiveCapsule').style.display = 'none';

      map.easeTo({ pitch: is3DView ? 48 : 0, duration: 800 });
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      showToast('تم إنهاء الملاحة');

      // Re-render alternatives if available
      renderAlternativeRouteLines();
    }
`;

html = html.replace(duplicateFunctionsRegex, unifiedDrivingController);

// 2. Add alternative routes map layers in map.on('load')
const routeLayerAnchor = "map.addLayer({\n          id: 'route-core',";
const altRouteLayers = `
        // Alternative Routes Layer (Translucent Frosted Line)
        map.addSource('route-alt-path', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
          id: 'route-alt-glow',
          type: 'line',
          source: 'route-alt-path',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#5ac8fa', 'line-width': 10, 'line-opacity': 0.35 }
        });
        map.addLayer({
          id: 'route-alt-core',
          type: 'line',
          source: 'route-alt-path',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#8e8e93', 'line-width': 5, 'line-dasharray': [2, 1.5] }
        });
`;

html = html.replace(routeLayerAnchor, altRouteLayers + '\n        ' + routeLayerAnchor);

// 3. Alternative route markers & line rendering functions
const altRouteHelpers = `
    let altRouteMarkers = [];

    function clearAlternativeRouteMarkers() {
      altRouteMarkers.forEach(m => m.remove());
      altRouteMarkers = [];
    }

    function renderAlternativeRouteLines() {
      clearAlternativeRouteMarkers();
      if (!map.getSource('route-alt-path')) return;

      if (!availableRoutes || availableRoutes.length <= 1) {
        map.getSource('route-alt-path').setData({ type: 'FeatureCollection', features: [] });
        return;
      }

      const altFeatures = [];
      const primaryDuration = currentPrimaryRoute ? currentPrimaryRoute.durationMin : availableRoutes[0].durationMin;

      availableRoutes.forEach((route, idx) => {
        if (route === currentPrimaryRoute) return;
        altFeatures.push({
          type: 'Feature',
          geometry: route.geometry,
          properties: { index: idx }
        });

        // Add on-map Liquid Glass badge at route midpoint
        if (route.geometry && route.geometry.coordinates && route.geometry.coordinates.length > 5) {
          const midIdx = Math.floor(route.geometry.coordinates.length * 0.45);
          const midPt = route.geometry.coordinates[midIdx];
          const diffMin = route.durationMin - primaryDuration;
          const diffText = diffMin > 0 ? ('+' + diffMin + ' د') : (diffMin < 0 ? (diffMin + ' د') : 'نفس الوقت');

          const el = document.createElement('div');
          el.className = 'alt-route-pill liquid-glass';
          el.innerHTML = '<i class="fa-solid fa-route" style="margin-left:4px;"></i> ' + diffText;
          el.onclick = (e) => {
            e.stopPropagation();
            selectRoute(idx, true);
          };

          const m = new maplibregl.Marker({ element: el }).setLngLat(midPt).addTo(map);
          altRouteMarkers.push(m);
        }
      });

      map.getSource('route-alt-path').setData({
        type: 'FeatureCollection',
        features: altFeatures
      });
    }
`;

html = html.replace('function selectRoute(index, fitBounds) {', altRouteHelpers + '\n    function selectRoute(index, fitBounds) {');

// In selectRoute: call renderAlternativeRouteLines
html = html.replace(
  "map.getSource('route-path').setData(route.geometry);",
  "map.getSource('route-path').setData(route.geometry);\n      renderAlternativeRouteLines();"
);

// 4. Nearby Hazards Real-time Proximity Detector
const proximityDetector = `
    let lastHazardAlertTime = 0;
    function checkNearbyHazards(coords) {
      if (Date.now() - lastHazardAlertTime < 40000) return; // Rate limit alerts
      if (!window.turf || !incidentMarkers) return;

      const userPt = turf.point(coords);
      for (const [id, m] of incidentMarkers.entries()) {
        const markerLngLat = m.getLngLat();
        const distKm = turf.distance(userPt, turf.point([markerLngLat.lng, markerLngLat.lat]), { units: 'kilometers' });
        if (distKm <= 0.45) { // Within 450 meters
          lastHazardAlertTime = Date.now();
          playHazardCautionTone();
          const banner = document.getElementById('hazardAlertBanner');
          const title = document.getElementById('hazardAlertTitle');
          const subtitle = document.getElementById('hazardAlertSubtitle');
          if (banner && title && subtitle) {
            title.innerText = 'تنبيه أمان: خطر على بعد ' + Math.round(distKm * 1000) + ' متر';
            subtitle.innerText = 'خفف السرعة وكن على استعداد للتوقف (مرصود مجتمعياً ومحفوظ للأبد)';
            banner.style.display = 'flex';
            setTimeout(() => { banner.style.display = 'none'; }, 9000);
          }
          break;
        }
      }
    }
`;

html = html.replace('function handleNavigationStep(coords, heading) {', proximityDetector + '\n    function handleNavigationStep(coords, heading) {');

// Connect checkNearbyHazards inside handleNavigationStep
html = html.replace(
  'updateNavigationGuidance(coords);',
  'updateNavigationGuidance(coords);\n      checkNearbyHazards(coords);'
);

// In GPS position update: update speedometer and driving HUD
const oldGpsSpeed = "document.getElementById('liveSpeedText').innerText = speed === null\n            ? '--'\n            : Math.round(speed * 3.6);";
const newGpsSpeed = `const speedKmh = speed === null ? 0 : Math.round(speed * 3.6);
          document.getElementById('liveSpeedText').innerText = speedKmh;
          const drivingSpeedEl = document.getElementById('drivingSpeedValue');
          if (drivingSpeedEl) drivingSpeedEl.innerText = speedKmh;
          const limitBadge = document.getElementById('drivingSpeedLimit');
          if (limitBadge) {
            limitBadge.classList.toggle('speeding', speedKmh > 65);
          }`;

html = html.replace(oldGpsSpeed, newGpsSpeed);

// Verification of emoji removal
const emojiRegex = /[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
const remaining = html.match(emojiRegex);
console.log('Emojis in public/index.html:', remaining ? remaining.length : 0);
if (remaining) {
  console.log('Found emojis:', [...new Set(remaining)]);
} else {
  console.log('PERFECT: Exactly 0 emojis found in index.html!');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Done upgrading index.html with complete Waze driving cockpit and multi-route system!');
