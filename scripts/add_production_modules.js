const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(targetPath, 'utf8');

console.log('Original length:', html.length);

// 1. Add CSS for route loading and error boxes
const extraCss = `
    /* Loading Shimmer & Error Box */
    .route-loading-box {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(0, 122, 255, 0.08);
      border: 1px solid rgba(0, 122, 255, 0.2);
      border-radius: 14px;
      padding: 12px 14px;
      margin-bottom: 10px;
    }
    .route-error-box {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255, 59, 48, 0.08);
      border: 1px solid rgba(255, 59, 48, 0.2);
      border-radius: 14px;
      padding: 12px 14px;
      margin-bottom: 10px;
    }
`;

html = html.replace('</style>', extraCss + '\n  </style>');

// 2. Add offline packs button in apple-side-stack
const offlineBtnHtml = `
      <button class="glass-control-btn" onclick="playHapticClick(); openOfflineModal()" id="btnOffline" title="خرائط بدون إنترنت">
        <i class="fa-solid fa-cloud-arrow-down"></i>
      </button>`;

html = html.replace(
  '<button class="glass-control-btn" onclick="toggleLanguage()" id="langBtn" title="Language">',
  offlineBtnHtml + '\n      <button class="glass-control-btn" onclick="toggleLanguage()" id="langBtn" title="Language">'
);

// 3. Update quick-categories: change searchCategory('وقود') to openFuelModal()
html = html.replace(
  `searchCategory('وقود')"><i class="fa-solid fa-gas-pump"></i> محطات وقود`,
  `openFuelModal()"><i class="fa-solid fa-gas-pump"></i> محطات وقود`
);

// Add offline maps chip to quickCategories
html = html.replace(
  `<button class="category-chip" onclick="playHapticClick(); openDialectModal()"><i class="fa-solid fa-microphone-lines"></i> اللهجة العراقية</button>`,
  `<button class="category-chip" onclick="playHapticClick(); openDialectModal()"><i class="fa-solid fa-microphone-lines"></i> اللهجة العراقية</button>
      <button class="category-chip" onclick="playHapticClick(); openOfflineModal()"><i class="fa-solid fa-cloud-arrow-down"></i> خرائط بدون نت</button>`
);

// 4. Add route loading and error boxes in bottomSheetCard
const routeFeedbackHtml = `
      <!-- Route Loading State -->
      <div class="route-loading-box" id="routeLoadingBox" style="display:none;">
        <i class="fa-solid fa-circle-notch fa-spin" style="color:var(--ios-blue); font-size:18px;"></i>
        <span style="font-size:13px; font-weight:700; color:var(--ios-text);" id="routeLoadingText">جارٍ حساب أفضل مسار عبر شوارع العراق...</span>
      </div>

      <!-- Route Error & Retry State -->
      <div class="route-error-box" id="routeErrorBox" style="display:none;">
        <i class="fa-solid fa-circle-exclamation" style="color:var(--ios-red); font-size:18px;"></i>
        <div style="flex:1;">
          <div style="font-weight:700; font-size:13px;" id="routeErrorTitle">تعذر حساب المسار</div>
          <div style="font-size:11px; color:var(--ios-text-secondary);" id="routeErrorDesc">تحقق من اتصال الإنترنت أو اختر نقطة على شبكة الطرق</div>
        </div>
        <button class="endpoint-action-btn" onclick="playHapticClick(); retryLastRoute()" id="btnRetryRoute">إعادة المحاولة</button>
      </div>
`;

html = html.replace(
  '<!-- Route Details (Appears when destination is picked) -->',
  routeFeedbackHtml + '\n      <!-- Route Details (Appears when destination is picked) -->'
);

