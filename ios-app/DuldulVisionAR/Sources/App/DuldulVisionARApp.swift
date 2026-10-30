import SwiftUI

@main
struct DuldulVisionARApp: App {
    @StateObject private var catalogService = SpatialCatalogService()
    @StateObject private var navManager = NavigationManager()
    @StateObject private var incidentManager = IncidentManager()
    @StateObject private var bridgesManager = BridgesManager()
    @StateObject private var discoveryManager = CityMonumentsDiscoveryManager()
    @StateObject private var persistenceService = GeospatialPersistenceService()
    @StateObject private var modelCatalog = USDZModelCatalog()
    @StateObject private var landmarksService = IraqLandmarksService()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(catalogService)
                .environmentObject(navManager)
                .environmentObject(incidentManager)
                .environmentObject(bridgesManager)
                .environmentObject(discoveryManager)
                .environmentObject(persistenceService)
                .environmentObject(modelCatalog)
                .environmentObject(landmarksService)
                .preferredColorScheme(.dark)
        }
    }
}
