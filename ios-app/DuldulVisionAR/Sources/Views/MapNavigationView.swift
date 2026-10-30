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

// MARK: - Native MapView Representable with Full Route & 3D Navigation Support
public struct NativeMapView: UIViewRepresentable {
    @ObservedObject var navManager: NavigationManager
    var incidents: [CommunityIncident]
    var bridges: [BaghdadBridge]
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
        let region = MKCoordinateRegion(center: baghdad, span: MKCoordinateSpan(latitudeDelta: 0.08, longitudeDelta: 0.08))
        mapView.setRegion(region, animated: false)
        
        // Tap Gesture to pick destination directly on map
        let tapGesture = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleMapTap(_:)))
        mapView.addGestureRecognizer(tapGesture)
        
        return mapView
    }
    
    public func updateUIView(_ mapView: MKMapView, context: Context) {
        context.coordinator.parent = self
        
        // 1. Update Route Polyline Overlay
        updatePolyline(on: mapView)
        
        // 2. Update Annotations (Bridges, Incidents, Destination)
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
        
        // Avoid rebuilding if identical
        if let existing = currentOverlays.first as? MKPolyline, existing.pointCount == route.coordinates.count {
            return
        }
        
        mapView.removeOverlays(currentOverlays)
        let polyline = MKPolyline(coordinates: route.coordinates, count: route.coordinates.count)
        mapView.addOverlay(polyline, level: .aboveRoads)
        
        // If not actively navigating, fit the route in view
        if !navManager.isNavigating {
            let rect = polyline.boundingMapRect
            mapView.setVisibleMapRect(rect, edgePadding: UIEdgeInsets(top: 80, left: 40, bottom: 220, right: 40), animated: true)
        }
    }
    
    private func updateAnnotations(on mapView: MKMapView) {
        // Collect custom annotations
        var newAnnotations: [DuldulMapAnnotation] = []
        
        // Baghdad Bridges
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
        
        // Community Incidents (Cameras, Checkpoints, Hazards)
        for inc in incidents {
            let color: UIColor
            switch inc.type {
            case .speedCamera: color = .systemRed
            case .checkpoint: color = .systemBlue
            case .trafficJam: color = .systemOrange
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
        
        // Active Destination Pin
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
        
        // Replace non-user annotations cleanly
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
            
            // Reverse geocode tap location to Arabic place name
            let loc = CLLocation(latitude: coord.latitude, longitude: coord.longitude)
            let geocoder = CLGeocoder()
            geocoder.reverseGeocodeLocation(loc) { [weak self] placemarks, _ in
                let name = placemarks?.first?.name ?? placemarks?.first?.thoroughfare ?? "موقع محدد على الخريطة"
                self?.parent.onSelectCoordinate(coord, name)
            }
        }
        
        public func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
            if let polyline = overlay as? MKPolyline {
                let renderer = MKPolylineRenderer(polyline: polyline)
                renderer.strokeColor = UIColor(red: 0.05, green: 0.70, blue: 1.0, alpha: 0.95)
                renderer.lineWidth = 7.0
                renderer.lineCap = .round
                renderer.lineJoin = .round
                return renderer
            }
            return MKOverlayRenderer(overlay: overlay)
        }
        
        public func mapView(_ mapView: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
            // Keep native pulsing user puck with direction arrow
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
    }
}

// MARK: - Production MapNavigationView
public struct MapNavigationView: View {
    @EnvironmentObject var navManager: NavigationManager
    @EnvironmentObject var incidentManager: IncidentManager
    @EnvironmentObject var bridgesManager: BridgesManager
    @StateObject private var searchService = PlacesSearchService()
    
    @State private var searchKeyword: String = ""
    @State private var showHazardSheet: Bool = false
    @State private var showBridgesSheet: Bool = false
    
    public init() {}
    
