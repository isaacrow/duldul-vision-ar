import SwiftUI
import RealityKit
import ARKit
import CoreLocation

public struct SpatialARScannerView: View {
    @StateObject private var geoARManager = GeoSpatialARManager()
    @StateObject private var visionManager = ARKitVisionManager()
    
    @EnvironmentObject var navManager: NavigationManager
    @EnvironmentObject var bridgesManager: BridgesManager
    @EnvironmentObject var incidentManager: IncidentManager
    @EnvironmentObject var catalogService: SpatialCatalogService
    @EnvironmentObject var discoveryManager: CityMonumentsDiscoveryManager
    
    @State private var selectedItem: GeoARItem?
    @State private var activeFilter: GeoSpatialARManager.SpatialFilter = .all
    @State private var selectedRangeIndex: Int = 1 // 1500m default
    
    let ranges: [Double] = [500.0, 1500.0, 5000.0]
    let rangeLabels: [String] = ["500م", "1.5 كم", "5 كم"]
    
    public init() {}
    
    // Filtered items based on active category filter
    private var filteredItems: [GeoARItem] {
        geoARManager.geoItems.filter { item in
            switch activeFilter {
            case .all: return true
            case .bridges: return item.category == .landmark
            case .hazards: return item.category == .obstacle || item.category == .sign
            case .route: return item.id.hasPrefix("route-step")
            case .shops: return item.category == .shop
            }
        }
    }
    