// 5. Add Fuel Modal and Offline Modal HTML before Turf.js
const modalsHtml = `
  <!-- Baghdad / Iraq Curated Fuel Stations Modal -->
  <div class="apple-modal-overlay" id="fuelModal" style="display:none;">
    <div class="apple-modal-sheet liquid-glass" style="max-height:82vh; overflow-y:auto;">
      <div class="sheet-handle" style="margin-bottom:12px;"></div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <div>
          <h3 style="font-weight:800; font-size:20px;">محطات الوقود النموذجية</h3>
          <p style="font-size:12px; color:var(--ios-text-secondary);">مواقع رسمية معتمدة • أوقات الانتظار تتطلب مساهمة السائقين</p>
        </div>
        <span class="bridge-status-pill" style="background:rgba(0,122,255,0.1); color:var(--ios-blue);">مواقع معتمدة</span>
      </div>

      <div id="fuelList" style="display:flex; flex-direction:column; gap:8px;"></div>

      <button onclick="closeFuelModal()" style="width:100%; margin-top:16px; background:var(--ios-bg); color:var(--ios-text); border:1px solid var(--ios-border); border-radius:14px; padding:12px; font-weight:700; cursor:pointer;">إغلاق</button>
    </div>
  </div>

  <!-- Offline Governorate Map Packs Modal -->
  <div class="apple-modal-overlay" id="offlineModal" style="display:none;">
    <div class="apple-modal-sheet liquid-glass" style="max-height:82vh; overflow-y:auto;">
      <div class="sheet-handle" style="margin-bottom:12px;"></div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <div>
          <h3 style="font-weight:800; font-size:20px;">حزم الخرائط بدون إنترنت</h3>
          <p style="font-size:12px; color:var(--ios-text-secondary);">تنزيل خرائط المحافظات للاستخدام في حالات ضعف تغطية 4G</p>
        </div>
        <span class="bridge-status-pill" style="background:rgba(52,199,89,0.1); color:var(--ios-green-dark);">PWA Offline</span>
      </div>

      <div id="offlinePacksList" style="display:flex; flex-direction:column; gap:10px;"></div>

      <button onclick="closeOfflineModal()" style="width:100%; margin-top:16px; background:var(--ios-bg); color:var(--ios-text); border:1px solid var(--ios-border); border-radius:14px; padding:12px; font-weight:700; cursor:pointer;">إغلاق</button>
    </div>
  </div>
`;

html = html.replace(
  '<!-- Turf.js for Advanced Spatial Math & Off-Route Detection -->',
  modalsHtml + '\n  <!-- Turf.js for Advanced Spatial Math & Off-Route Detection -->'
);

// 6. Update calculateRouteTo in script to use lastCalculatedParams and loading/error states
const calcRouteFind = `async function calculateRouteTo(destLng, destLat, name) {
      const origin = getActiveOrigin();
      destinationCoords = [destLng, destLat];
      destinationName = name;
      currentPrimaryRoute = null;
      availableRoutes = [];

      updateRouteEndpointsDisplay(origin.name, name);`;

const calcRouteReplace = `let lastCalculatedParams = null;

    function retryLastRoute() {
      if (lastCalculatedParams) {
        calculateRouteTo(lastCalculatedParams.lng, lastCalculatedParams.lat, lastCalculatedParams.name);
      } else {
        showToast(currentLang === 'en' ? 'Select a destination first' : 'حدد وجهة أولاً');
      }
    }

    async function calculateRouteTo(destLng, destLat, name) {
      lastCalculatedParams = { lng: destLng, lat: destLat, name };
      const origin = getActiveOrigin();
      destinationCoords = [destLng, destLat];
      destinationName = name;
      currentPrimaryRoute = null;
      availableRoutes = [];

      updateRouteEndpointsDisplay(origin.name, name);

      const loadingBox = document.getElementById('routeLoadingBox');
      const errorBox = document.getElementById('routeErrorBox');
      if (loadingBox) loadingBox.style.display = 'flex';
      if (errorBox) errorBox.style.display = 'none';`;

html = html.replace(calcRouteFind, calcRouteReplace);

