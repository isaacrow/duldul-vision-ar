import Foundation
import Combine

public class SpatialCatalogService: ObservableObject {
    @Published public var catalogedAnchors: [SpatialAnchorModel] = []
    @Published public var isSyncing: Bool = false
    
    // Change to your local machine IP or Cloudflare tunnel URL
    public var serverBaseURL: String = "https://carey-ice-virginia-market.trycloudflare.com"
    
    public init() {
        loadLocalSeedAnchors()
    }
    
    private func loadLocalSeedAnchors() {
        catalogedAnchors = [
            SpatialAnchorModel(
                title: "عشتار مول",
                category: .shop,
                confidence: 0.98,
                position: SIMD3<Float>(0.0, 1.2, -8.5),
                worldCoords: WorldCoordinate(latitude: 33.3082, longitude: 44.4023)
            ),
            SpatialAnchorModel(
                title: "صيدلية المنصور الحديثة",
                category: .shop,
                confidence: 0.95,
                position: SIMD3<Float>(-4.2, 0.8, -12.0),
                worldCoords: WorldCoordinate(latitude: 33.3145, longitude: 44.3812)
            ),
            SpatialAnchorModel(
                title: "سرعة 100 كم/س قصوى",
                category: .sign,
                confidence: 0.99,
                position: SIMD3<Float>(3.8, 2.5, -15.0),
                worldCoords: WorldCoordinate(latitude: 33.3298, longitude: 44.3645)
            )
        ]
    }
    
    public func catalogEntity(
        title: String,
        category: SpatialCategory,
        confidence: Float,
        position: SIMD3<Float>,
        lat: Double = 33.3152,
        lng: Double = 44.3661
    ) {
        let anchor = SpatialAnchorModel(
            title: title,
            category: category,
            confidence: confidence,
            position: position,
            worldCoords: WorldCoordinate(latitude: lat, longitude: lng)
        )
        
        DispatchQueue.main.async {
            self.catalogedAnchors.insert(anchor, at: 0)
        }
        
        // Asynchronously post to backend server
        syncToBackend(anchor: anchor, lat: lat, lng: lng)
    }
    
    private func syncToBackend(anchor: SpatialAnchorModel, lat: Double, lng: Double) {
        guard let url = URL(string: "\(serverBaseURL)/api/spatial/catalog") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let payload: [String: Any] = [
            "name": anchor.title,
            "category": anchor.category.rawValue,
            "confidence": anchor.confidence,
            "depthMeters": Double(-anchor.position.z),
            "lateralMeters": Double(anchor.position.x),
            "lat": lat,
            "lng": lng,
            "detectedText": anchor.title
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
            URLSession.shared.dataTask(with: request) { data, response, error in
                if let error = error {
                    print("[SpatialCatalogService] Sync error: \(error.localizedDescription)")
                } else {
                    print("[SpatialCatalogService] Successfully cataloged to server: \(anchor.title)")
                }
            }.resume()
        } catch {
            print("[SpatialCatalogService] JSON encoding error: \(error)")
        }
    }
}
