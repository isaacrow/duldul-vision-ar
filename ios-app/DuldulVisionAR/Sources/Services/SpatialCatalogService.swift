import Foundation
import Combine

public class SpatialCatalogService: ObservableObject {
    @Published public var catalogedAnchors: [SpatialAnchorModel] = []
    @Published public var isSyncing: Bool = false
    
    public var serverBaseURL: String {
        return AppConfig.backendBaseURL
    }
    
    public init() {
        fetchSpatialCatalog()
    }
    
    public func fetchSpatialCatalog() {
        guard let url = URL(string: "\(serverBaseURL)/api/spatial/pois") else { return }
        URLSession.shared.dataTask(with: url) { [weak self] data, _, error in
            guard let self = self, let data = data, error == nil else { return }
            do {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let pois = json["pois"] as? [[String: Any]] {
                    let parsed: [SpatialAnchorModel] = pois.compactMap { d in
                        guard let title = d["name"] as? String,
                              let catStr = d["category"] as? String,
                              let lat = d["lat"] as? Double,
                              let lng = d["lng"] as? Double else { return nil }
                        let cat = SpatialCategory(rawValue: catStr) ?? .shop
                        let conf = (d["confidence"] as? Double).map { Float($0) } ?? 1.0
                        return SpatialAnchorModel(
                            title: title,
                            category: cat,
                            confidence: conf,
                            position: SIMD3<Float>(0, 1.5, -5.0),
                            worldCoords: WorldCoordinate(latitude: lat, longitude: lng)
                        )
                    }
                    DispatchQueue.main.async {
                        self.catalogedAnchors = parsed
                    }
                }
            } catch {
                print("[SpatialCatalogService] Parse error: \(error)")
            }
        }.resume()
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