// Update success and catch inside calculateRouteTo
html = html.replace(
  `selectRoute(0, true);
        document.getElementById('btnPreviewFly').style.display = 'inline-flex';
        document.getElementById('btnStartNav').style.display = 'inline-flex';`,
  `selectRoute(0, true);
        if (loadingBox) loadingBox.style.display = 'none';
        if (errorBox) errorBox.style.display = 'none';
        document.getElementById('btnPreviewFly').style.display = 'inline-flex';
        document.getElementById('btnStartNav').style.display = 'inline-flex';`
);

html = html.replace(
  `document.getElementById('tripEta').innerText = '--';
        document.getElementById('tripDetails').innerText = currentLang === 'en' ? 'Route calculation failed' : 'لم يُحسب المسار';
        showToast(err.message || (currentLang === 'en' ? 'Route calculation failed' : 'تعذر الاتصال بمحرك المسارات.'));`,
  `if (loadingBox) loadingBox.style.display = 'none';
        if (errorBox) {
          errorBox.style.display = 'flex';
          const errDesc = document.getElementById('routeErrorDesc');
          if (errDesc) errDesc.innerText = err.message || (currentLang === 'en' ? 'Check internet connection or select a point closer to roads' : 'تحقق من اتصال الإنترنت أو اختر نقطة على شبكة الطرق');
        }
        document.getElementById('tripEta').innerText = '--';
        document.getElementById('tripDetails').innerText = currentLang === 'en' ? 'Route calculation failed' : 'لم يُحسب المسار';
        showToast(err.message || (currentLang === 'en' ? 'Route calculation failed' : 'تعذر الاتصال بمحرك المسارات.'));`
);

