import SwiftUI
import MapKit
import CoreLocation

// MARK: - Custom Annotation Item for MKMapView
public class DuldulMapAnnotation: NSObject, MKAnnotation {
    public let coordinate: CLLocationCoordinate2D
    public let title: String?
    public let subtitle: String?
    public let category: String
    public let iconName: String
    public let tintColor: UIColor
    
    public init(
        coordinate: CLLocationCoordinate2D,
        title: String?,
        subtitle: String?,
        category: String,
        iconName: String,
        tintColor: UIColor
    ) {
        self.coordinate = coordinate
        self.title = title
        self.subtitle = subtitle
        self.category = category
        self.iconName = iconName
        self.tintColor = tintColor
        super.init()
    }
}

// MARK: - Native MapView Representable with Full Route, Landmarks & 3D Navigation Support
public struct NativeMapView: UIViewRepresentable {
    @ObservedObject var navManager: NavigationManager
    var incidents: [CommunityIncident]
    var bridges: [BaghdadBridge]
    var landmarks: [IraqLandmarkItem]
    @Binding var targetCenterCoordinate: CLLocationCoordinate2D?
    var onSelectCoordinate: (CLLocationCoordinate2D, String) -> Void
    
    public func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    public func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView()
        mapView.delegate = context.coordinator
        mapView.showsUserLocation = true
        mapView.userTrackingMode = .none
        mapView.isRotateEnabled = true
        mapView.isPitchEnabled = true
        mapView.showsBuildings = true
        mapView.showsTraffic = true
        mapView.overrideUserInterfaceStyle = .dark
        
        // Initial Baghdad Region
        let baghdad = CLLocationCoordinate2D(latitude: 33.3152, longitude: 44.3661)
        let region = MKCoordinateRegion(center: baghdad, span: MKCoordinateSpan(latitudeDelta: 0.12, longitudeDelta: 0.12))
        mapView.setRegion(region, animated: false)
        
