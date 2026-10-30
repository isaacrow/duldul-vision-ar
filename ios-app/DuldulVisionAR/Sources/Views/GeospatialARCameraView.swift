import SwiftUI
import RealityKit
import ARKit
import CoreLocation

/// Full-Screen Geospatial AR Camera Experience for Duldul
public struct GeospatialARCameraView: View {
    @StateObject private var engine = GeospatialEngine()
    @EnvironmentObject var persistenceService: GeospatialPersistenceService
    @EnvironmentObject var modelCatalog: USDZModelCatalog
    @EnvironmentObject var landmarksService: IraqLandmarksService
    
    @State private var selectedItem: GeoARItem?
    @State private var showDetailSheet: Bool = false
    @State private var showModeSelectorSheet: Bool = false
    @State private var showStudioSheet: Bool = false
    @State private var radarRangeMeters: Double = 2500.0
    
    public init() {}
    
    public var body: some View {
        GeometryReader { geometry in
            ZStack {
                // 1. RealityKit Live Camera Viewport
                EngineARViewRepresentable(engine: engine)
                    .edgesIgnoringSafeArea(.all)
                
                // 2. 3D Screen Billboards for Objects in Camera Viewport
                ForEach(engine.activeNearbyItems) { item in
                    if item.isInsideFOV, let screenPos = item.screenPosition {
                        let posX = screenPos.x * geometry.size.width
                        let posY = screenPos.y * geometry.size.height
                        
                        GeoARBillboardView(
                            item: item,
                            isSelected: selectedItem?.id == item.id
                        ) {
                            self.selectedItem = item
                            self.showDetailSheet = true
                        }
                        .position(x: posX, y: posY)
                        .transition(.scale.combined(with: .opacity))
                    }
                }
                
                // 3. Offscreen Directional Edge Arrows
                edgeArrowsOverlay
                
                // 4. Top Telemetry HUD (Mode A/B, GPS Accuracy, Compass Calibration)
                VStack(spacing: 8) {
                    telemetryHeaderView
                    
                    if engine.isSpeedHazardWarningActive {
                        drivingSafetyWarningBanner
                    }
                    
                    Spacer()
                    
                    // 5. Bottom Controls (Recalibrate, Studio, Radar Compass)
                    bottomControlsOverlay
                }
                .padding(.top, 10)
                .padding(.horizontal, 14)
                .padding(.bottom, 24)
            }
        }
        .onAppear {
            engine.syncPlacements(with: persistenceService.savedPlacements)
        }
        .onChange(of: persistenceService.savedPlacements.count) { _ in
            engine.syncPlacements(with: persistenceService.savedPlacements)
        }
        .sheet(isPresented: $showDetailSheet) {
            if let item = selectedItem {
                LandmarkARDetailModal(item: item, engine: engine) {
                    if let userAcc = engine.userCoordinate {
                        persistenceService.markAsPhysicallyVerified(id: item.id, accuracy: engine.gpsHorizontalAccuracy)
                    }
                }
            }
        }
        .sheet(isPresented: $showModeSelectorSheet) {
            ModeExplorationSheet(engine: engine)
        }
        .sheet(isPresented: $showStudioSheet) {
            ARGeographicStudioView(initialCoordinate: engine.userCoordinate)
                .environmentObject(persistenceService)
                .environmentObject(modelCatalog)
        }
    }
    
