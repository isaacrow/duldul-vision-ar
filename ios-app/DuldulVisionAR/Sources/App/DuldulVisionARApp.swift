import SwiftUI

@main
struct DuldulVisionARApp: App {
    @StateObject private var catalogService = SpatialCatalogService()
    @StateObject private var navManager = NavigationManager()
    @StateObject private var incidentManager = IncidentManager()
    @StateObject private var bridgesManager = BridgesManager()
    @StateObject private var discoveryManager = CityMonumentsDiscoveryManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(catalogService)
                .environmentObject(navManager)
                .environmentObject(incidentManager)
                .environmentObject(bridgesManager)
                .environmentObject(discoveryManager)
                .preferredColorScheme(.dark)
        }
    }
}
