import SwiftUI
import MapKit
import CoreLocation

/// AR Geographic Studio: Plan, position, calibrate and preview 3D augmented reality models at real Iraqi coordinates
public struct ARGeographicStudioView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var persistenceService: GeospatialPersistenceService
    @EnvironmentObject var modelCatalog: USDZModelCatalog
    
    // Planning Placement State
    @State private var selectedCoordinate: CLLocationCoordinate2D = CLLocationCoordinate2D(latitude: 32.5422, longitude: 44.4219) // Default: Babylon Ishtar Gate
    @State private var selectedModelId: String = "model-ishtar-gate"
    @State private var titleArabic: String = "تجربة بوابة عشتار ثلاثية الأبعاد"
    @State private var titleEnglish: String = "Ishtar Gate Spatial Experience"
    @State private var scale: Float = 1.0
    @State private var headingDeg: Double = 0.0
    @State private var altitudeOffset: Double = 0.0
    @State private var notesText: String = ""
    @State private var showSavedAlert: Bool = false
    @State private var mapRegion: MKCoordinateRegion = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 32.5422, longitude: 44.4219),
        span: MKCoordinateSpan(latitudeDelta: 0.015, longitudeDelta: 0.015)
    )
    
    // Quick Iraqi City Anchors
    let cityPresets: [(name: String, coord: CLLocationCoordinate2D)] = [
        ("بابل الأثرية", CLLocationCoordinate2D(latitude: 32.5422, longitude: 44.4219)),
        ("بغداد (التحرير)", CLLocationCoordinate2D(latitude: 33.3283, longitude: 44.4093)),
        ("كربلاء المقدسة", CLLocationCoordinate2D(latitude: 32.4419, longitude: 43.6022)),
        ("ذي قار (أور)", CLLocationCoordinate2D(latitude: 30.9628, longitude: 46.1031)),
        ("أربيل (القلعة)", CLLocationCoordinate2D(latitude: 36.1912, longitude: 44.0091)),
        ("الموصل (الحدباء)", CLLocationCoordinate2D(latitude: 36.3432, longitude: 43.1275)),
        ("البصرة (العشار)", CLLocationCoordinate2D(latitude: 30.5133, longitude: 47.8385))
    ]
    
    public init(initialCoordinate: CLLocationCoordinate2D? = nil, initialModelId: String? = nil) {
        if let c = initialCoordinate {
            _selectedCoordinate = State(initialValue: c)
            _mapRegion = State(initialValue: MKCoordinateRegion(center: c, span: MKCoordinateSpan(latitudeDelta: 0.015, longitudeDelta: 0.015)))
        }
        if let m = initialModelId {
            _selectedModelId = State(initialValue: m)
        }
    }
    
    public var body: some View {
        NavigationView {
            ZStack {
                Color(red: 0.05, green: 0.07, blue: 0.11).edgesIgnoringSafeArea(.all)
                
                ScrollView {
                    VStack(spacing: 20) {
                        // 1. Studio Header & Geographic Workflow Info
                        headerSection
                        
                        // 2. City Quick Selector
                        cityPresetsSection
                        
                        // 3. Interactive Map Placement Canvas
                        mapPickerSection
                        
                        // 4. Model Selection Carousel
                        modelSelectionSection
                        
                        // 5. Orientation, Scale & Altitude Adjusters
                        spatialTransformSection
                        
                        // 6. Placement Confidence & Verification Notice
                        verificationNoticeSection
                        
                        // 7. Save and Deploy Button
                        saveActionSection
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 40)
                }
            }
            .navigationBarTitle("استوديو التموضع الجغرافي AR", displayMode: .inline)
            .navigationBarItems(leading: Button("إلغاء") { dismiss() })
            .alert(isPresented: $showSavedAlert) {
                Alert(
                    title: Text("تم حفظ التجربة بنجاح"),
                    message: Text("تمت جدولة التجربة وحفظ الإحداثيات الجغرافية. يمكنك الآن زيارة الموقع واستعراضها عبر كاميرا AR دلدل."),
                    dismissButton: .default(Text("تم")) { dismiss() }
                )
            }
        }
    }
    
    // MARK: - Header
    private var headerSection: some View {
        VStack(alignment: .trailing, spacing: 6) {
            HStack {
                Spacer()
                Text("تخطيط التجارب المكانية في العراق")
                    .font(.system(size: 19, weight: .bold))
                    .foregroundColor(.white)
                Image(systemName: "cube.transparent.fill")
                    .foregroundColor(.cyan)
                    .font(.system(size: 20))
            }
            
            Text("قم بتثبيت مجسمات التراث ثلاثية الأبعاد بدقة على إحداثيات جغرافية حقيقية وضبط الاتجاه والارتفاع قبل زيارة الموقع ميدانياً.")
                .font(.system(size: 12.5))
                .foregroundColor(.gray)
                .multilineTextAlignment(.trailing)
        }
        .padding(14)
        .background(Color.white.opacity(0.04))
        .cornerRadius(16)
    }
    
    // MARK: - Quick Cities
    private var cityPresetsSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(cityPresets, id: \.name) { city in
                    Button(action: {
                        selectedCoordinate = city.coord
                        withAnimation {
                            mapRegion.center = city.coord
                        }
                    }) {
                        Text(city.name)
                            .font(.system(size: 13, weight: .semibold))
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(Color.cyan.opacity(0.15))
                            .foregroundColor(.cyan)
                            .cornerRadius(20)
                            .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.cyan.opacity(0.3), lineWidth: 1))
                    }
                }
            }
            .padding(.vertical, 4)
        }
    }
    
    // MARK: - Map Canvas
    private var mapPickerSection: some View {
        VStack(alignment: .trailing, spacing: 10) {
            HStack {
                Text("خط الطول: \(String(format: "%.4f", selectedCoordinate.longitude))° | خط العرض: \(String(format: "%.4f", selectedCoordinate.latitude))°")
                    .font(.system(size: 11.5, design: .monospaced))
                    .foregroundColor(.gray)
                Spacer()
                Text("الموقع الجغرافي المختار")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
            }
            
            ZStack {
                Map(coordinateRegion: $mapRegion)
                    .frame(height: 220)
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.15), lineWidth: 1))
                
                // Center Crosshair / Pin
                VStack(spacing: 0) {
                    Image(systemName: "mappin.circle.fill")
                        .font(.system(size: 32))
                        .foregroundColor(.cyan)
                        .shadow(color: .black.opacity(0.6), radius: 6, y: 3)
                    
                    // Heading Arrow preview
                    Image(systemName: "location.north.line.fill")
                        .font(.system(size: 18))
                        .foregroundColor(.orange)
                        .rotationEffect(.degrees(headingDeg))
                }
            }
            .onTapGesture {
                selectedCoordinate = mapRegion.center
            }
            
            Text("حرك الخريطة لجعل النقطة المطلوبة في المركز لتثبيت المجسم عليها.")
                .font(.system(size: 11))
                .foregroundColor(.gray)
        }
        .padding(14)
        .background(Color(red: 0.08, green: 0.11, blue: 0.16))
        .cornerRadius(18)
    }
    
    // MARK: - Model Selection
    private var modelSelectionSection: some View {
        VStack(alignment: .trailing, spacing: 10) {
            Text("اختر المجسم ثلاثي الأبعاد (USDZ / Procedural)")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.white)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(modelCatalog.models) { item in
                        let isSelected = selectedModelId == item.id
                        Button(action: {
                            selectedModelId = item.id
                            titleArabic = item.nameArabic
                            titleEnglish = item.name
                            scale = item.defaultScale
                            altitudeOffset = item.defaultAltitudeOffset
                        }) {
                            VStack(alignment: .leading, spacing: 6) {
                                HStack {
                                    Image(systemName: item.category.iconName)
                                        .foregroundColor(isSelected ? .cyan : .gray)
                                    Spacer()
                                    if isSelected {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundColor(.cyan)
                                    }
                                }
                                
                                Text(item.nameArabic)
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundColor(.white)
                                    .multilineTextAlignment(.leading)
                                    .lineLimit(2)
                                
                                Text(item.category.rawValue)
                                    .font(.system(size: 10))
                                    .foregroundColor(.gray)
                            }
                            .padding(12)
                            .frame(width: 170, height: 110)
                            .background(isSelected ? Color.cyan.opacity(0.18) : Color.white.opacity(0.05))
                            .cornerRadius(14)
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(isSelected ? Color.cyan : Color.white.opacity(0.1), lineWidth: 1.5))
                        }
                    }
                }
            }
        }
        .padding(14)
        .background(Color(red: 0.08, green: 0.11, blue: 0.16))
        .cornerRadius(18)
    }
    
    // MARK: - Spatial Transforms (Scale, Heading, Altitude)
    private var spatialTransformSection: some View {
        VStack(alignment: .trailing, spacing: 14) {
            Text("المعايرة والتحكم المكاني")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.white)
            
            // Heading Slider
            VStack(alignment: .trailing, spacing: 4) {
                HStack {
                    Text("\(Int(headingDeg))°")
                        .font(.system(size: 13, weight: .bold, design: .monospaced))
                        .foregroundColor(.cyan)
                    Spacer()
                    Text("الاتجاه الجغرافي (شمال = 0°):")
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                }
                Slider(value: $headingDeg, in: 0...360, step: 5)
                    .accentColor(.cyan)
            }
            
            // Scale Slider
            VStack(alignment: .trailing, spacing: 4) {
                HStack {
                    Text(String(format: "%.2fx", scale))
                        .font(.system(size: 13, weight: .bold, design: .monospaced))
                        .foregroundColor(.orange)
                    Spacer()
                    Text("حجم ومقياس المجسم:")
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                }
                Slider(value: $scale, in: 0.1...5.0, step: 0.1)
                    .accentColor(.orange)
            }
            
            // Altitude Offset Slider
            VStack(alignment: .trailing, spacing: 4) {
                HStack {
                    Text(String(format: "%.1f متر", altitudeOffset))
                        .font(.system(size: 13, weight: .bold, design: .monospaced))
                        .foregroundColor(.green)
                    Spacer()
                    Text("الارتفاع عن مستوى الأرض:")
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                }
                Slider(value: $altitudeOffset, in: -5.0...30.0, step: 0.5)
                    .accentColor(.green)
            }
        }
        .padding(14)
        .background(Color(red: 0.08, green: 0.11, blue: 0.16))
        .cornerRadius(18)
    }
    
    // MARK: - Verification Notice
    private var verificationNoticeSection: some View {
        HStack(spacing: 12) {
            VStack(alignment: .trailing, spacing: 3) {
                Text("تنبيه النزاهة الجغرافية:")
                    .font(.system(size: 12.5, weight: .bold))
                    .foregroundColor(.yellow)
                Text("هذا الموقع يعتبر حالياً (معاينة جغرافية تقريبية). لا يتم وسمه كـ (تم التحقق ميدانياً) إلا بعد الوقوف في الموقع الفعلي وتشغيل كاميرا ARKit.")
                    .font(.system(size: 11))
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.trailing)
            }
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.yellow)
                .font(.system(size: 22))
        }
        .padding(12)
        .background(Color.yellow.opacity(0.08))
        .cornerRadius(14)
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.yellow.opacity(0.25), lineWidth: 1))
    }
    
    // MARK: - Save Action
    private var saveActionSection: some View {
        Button(action: {
            let newPlacement = GeospatialPlacementModel(
                title: titleEnglish,
                titleArabic: titleArabic,
                latitude: selectedCoordinate.latitude,
                longitude: selectedCoordinate.longitude,
                altitude: altitudeOffset,
                heading: headingDeg,
                scale: scale,
                assetId: selectedModelId,
                positioningAccuracy: 3.0,
                altitudeUncertainty: 2.0,
                headingUncertainty: 5.0,
                creationTimestamp: Date(),
                dataProvenance: "استوديو دلدل للواقع المعزز الجغرافي",
                verificationStatus: .mapPlanned,
                positioningMode: .modeBGeographicFallbackENU,
                notes: notesText.isEmpty ? "مخطط عبر الاستوديو الجغرافي" : notesText
            )
            persistenceService.savePlacement(newPlacement)
            showSavedAlert = true
        }) {
            HStack(spacing: 8) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 16, weight: .bold))
                Text("حفظ ونشر التجربة الجغرافية")
                    .font(.system(size: 15, weight: .bold))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(Color.cyan)
            .foregroundColor(.black)
            .cornerRadius(18)
            .shadow(color: Color.cyan.opacity(0.35), radius: 10, y: 4)
        }
    }
}
