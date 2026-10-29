const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Define updateCockpitArrivalMetrics, updateCockpitManeuver, and playStudioVoice
const studioVoiceAndCockpitCode = `
    // ---------------- Natural Studio Voice Audio Player (Arabic & Iraqi Dialect) ---------------- //
    const STUDIO_CLIPS = {
      iraqi: {
        turn_right: '/audio/iraqi_turn_right.mp3',
        turn_left: '/audio/iraqi_turn_left.mp3',
        turn_right_now: '/audio/iraqi_turn_right_now.mp3',
        turn_left_now: '/audio/iraqi_turn_left_now.mp3',
        continue: '/audio/iraqi_continue.mp3',
        arrive: '/audio/iraqi_arrived.mp3',
        checkpoint: '/audio/iraqi_checkpoint.mp3',
        camera: '/audio/iraqi_camera.mp3',
        traffic: '/audio/iraqi_traffic.mp3',
        recalculating: '/audio/iraqi_recalculating.mp3'
      },
      fusha: {
        turn_right: '/audio/turn_right_200.mp3',
        turn_left: '/audio/turn_left_200.mp3',
        turn_right_now: '/audio/turn_right_now.mp3',
        turn_left_now: '/audio/turn_left_now.mp3',
        continue: '/audio/continue_straight.mp3',
        arrive: '/audio/arrived.mp3',
        checkpoint: '/audio/checkpoint_ahead.mp3',
        camera: '/audio/speed_camera_ahead.mp3',
        traffic: '/audio/traffic_ahead.mp3',
        recalculating: '/audio/recalculating.mp3'
      }
    };

    let activeStudioAudio = null;

    function playStudioVoice(clipKey) {
      if (isAudioMuted) return;
      const dialect = chosenDialect === 'iraqi' ? 'iraqi' : 'fusha';
      const fileUrl = (STUDIO_CLIPS[dialect] && STUDIO_CLIPS[dialect][clipKey]) || STUDIO_CLIPS.fusha[clipKey];
      if (!fileUrl) return;

      if (activeStudioAudio) {
        try { activeStudioAudio.pause(); } catch (e) {}
      }

      playManeuverChime(); // Play crisp harmonic bell chime first

      setTimeout(() => {
        activeStudioAudio = new Audio(fileUrl);
        activeStudioAudio.play().catch(() => {
          speakNativeFallback(clipKey);
        });
      }, 200);
    }

    function speakNativeFallback(clipKey) {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      let text = 'انعطف للأمام';
      if (clipKey.includes('right')) text = 'انعطف يميناً';
      else if (clipKey.includes('left')) text = 'انعطف يساراً';
      else if (clipKey === 'arrive') text = 'وصلت إلى وجهتك بالسلامة';

      const u = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const arVoice = voices.find(v => v.lang.startsWith('ar'));
      if (arVoice) u.voice = arVoice;
      u.lang = 'ar-SA';
      window.speechSynthesis.speak(u);
    }

    function updateCockpitArrivalMetrics(durationMin, distanceKm) {
      const now = new Date();
      const dur = Number(durationMin) || 15;
      now.setMinutes(now.getMinutes() + dur);
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');

      const etaEl = document.getElementById('cockpitEtaTime');
      if (etaEl) etaEl.innerText = hours + ':' + mins;

      const minEl = document.getElementById('cockpitRemainingMin');
      if (minEl) minEl.innerText = dur + ' دقيقة';

      const distEl = document.getElementById('cockpitRemainingDist');
      if (distEl) distEl.innerText = (distanceKm || 10) + ' كم';
    }

    function updateCockpitManeuver(step, nextStep) {
      if (!step) return;
      const distEl = document.getElementById('drivingDistance');
      const streetEl = document.getElementById('drivingStreet');
      const iconEl = document.getElementById('drivingManeuverIcon');
      const subTextEl = document.getElementById('drivingSubText');

      const distM = step.distanceMeters || 300;
      if (distEl) distEl.innerText = 'في ' + distM + ' م';
      if (streetEl) streetEl.innerText = step.instruction || 'انطلق نحو الوجهة';
      if (subTextEl && nextStep) {
        subTextEl.innerText = 'ثم: ' + nextStep.instruction;
      }

      const inst = (step.instruction || '').toLowerCase();
      if (inst.includes('يمين') || inst.includes('right')) {
        if (iconEl) iconEl.className = 'fa-solid fa-arrow-turn-up';
        updateLaneBoxes('right');
      } else if (inst.includes('يسار') || inst.includes('left')) {
        if (iconEl) iconEl.className = 'fa-solid fa-arrow-turn-down';
        updateLaneBoxes('left');
      } else if (inst.includes('دوران') || inst.includes('u-turn')) {
        if (iconEl) iconEl.className = 'fa-solid fa-rotate-left';
        updateLaneBoxes('left');
      } else {
        if (iconEl) iconEl.className = 'fa-solid fa-arrow-up';
        updateLaneBoxes('center');
      }
    }

    function updateLaneBoxes(dir) {
      const l0 = document.getElementById('lane0');
      const l1 = document.getElementById('lane1');
      const l2 = document.getElementById('lane2');
      const advice = document.getElementById('laneAdvice');

      if (!l0 || !l1 || !l2) return;
      l0.className = 'lane-box';
      l1.className = 'lane-box';
      l2.className = 'lane-box';

      if (dir === 'right') {
        l2.className = 'lane-box highlight';
        if (advice) advice.innerText = 'الزم المسار الأيمن';
      } else if (dir === 'left') {
        l0.className = 'lane-box highlight';
        if (advice) advice.innerText = 'الزم المسار الأيسر';
      } else {
        l1.className = 'lane-box highlight';
        if (advice) advice.innerText = 'تابع السير في المسار الأوسط';
      }
    }
`;

