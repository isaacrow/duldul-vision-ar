import SwiftUI
import MapKit

public struct MapLocationPOI: Identifiable {
    public let id = UUID()
    public let name: String
    public let category: String
    public let iconName: String
    public let color: Color
    public let coordinate: CLLocationCoordinate2D
}

public struct MapNavigationView: View {
    @EnvironmentObject var navManager: NavigationManager
    @EnvironmentObject var incidentManager: IncidentManager
    @EnvironmentObject var bridgesManager: BridgesManager
    @StateObject private var searchService = PlacesSearchService()
    
    @State private var searchKeyword: String = ""
    @State private var showHazardSheet: Bool = false
    @State private var showBridgesSheet: Bool = false
    @State private var selectedPOI: MapLocationPOI?
    
    // Fallback Initial Region: Only centers dynamically on user location or first search
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 33.3152, longitude: 44.3661),
        span: MKCoordinateSpan(latitudeDelta: 0.08, longitudeDelta: 0.08)
    )
    
    // Curated Image 2 Iraqi Hub POIs
    private let iraqiPOIs: [MapLocationPOI] = [
        MapLocationPOI(name: "عشتار مول", category: "mall", iconName: "bag.fill", color: .blue, coordinate: CLLocationCoordinate2D(latitude: 33.3082, longitude: 44.4023)),
        MapLocationPOI(name: "د. علي الزيدي", category: "clinic", iconName: "stethoscope", color: .red, coordinate: CLLocationCoordinate2D(latitude: 33.3145, longitude: 44.3812)),
        MapLocationPOI(name: "قاعة النقيب", category: "hall", iconName: "building.columns.fill", color: .teal, coordinate: CLLocationCoordinate2D(latitude: 33.3298, longitude: 44.3645)),
        MapLocationPOI(name: "مول المنصور", category: "mall", iconName: "bag.fill", color: .purple, coordinate: CLLocationCoordinate2D(latitude: 33.3142, longitude: 44.3546)),
        MapLocationPOI(name: "جامعة بغداد - الجادرية", category: "edu", iconName: "graduationcap.fill", color: .indigo, coordinate: CLLocationCoordinate2D(latitude: 33.2711, longitude: 44.3789)),
        MapLocationPOI(name: "مستشفى اليرموك التعليمي", category: "hospital", iconName: "cross.case.fill", color: .green, coordinate: CLLocationCoordinate2D(latitude: 33.3060, longitude: 44.3815)),
        MapLocationPOI(name: "ساحة التحرير", category: "square", iconName: "flag.fill", color: .orange, coordinate: CLLocationCoordinate2D(latitude: 33.3283, longitude: 44.4081)),
        MapLocationPOI(name: "مطار بغداد الدولي", category: "airport", iconName: "airplane", color: .cyan, coordinate: CLLocationCoordinate2D(latitude: 33.2625, longitude: 44.2344))
    ]
    
    public var body: some View {
        ZStack {
            // Map Canvas with Custom Styling
            Map(coordinateRegion: $region, annotationItems: iraqiPOIs) { poi in
                MapAnnotation(coordinate: poi.coordinate) {
                    Button(action: {
                        self.selectedPOI = poi
                        navManager.calculateRoute(to: poi.coordinate, destName: poi.name) { _ in }
                    }) {
                        VStack(spacing: 4) {
                            ZStack {
                                Circle()
                                    .fill(poi.color)
                                    .frame(width: 36, height: 36)
                                    .shadow(color: .black.opacity(0.35), radius: 6, y: 3)
                                    .overlay(Circle().stroke(Color.white, lineWidth: 2))
                                
                                Image(systemName: poi.iconName)
                                    .font(.system(size: 15, weight: .bold))
                                    .foregroundColor(.white)
                            }
                            
                            Text(poi.name)
                                .font(.system(size: 10, weight: .heavy))
                                .foregroundColor(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(Color(red: 0.08, green: 0.10, blue: 0.14).opacity(0.92))
                                .cornerRadius(12)
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.15), lineWidth: 0.5))
                        }
                    }
                }
            }
            .edgesIgnoringSafeArea(.all)
            .preferredColorScheme(.dark)
            
            // Driving HUD (Active Drive Mode)
            if navManager.isNavigating {
                activeDrivingCockpitView
            } else {
                // Browsing Mode Overlays
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
                        .font(.system(size: 15, weight: .bold))
                    
                    TextField("إلى أين؟ | ابحث عن وجهة في العراق...", text: $searchKeyword)
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
                .background(Color(red: 0.08, green: 0.10, blue: 0.14).opacity(0.92))
                .cornerRadius(searchService.searchResults.isEmpty ? 22 : 16)
                .overlay(RoundedRectangle(cornerRadius: searchService.searchResults.isEmpty ? 22 : 16).stroke(Color.white.opacity(0.12), lineWidth: 1))
                .shadow(color: Color.black.opacity(0.35), radius: 16, y: 6)
                
                // Real OpenStreetMap Places Autocomplete Results Dropdown
                if !searchService.searchResults.isEmpty && !searchKeyword.isEmpty {
                    VStack(alignment: .leading, spacing: 0) {
                        ForEach(searchService.searchResults.prefix(6)) { place in
                            Button(action: {
                                selectedPOI = MapLocationPOI(
                                    name: place.nameArabic,
                                    category: place.category,
                                    iconName: "mappin.circle.fill",
                                    color: .cyan,
                                    coordinate: place.coordinate
                                )
                                region.center = place.coordinate
                                region.span = MKCoordinateSpan(latitudeDelta: 0.03, longitudeDelta: 0.03)
                                searchKeyword = ""
                                searchService.updateQuery("")
                                
                                navManager.calculateRoute(to: place.coordinate, destName: place.nameArabic) { _ in }
                            }) {
                                HStack(spacing: 12) {
                                    Image(systemName: "mappin.and.ellipse")
                                        .foregroundColor(.cyan)
                                        .font(.system(size: 14))
                                    
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(place.nameArabic)
                                            .font(.system(size: 14, weight: .bold))
                                            .foregroundColor(.white)
                                        
                                        HStack(spacing: 6) {
                                            Text(place.city)
                                                .font(.system(size: 11))
                                                .foregroundColor(.gray)
                                            Text("•")
                                                .font(.system(size: 10))
                                                .foregroundColor(.gray)
                                            Text(place.source)
                                                .font(.system(size: 10, weight: .semibold))
                                                .foregroundColor(.cyan.opacity(0.8))
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
                    .shadow(color: Color.black.opacity(0.4), radius: 12, y: 6)
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 10)
            
            Spacer()
            
            // Side Floating Controls
            HStack {
                Spacer()
                VStack(spacing: 10) {
                    // Bridges Radar Button
                    Button(action: { showBridgesSheet = true }) {
                        Image(systemName: "bridge")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.cyan)
                            .frame(width: 44, height: 44)
                            .background(Color(red: 0.08, green: 0.10, blue: 0.14).opacity(0.88))
                            .clipShape(Circle())
                            .overlay(Circle().stroke(Color.white.opacity(0.12), lineWidth: 1))
                    }
                    
                    // Voice Mute FAB
                    Button(action: { navManager.toggleVoiceMute() }) {
                        Image(systemName: navManager.isVoiceMuted ? "speaker.slash.fill" : "speaker.wave.2.fill")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(navManager.isVoiceMuted ? .gray : .green)
                            .frame(width: 44, height: 44)
                            .background(Color.white)
                            .clipShape(Circle())
                            .shadow(color: .black.opacity(0.3), radius: 8, y: 4)
                    }
                    
                    // Quick Hazard Report Button
                    Button(action: { showHazardSheet = true }) {
                        Image(systemName: "triangle.fill")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.orange)
                            .frame(width: 44, height: 44)
                            .background(Color(red: 0.08, green: 0.10, blue: 0.14).opacity(0.88))
                            .clipShape(Circle())
                            .overlay(Circle().stroke(Color.orange.opacity(0.4), lineWidth: 1))
                    }
                }
                .padding(.trailing, 16)
            }
            
            // Selected Route Card or Bottom Shortcuts
            if let route = navManager.activeRoute {
                RouteOverviewCard(route: route) {
                    navManager.startNavigation()
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 20)
            } else {
                // Image 2 Shortcuts Row
                HStack(spacing: 8) {
                    ShortcutPill(icon: "house.fill", title: "أضف المنزل")
                    ShortcutPill(icon: "briefcase.fill", title: "أضف العمل")
                    ShortcutPill(icon: "star.fill", title: "المفضلة")
                    ShortcutPill(icon: "clock.arrow.circlepath", title: "الأخيرة")
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 20)
            }
        }
    }
    
    // MARK: - Active Driving Cockpit View
    private var activeDrivingCockpitView: some View {
        VStack {
            // Top Maneuver Banner
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(Color.green)
                        .frame(width: 52, height: 52)
                    Image(systemName: "arrow.turn.up.right")
                        .font(.system(size: 26, weight: .heavy))
                        .foregroundColor(.white)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(Int(navManager.distanceToNextManeuverMeters)) م")
                        .font(.system(size: 28, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                    Text(navManager.nextManeuverText)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white.opacity(0.9))
                        .lineLimit(1)
                }
                Spacer()
            }
            .padding(14)
            .background(Color(red: 0.08, green: 0.10, blue: 0.14).opacity(0.94))
            .cornerRadius(20)
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.white.opacity(0.14), lineWidth: 1))
            .padding(.horizontal, 16)
            .padding(.top, 10)
            
            Spacer()
            
            // Bottom Speed & Trip Metrics Bar
            HStack {
                // Live Speed Pill
                VStack(spacing: 0) {
                    Text("\(Int(navManager.currentSpeedKmh))")
                        .font(.system(size: 28, weight: .black, design: .rounded))
                        .foregroundColor(navManager.isSpeedExceeded ? .red : .white)
                    Text("كم/س")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.gray)
                }
                .frame(width: 62, height: 62)
                .background(Color(red: 0.08, green: 0.10, blue: 0.14).opacity(0.92))
                .clipShape(Circle())
                .overlay(Circle().stroke(navManager.isSpeedExceeded ? Color.red : Color.white.opacity(0.12), lineWidth: 2))
                
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
                Button(action: { navManager.stopNavigation() }) {
                    Image(systemName: "xmark")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                        .frame(width: 44, height: 44)
                        .background(Color.red.opacity(0.85))
                        .clipShape(Circle())
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 24)
        }
    }
}

struct RouteOverviewCard: View {
    let route: ActiveRoute
    let onStart: () -> Void
    
    var body: some View {
        HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 2) {
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
                .padding(.horizontal, 18)
                .padding(.vertical, 12)
                .background(Color.green)
                .cornerRadius(18)
                .shadow(color: Color.green.opacity(0.35), radius: 8, y: 4)
            }
        }
        .padding(16)
        .background(Color(red: 0.08, green: 0.10, blue: 0.14).opacity(0.94))
        .cornerRadius(22)
        .overlay(RoundedRectangle(cornerRadius: 22).stroke(Color.white.opacity(0.12), lineWidth: 1))
    }
}

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
        .background(Color.white.opacity(0.08))
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.12), lineWidth: 1))
    }
}