        // Tap Gesture to pick any geographic point on map
        let tapGesture = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleMapTap(_:)))
        mapView.addGestureRecognizer(tapGesture)
        
        return mapView
    }
    
    public func updateUIView(_ mapView: MKMapView, context: Context) {
        context.coordinator.parent = self
        
        // Center camera if requested by city switcher
        if let target = targetCenterCoordinate {
            let region = MKCoordinateRegion(center: target, span: MKCoordinateSpan(latitudeDelta: 0.08, longitudeDelta: 0.08))
            mapView.setRegion(region, animated: true)
            DispatchQueue.main.async {
                self.targetCenterCoordinate = nil
            }
        }
        
        // 1. Update Route Polyline Overlay
        updatePolyline(on: mapView)
        
        // 2. Update Annotations (Landmarks, Bridges, Incidents, Destination)
        updateAnnotations(on: mapView)
        
        // 3. Camera Handling: 3D Driving Cockpit vs Overview
        if navManager.isNavigating, let targetCoord = navManager.snappedLocation ?? navManager.userLocation {
            let camera = MKMapCamera(
                lookingAtCenter: targetCoord,
                fromDistance: 320,
                pitch: 58,
                heading: navManager.userHeading
            )
            mapView.setCamera(camera, animated: true)
        }
    }
    
    private func updatePolyline(on mapView: MKMapView) {
        let currentOverlays = mapView.overlays
        
        guard let route = navManager.activeRoute, route.coordinates.count >= 2 else {
            if !currentOverlays.isEmpty {
                mapView.removeOverlays(currentOverlays)
            }
            return
        }
        
        if let existing = currentOverlays.first as? MKPolyline, existing.pointCount == route.coordinates.count {
            return
        }
        
        mapView.removeOverlays(currentOverlays)
        let polyline = MKPolyline(coordinates: route.coordinates, count: route.coordinates.count)
        mapView.addOverlay(polyline, level: .aboveRoads)
    }
    
    private func updateAnnotations(on mapView: MKMapView) {
        var newAnnotations: [DuldulMapAnnotation] = []
        
        // 1. Historical & Cultural Landmarks of Iraq
        for lm in landmarks {
            let ann = DuldulMapAnnotation(
                coordinate: lm.coordinate,
                title: lm.nameArabic,
                subtitle: "\(lm.cityName) • \(lm.historicalPeriod)",
                category: "landmark",
                iconName: "crown.fill",
                tintColor: .systemCyan
            )
            newAnnotations.append(ann)
        }
        
        // 2. Baghdad Bridges
        for bridge in bridges {
            let ann = DuldulMapAnnotation(
                coordinate: CLLocationCoordinate2D(latitude: bridge.lat, longitude: bridge.lng),
                title: bridge.nameArabic,
                subtitle: "\(bridge.statusArabic) • \(bridge.speedKmh) كم/س",
                category: "bridge",
                iconName: "bridge",
                tintColor: bridge.statusArabic == "سالك" ? .systemGreen : (bridge.statusArabic == "مزدحم" ? .systemRed : .systemOrange)
            )
            newAnnotations.append(ann)
        }
        
        // 3. Community Incidents
        for inc in incidents {
            let color: UIColor
            switch inc.type {
            case .speedCamera: color = .systemRed
            case .checkpoint: color = .systemBlue
            default: color = .systemYellow
            }
            let ann = DuldulMapAnnotation(
                coordinate: CLLocationCoordinate2D(latitude: inc.lat, longitude: inc.lng),
                title: inc.title,
                subtitle: inc.type.titleArabic,
                category: inc.type.rawValue,
                iconName: inc.type.iconName,
                tintColor: color
            )
            newAnnotations.append(ann)
        }
        
        // 4. Active Destination Pin
        if let route = navManager.activeRoute, let lastCoord = route.coordinates.last {
            let destAnn = DuldulMapAnnotation(
                coordinate: lastCoord,
                title: route.destinationName,
                subtitle: "\(route.totalDurationMin) دقيقة • \(String(format: "%.1f كم", route.totalDistanceKm))",
                category: "destination",
                iconName: "mappin.and.ellipse",
                tintColor: .systemGreen
            )
            newAnnotations.append(destAnn)
        }
        
        let existingCustom = mapView.annotations.filter { !($0 is MKUserLocation) }
        mapView.removeAnnotations(existingCustom)
        mapView.addAnnotations(newAnnotations)
    }
    
    public class Coordinator: NSObject, MKMapViewDelegate {
        var parent: NativeMapView
        
        init(_ parent: NativeMapView) {
            self.parent = parent
        }
        
        @objc func handleMapTap(_ gesture: UITapGestureRecognizer) {
            guard let mapView = gesture.view as? MKMapView else { return }
            let point = gesture.location(in: mapView)
            let coord = mapView.convert(point, toCoordinateFrom: mapView)
            
            // Format coordinate title
            let title = "نقطة جغرافية (\(String(format: "%.4f", coord.latitude)), \(String(format: "%.4f", coord.longitude)))"
            parent.onSelectCoordinate(coord, title)
        }
        
        public func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
            if let polyline = overlay as? MKPolyline {
                let renderer = MKPolylineRenderer(polyline: polyline)
                renderer.strokeColor = UIColor.systemCyan
                renderer.lineWidth = 6.0
                renderer.lineCap = .round
                renderer.lineJoin = .round
                return renderer
            }
            return MKOverlayRenderer(overlay: overlay)
        }
        
        public func mapView(_ mapView: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
            if annotation is MKUserLocation { return nil }
            
            guard let custom = annotation as? DuldulMapAnnotation else { return nil }
            let identifier = "DuldulMarker_\(custom.category)"
            
            var marker = mapView.dequeueReusableAnnotationView(withIdentifier: identifier) as? MKMarkerAnnotationView
            if marker == nil {
                marker = MKMarkerAnnotationView(annotation: custom, reuseIdentifier: identifier)
                marker?.canShowCallout = true
            } else {
                marker?.annotation = custom
            }
            
            marker?.markerTintColor = custom.tintColor
            marker?.glyphImage = UIImage(systemName: custom.iconName)
            
            return marker
        }
        
        public func mapView(_ mapView: MKMapView, didSelect view: MKAnnotationView) {
            if let custom = view.annotation as? DuldulMapAnnotation {
                parent.onSelectCoordinate(custom.coordinate, custom.title ?? "معلم جغرافي")
            }
        }
    }
}