    public var body: some View {
        ZStack {
            // Full-Screen Native Apple Map Canvas
            NativeMapView(
                navManager: navManager,
                incidents: incidentManager.incidents,
                bridges: bridgesManager.bridges,
                onSelectCoordinate: { coord, name in
                    let gen = UIImpactFeedbackGenerator(style: .medium)
                    gen.impactOccurred()
                    navManager.calculateRoute(to: coord, destName: name) { _ in }
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
    }
    
    // MARK: - Browsing Mode Overlays
    private var browsingModeOverlays: some View {
        VStack {
            // Top Floating Search Capsule
            VStack(spacing: 0) {
                HStack(spacing: 12) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.cyan)
                        .font(.system(size: 16, weight: .bold))
                    
                    TextField("وين رايح؟ | ابحث عن أي مكان في العراق...", text: $searchKeyword)
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
                
                // Real Live Search Suggestions Dropdown
                if !searchService.searchResults.isEmpty && !searchKeyword.isEmpty {
                    VStack(alignment: .leading, spacing: 0) {
                        ForEach(searchService.searchResults.prefix(6)) { place in
                            Button(action: {
                                searchKeyword = ""
                                searchService.updateQuery("")
                                let gen = UIImpactFeedbackGenerator(style: .medium)
                                gen.impactOccurred()
                                navManager.calculateRoute(to: place.coordinate, destName: place.nameArabic) { _ in }
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
                                        
                                        HStack(spacing: 6) {
                                            Text(place.city)
                                                .font(.system(size: 11))
                                                .foregroundColor(.gray)
                                            Text("•")
                                                .font(.system(size: 10))
                                                .foregroundColor(.gray)
                                            Text(place.source)
                                                .font(.system(size: 10, weight: .semibold))
                                                .foregroundColor(.cyan.opacity(0.85))
                                        }
                                    }
                                    Spacer()
                                    Image(systemName: "arrow.up.backward")
                                        .foregroundColor(.gray)
                                        .font(.system(size: 12))
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
                    .padding(.top, 6)
                    .shadow(color: Color.black.opacity(0.5), radius: 14, y: 8)
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 10)
            
            Spacer()
            
            // Side Floating Control Buttons
            HStack {
                Spacer()
                VStack(spacing: 12) {
                    // Bridges Radar Button
                    Button(action: { showBridgesSheet = true }) {
                        Image(systemName: "bridge")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.cyan)
                            .frame(width: 46, height: 46)
                            .background(Color(red: 0.08, green: 0.10, blue: 0.14).opacity(0.92))
                            .clipShape(Circle())
                            .overlay(Circle().stroke(Color.white.opacity(0.15), lineWidth: 1))
                            .shadow(color: Color.black.opacity(0.3), radius: 8, y: 4)
                    }
                    
                    // Voice Mute FAB
                    Button(action: { navManager.toggleVoiceMute() }) {
                        Image(systemName: navManager.isVoiceMuted ? "speaker.slash.fill" : "speaker.wave.2.fill")
                            .font(.system(size: 17, weight: .bold))
                            .foregroundColor(navManager.isVoiceMuted ? .gray : .green)
                            .frame(width: 46, height: 46)
                            .background(Color.white)
                            .clipShape(Circle())
                            .shadow(color: Color.black.opacity(0.3), radius: 8, y: 4)
                    }
                    
                    // Quick Hazard Report Button
                    Button(action: { showHazardSheet = true }) {
                        Image(systemName: "triangle.fill")
                            .font(.system(size: 17, weight: .bold))
                            .foregroundColor(.orange)
                            .frame(width: 46, height: 46)
                            .background(Color(red: 0.08, green: 0.10, blue: 0.14).opacity(0.92))
                            .clipShape(Circle())
                            .overlay(Circle().stroke(Color.orange.opacity(0.5), lineWidth: 1.5))
                            .shadow(color: Color.black.opacity(0.3), radius: 8, y: 4)
                    }
                }
                .padding(.trailing, 16)
            }
            
            // Active Route Overview Card (Appears after selecting a destination)
            if let route = navManager.activeRoute {
                RouteOverviewCard(route: route) {
                    let gen = UINotificationFeedbackGenerator()
                    gen.notificationOccurred(.success)
                    navManager.startNavigation()
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 22)
                .transition(.move(edge: .bottom).combined(with: .opacity))
            } else {
                // Quick Iraqi Destination Shortcuts
                HStack(spacing: 8) {
                    Button(action: {
                        navManager.calculateRoute(to: CLLocationCoordinate2D(latitude: 33.3142, longitude: 44.3546), destName: "مول المنصور") { _ in }
                    }) {
                        ShortcutPill(icon: "bag.fill", title: "مول المنصور")
                    }
                    
                    Button(action: {
                        navManager.calculateRoute(to: CLLocationCoordinate2D(latitude: 33.3283, longitude: 44.4081), destName: "ساحة التحرير") { _ in }
                    }) {
                        ShortcutPill(icon: "flag.fill", title: "ساحة التحرير")
                    }
                    
                    Button(action: {
                        navManager.calculateRoute(to: CLLocationCoordinate2D(latitude: 33.2625, longitude: 44.2344), destName: "مطار بغداد الدولي") { _ in }
                    }) {
                        ShortcutPill(icon: "airplane", title: "مطار بغداد")
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 22)
            }
        }
    }
    
    // MARK: - Active Driving Cockpit View
    private var activeDrivingCockpitView: some View {
        VStack {
            // Top Maneuver Card
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
                        .foregroundColor(.white.opacity(0.95))
                        .lineLimit(1)
                }
                Spacer()
            }
            .padding(14)
            .background(Color(red: 0.08, green: 0.10, blue: 0.14).opacity(0.95))
            .cornerRadius(20)
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.white.opacity(0.14), lineWidth: 1))
            .padding(.horizontal, 16)
            .padding(.top, 10)
            
            Spacer()
            
            // Bottom Speed & Trip Metrics Bar
            HStack {
                // Live GPS Speed Pill
                VStack(spacing: 0) {
                    Text("\(Int(navManager.currentSpeedKmh))")
                        .font(.system(size: 28, weight: .black, design: .rounded))
                        .foregroundColor(navManager.isSpeedExceeded ? .red : .white)
                    Text("كم/س")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.gray)
                }
                .frame(width: 62, height: 62)
                .background(Color(red: 0.08, green: 0.10, blue: 0.14).opacity(0.94))
                .clipShape(Circle())
                .overlay(Circle().stroke(navManager.isSpeedExceeded ? Color.red : Color.white.opacity(0.15), lineWidth: 2))
                
                Spacer()
                
                // Trip ETA Info
                if let route = navManager.activeRoute {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("\(route.totalDurationMin) دقيقة")
                            .font(.system(size: 20, weight: .heavy))
                            .foregroundColor(.green)
                        Text(String(format: "%.1f كم", route.totalDistanceKm))
                            .font(.system(size: 12))
                            .foregroundColor(.gray)
                    }
                }
                
                // End Drive Button
                Button(action: {
                    let gen = UIImpactFeedbackGenerator(style: .medium)
                    gen.impactOccurred()
                    navManager.stopNavigation()
                }) {
                    Image(systemName: "xmark")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                        .frame(width: 44, height: 44)
                        .background(Color.red.opacity(0.9))
                        .clipShape(Circle())
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 24)
        }
    }
}

// MARK: - Route Overview Card
public struct RouteOverviewCard: View {
    let route: ActiveRoute
    let onStart: () -> Void
    