// 7. Add Fuel and Offline Modal handlers to JavaScript
const extraJs = `
    // ---------------- Fuel Stations & Offline Packs Handlers ---------------- //
    async function openFuelModal() {
      document.getElementById('fuelModal').style.display = 'flex';
      const container = document.getElementById('fuelList');
      container.innerHTML = '<div style="padding:14px; text-align:center; color:var(--ios-text-secondary);"><i class="fa-solid fa-circle-notch fa-spin"></i> جارٍ تحميل محطات الوقود...</div>';

      try {
        const res = await fetch('/api/fuel');
        const data = await res.json();
        if (!res.ok || !data.stations) throw new Error('تعذر تحميل المحطات');

        container.innerHTML = data.stations.map(st => \`
          <div class="bridge-card" onclick="flyToStation(\${st.lng}, \${st.lat}, '\${escapeHtml(st.name)}')">
            <div>
              <div style="font-weight:700; font-size:15px;"><i class="fa-solid fa-gas-pump" style="color:var(--ios-green); margin-left:6px;"></i>\${escapeHtml(st.name)}</div>
              <div style="font-size:12px; color:var(--ios-text-secondary); margin-top:2px;">\${escapeHtml(st.city)} • \${escapeHtml(st.district)}</div>
              <div style="display:flex; gap:4px; margin-top:6px;">
                \${(st.types || []).map(t => \`<span style="font-size:10px; background:rgba(0,122,255,0.1); color:var(--ios-blue); padding:2px 6px; border-radius:6px; font-weight:700;">\${escapeHtml(t)}</span>\`).join('')}
              </div>
            </div>
            <div style="text-align:left;">
              <button class="endpoint-action-btn" style="pointer-events:none;">انطلاق</button>
            </div>
          </div>
        \`).join('');
      } catch (e) {
        container.innerHTML = '<div style="padding:14px; text-align:center; color:var(--ios-text-secondary);">تعذر الاتصال بقاعدة محطات الوقود</div>';
      }
    }

    function closeFuelModal() {
      document.getElementById('fuelModal').style.display = 'none';
    }

    function flyToStation(lng, lat, name) {
      closeFuelModal();
      map.flyTo({ center: [lng, lat], zoom: 16.5, duration: 1200 });
      calculateRouteTo(lng, lat, name);
    }

    async function openOfflineModal() {
      document.getElementById('offlineModal').style.display = 'flex';
      const container = document.getElementById('offlinePacksList');
      container.innerHTML = '<div style="padding:14px; text-align:center; color:var(--ios-text-secondary);"><i class="fa-solid fa-circle-notch fa-spin"></i> جارٍ قراءة حزم المحافظات...</div>';

      try {
        const res = await fetch('/api/offline/packs');
        const packs = await res.json();
        if (!res.ok || !Array.isArray(packs)) throw new Error('تعذر تحميل الحزم');

        const downloadedPacks = JSON.parse(localStorage.getItem('duldul_downloaded_packs') || '[]');

        container.innerHTML = packs.map(pack => {
          const isDownloaded = downloadedPacks.includes(pack.id);
          return \`
            <div class="bridge-card">
              <div>
                <div style="font-weight:700; font-size:15px;">\${currentLang === 'en' ? escapeHtml(pack.name_en) : escapeHtml(pack.name_ar)}</div>
                <div style="font-size:12px; color:var(--ios-text-secondary); margin-top:3px;">
                  الحجم: \${pack.totalSizeMb} ميغابايت • الإصدار \${pack.version}
                </div>
                <div style="font-size:11px; color:var(--ios-text-tertiary); margin-top:2px;">
                  تشمل شبكة الطرق والمعالم الحضرية
                </div>
              </div>
              <div>
                <button class="endpoint-action-btn" onclick="downloadOfflinePack('\${pack.id}', '\${escapeHtml(pack.name_ar)}', this)" style="\${isDownloaded ? 'background:rgba(52,199,89,0.15); color:var(--ios-green);' : ''}">
                  \${isDownloaded ? '<i class=\"fa-solid fa-check\"></i> محفوظة' : '<i class=\"fa-solid fa-download\"></i> تنزيل'}
                </button>
              </div>
            </div>
          \`;
        }).join('');
      } catch (e) {
        container.innerHTML = '<div style="padding:14px; text-align:center; color:var(--ios-text-secondary);">تعذر الاتصال بمركز الحزم</div>';
      }
    }

    function closeOfflineModal() {
      document.getElementById('offlineModal').style.display = 'none';
    }

    async function downloadOfflinePack(id, name, btn) {
      if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> جارٍ التحميل...';
        btn.disabled = true;
      }
      try {
        const res = await fetch('/api/offline/pack/' + id + '/download');
        const data = await res.json();
        if (!res.ok) throw new Error('فشل تنزيل الحزمة');

        const downloadedPacks = JSON.parse(localStorage.getItem('duldul_downloaded_packs') || '[]');
        if (!downloadedPacks.includes(id)) downloadedPacks.push(id);
        localStorage.setItem('duldul_downloaded_packs', JSON.stringify(downloadedPacks));
        localStorage.setItem('duldul_pack_' + id, JSON.stringify(data));

        showToast('تم حفظ حزمة ' + name + ' محلياً بنجاح — جاهزة للعمل دون شبكة');
        if (btn) {
          btn.innerHTML = '<i class="fa-solid fa-check"></i> محفوظة';
          btn.style.background = 'rgba(52,199,89,0.15)';
          btn.style.color = 'var(--ios-green)';
          btn.disabled = false;
        }
      } catch (e) {
        showToast('تعذر تنزيل الحزمة: ' + e.message);
        if (btn) {
          btn.innerHTML = '<i class="fa-solid fa-download"></i> إعادة المحاولة';
          btn.disabled = false;
        }
      }
    }

    // Network status listener
    window.addEventListener('online', () => {
      showToast(currentLang === 'en' ? 'Internet connection restored' : 'تم استعادة الاتصال بالإنترنت 🟢');
    });

    window.addEventListener('offline', () => {
      showToast(currentLang === 'en' ? 'Offline mode active (cached data)' : 'وضع عدم الاتصال — استخدام الخرائط المحفوظة 📡');
    });
`;

html = html.replace('function toggleLanguage()', extraJs + '\n    function toggleLanguage()');

fs.writeFileSync(targetPath, html, 'utf8');
console.log('Successfully updated index.html with production modules! New length:', html.length);