// MARK: - Production MapNavigationView
public struct MapNavigationView: View {
    @EnvironmentObject var navManager: NavigationManager
    @EnvironmentObject var incidentManager: IncidentManager
    @EnvironmentObject var bridgesManager: BridgesManager
    @EnvironmentObject var landmarksService: IraqLandmarksService
    @EnvironmentObject var persistenceService: GeospatialPersistenceService
    @EnvironmentObject var modelCatalog: USDZModelCatalog
    @StateObject private var searchService = PlacesSearchService()
    
    @State private var searchKeyword: String = ""
    @State private var showHazardSheet: Bool = false
    @State private var showBridgesSheet: Bool = false
    @State private var showStudioSheet: Bool = false
    @State private var targetCenterCoord: CLLocationCoordinate2D? = nil
    
    // Selected Point Inspection State
    @State private var inspectedCoordinate: CLLocationCoordinate2D? = nil
    @State private var inspectedPlaceName: String = ""
    
    let quickCities: [(name: String, coord: CLLocationCoordinate2D)] = [
        ("بغداد", CLLocationCoordinate2D(latitude: 33.3152, longitude: 44.3661)),
        ("بابل", CLLocationCoordinate2D(latitude: 32.5422, longitude: 44.4219)),
        ("كربلاء", CLLocationCoordinate2D(latitude: 32.6160, longitude: 44.0249)),
        ("النجف", CLLocationCoordinate2D(latitude: 32.0000, longitude: 44.3333)),
        ("ذي قار (أور)", CLLocationCoordinate2D(latitude: 30.9628, longitude: 46.1031)),
        ("أربيل", CLLocationCoordinate2D(latitude: 36.1912, longitude: 44.0091)),
        ("الموصل", CLLocationCoordinate2D(latitude: 36.3432, longitude: 43.1275)),
        ("البصرة", CLLocationCoordinate2D(latitude: 30.5133, longitude: 47.8385))
    ]
    
    public init() {}
    
    public var body: some View {
        ZStack {
            // Full-Screen Native Apple Map Canvas
            NativeMapView(
                navManager: navManager,
                incidents: incidentManager.incidents,
                bridges: bridgesManager.bridges,
                landmarks: landmarksService.landmarks,
                targetCenterCoordinate: $targetCenterCoord,
                onSelectCoordinate: { coord, name in
                    let gen = UIImpactFeedbackGenerator(style: .medium)
                    gen.impactOccurred()
                    self.inspectedCoordinate = coord
                    self.inspectedPlaceName = name
                }
            )
            .edgesIgnoringSafeArea(.all)
            
            // Cockpit Driving Mode or Browsing Mode Overlays
            if navManager.isNavigating {
                activeDrivingCockpitView
            } else {
                browsingModeOverlays
            }
        }
        .sheet(isPresented: $showHazardSheet) {
            ReportHazardSheet(userLocation: navManager.userLocation)
                .environmentObject(incidentManager)
        }
        .sheet(isPresented: $showBridgesSheet) {
            BridgesRadarSheet()
                .environmentObject(bridgesManager)
        }
        .sheet(isPresented: $showStudioSheet) {
            ARGeographicStudioView(initialCoordinate: inspectedCoordinate)
                .environmentObject(persistenceService)
                .environmentObject(modelCatalog)
        }
    }
    
