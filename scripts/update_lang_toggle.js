const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(filePath, 'utf8');

const oldLangToggleRegex = /function toggleLanguage\(\)\s*\{[\s\S]*?document\.getElementById\('searchInput'\)\.placeholder = currentLang === 'ar' \? 'ابحث في بغداد والمحافظات\.\.\.' : 'Search in Baghdad and Iraq\.\.\.';\s*\}/;

const newLangToggle = `function toggleLanguage() {
      currentLang = currentLang === 'ar' ? 'en' : 'ar';
      document.documentElement.lang = currentLang;
      document.documentElement.dir = currentLang === 'en' ? 'ltr' : 'rtl';
      document.body.classList.toggle('lang-en', currentLang === 'en');
      document.getElementById('langBtn').innerText = currentLang === 'ar' ? 'EN' : 'عربي';

      const isAr = currentLang === 'ar';
      document.getElementById('searchInput').placeholder = isAr
        ? 'ابحث في دلدل عن أي مكان في العراق...'
        : 'Search places across Iraq in Duldul...';

      const labelGo = document.getElementById('labelGo');
      if (labelGo) labelGo.innerText = isAr ? 'انطلاق' : 'Go';

      const btnOrigin = document.getElementById('btnToggleOrigin');
      if (btnOrigin) btnOrigin.innerText = isAr ? 'تغيير نقطة البداية' : 'Change Start';

      // Update cockpit bottom labels
      const muteBtn = document.getElementById('btnAudioToggle');
      if (muteBtn && muteBtn.querySelector('span')) {
        muteBtn.querySelector('span').innerText = isAr ? 'الصوت' : 'Audio';
      }

      const stopBtn = document.querySelector('.btn-stop-drive span');
      if (stopBtn) stopBtn.innerText = isAr ? 'إنهاء' : 'End';

      const shareBtn = document.querySelector('.btn-share-eta span');
      if (shareBtn) shareBtn.innerText = isAr ? 'مشاركة' : 'Share';

      const recenterBtn = document.querySelector('.btn-recenter-drive span');
      if (recenterBtn) recenterBtn.innerText = isAr ? 'توسيط' : 'Recenter';

      const hazardBtn = document.querySelector('.btn-hazard-report span');
      if (hazardBtn) hazardBtn.innerText = isAr ? 'إبلاغ' : 'Report';

      const arrivalLabel = document.querySelector('.cockpit-eta-label');
      if (arrivalLabel) arrivalLabel.innerText = isAr ? 'الوصول' : 'Arrival';

      if (currentPrimaryRoute) {
        updateCockpitArrivalMetrics(currentPrimaryRoute.durationMin, currentPrimaryRoute.distanceKm);
      }
    }`;

if (oldLangToggleRegex.test(html)) {
  html = html.replace(oldLangToggleRegex, newLangToggle);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log('Successfully updated toggleLanguage!');
} else {
  console.warn('Regex for toggleLanguage did not match!');
}
