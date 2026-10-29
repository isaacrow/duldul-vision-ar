import SwiftUI

public struct ContentView: View {
    @State private var selectedTab: Int = 0
    @EnvironmentObject var navManager: NavigationManager
    @EnvironmentObject var incidentManager: IncidentManager
    @EnvironmentObject var discoveryManager: CityMonumentsDiscoveryManager
    
    public init() {}
    
    public var body: some View {
        ZStack(alignment: .bottom) {
            // Mode Views
            Group {
                switch selectedTab {
                case 0:
                    TeslaFSDVectorSpaceView()
                case 1:
                    SpatialARScannerView()
                case 2:
                    MapNavigationView()
                case 3:
                    MonumentJournalView()
                default:
                    BridgesRadarSheet()
                }
            }
            .edgesIgnoringSafeArea(.all)
            
            // Proximity Hazard Alert Toast Banner (e.g. Speed Camera / Checkpoint ahead)
            if let alert = incidentManager.nearbyAlert {
                VStack {
                    HStack(spacing: 12) {
                        Image(systemName: alert.type.iconName)
                            .font(.system(size: 22, weight: .bold))
                            .foregroundColor(.orange)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("تنبيه: \(alert.title)")
                                .font(.system(size: 14, weight: .black))
                                .foregroundColor(.white)
                            Text("على بعد أقل من 400 متر على مسارك")
                                .font(.system(size: 11))
                                .foregroundColor(.gray)
                        }
                        Spacer()
                    }
                    .padding(14)
                    .background(Color(red: 0.12, green: 0.15, blue: 0.22).opacity(0.96))
                    .cornerRadius(18)
                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.orange.opacity(0.4), lineWidth: 1.5))
                    .shadow(color: Color.black.opacity(0.5), radius: 16, y: 8)
                    .padding(.horizontal, 20)
                    .padding(.top, 14)
                    
                    Spacer()
                }
                .transition(.move(edge: .top).combined(with: .opacity))
                .animation(.spring(response: 0.35, dampingFraction: 0.8), value: incidentManager.nearbyAlert?.id)
            }
            
            // Ultra-Clean Native Tab Bar Switcher (Hidden during active navigation for full immersion)
            if !navManager.isNavigating {
                HStack(spacing: 12) {
                    TabButton(index: 0, title: "تسلا 3D", icon: "car.side.fill", selectedTab: $selectedTab)
                    TabButton(index: 1, title: "ماسح AR", icon: "camera.viewfinder", selectedTab: $selectedTab)
                    TabButton(index: 2, title: "الخريطة", icon: "map.fill", selectedTab: $selectedTab)
                    TabButton(index: 3, title: "المعالم والآثار", icon: "sparkles", selectedTab: $selectedTab)
                    TabButton(index: 4, title: "الجسور", icon: "bridge", selectedTab: $selectedTab)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(Color(red: 0.06, green: 0.08, blue: 0.12).opacity(0.92))
                .cornerRadius(26)
                .overlay(RoundedRectangle(cornerRadius: 26).stroke(Color.white.opacity(0.12), lineWidth: 1))
                .shadow(color: Color.black.opacity(0.4), radius: 20, y: 10)
                .padding(.bottom, 8)
            }
            
            // Celebration Modal when User Discovers a Monument or Artifact
            if discoveryManager.showDiscoveryCelebration, let mon = discoveryManager.newlyDiscoveredMonument {
                DiscoveryCelebrationModal(monument: mon) {
                    discoveryManager.showDiscoveryCelebration = false
                }
                .transition(.opacity)
                .zIndex(999)
            }
        }
    }
}

struct TabButton: View {
    let index: Int
    let title: String
    let icon: String
    @Binding var selectedTab: Int
    
    var isSelected: Bool { selectedTab == index }
    
    var body: some View {
        Button(action: {
            let gen = UIImpactFeedbackGenerator(style: .light)
            gen.impactOccurred()
            selectedTab = index
        }) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 13, weight: .bold))
                if isSelected {
                    Text(title)
                        .font(.system(size: 11.5, weight: .heavy))
                }
            }
            .foregroundColor(isSelected ? .white : .gray)
            .padding(.horizontal, isSelected ? 12 : 7)
            .padding(.vertical, 8)
            .background(isSelected ? Color.blue.opacity(0.65) : Color.clear)
            .cornerRadius(18)
            .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isSelected)
        }
    }
}