    // MARK: - Browsing Mode Overlays
    private var browsingModeOverlays: some View {
        VStack {
            // Top Floating Search Capsule + Quick Cities Bar
            VStack(spacing: 8) {
                // Search Bar
                HStack(spacing: 12) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.cyan)
                        .font(.system(size: 16, weight: .bold))
                    
                    TextField("ابحث عن أي مكان أو معلم في العراق...", text: $searchKeyword)
                        .font(.system(size: 14.5, weight: .medium))
                        .foregroundColor(.white)
                        .onChange(of: searchKeyword) { newValue in
                            searchService.updateQuery(newValue)
                        }
                    
                    if searchService.isSearching {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .cyan))
                            .scaleEffect(0.8)
                    } else if !searchKeyword.isEmpty {
                        Button(action: {
                            searchKeyword = ""
                            searchService.updateQuery("")
                        }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.gray)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(Color(red: 0.08, green: 0.10, blue: 0.14).opacity(0.94))
                .cornerRadius(searchService.searchResults.isEmpty ? 22 : 16)
                .overlay(RoundedRectangle(cornerRadius: searchService.searchResults.isEmpty ? 22 : 16).stroke(Color.white.opacity(0.12), lineWidth: 1))
                .shadow(color: Color.black.opacity(0.4), radius: 16, y: 6)
                
                // City Quick Shortcuts
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(quickCities, id: \.name) { city in
                            Button(action: {
                                targetCenterCoord = city.coord
                            }) {
                                Text(city.name)
                                    .font(.system(size: 12, weight: .semibold))
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(Color(red: 0.12, green: 0.15, blue: 0.22).opacity(0.92))
                                    .foregroundColor(.white)
                                    .cornerRadius(14)
                                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.1), lineWidth: 1))
                            }
                        }
                    }
                }
                
                // Search Suggestions Dropdown
                if !searchService.searchResults.isEmpty && !searchKeyword.isEmpty {
                    VStack(alignment: .leading, spacing: 0) {
                        ForEach(searchService.searchResults.prefix(5)) { place in
                            Button(action: {
                                searchKeyword = ""
                                searchService.updateQuery("")
                                let gen = UIImpactFeedbackGenerator(style: .medium)
                                gen.impactOccurred()
                                inspectedCoordinate = place.coordinate
                                inspectedPlaceName = place.nameArabic
                                targetCenterCoord = place.coordinate
                            }) {
                                HStack(spacing: 12) {
                                    Image(systemName: "mappin.and.ellipse")
                                        .foregroundColor(.cyan)
                                        .font(.system(size: 15))
                                    
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(place.nameArabic)
                                            .font(.system(size: 14, weight: .bold))
                                            .foregroundColor(.white)
                                            .lineLimit(1)
                                        
                                        Text(place.city)
                                            .font(.system(size: 11))
                                            .foregroundColor(.gray)
                                    }
                                    Spacer()
                                }
                                .padding(.horizontal, 16)
                                .padding(.vertical, 10)
                            }
                            Divider().background(Color.white.opacity(0.08))
                        }
                    }
                    .background(Color(red: 0.08, green: 0.10, blue: 0.14).opacity(0.96))
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.12), lineWidth: 1))
                    .shadow(color: Color.black.opacity(0.5), radius: 14, y: 8)
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 10)
            
            Spacer()
            
            // Selected Coordinate Inspector Card
            if let coord = inspectedCoordinate {
                VStack(alignment: .trailing, spacing: 10) {
                    HStack {
                        Button(action: { inspectedCoordinate = nil }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.gray)
                                .font(.system(size: 18))
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(inspectedPlaceName)
                                .font(.system(size: 15, weight: .bold))
                                .foregroundColor(.white)
                            Text("\(String(format: "%.4f", coord.latitude))°N, \(String(format: "%.4f", coord.longitude))°E")
                                .font(.system(size: 11, design: .monospaced))
                                .foregroundColor(.cyan)
                        }
                    }
                    
                    HStack(spacing: 10) {
                        // Open in AR Studio Button
                        Button(action: { showStudioSheet = true }) {
                            HStack(spacing: 6) {
                                Image(systemName: "cube.transparent")
                                Text("تخطيط AR في الموقع")
                            }
                            .font(.system(size: 12.5, weight: .bold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(Color.cyan)
                            .foregroundColor(.black)
                            .cornerRadius(12)
                        }
                        
                        // Navigate Route Button
                        Button(action: {
                            navManager.calculateRoute(to: coord, destName: inspectedPlaceName) { _ in }
                            inspectedCoordinate = nil
                        }) {
                            HStack(spacing: 6) {
                                Image(systemName: "arrow.triangle.turn.up.right.diamond.fill")
                                Text("توجيه ملاحي")
                            }
                            .font(.system(size: 12.5, weight: .bold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(Color.white.opacity(0.1))
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                    }
                }
                .padding(14)
                .background(Color(red: 0.08, green: 0.10, blue: 0.15).opacity(0.96))
                .cornerRadius(18)
                .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.cyan.opacity(0.4), lineWidth: 1.5))
                .padding(.horizontal, 16)
                .padding(.bottom, 75)
                .transition(.move(edge: .bottom).combined(with: .opacity))
            } else if let route = navManager.activeRoute {
                RouteOverviewCard(route: route) {
                    let gen = UINotificationFeedbackGenerator()
                    gen.notificationOccurred(.success)
                    navManager.startNavigation()
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 75)
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
    }
    
    // MARK: - Active Driving Cockpit View
    private var activeDrivingCockpitView: some View {
        VStack {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(Color.green)
                        .frame(width: 54, height: 54)
                    Image(systemName: "arrow.turn.up.right")
                        .font(.system(size: 28, weight: .heavy))
                        .foregroundColor(.white)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(Int(navManager.distanceToNextManeuverMeters)) م")
                        .font(.system(size: 30, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                    
                    Text(navManager.nextManeuverText)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)
                        .lineLimit(1)
                }
                Spacer()
                
                Button(action: { navManager.stopNavigation() }) {
                    Image(systemName: "xmark")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)
                        .padding(10)
                        .background(Color.red)
                        .clipShape(Circle())
                }
            }
            .padding(14)
            .background(Color(red: 0.08, green: 0.10, blue: 0.15).opacity(0.96))
            .cornerRadius(20)
            .padding(.horizontal, 16)
            .padding(.top, 8)
            
            Spacer()
        }
    }
}

// MARK: - Route Overview Card
struct RouteOverviewCard: View {
    let route: ActiveRoute
    let onStart: () -> Void
    
    var body: some View {
        HStack(spacing: 14) {
            Button(action: onStart) {
                HStack(spacing: 6) {
                    Image(systemName: "play.fill")
                        .font(.system(size: 14, weight: .black))
                    Text("انطلق")
                        .font(.system(size: 16, weight: .black))
                }
                .padding(.horizontal, 22)
                .padding(.vertical, 12)
                .background(Color.green)
                .foregroundColor(.black)
                .cornerRadius(16)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                Text(route.destinationName)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(.white)
                
                HStack(spacing: 6) {
                    Text("\(String(format: "%.1f", route.totalDistanceKm)) كم")
                        .font(.system(size: 13, design: .monospaced))
                        .foregroundColor(.gray)
                    Text("•")
                        .foregroundColor(.gray)
                    Text("\(route.totalDurationMin) دقيقة")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.cyan)
                }
            }
        }
        .padding(14)
        .background(Color(red: 0.08, green: 0.10, blue: 0.15).opacity(0.96))
        .cornerRadius(20)
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.white.opacity(0.12), lineWidth: 1))
    }
}