    public var body: some View {
        HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 4) {
                Text(route.destinationName)
                    .font(.system(size: 16, weight: .heavy))
                    .foregroundColor(.white)
                    .lineLimit(1)
                
                HStack(spacing: 8) {
                    Text("\(route.totalDurationMin) دقيقة")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.green)
                    Text("•")
                        .foregroundColor(.gray)
                    Text(String(format: "%.1f كم", route.totalDistanceKm))
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                }
            }
            
            Spacer()
            
            Button(action: onStart) {
                HStack(spacing: 6) {
                    Image(systemName: "location.fill")
                    Text("انطلاق")
                }
                .font(.system(size: 14, weight: .heavy))
                .foregroundColor(.white)
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(Color.green)
                .cornerRadius(18)
                .shadow(color: Color.green.opacity(0.4), radius: 8, y: 4)
            }
        }
        .padding(16)
        .background(Color(red: 0.08, green: 0.10, blue: 0.14).opacity(0.95))
        .cornerRadius(22)
        .overlay(RoundedRectangle(cornerRadius: 22).stroke(Color.white.opacity(0.12), lineWidth: 1))
    }
}

// MARK: - Shortcut Pill Component
public struct ShortcutPill: View {
    public let icon: String
    public let title: String
    
    public init(icon: String, title: String) {
        self.icon = icon
        self.title = title
    }
    
    public var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 11))
                .foregroundColor(.cyan)
            Text(title)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.white)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(Color(red: 0.08, green: 0.10, blue: 0.14).opacity(0.92))
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.12), lineWidth: 1))
    }
}
