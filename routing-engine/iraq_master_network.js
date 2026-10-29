/**
 * Duldul Master Road Network of Iraq (جمهورية العراق)
 * Topological Graph of Federal Expressways, Baghdad Arterials, and Tigris Bridges
 */

function haversineDistKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

class IraqMasterNetwork {
  constructor() {
    this.nodes = new Map(); // id -> { id, lat, lng, name_ar, name_en, city, isCheckpoint }
    this.edges = []; // list of edges
    this.adjacency = new Map(); // id -> [ edgeIndex ]
    this.initMasterTopology();
  }

  addNode(id, lat, lng, name_ar, name_en, city = 'بغداد', isCheckpoint = false) {
    this.nodes.set(id, { id, lat, lng, name_ar, name_en, city, isCheckpoint });
    if (!this.adjacency.has(id)) {
      this.adjacency.set(id, []);
    }
  }

  addEdge(from, to, roadName_ar, roadName_en, baseSpeedKmh = 50, roadClass = 'arterial', oneWay = false, isBridge = false) {
    const n1 = this.nodes.get(from);
    const n2 = this.nodes.get(to);
    if (!n1 || !n2) return;

    const distKm = haversineDistKm(n1.lat, n1.lng, n2.lat, n2.lng);

    const edgeObj1 = {
      from,
      to,
      roadName_ar,
      roadName_en,
      distanceKm: distKm,
      baseSpeedKmh,
      roadClass, // 'expressway' | 'arterial' | 'bridge' | 'residential'
      isBridge,
      dynamicDelaySec: 0,
      crowdsourcedCongestion: 0, // 0 = clear, 1 = moderate, 2 = heavy, 3 = severe
      geometry: [
        [n1.lng, n1.lat],
        [n2.lng, n2.lat]
      ]
    };

    const idx1 = this.edges.length;
    this.edges.push(edgeObj1);
    this.adjacency.get(from).push(idx1);

    if (!oneWay) {
      const edgeObj2 = {
        from: to,
        to: from,
        roadName_ar,
        roadName_en,
        distanceKm: distKm,
        baseSpeedKmh,
        roadClass,
        isBridge,
        dynamicDelaySec: 0,
        crowdsourcedCongestion: 0,
        geometry: [
          [n2.lng, n2.lat],
          [n1.lng, n1.lat]
        ]
      };
      const idx2 = this.edges.length;
      this.edges.push(edgeObj2);
      if (!this.adjacency.has(to)) this.adjacency.set(to, []);
      this.adjacency.get(to).push(idx2);
    }
  }

