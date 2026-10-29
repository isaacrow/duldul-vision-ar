const fs = require('fs');
const path = require('path');

const placesFile = path.join(__dirname, '..', 'data', 'iraq_places.json');

const IRAQ_MEGA_PLACES = [
  // ---------------- Iconic Iraqi Facebook & Instagram Hotspots (Food & Cafes) ---------------- //
  { id: "fb-bgw-1", name: "مطعم صمد - المنصور", name_en: "Samad Restaurant Mansour", lat: 33.3150, lng: 44.3540, category: "مطعم وشيف", city: "بغداد", source: "Facebook & Google Top Rated" },
  { id: "fb-bgw-2", name: "مطعم صمد - الجادرية", name_en: "Samad Restaurant Jadriya", lat: 33.2830, lng: 44.3820, category: "مطعم وشيف", city: "بغداد", source: "Facebook Top Rated" },
  { id: "fb-bgw-3", name: "مطعم زرزور التراثي - الكرادة", name_en: "Zarzour Restaurant Karrada", lat: 33.3030, lng: 44.4280, category: "مطاعم ومقاهي", city: "بغداد", source: "Facebook Viral" },
  { id: "fb-bgw-4", name: "كافيه اليازية - كورنيش الجادرية", name_en: "Al-Yazia Cafe Jadriya", lat: 33.2860, lng: 44.3890, category: "مطاعم ومقاهي", city: "بغداد", source: "Instagram Hotspot" },
  { id: "fb-bgw-5", name: "مطعم مسكوف أبي نؤاس (الفرسان)", name_en: "Abu Nuwas Masgouf Fish", lat: 33.3180, lng: 44.4210, category: "مطاعم ومقاهي", city: "بغداد", source: "Google Maps Landmark" },
  { id: "fb-bgw-6", name: "فلافل لبنان الشهيرة - شارع فلسطين", name_en: "Lebanon Falafel Palestine St", lat: 33.3480, lng: 44.4270, category: "مطاعم ومقاهي", city: "بغداد", source: "Facebook Trending" },
  { id: "fb-bgw-7", name: "مقهى الزهاوي التراثي - الميدان", name_en: "Al-Zahawi Historic Cafe", lat: 33.3440, lng: 44.3860, category: "ثقافة وتراث", city: "بغداد", source: "Facebook Heritage" },
  { id: "fb-bgw-8", name: "شاي حجي خليل - خان القشلة والمتنبي", name_en: "Haji Khalil Tea - Qishla", lat: 33.3395, lng: 44.3885, category: "ثقافة وتراث", city: "بغداد", source: "Facebook & Insta" },
  { id: "fb-bgw-9", name: "برغر ومطعم بروستد كويك - المنصور 14 رمضان", name_en: "Quick Broasted Mansour", lat: 33.3190, lng: 44.3560, category: "مطاعم ومقاهي", city: "بغداد", source: "Facebook Local" },
  { id: "fb-bgw-10", name: "كنافة ومأكولات الحلواني - الكرادة", name_en: "Halwani Sweets Karrada", lat: 33.3060, lng: 44.4260, category: "مطاعم ومقاهي", city: "بغداد", source: "Facebook Trending" },
  { id: "fb-bgw-11", name: "مطعم ومطبخ عيون بغداد - ساحة الواثق", name_en: "Oyoun Baghdad Wathiq", lat: 33.3100, lng: 44.4350, category: "مطاعم ومقاهي", city: "بغداد", source: "Google Maps" },
  { id: "fb-bgw-12", name: "شاورما الشيف - تقاطع الأميرات", name_en: "Princesses Shawarma Mansour", lat: 33.3120, lng: 44.3580, category: "مطاعم ومقاهي", city: "بغداد", source: "Facebook Local" },

  // ---------------- Major Shopping Malls (Google & Facebook Check-ins) ---------------- //
  { id: "mall-bgw-1", name: "مول بغداد الحارثية", name_en: "Baghdad Mall Harthiya", lat: 33.3130, lng: 44.3680, category: "تسوق وتجارة", city: "بغداد", source: "Google Top Mall" },
  { id: "mall-bgw-2", name: "مول المنصور", name_en: "Al-Mansour Mall", lat: 33.3142, lng: 44.3528, category: "تسوق وتجارة", city: "بغداد", source: "Google Top Mall" },
  { id: "mall-bgw-3", name: "بابلون مول - المنصور", name_en: "Babylon Mall Mansour", lat: 33.3195, lng: 44.3510, category: "تسوق وتجارة", city: "بغداد", source: "Facebook Check-ins" },
  { id: "mall-bgw-4", name: "النخيل مول - شارع فلسطين", name_en: "Al-Nakheel Mall Palestine St", lat: 33.3420, lng: 44.4310, category: "تسوق وتجارة", city: "بغداد", source: "Google Maps" },
  { id: "mall-bgw-5", name: "مول الزهور - الكرادة مريم", name_en: "Al-Zuhoor Mall Karrada", lat: 33.3020, lng: 44.4180, category: "تسوق وتجارة", city: "بغداد", source: "Google Maps" },
  { id: "mall-ebl-1", name: "فاميلي مول أربيل", name_en: "Family Mall Erbil", lat: 36.2080, lng: 43.9850, category: "تسوق وتجارة", city: "أربيل", source: "Google Top Mall" },
  { id: "mall-ebl-2", name: "مجدي مول أربيل", name_en: "Majidi Mall Erbil", lat: 36.1790, lng: 44.0580, category: "تسوق وتجارة", city: "أربيل", source: "Facebook Check-ins" },
  { id: "mall-bsr-1", name: "تايمز سكوير مول البصرة", name_en: "Basra Times Square Mall", lat: 30.5210, lng: 47.8180, category: "تسوق وتجارة", city: "البصرة", source: "Google Top Mall" },

  // ---------------- Historic Markets & Bazaars ---------------- //
  { id: "mkt-bgw-1", name: "سوق الشورجة التاريخي والتجاري", name_en: "Al-Shorja Central Market", lat: 33.3370, lng: 44.3980, category: "تسوق وتجارة", city: "بغداد", source: "Google Maps Heritage" },
  { id: "mkt-bgw-2", name: "شارع المتنبي وسوق الكتب", name_en: "Al-Mutanabbi Cultural Street", lat: 33.3392, lng: 44.3881, category: "ثقافة وتراث", city: "بغداد", source: "Facebook Landmark" },
  { id: "mkt-bgw-3", name: "سوق الصفافير للنحاسيات - الرشيد", name_en: "Al-Safafir Coppersmith Market", lat: 33.3385, lng: 44.3930, category: "ثقافة وتراث", city: "بغداد", source: "Google Heritage" },
  { id: "mkt-bgw-4", name: "سوق الكرادة داخل التجاري", name_en: "Karrada Commercial Market", lat: 33.3015, lng: 44.4305, category: "تسوق وتجارة", city: "بغداد", source: "Facebook Hotspot" },

  // ---------------- Fuel Stations (Waze & Google Verified) ---------------- //
  { id: "fuel-bgw-1", name: "محطة وقود الكيلاني الحكومية", name_en: "Al-Kilani Fuel Station", lat: 33.3330, lng: 44.4120, category: "محطات وقود", city: "بغداد", source: "Waze & Google Verified" },
  { id: "fuel-bgw-2", name: "محطة وقود المنصور النموذجية", name_en: "Al-Mansour Fuel Station", lat: 33.3110, lng: 44.3590, category: "محطات وقود", city: "بغداد", source: "Waze Verified" },
  { id: "fuel-bgw-3", name: "محطة وقود الجادرية الحديثة", name_en: "Jadriya Fuel Station", lat: 33.2790, lng: 44.3840, category: "محطات وقود", city: "بغداد", source: "Waze & Google" },
  { id: "fuel-bgw-4", name: "محطة وقود زيونة", name_en: "Zayouna Fuel Station", lat: 33.3360, lng: 44.4450, category: "محطات وقود", city: "بغداد", source: "Waze Verified" },
  { id: "fuel-bgw-5", name: "محطة وقود سريع الدورة", name_en: "Dora Expressway Fuel Station", lat: 33.2610, lng: 44.4150, category: "محطات وقود", city: "بغداد", source: "Waze Verified" },
  { id: "fuel-bgw-6", name: "محطة وقود مطار بغداد الدولي", name_en: "Airport Road Fuel Station", lat: 33.2780, lng: 44.3050, category: "محطات وقود", city: "بغداد", source: "Waze & Google" },

  // ---------------- Major Hospitals & Medical Facilities ---------------- //
  { id: "hosp-bgw-1", name: "مدينة الطب - مستشفى بغداد التعليمي", name_en: "Medical City Hospital Complex", lat: 33.3490, lng: 44.3810, category: "مستشفيات", city: "بغداد", source: "Google Maps Civic" },
  { id: "hosp-bgw-2", name: "مستشفى ابن البيطار لجراحة القلب", name_en: "Ibn Al-Bitar Cardiac Hospital", lat: 33.3280, lng: 44.3790, category: "مستشفيات", city: "بغداد", source: "Google Maps Civic" },
  { id: "hosp-bgw-3", name: "مستشفى اليرموك التعليمي", name_en: "Al-Yarmouk Hospital", lat: 33.3080, lng: 44.3410, category: "مستشفيات", city: "بغداد", source: "Google Maps Civic" },
  { id: "hosp-bgw-4", name: "مستشفى الكندي التعليمي - النهضة", name_en: "Al-Kindi Teaching Hospital", lat: 33.3410, lng: 44.4360, category: "مستشفيات", city: "بغداد", source: "Google Maps Civic" },
  { id: "hosp-bgw-5", name: "مستشفى الأندلس التخصصي", name_en: "Al-Andalus Hospital", lat: 33.3215, lng: 44.4225, category: "مستشفيات", city: "بغداد", source: "Facebook Medical" },

  // ---------------- Transport Hubs & Terminals ---------------- //
  { id: "trans-bgw-1", name: "مطار بغداد الدولي - صالة بابل ونينوى", name_en: "Baghdad International Airport", lat: 33.2625, lng: 44.2344, category: "مطارات ونقل", city: "بغداد", source: "Civic Transit" },
  { id: "trans-bgw-2", name: "محطة قطار بغداد العالمية - العلاوي", name_en: "Baghdad Central Railway Station", lat: 33.3260, lng: 44.3820, category: "مطارات ونقل", city: "بغداد", source: "Civic Transit" },
  { id: "trans-bgw-3", name: "كراج العلاوي الموحد (نقل المحافظات)", name_en: "Al-Allawi Intercity Transit Terminal", lat: 33.3240, lng: 44.3850, category: "مطارات ونقل", city: "بغداد", source: "Transit Hub" },
  { id: "trans-bgw-4", name: "كراج النهضة المركزي الموحد", name_en: "Al-Nahda Intercity Bus Terminal", lat: 33.3450, lng: 44.4320, category: "مطارات ونقل", city: "بغداد", source: "Transit Hub" },

  // ---------------- Holy Shrines & National Landmarks ---------------- //
  { id: "shrine-bgw-1", name: "العتبة الكاظمية المقدسة", name_en: "Al-Kadhimiya Holy Shrine", lat: 33.3800, lng: 44.3400, category: "معلم ديني وثقافي", city: "بغداد", source: "Civic Religious" },
  { id: "shrine-bgw-2", name: "جامع أبي حنيفة النعمان - الأعظمية", name_en: "Abu Hanifa Mosque Adhamiya", lat: 33.3740, lng: 44.3590, category: "معلم ديني وثقافي", city: "بغداد", source: "Civic Religious" },
  { id: "shrine-njf-1", name: "العتبة العلوية المقدسة - النجف الأشرف", name_en: "Imam Ali Holy Shrine Najaf", lat: 31.9960, lng: 44.3140, category: "معلم ديني وثقافي", city: "النجف", source: "Civic Religious" },
  { id: "shrine-krb-1", name: "العتبة الحسينية والعباسية - كربلاء المقدسة", name_en: "Imam Hussain Holy Shrine Karbala", lat: 32.6164, lng: 44.0325, category: "معلم ديني وثقافي", city: "كربلاء", source: "Civic Religious" },
  { id: "shrine-sam-1", name: "ملوية سامراء والعتبة العسكرية", name_en: "Samarra Malwiya Minaret & Shrine", lat: 34.1980, lng: 43.8740, category: "معلم ديني وثقافي", city: "صلاح الدين", source: "UNESCO Heritage" },
  { id: "shrine-bab-1", name: "أطلال مدينة بابل الأثرية والأسد", name_en: "Ancient Babylon Archaeological Ruins", lat: 32.5420, lng: 44.4210, category: "ثقافة وتراث", city: "بابل", source: "UNESCO Heritage" },

  // ---------------- Erbil & Kurdistan Region Hotspots ---------------- //
  { id: "ebl-1", name: "قلعة أربيل التاريخية وميدان النافورة", name_en: "Erbil Citadel & Fountain Plaza", lat: 36.1912, lng: 44.0092, category: "ثقافة وتراث", city: "أربيل", source: "Google & Facebook" },
  { id: "ebl-2", name: "شارع الإسكان ومطاعم المشويات - أربيل", name_en: "Iskan Street Food District", lat: 36.1860, lng: 43.9980, category: "مطاعم ومقاهي", city: "أربيل", source: "Facebook Viral" },
  { id: "ebl-3", name: "مطار أربيل الدولي", name_en: "Erbil International Airport", lat: 36.2374, lng: 43.9592, category: "مطارات ونقل", city: "أربيل", source: "Civic Airport" },

  // ---------------- Basra Hotspots ---------------- //
  { id: "bsr-1", name: "كورنيش شط العرب وجسر المعلق الجديد", name_en: "Shatt Al-Arab Corniche Promenade", lat: 30.5190, lng: 47.8420, category: "سياحة وترفيه", city: "البصرة", source: "Facebook Hotspot" },
  { id: "bsr-2", name: "المدينة الرياضية بالبصرة (ملعب جذع النخلة)", name_en: "Basra Sports City Stadium", lat: 30.4350, lng: 47.7800, category: "رياضة وملاعب", city: "البصرة", source: "Google Landmark" },
  { id: "bsr-3", name: "مطار البصرة الدولي", name_en: "Basra International Airport", lat: 30.5490, lng: 47.6620, category: "مطارات ونقل", city: "البصرة", source: "Civic Airport" },
  { id: "bsr-4", name: "شناشيل البصرة القديمة", name_en: "Old Basra Shanasheel", lat: 30.5080, lng: 47.8250, category: "ثقافة وتراث", city: "البصرة", source: "Heritage Landmark" }
];

fs.writeFileSync(placesFile, JSON.stringify(IRAQ_MEGA_PLACES, null, 2), 'utf8');
console.log('Saved', IRAQ_MEGA_PLACES.length, 'rich Iraqi Google/Waze/Facebook locations to data/iraq_places.json');