    public var body: some View {
        GeometryReader { geometry in
            ZStack {
                // 1. Live ARKit Camera + RealityKit 3D Depth (.gravityAndHeading true north alignment)
                GeoARViewContainer(geoARManager: geoARManager, visionManager: visionManager)
                    .edgesIgnoringSafeArea(.all)
                
                // 2. Geographic AR 3D Billboards Projected Directly Onto World Scene
                ForEach(filteredItems) { item in
                    if item.isInsideFOV, let screenPos = item.screenPosition {
                        let posX = screenPos.x * geometry.size.width
                        let posY = screenPos.y * geometry.size.height
                        
                        GeoARBillboardView(
                            item: item,
                            isSelected: selectedItem?.id == item.id
                        ) {
                            self.selectedItem = item
                        }
                        .position(x: posX, y: posY)
                        .transition(.scale.combined(with: .opacity))
                    }
                }
                
                // 3. Off-Screen Edge Indicators (Points user toward landmarks outside camera FOV)
                VStack {
                    Spacer()
                    HStack {
                        // Left edge indicators
                        VStack(alignment: .leading, spacing: 6) {
                            ForEach(filteredItems.filter { $0.offscreenEdge == .left }.prefix(3)) { item in
                                GeoOffscreenIndicatorView(item: item) {
                                    self.selectedItem = item
                                }
                            }
                        }
                        .padding(.leading, 12)
                        
                        Spacer()
                        
                        // Right edge indicators
                        VStack(alignment: .trailing, spacing: 6) {
                            ForEach(filteredItems.filter { $0.offscreenEdge == .right }.prefix(3)) { item in
                                GeoOffscreenIndicatorView(item: item) {
                                    self.selectedItem = item
                                }
                            }
                        }
                        .padding(.trailing, 12)
                    }
                    Spacer()
                }
                
                // 4. Top Telemetry & Compass Radar HUD Overlay
                VStack(spacing: 10) {
                    // Top Status Bar: Status + Range Selector + 360° Compass Radar
                    HStack(alignment: .top, spacing: 10) {
                        VStack(alignment: .leading, spacing: 6) {
                            // Active State Capsule + Honest Accuracy Badge
                            HStack(spacing: 6) {
                                Circle()
                                    .fill(visionManager.isLiDARAvailable ? Color.green : Color.cyan)
                                    .frame(width: 8, height: 8)
                                    .shadow(color: visionManager.isLiDARAvailable ? Color.green : Color.cyan, radius: 4)
                                
                                Text(visionManager.isLiDARAvailable ? "LiDAR 3D: نشط" : "AR Geo: نشط")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(.white)
                                
                                Text("•")
                                    .foregroundColor(.white.opacity(0.4))
                                
                                Text(String(format: "%.0f° %@", geoARManager.cameraHeadingDegrees, cardinalDirection(geoARManager.cameraHeadingDegrees)))
                                    .font(.system(size: 11, weight: .black, design: .monospaced))
                                    .foregroundColor(.cyan)
                            }
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.black.opacity(0.7))
                            .cornerRadius(18)
                            .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.cyan.opacity(0.35), lineWidth: 1))
                            
                            // Real Sensor Accuracy Badge (GPS ±m, Heading ±°)
                            HStack(spacing: 6) {
                                Image(systemName: "location.north.circle.fill")
                                    .font(.system(size: 10))
                                    .foregroundColor(.yellow)
                                
                                Text(String(format: "دقة GPS: ±%.0fm", geoARManager.gpsAccuracyMeters))
                                    .font(.system(size: 9.5, weight: .semibold))
                                    .foregroundColor(.white)
                                
                                Text("•")
                                    .font(.system(size: 8))
                                    .foregroundColor(.gray)
                                
                                Text("بوصلة: مرشحة (Kalman)")
                                    .font(.system(size: 9.5, weight: .semibold))
                                    .foregroundColor(.green)
                            }
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color(red: 0.08, green: 0.10, blue: 0.14).opacity(0.85))
                            .cornerRadius(12)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.12), lineWidth: 0.8))
                            
                            // Range Segmented Pill
                            HStack(spacing: 2) {
                                ForEach(0..<ranges.count, id: \.self) { idx in
                                    Button(action: {
                                        selectedRangeIndex = idx
                                        geoARManager.radarRangeMeters = ranges[idx]
                                    }) {
                                        Text(rangeLabels[idx])
                                            .font(.system(size: 10, weight: .bold))
                                            .foregroundColor(selectedRangeIndex == idx ? .black : .white)
                                            .padding(.horizontal, 7)
                                            .padding(.vertical, 4)
                                            .background(selectedRangeIndex == idx ? Color.cyan : Color.clear)
                                            .cornerRadius(12)
                                    }
                                }
                            }
                            .padding(2)
                            .background(Color.black.opacity(0.65))
                            .cornerRadius(14)
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.15), lineWidth: 1))
                        }
                        
                        Spacer()
                        
                        // 360° Circular Geographic Compass Radar
                        GeoCompassRadarView(
                            headingDegrees: geoARManager.cameraHeadingDegrees,
                            items: filteredItems,
                            maxRangeMeters: geoARManager.radarRangeMeters
                        )
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 10)
                    
                    // Filter Chips Bar (Liquid Glass Style)
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(GeoSpatialARManager.SpatialFilter.allCases, id: \.self) { filter in
                                Button(action: {
                                    let gen = UIImpactFeedbackGenerator(style: .light)
                                    gen.impactOccurred()
                                    activeFilter = filter
                                }) {
                                    Text(filter.rawValue)
                                        .font(.system(size: 11.5, weight: .bold))
                                        .foregroundColor(activeFilter == filter ? .black : .white)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(activeFilter == filter ? Color.cyan : Color(red: 0.08, green: 0.12, blue: 0.20).opacity(0.85))
                                        .cornerRadius(16)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 16)
                                                .stroke(activeFilter == filter ? Color.cyan : Color.white.opacity(0.2), lineWidth: 1)
                                        )
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                    }
                    
                    Spacer()
                    
                    // 4.5. Proximity City Monument / Artifact Discovery Alert
                    if let nearbyMon = discoveryManager.activeNearbyMonument {
                        MonumentDiscoveryAlertView(
                            monument: nearbyMon,
                            onDiscoverTap: {
                                if nearbyMon.canBeCollected {
                                    discoveryManager.discoverMonument(id: nearbyMon.id)
                                } else {
                                    navManager.calculateRoute(
                                        to: CLLocationCoordinate2D(latitude: nearbyMon.lat, longitude: nearbyMon.lng),
                                        destName: nearbyMon.nameArabic
                                    ) { success in
                                        if success { navManager.isNavigating = true }
                                    }
                                }
                            },
                            onInspectTap: {
                                if nearbyMon.canBeCollected {
                                    discoveryManager.discoverMonument(id: nearbyMon.id)
                                }
                            }
                        )
                        .transition(.scale.combined(with: .opacity))
                        .padding(.bottom, 6)
                    }
                    
                    // 5. Bottom Interactive Landmark Card / Nearest Carousel
                    if let selected = selectedItem {
                        GeoLandmarkDetailSheet(
                            item: selected,
                            onNavigate: { destCoords, destName in
                                navManager.calculateRoute(to: destCoords, destName: destName) { success in
                                    if success {
                                        navManager.isNavigating = true
                                        self.selectedItem = nil
                                    }
                                }
                            },
                            onClose: {
                                self.selectedItem = nil
                            }
                        )
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                    } else if !filteredItems.isEmpty {
                        // Nearest Landmarks Quick Strip
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 10) {
                                ForEach(filteredItems.prefix(6)) { item in
                                    Button(action: {
                                        self.selectedItem = item
                                    }) {
                                        HStack(spacing: 6) {
                                            Circle()
                                                .fill(Color.cyan)
                                                .frame(width: 6, height: 6)
                                            
                                            Text(item.title)
                                                .font(.system(size: 11, weight: .bold))
                                                .foregroundColor(.white)
                                            
                                            Text("\(Int(item.distanceMeters))م")
                                                .font(.system(size: 10, weight: .black, design: .monospaced))
                                                .foregroundColor(.cyan)
                                        }
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 6)
                                        .background(Color(red: 0.08, green: 0.12, blue: 0.20).opacity(0.88))
                                        .cornerRadius(14)
                                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.18), lineWidth: 1))
                                    }
                                }
                            }
                            .padding(.horizontal, 16)
                            .padding(.bottom, 16)
                        }
                    } else {
                        // Empty / Guidance banner
                        Text("وجّه كاميرا الهاتف نحو الشارع — المعالم الجغرافية مثبتة مكانياً في مواقعها الحقيقية")
                            .font(.system(size: 11.5, weight: .bold))
                            .foregroundColor(.white.opacity(0.85))
                            .multilineTextAlignment(.center)
                            .padding(12)
                            .background(Color.black.opacity(0.7))
                            .cornerRadius(16)
                            .padding(.horizontal, 30)
                            .padding(.bottom, 18)
                    }
                }
            }
        }
        .onAppear {
            syncAllDataSources()
            
            visionManager.onEntityRecognized = { entity in
                let targetLat = entity.worldCoords?.latitude ?? (navManager.userLocation?.latitude ?? 0.0)
                let targetLng = entity.worldCoords?.longitude ?? (navManager.userLocation?.longitude ?? 0.0)
                
                guard targetLat != 0.0 && targetLng != 0.0 else { return }
                
                catalogService.catalogEntity(
                    title: entity.title,
                    category: entity.category,
                    confidence: entity.confidence,
                    position: entity.position,
                    lat: targetLat,
                    lng: targetLng
                )
                syncAllDataSources()
            }
        }
        .onChange(of: navManager.userLocation?.latitude) { _ in
            syncAllDataSources()
        }
        .onChange(of: navManager.userHeading) { _ in
            syncAllDataSources()
        }
    }
    
    private func syncAllDataSources() {
        guard let userLoc = navManager.userLocation else {
            return
        }
        discoveryManager.updateLocations(userLoc: userLoc, arView: geoARManager.arView)
        geoARManager.updateGeographicWorld(
            userLoc: userLoc,
            userHeading: navManager.userHeading,
            bridges: bridgesManager.bridges,
            incidents: incidentManager.incidents,
            routeSteps: navManager.activeRoute?.steps ?? [],
            scannedShops: catalogService.catalogedAnchors
        )
    }
    
    private func cardinalDirection(_ deg: Double) -> String {
        switch deg {
        case 337.5...360.0, 0.0..<22.5: return "شمال"
        case 22.5..<67.5: return "شمال شرق"
        case 67.5..<112.5: return "شرق"
        case 112.5..<157.5: return "جنوب شرق"
        case 157.5..<202.5: return "جنوب"
        case 202.5..<247.5: return "جنوب غرب"
        case 247.5..<292.5: return "غرب"
        case 292.5..<337.5: return "شمال غرب"
        default: return "شمال"
        }
    }
}

// MARK: - RealityKit ARViewContainer with Gravity & Heading Alignment
struct GeoARViewContainer: UIViewRepresentable {
    @ObservedObject var geoARManager: GeoSpatialARManager
    @ObservedObject var visionManager: ARKitVisionManager
    
    func makeUIView(context: Context) -> ARView {
        let arView = ARView(frame: .zero)
        geoARManager.startSession(in: arView)
        visionManager.arView = arView
        return arView
    }
    
    func updateUIView(_ uiView: ARView, context: Context) {}
}
