import SwiftUI

public struct ContentView: View {
    @State private var selectedTab: Int = 0
    @EnvironmentObject var navManager: NavigationManager
    @EnvironmentObject var persistenceService: GeospatialPersistenceService
    @EnvironmentObject var modelCatalog: USDZModelCatalog
    @EnvironmentObject var landmarksService: IraqLandmarksService
    @EnvironmentObject var discoveryManager: CityMonumentsDiscoveryManager
    
    public init() {}
    
    public var body: some View {
        ZStack(alignment: .bottom) {
            // Primary Application Tab Screens
            Group {
                switch selectedTab {
                case 0:
                    MapNavigationView()
                case 1:
                    ExploreLandmarksView()
                case 2:
                    GeospatialARCameraView()
                case 3:
                    ModelCatalogView()
                case 4:
                    UserProfileView()
                default:
                    MapNavigationView()
                }
            }
            .edgesIgnoringSafeArea(.all)
            
            // Native Tab Bar Switcher (Hidden during active driving navigation)
            if !navManager.isNavigating {
                nativeTabBar
            }
        }
    }
    
    // MARK: - 5 Primary Tabs
    private var nativeTabBar: some View {
        HStack(spacing: 8) {
            DuldulTabItem(index: 0, title: "الخريطة", icon: "map.fill", selectedTab: $selectedTab)
            DuldulTabItem(index: 1, title: "الاستكشاف", icon: "safari.fill", selectedTab: $selectedTab)
            DuldulTabItem(index: 2, title: "الواقع المعزز", icon: "camera.viewfinder", selectedTab: $selectedTab)
            DuldulTabItem(index: 3, title: "النماذج 3D", icon: "cube.fill", selectedTab: $selectedTab)
            DuldulTabItem(index: 4, title: "ملفي", icon: "person.fill", selectedTab: $selectedTab)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .background(Color(red: 0.06, green: 0.08, blue: 0.12).opacity(0.94))
        .cornerRadius(24)
        .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color.white.opacity(0.12), lineWidth: 1))
        .shadow(color: Color.black.opacity(0.45), radius: 18, y: 8)
        .padding(.horizontal, 12)
        .padding(.bottom, 8)
    }
}

struct DuldulTabItem: View {
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
            VStack(spacing: 3) {
                Image(systemName: icon)
                    .font(.system(size: isSelected ? 17 : 15, weight: isSelected ? .bold : .medium))
                    .foregroundColor(isSelected ? .cyan : .gray)
                
                Text(title)
                    .font(.system(size: 10, weight: isSelected ? .bold : .medium))
                    .foregroundColor(isSelected ? .white : .gray)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 4)
            .background(isSelected ? Color.cyan.opacity(0.12) : Color.clear)
            .cornerRadius(12)
        }
    }
}