html = html.replace('function startNavigationDrive() {', studioVoiceAndCockpitCode + '\n    function startNavigationDrive() {');

// 2. Update speakIraqiManeuver to use playStudioVoice
const newSpeakIraqiManeuver = `
    function speakIraqiManeuver(instruction, distanceM) {
      if (isAudioMuted) return;
      const inst = (instruction || '').toLowerCase();
      const dist = Number(distanceM) || 300;

      if (inst.includes('الوصول') || inst.includes('arrive')) {
        playStudioVoice('arrive');
      } else if (inst.includes('يمين') || inst.includes('right')) {
        playStudioVoice(dist <= 60 ? 'turn_right_now' : 'turn_right');
      } else if (inst.includes('يسار') || inst.includes('left')) {
        playStudioVoice(dist <= 60 ? 'turn_left_now' : 'turn_left');
      } else if (inst.includes('تابع') || inst.includes('continue')) {
        playStudioVoice('continue');
      } else {
        playStudioVoice('continue');
      }
    }
`;

html = html.replace(
  /function speakIraqiManeuver\(instruction, distanceM\) \{[\s\S]*?window\.speechSynthesis\.speak\(u\);\s*\}/,
  newSpeakIraqiManeuver
);

// 3. Update route line styling to vibrant iOS blue (#007aff)
html = html.replace(
  "paint: { 'line-color': '#168a78', 'line-width': 13, 'line-opacity': 0.35 }",
  "paint: { 'line-color': '#007aff', 'line-width': 14, 'line-opacity': 0.38, 'line-blur': 3 }"
);
html = html.replace(
  "paint: { 'line-color': '#168a78', 'line-width': 6.5 }",
  "paint: { 'line-color': '#007aff', 'line-width': 7 }"
);
html = html.replace(
  "map.addLayer({ id: 'route-glow', type: 'line', source: 'route-path', paint: { 'line-color': '#168a78'",
  "map.addLayer({ id: 'route-glow', type: 'line', source: 'route-path', paint: { 'line-color': '#007aff'"
);
html = html.replace(
  "map.addLayer({ id: 'route-core', type: 'line', source: 'route-path', paint: { 'line-color': '#168a78'",
  "map.addLayer({ id: 'route-core', type: 'line', source: 'route-path', paint: { 'line-color': '#007aff'"
);

// 4. Update checkNearbyHazards to trigger studio warning clips
html = html.replace(
  "playHazardCautionTone();",
  "playHazardCautionTone(); playStudioVoice('checkpoint');"
);

// 5. Verification of emoji removal
const emojiRegex = /[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
const remaining = html.match(emojiRegex);
console.log('Emojis in updated index.html:', remaining ? remaining.length : 0);

fs.writeFileSync(filePath, html, 'utf8');
console.log('Saved studio voice and cockpit metrics to index.html successfully!');