  initMasterTopology() {
    // ---------------- Baghdad Core Urban Nodes ---------------- //
    this.addNode("tahrir", 33.3288, 44.4101, "ساحة التحرير ونصب الحرية", "Tahrir Square");
    this.addNode("khalani", 33.3340, 44.4050, "ساحة الخلاني", "Khalani Square");
    this.addNode("ferdaws", 33.3130, 44.4230, "ساحة الفردوس", "Firdaws Square");
    this.addNode("kahramana", 33.3160, 44.4190, "ساحة كهرمانة", "Kahramana Square");
    this.addNode("andalus", 33.3210, 44.4210, "ساحة الأندلس", "Andalus Square");
    this.addNode("karrada_in_start", 33.3120, 44.4220, "بداية شارع الكرادة داخل", "Karrada Dakhil Entrance");
    this.addNode("karrada_in_mid", 33.3010, 44.4310, "شارع الكرادة داخل - العلوية", "Karrada Dakhil Mid");
    this.addNode("karrada_in_end", 33.2890, 44.4150, "نهاية الكرادة داخل - سبع قصور", "Karrada Dakhil End");
    this.addNode("karrada_out_start", 33.3110, 44.4270, "شارع الكرادة خارج - الباب الشرقي", "Karrada Kharij Start");
    this.addNode("karrada_out_mid", 33.2980, 44.4250, "شارع الكرادة خارج - المسبح", "Karrada Kharij Masbah");
    this.addNode("masbah_junction", 33.2910, 44.4200, "تقاطع المسبح الرئيسي", "Masbah Junction");
    this.addNode("abu_nuwas_north", 33.3260, 44.4120, "شارع أبي نؤاس - الشمالي", "Abu Nuwas North");
    this.addNode("abu_nuwas_mid", 33.3080, 44.4280, "شارع أبي نؤاس - حدائق دجلة", "Abu Nuwas Corniche");
    this.addNode("abu_nuwas_south", 33.2870, 44.3980, "شارع أبي نؤاس - الجادرية", "Abu Nuwas South");

    // ---------------- Baghdad West (Karkh) Nodes ---------------- //
    this.addNode("nisoor", 33.3090, 44.3640, "ساحة النسور", "Nisoor Square");
    this.addNode("mansour_mall", 33.3142, 44.3528, "مول المنصور الرئيسي", "Mansour Mall");
    this.addNode("mansour_14ramadan", 33.3180, 44.3540, "شارع 14 رمضان - المنصور", "14th of Ramadan St");
    this.addNode("damascus_st", 33.3250, 44.3750, "شارع دمشق الدولي", "Damascus Street");
    this.addNode("yarmouk", 33.3080, 44.3410, "ساحة اليرموك ومستشفى اليرموك", "Yarmouk Square");
    this.addNode("qadisiya", 33.2950, 44.3680, "تقاطع القادسية السريع", "Qadisiya Junction");
    this.addNode("umm_tubul", 33.2880, 44.3420, "جامع أم الطبول السريع", "Umm Al-Tubul Junction");
    this.addNode("airport_rd_north", 33.2790, 44.3180, "طريق المطار السريع - بوابة الرضوانية", "Airport Highway North");
    this.addNode("airport_terminal", 33.2625, 44.2344, "مطار بغداد الدولي - صالة بابل", "Baghdad International Airport Terminal");

    // ---------------- 9 Baghdad Tigris Bridges (Nodes & Crossings) ---------------- //
    this.addNode("bridge_jumhuriya_east", 33.3275, 44.4080, "جسر الجمهورية - جانب الرصافة", "Jumhuriya Bridge East");
    this.addNode("bridge_jumhuriya_west", 33.3260, 44.3980, "جسر الجمهورية - مدخل المنطقة الخضراء", "Jumhuriya Bridge West");

    this.addNode("bridge_sinak_east", 33.3320, 44.4020, "جسر السنك - جانب الرصافة", "Sinak Bridge East");
    this.addNode("bridge_sinak_west", 33.3300, 44.3930, "جسر السنك - الصالحية", "Sinak Bridge West");

    this.addNode("bridge_ahrar_east", 33.3380, 44.3970, "جسر الأحرار - شارع الرشيد", "Ahrar Bridge East");
    this.addNode("bridge_ahrar_west", 33.3370, 44.3880, "جسر الأحرار - جانب الكرخ", "Ahrar Bridge West");

    this.addNode("bridge_shuhada_east", 33.3420, 44.3920, "جسر الشهداء - شارع المتنبي", "Shuhada Bridge East");
    this.addNode("bridge_shuhada_west", 33.3410, 44.3830, "جسر الشهداء - سوق الشواكة", "Shuhada Bridge West");

    this.addNode("bridge_bab_muadham_east", 33.3530, 44.3840, "جسر باب المعظم - مدينة الطب", "Bab Al-Muadham Bridge East");
    this.addNode("bridge_bab_muadham_west", 33.3510, 44.3750, "جسر باب المعظم - العطيفية", "Bab Al-Muadham Bridge West");

    this.addNode("bridge_jadriya_east", 33.2840, 44.3880, "جسر الجادرية - جامعة بغداد", "Jadriya Bridge East");
    this.addNode("bridge_jadriya_west", 33.2820, 44.3720, "جسر الجادرية - القادسية", "Jadriya Bridge West");

    this.addNode("bridge_dora_east", 33.2560, 44.4280, "جسر الدورة - الكرادة وسريع محمد القاسم", "Dora Bridge East");
    this.addNode("bridge_dora_west", 33.2540, 44.4080, "جسر الدورة - جانب الكرخ ومصفى الدورة", "Dora Bridge West");

    this.addNode("bridge_14ramadan_east", 33.3760, 44.3640, "جسر 14 رمضان (الأئمة) - الأعظمية", "14th of Ramadan Bridge East");
    this.addNode("bridge_14ramadan_west", 33.3740, 44.3510, "جسر 14 رمضان (الأئمة) - الكاظمية", "14th of Ramadan Bridge West");

    this.addNode("bridge_14july_east", 33.2980, 44.4020, "جسر 14 تموز (المعلق) - كرادة مريم", "14th of July Bridge East");
    this.addNode("bridge_14july_west", 33.2960, 44.3920, "جسر 14 تموز (المعلق) - الجادرية", "14th of July Bridge West");

    // ---------------- Mohammed Al-Qassim Expressway (سريع محمد القاسم) ---------------- //
    this.addNode("qassim_north", 33.3720, 44.3950, "سريع محمد القاسم - تقاطع الصليخ والأعظمية", "Mohammed Al-Qassim North");
    this.addNode("qassim_palestine_junction", 33.3480, 44.4280, "سريع محمد القاسم - ساحة بيروت", "Qassim - Beirut Square");
    this.addNode("qassim_tahrir_overpass", 33.3320, 44.4320, "سريع محمد القاسم - مجسر الباب الشرقي", "Qassim - Tahrir Overpass");
    this.addNode("qassim_karrada_junction", 33.3080, 44.4420, "سريع محمد القاسم - مخرج الكرادة وشارع الصناعة", "Qassim - Karrada Exit");
    this.addNode("qassim_dora_junction", 33.2680, 44.4410, "سريع محمد القاسم - تقاطع سريع الدورة والجنوب", "Qassim - Dora Highway Interchange");

    // ---------------- Federal Intercity Hub Nodes ---------------- //
    this.addNode("highway1_baghdad_south", 33.2200, 44.3800, "سيطرة الصقور ومخرج بغداد الجنوبي (طريق المرور السريع 1)", "Highway 1 South Gate", "بغداد", true);
    this.addNode("hillah_junction", 32.4840, 44.4320, "تقاطع الحلة الدولي ومجمع بابل الآثاري", "Hillah Interchange", "بابل");
    this.addNode("karbala_shrine", 32.6164, 44.0325, "كربلاء المقدسة - العتبة الحسينية والعباسية", "Karbala City Center", "كربلاء");
    this.addNode("najaf_shrine", 31.9960, 44.3140, "النجف الأشرف - العتبة العلوية المقدسة ومطار النجف", "Najaf City Center", "النجف");
    this.addNode("diwaniyah_hub", 31.9890, 44.9280, "مدينة الديوانية - تقاطع الفرات الأوسط", "Diwaniyah Hub", "الديوانية");
    this.addNode("nasiriyah_hub", 31.0420, 46.2570, "الناصرية - تقاطع أور السريع", "Nasiriyah Ur Hub", "ذي قار");
    this.addNode("basra_sports_city", 30.4350, 47.7800, "مدينة البصرة الرياضية (جذع النخلة)", "Basra Sports City", "البصرة");
    this.addNode("basra_corniche", 30.5190, 47.8420, "كورنيش شط العرب - البصرة الفيحاء", "Basra Corniche", "البصرة");

    this.addNode("highway_north_gate", 33.4800, 44.3200, "سيطرة الشعب - مخرج بغداد الشمالي", "North Gate - Shaab Checkpoint", "بغداد", true);
    this.addNode("samarra_hub", 34.1980, 43.8740, "سامراء - الملوية والعتبة العسكرية", "Samarra Hub", "صلاح الدين");
    this.addNode("kirkuk_hub", 35.4680, 44.3920, "كركوك - قلعة كركوك وطريق الشمال", "Kirkuk Hub", "كركوك");
    this.addNode("erbil_citadel", 36.1912, 44.0092, "قلعة أربيل وميدان نافورة هولير", "Erbil Citadel", "أربيل");
    this.addNode("mosul_hub", 36.3430, 43.1270, "الموصل القديمة - جامع النوري الكبير", "Old Mosul Hub", "الموصل");

    // ---------------- Connecting Edges (Dual Carriageway & Expressways) ---------------- //
    // Mohammed Al-Qassim Expressway (Fast North-South Spine)
    this.addEdge("qassim_north", "qassim_palestine_junction", "طريق محمد القاسم السريع", "Mohammed Al-Qassim Expressway", 95, "expressway");
    this.addEdge("qassim_palestine_junction", "qassim_tahrir_overpass", "طريق محمد القاسم السريع", "Mohammed Al-Qassim Expressway", 90, "expressway");
    this.addEdge("qassim_tahrir_overpass", "qassim_karrada_junction", "طريق محمد القاسم السريع", "Mohammed Al-Qassim Expressway", 90, "expressway");
    this.addEdge("qassim_karrada_junction", "qassim_dora_junction", "طريق محمد القاسم السريع", "Mohammed Al-Qassim Expressway", 95, "expressway");

    // Connect Qassim to Central Baghdad
    this.addEdge("qassim_tahrir_overpass", "tahrir", "مجسر قرطبة والباب الشرقي", "Cordoba Overpass to Tahrir", 55, "arterial");
    this.addEdge("qassim_karrada_junction", "karrada_in_mid", "شارع الصناعة المؤدي للكرادة", "Sinaa St to Karrada", 45, "arterial");
    this.addEdge("qassim_karrada_junction", "karrada_out_mid", "شارع النضال المؤدي للمسبح", "Nidhal St to Masbah", 50, "arterial");

    // Karrada Internal Grid
    this.addEdge("tahrir", "ferdaws", "شارع السعدون التجاري", "Saadoun Street", 50, "arterial");
    this.addEdge("ferdaws", "kahramana", "شارع الكرادة داخل - المقطع الأول", "Karrada Dakhil Section 1", 40, "arterial");
    this.addEdge("kahramana", "karrada_in_mid", "شارع الكرادة داخل - العلوية", "Karrada Dakhil Mid Section", 35, "arterial");
    this.addEdge("karrada_in_mid", "karrada_in_end", "شارع الكrادة داخل - سبع قصور", "Karrada Dakhil South", 35, "arterial");
    this.addEdge("karrada_in_end", "masbah_junction", "تقاطع المسبح والكرادة خارج", "Masbah Connection", 45, "arterial");
    this.addEdge("ferdaws", "karrada_out_start", "شارع الكرادة خارج", "Karrada Kharij North", 45, "arterial");
    this.addEdge("karrada_out_start", "karrada_out_mid", "شارع الكرادة خارج - مجمع المتاجر", "Karrada Kharij Mid", 40, "arterial");
    this.addEdge("karrada_out_mid", "masbah_junction", "شارع الكرادة خارج - المسبح", "Karrada Kharij Masbah", 45, "arterial");
    this.addEdge("masbah_junction", "bridge_jadriya_east", "شارع جامعة بغداد المؤدي لجسر الجادرية", "Jadriya Bridge Access", 55, "arterial");

    // Abu Nuwas Riverbank Scenic Highway
    this.addEdge("tahrir", "abu_nuwas_north", "نزلة شارع أبي نؤاس", "Abu Nuwas Ramp", 45, "arterial");
    this.addEdge("abu_nuwas_north", "abu_nuwas_mid", "شارع أبي نؤاس الكورنيش", "Abu Nuwas Riverbank Corniche", 60, "arterial");
    this.addEdge("abu_nuwas_mid", "abu_nuwas_south", "شارع أبي نؤاس باتجاه الجادرية", "Abu Nuwas Southbound", 60, "arterial");
    this.addEdge("abu_nuwas_south", "bridge_jadriya_east", "كورنيش الجادرية المؤدي للجسر", "Jadriya Corniche to Bridge", 55, "arterial");

    // Tigris Bridges Crossings
    this.addEdge("tahrir", "bridge_jumhuriya_east", "مقتربات جسر الجمهورية", "Jumhuriya Bridge Ramp", 50, "arterial");
    this.addEdge("bridge_jumhuriya_east", "bridge_jumhuriya_west", "جسر الجمهورية التاريخي", "Al-Jumhuriya Bridge", 60, "bridge", false, true);
    this.addEdge("bridge_jumhuriya_west", "damascus_st", "شارع دمشق باتجاه الكرخ", "Damascus St from Green Zone", 50, "arterial");

    this.addEdge("khalani", "bridge_sinak_east", "مقتربات جسر السنك", "Sinak Bridge Ramp", 45, "arterial");
    this.addEdge("bridge_sinak_east", "bridge_sinak_west", "جسر السنك العابر لدجلة", "Al-Sinak Bridge", 55, "bridge", false, true);
    this.addEdge("bridge_sinak_west", "damascus_st", "شارع الصالحية المؤدي لدمشق", "Salhiya St to Damascus", 50, "arterial");

    this.addEdge("bridge_jadriya_east", "bridge_jadriya_west", "جسر الجادرية المعلق (دجلة)", "Al-Jadriya Bridge", 70, "bridge", false, true);
    this.addEdge("bridge_jadriya_west", "qadisiya", "سريع القادسية باتجاه المطار والكرخ", "Qadisiya Expressway West", 85, "expressway");

    this.addEdge("qassim_dora_junction", "bridge_dora_east", "مدخل جسر الدورة السريع", "Dora Bridge East Ramp", 70, "expressway");
    this.addEdge("bridge_dora_east", "bridge_dora_west", "جسر الدورة السريع العابر لدجلة", "Al-Dora Bridge Expressway", 80, "bridge", false, true);
    this.addEdge("bridge_dora_west", "qadisiya", "سريع الدورة باتجاه القادسية والمطار", "Dora to Qadisiya Expressway", 85, "expressway");

    this.addEdge("karrada_in_mid", "bridge_14july_east", "مقتربات جسر 14 تموز (المعلق)", "14th of July Bridge Ramp", 45, "arterial");
    this.addEdge("bridge_14july_east", "bridge_14july_west", "جسر 14 تموز (المعلق)", "14th of July Bridge", 60, "bridge", false, true);
    this.addEdge("bridge_14july_west", "damascus_st", "شارع كرادة مريم", "Karradat Maryam St", 50, "arterial");

    // West Baghdad (Karkh) Arterials to Airport
    this.addEdge("damascus_st", "nisoor", "شارع دمشق باتجاه ساحة النسور", "Damascus St to Nisoor", 60, "arterial");
    this.addEdge("nisoor", "mansour_mall", "شارع المنصور الرئيسي (الأميرات)", "Princesses Street Mansour", 50, "arterial");
    this.addEdge("mansour_mall", "mansour_14ramadan", "شارع 14 رمضان الشهير", "14th of Ramadan Commercial", 45, "arterial");
    this.addEdge("nisoor", "yarmouk", "شارع الأردن السريع", "Jordan Street Expressway", 65, "arterial");
    this.addEdge("qadisiya", "umm_tubul", "سريع القادسية المؤدي للمطار", "Qadisiya to Umm Al-Tubul", 85, "expressway");
    this.addEdge("umm_tubul", "airport_rd_north", "طريق المطار الدولي - المقطع السريع", "Baghdad Airport Highway", 100, "expressway");
    this.addEdge("yarmouk", "airport_rd_north", "شارع أم الطبول الفرعي", "Umm Al-Tubul Access", 70, "arterial");
    this.addEdge("airport_rd_north", "airport_terminal", "طريق مطار بغداد الدولي السريع VIP", "Baghdad International Airport VIP Expressway", 110, "expressway");

    // Federal Arterials: Baghdad to Holy Shrines & Basra (Highway 1)
    this.addEdge("qadisiya", "highway1_baghdad_south", "طريق المرور السريع 1 - المخرج الجنوبي", "Expressway 1 Southbound", 100, "expressway");
    this.addEdge("highway1_baghdad_south", "hillah_junction", "طريق المرور السريع 1 (بغداد - بابل)", "Expressway 1: Baghdad - Babylon", 115, "expressway");
    this.addEdge("hillah_junction", "karbala_shrine", "طريق الحلة - كربلاء السريع", "Hillah to Karbala Highway", 90, "arterial");
    this.addEdge("karbala_shrine", "najaf_shrine", "طريق يا حسين (كربلاء - النجف الأشرف)", "Karbala to Najaf Highway", 85, "arterial");
    this.addEdge("hillah_junction", "diwaniyah_hub", "طريق المرور السريع 1 (الحلة - الديوانية)", "Expressway 1: Hillah to Diwaniyah", 120, "expressway");
    this.addEdge("diwaniyah_hub", "nasiriyah_hub", "طريق المرور السريع 1 (الديوانية - الناصرية)", "Expressway 1: Diwaniyah to Nasiriyah", 120, "expressway");
    this.addEdge("nasiriyah_hub", "basra_sports_city", "طريق المرور السريع 1 (الناصرية - البصرة)", "Expressway 1: Nasiriyah to Basra", 120, "expressway");
    this.addEdge("basra_sports_city", "basra_corniche", "شارع الكويت وشارع بغداد في البصرة", "Basra City Center Avenue", 60, "arterial");

    // Federal Arterials: Baghdad to North (Kirkuk, Erbil, Mosul)
    this.addEdge("qassim_north", "highway_north_gate", "طريق بغداد الشمالي السريع (سيطرة الشعب)", "Baghdad North Gate Highway", 85, "expressway");
    this.addEdge("highway_north_gate", "samarra_hub", "طريق بغداد - سامراء الدولي", "Baghdad to Samarra Highway", 105, "expressway");
    this.addEdge("samarra_hub", "mosul_hub", "طريق تكريت - بيجي - الموصل الدولي", "Samarra to Mosul Highway", 100, "expressway");
    this.addEdge("highway_north_gate", "kirkuk_hub", "طريق بغداد - الخالص - كركوك", "Baghdad to Kirkuk Highway", 95, "expressway");
    this.addEdge("kirkuk_hub", "erbil_citadel", "طريق كركوك - أربيل السريع الدولي", "Kirkuk to Erbil Highway", 110, "expressway");
  }
}

module.exports = { IraqMasterNetwork, haversineDistKm };
