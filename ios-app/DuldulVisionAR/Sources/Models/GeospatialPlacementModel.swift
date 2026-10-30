import Foundation
import CoreLocation

/// Verification status distinguishing approximate map plans from physically verified placements
public enum ARPlacementVerificationStatus: String, Codable, CaseIterable {
    case mapPlanned = "مخطط على الخريطة"
    case physicallyVerified = "تم التحقق ميدانياً بالكاميرا"
    case calibratedOnSite = "معاير بدقة عالية في الموقع"
    
    public var badgeColorHex: String {
        switch self {
        case .mapPlanned: return "#F59E0B" // Amber
        case .physicallyVerified: return "#10B981" // Emerald Green
        case .calibratedOnSite: return "#06B6D4" // Cyan
        }
    }
}

/// The AR positioning mode used to anchor the 3D entity
public enum ARTrackingEngineMode: String, Codable {
    case modeAAppleGeoTracking = "تتبع جغرافي آبل (Mode A)"
    case modeBGeographicFallbackENU = "تموضع بديل محلي ENU + VIO (Mode B)"
}

/// Core model representing a geographically intelligent augmented reality placement in Iraq
public struct GeospatialPlacementModel: Identifiable, Codable {
    public let id: String
    public var title: String
    public var titleArabic: String
    public var latitude: Double
    public var longitude: Double
    public var altitude: Double // Altitude in meters above ground or sea level
    public var heading: Double  // Geographic orientation (0° = True North, 90° = East)
    public var scale: Float     // Uniform scale multiplier (default 1.0)
    public var geographicAnchorId: String
    public var assetId: String  // References 3D model in USDZModelCatalog
    public var positioningAccuracy: Double // GPS accuracy in meters at creation
    public var altitudeUncertainty: Double // Altitude uncertainty in meters
    public var headingUncertainty: Double  // Heading uncertainty in degrees
    public var creationTimestamp: Date
    public var dataProvenance: String     // Provenance / source of coordinates
    public var verificationStatus: ARPlacementVerificationStatus
    public var positioningMode: ARTrackingEngineMode
    public var notes: String?
    
    public init(
        id: String = UUID().uuidString,
        title: String,
        titleArabic: String,
        latitude: Double,
        longitude: Double,
        altitude: Double = 0.0,
        heading: Double = 0.0,
        scale: Float = 1.0,
        geographicAnchorId: String = UUID().uuidString,
        assetId: String,
        positioningAccuracy: Double = 5.0,
        altitudeUncertainty: Double = 3.0,
        headingUncertainty: Double = 10.0,
        creationTimestamp: Date = Date(),
        dataProvenance: String = "استوديو دلدل الجغرافي",
        verificationStatus: ARPlacementVerificationStatus = .mapPlanned,
        positioningMode: ARTrackingEngineMode = .modeBGeographicFallbackENU,
        notes: String? = nil
    ) {
        self.id = id
        self.title = title
        self.titleArabic = titleArabic
        self.latitude = latitude
        self.longitude = longitude
        self.altitude = altitude
        self.heading = heading
        self.scale = scale
        self.geographicAnchorId = geographicAnchorId
        self.assetId = assetId
        self.positioningAccuracy = positioningAccuracy
        self.altitudeUncertainty = altitudeUncertainty
        self.headingUncertainty = headingUncertainty
        self.creationTimestamp = creationTimestamp
        self.dataProvenance = dataProvenance
        self.verificationStatus = verificationStatus
        self.positioningMode = positioningMode
        self.notes = notes
    }
    
    public var coordinate: CLLocationCoordinate2D {
        return CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}