    // MARK: - Telemetry Header
    private var telemetryHeaderView: some View {
        VStack(spacing: 6) {
            HStack(alignment: .center, spacing: 8) {
                // Mode Badge Button
                Button(action: { showModeSelectorSheet = true }) {
                    HStack(spacing: 5) {
                        Circle()
                            .fill(engine.activeMode == .modeAAppleGeoTracking ? Color.green : Color.cyan)
                            .frame(width: 8, height: 8)
                        Text(engine.activeMode == .modeAAppleGeoTracking ? "Mode A (Apple Geo)" : "Mode B (ENU Fallback)")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)
                        Image(systemName: "chevron.down")
                            .font(.system(size: 9))
                            .foregroundColor(.gray)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color.black.opacity(0.75))
                    .cornerRadius(14)
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.15), lineWidth: 1))
                }
                
                Spacer()
                
                // Sensor Accuracy Capsule
                HStack(spacing: 8) {
                    HStack(spacing: 3) {
                        Image(systemName: "location.fill")
                            .font(.system(size: 9))
                            .foregroundColor(.cyan)
                        Text("GPS: ±\(String(format: "%.1f", engine.gpsHorizontalAccuracy))م")
                            .font(.system(size: 10.5, weight: .bold, design: .monospaced))
                            .foregroundColor(.white)
                    }
                    
                    Divider().frame(height: 12).background(Color.white.opacity(0.3))
                    
                    HStack(spacing: 3) {
                        Image(systemName: "safari.fill")
                            .font(.system(size: 9))
                            .foregroundColor(.orange)
                        Text("\(Int(engine.cameraHeadingDegrees))°")
                            .font(.system(size: 10.5, weight: .bold, design: .monospaced))
                            .foregroundColor(.white)
                    }
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color.black.opacity(0.75))
                .cornerRadius(14)
            }
            
            // Engine Tracking Status Bar
            HStack {
                Text(engine.statusMessageArabic)
                    .font(.system(size: 11))
                    .foregroundColor(.gray)
                Spacer()
                Text("المعالم النشطة: \(engine.activeNearbyItems.count)")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.cyan)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 4)
            .background(Color.black.opacity(0.6))
            .cornerRadius(10)
        }
    }
    
    // MARK: - Driving Safety Alert
    private var drivingSafetyWarningBanner: some View {
        HStack(spacing: 8) {
            Image(systemName: "exclamationmark.octagon.fill")
                .foregroundColor(.red)
                .font(.system(size: 16))
            Text("تحذير أمان: تم رصد سرعة قيادة عالية (> 25 كم/س). يمنع استخدام كاميرا الواقع المعزز أثناء القيادة.")
                .font(.system(size: 11.5, weight: .bold))
                .foregroundColor(.white)
                .multilineTextAlignment(.leading)
        }
        .padding(10)
        .background(Color.red.opacity(0.85))
        .cornerRadius(12)
        .shadow(radius: 6)
    }
    
    // MARK: - Offscreen Edge Indicators
    private var edgeArrowsOverlay: some View {
        VStack {
            Spacer()
            HStack {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(engine.activeNearbyItems.filter { $0.offscreenEdge == .left }.prefix(3)) { item in
                        GeoOffscreenIndicatorView(item: item) {
                            self.selectedItem = item
                            self.showDetailSheet = true
                        }
                    }
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 6) {
                    ForEach(engine.activeNearbyItems.filter { $0.offscreenEdge == .right }.prefix(3)) { item in
                        GeoOffscreenIndicatorView(item: item) {
                            self.selectedItem = item
                            self.showDetailSheet = true
                        }
                    }
                }
            }
            Spacer()
        }
    }
    
    // MARK: - Bottom Controls
    private var bottomControlsOverlay: some View {
        HStack(alignment: .bottom, spacing: 12) {
            // Recalibrate Button
            Button(action: {
                engine.recalibrateSensors()
                let gen = UIImpactFeedbackGenerator(style: .medium)
                gen.impactOccurred()
            }) {
                VStack(spacing: 3) {
                    Image(systemName: "arrow.triangle.2.circlepath")
                        .font(.system(size: 16, weight: .bold))
                    Text("إعادة معايرة")
                        .font(.system(size: 10, weight: .bold))
                }
                .frame(width: 70, height: 55)
                .background(Color(red: 0.1, green: 0.12, blue: 0.18).opacity(0.92))
                .foregroundColor(.cyan)
                .cornerRadius(16)
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.15), lineWidth: 1))
            }
            
            Spacer()
            
            // 360° Compass Radar Mini Widget
            GeoCompassRadarView(
                headingDegrees: engine.cameraHeadingDegrees,
                items: engine.activeNearbyItems,
                maxRangeMeters: radarRangeMeters
            )
            .frame(width: 130, height: 130)
            
            Spacer()
            
            // Open Studio Planning Button
            Button(action: { showStudioSheet = true }) {
                VStack(spacing: 3) {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 16, weight: .bold))
                    Text("إضافة تجربة")
                        .font(.system(size: 10, weight: .bold))
                }
                .frame(width: 70, height: 55)
                .background(Color.cyan)
                .foregroundColor(.black)
                .cornerRadius(16)
                .shadow(color: Color.cyan.opacity(0.3), radius: 6, y: 2)
            }
        }
    }
}

// MARK: - RealityKit ARView Representable
public struct EngineARViewRepresentable: UIViewRepresentable {
    @ObservedObject var engine: GeospatialEngine
    
    public func makeUIView(context: Context) -> ARView {
        let view = ARView(frame: .zero)
        engine.startSession(in: view)
        return view
    }
    
