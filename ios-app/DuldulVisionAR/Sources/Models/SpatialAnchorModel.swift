import Foundation
import simd

public enum SpatialCategory: String, Codable {
    case vehicle = "vehicle"
    case sign = "sign"
    case shop = "shop"
    case obstacle = "obstacle"
    case landmark = "landmark"
}

public struct SpatialAnchorModel: Identifiable, Codable {
    public let id: String
    public let title: String
    public let category: SpatialCategory
    public let confidence: Float
    public let position: SIMD3<Float> // Physical (X, Y, Z) in meters relative to device
    public let worldCoords: WorldCoordinate?
    public let timestamp: Date

    public init(
        id: String = UUID().uuidString,
        title: String,
        category: SpatialCategory,
        confidence: Float,
        position: SIMD3<Float>,
        worldCoords: WorldCoordinate? = nil,
        timestamp: Date = Date()
    ) {
        self.id = id
        self.title = title
        self.category = category
        self.confidence = confidence
        self.position = position
        self.worldCoords = worldCoords
        self.timestamp = timestamp
    }
}

public struct WorldCoordinate: Codable {
    public let latitude: Double
    public let longitude: Double
    
    public init(latitude: Double, longitude: Double) {
        self.latitude = latitude
        self.longitude = longitude
    }
}