    public func updateUIView(_ uiView: ARView, context: Context) {}
}

// MARK: - Mode Exploration & Availability Sheet
struct ModeExplorationSheet: View {
    @ObservedObject var engine: GeospatialEngine
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        ZStack {
            Color(red: 0.06, green: 0.08, blue: 0.12).edgesIgnoringSafeArea(.all)
            
            VStack(alignment: .trailing, spacing: 18) {
                HStack {
                    Button("إغلاق") { dismiss() }
                        .foregroundColor(.cyan)
                    Spacer()
                    Text("أنماط التتبع المكاني الجغرافي")
                        .font(.system(size: 17, weight: .bold))
                        .foregroundColor(.white)
                }
                
                // Mode A Explanation Card
                VStack(alignment: .trailing, spacing: 8) {
                    HStack {
                        Spacer()
                        Text("النمط A: تتبع آبل الجغرافي (ARGeoTracking)")
                            .font(.system(size: 14.5, weight: .bold))
                            .foregroundColor(.white)
                        Image(systemName: "applelogo")
                            .foregroundColor(.gray)
                    }
                    
                    Text(engine.appleGeoTrackingStatusMessage)
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.trailing)
                    
                    HStack {
                        Text(engine.appleGeoTrackingAvailableAtLocation ? "متاح في منطقتك" : "غير مدعوم جغرافياً في العراق حالياً")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(engine.appleGeoTrackingAvailableAtLocation ? .green : .orange)
                        Spacer()
                    }
                }
                .padding(14)
                .background(Color.white.opacity(0.04))
                .cornerRadius(16)
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.1), lineWidth: 1))
                
                // Mode B Explanation Card
                VStack(alignment: .trailing, spacing: 8) {
                    HStack {
                        Spacer()
                        Text("النمط B: المحرك البديل (CoreLocation + ENU + VIO)")
                            .font(.system(size: 14.5, weight: .bold))
                            .foregroundColor(.cyan)
                        Image(systemName: "globe.asia.australia.fill")
                            .foregroundColor(.cyan)
                    }
                    
                    Text("يعتمد المحرك على معادلات WGS84 وإسقاط East-North-Up المحلي مع مرشح كالمان الدائري للتوجيه وتثبيت ARKit البصري-القصوري لضمان دقة مكانية وثبات في عموم مدن العراق.")
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.trailing)
                    
                    HStack {
                        Text("النمط النشط والمعتمد رسمياً")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.cyan)
                        Spacer()
                    }
                }
                .padding(14)
                .background(Color.cyan.opacity(0.08))
                .cornerRadius(16)
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.cyan.opacity(0.3), lineWidth: 1))
                
                Spacer()
            }
            .padding(20)
        }
    }
}

// MARK: - Landmark AR Detail Modal
struct LandmarkARDetailModal: View {
    let item: GeoARItem
    @ObservedObject var engine: GeospatialEngine
    let onVerify: () -> Void
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        ZStack {
            Color(red: 0.08, green: 0.10, blue: 0.15).edgesIgnoringSafeArea(.all)
            
            VStack(alignment: .trailing, spacing: 16) {
                HStack {
                    Button("تم") { dismiss() }
                        .foregroundColor(.cyan)
                    Spacer()
                    Text(item.title)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.white)
                }
                
                HStack(spacing: 12) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("المسافة: \(Int(item.distanceMeters)) متر")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.cyan)
                        Text("الاتجاه الجغرافي: \(Int(item.azimuthDegrees))° بالنسبة للشمال")
                            .font(.system(size: 12))
                            .foregroundColor(.gray)
                    }
                    Spacer()
                }
                .padding(12)
                .background(Color.white.opacity(0.04))
                .cornerRadius(12)
                
                if let meta = item.metadata {
                    Text(meta)
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                }
                
                // Verify button if within 50m
                if item.distanceMeters < 50.0 {
                    Button(action: {
                        onVerify()
                        dismiss()
                    }) {
                        HStack {
                            Image(systemName: "checkmark.seal.fill")
                            Text("تأكيد التحقق الميداني بالكاميرا")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .foregroundColor(.black)
                        .cornerRadius(16)
                    }
                } else {
                    Text("اقترب من الموقع (أقل من 50 متراً) لتوثيق التحقق الميداني وتأكيد الدقة.")
                        .font(.system(size: 11))
                        .foregroundColor(.orange)
                        .multilineTextAlignment(.trailing)
                }
                
                Spacer()
            }
            .padding(20)
        }
    }
}
