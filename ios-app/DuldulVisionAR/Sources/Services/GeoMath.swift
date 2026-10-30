import Foundation
import CoreLocation
import simd

/// High-precision Geodesic & Coordinate Transformation Utilities for Duldul Geospatial AR
public enum GeoMath {
    /// WGS84 semi-major axis in meters
    public static let wgs84A: Double = 6378137.0
    /// WGS84 flattening
    public static let wgs84F: Double = 1.0 / 298.257223563
    /// Earth mean radius in meters
    public static let earthMeanRadiusMeters: Double = 6371000.0
    
    // MARK: - Haversine Distance Calculation (Meters)
    public static func haversineDistance(from: CLLocationCoordinate2D, to: CLLocationCoordinate2D) -> Double {
        let lat1 = from.latitude * .pi / 180.0
        let lon1 = from.longitude * .pi / 180.0
        let lat2 = to.latitude * .pi / 180.0
        let lon2 = to.longitude * .pi / 180.0
        
        let dLat = lat2 - lat1
        let dLon = lon2 - lon1
        
        let a = sin(dLat / 2.0) * sin(dLat / 2.0) +
                cos(lat1) * cos(lat2) * sin(dLon / 2.0) * sin(dLon / 2.0)
        let c = 2.0 * atan2(sqrt(a), sqrt(max(0.0, 1.0 - a)))
        return earthMeanRadiusMeters * c
    }
    
    // MARK: - Great-Circle Forward Azimuth (0° to 360° True North)
    public static func calculateAzimuth(from: CLLocationCoordinate2D, to: CLLocationCoordinate2D) -> Double {
        let lat1 = from.latitude * .pi / 180.0
        let lon1 = from.longitude * .pi / 180.0
        let lat2 = to.latitude * .pi / 180.0
        let lon2 = to.longitude * .pi / 180.0
        
        let dLon = lon2 - lon1
        let y = sin(dLon) * cos(lat2)
        let x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dLon)
        
        var azimuthRad = atan2(y, x)
        var azimuthDeg = azimuthRad * 180.0 / .pi
        if azimuthDeg < 0.0 { azimuthDeg += 360.0 }
        return azimuthDeg
    }
    
    // MARK: - Local East-North-Up (ENU) Coordinate Conversion
    /// Converts a geographic target (WGS84 lat, lon, alt) relative to a reference origin into local ENU meters
    public static func wgs84ToLocalENU(
        target: CLLocationCoordinate2D,
        targetAltitude: Double = 0.0,
        reference: CLLocationCoordinate2D,
        referenceAltitude: Double = 0.0
    ) -> (east: Double, north: Double, up: Double) {
        let lat0Rad = reference.latitude * .pi / 180.0
        let dLat = (target.latitude - reference.latitude) * .pi / 180.0
        let dLon = (target.longitude - reference.longitude) * .pi / 180.0
        
        // Curvature corrections for ellipsoidal Earth
        let sinLat0 = sin(lat0Rad)
        let e2 = 2.0 * wgs84F - wgs84F * wgs84F
        let chi = sqrt(1.0 - e2 * sinLat0 * sinLat0)
        let radiusOfCurvatureInPrimeVertical = wgs84A / chi
        let meridionalRadius = wgs84A * (1.0 - e2) / pow(chi, 3.0)
        
        let eastMeters = (radiusOfCurvatureInPrimeVertical + referenceAltitude) * cos(lat0Rad) * dLon
        let northMeters = (meridionalRadius + referenceAltitude) * dLat
        let upMeters = targetAltitude - referenceAltitude
        
        return (east: eastMeters, north: northMeters, up: upMeters)
    }
    
    // MARK: - Transform ENU to ARKit Gravity-and-Heading 3D Vector
    /// Under ARKit `.gravityAndHeading`:
    /// +X = True East
    /// +Y = Up (opposite gravity)
    /// -Z = True North
    public static func enuToRealityKitPosition(east: Double, north: Double, up: Double) -> SIMD3<Float> {
        let x = Float(east)
        let y = Float(up)
        let z = -Float(north)
        return SIMD3<Float>(x, y, z)
    }
    
    // MARK: - Screen FOV Projection for AR HUD Overlays
    public struct ProjectedScreenPoint {
        public let normalizedPoint: CGPoint // 0..1 in screen space
        public let isInsideFOV: Bool
        public let offscreenDirection: OffscreenDirection?
    }
    
    public enum OffscreenDirection {
        case left, right, top, bottom
    }
    
    public static func projectToScreen(
        azimuthDeg: Double,
        distanceMeters: Double,
        altitudeMeters: Double,
        cameraHeadingDeg: Double,
        cameraPitchDeg: Double,
        horizontalFOV: Double = 63.5,
        verticalFOV: Double = 49.0
    ) -> ProjectedScreenPoint {
        // Relative bearing [-180 .. +180]
        var relBearing = azimuthDeg - cameraHeadingDeg
        while relBearing > 180.0 { relBearing -= 360.0 }
        while relBearing < -180.0 { relBearing += 360.0 }
        
        // Relative elevation angle [-90 .. +90]
        let elevationRad = atan2(altitudeMeters, max(1.0, distanceMeters))
        let elevationDeg = elevationRad * 180.0 / .pi
        let relElevation = elevationDeg - cameraPitchDeg
        
        let halfH = horizontalFOV / 2.0
        let halfV = verticalFOV / 2.0
        
        if abs(relBearing) <= halfH && abs(relElevation) <= halfV {
            let normX = 0.5 + (relBearing / horizontalFOV)
            let normY = 0.5 - (relElevation / verticalFOV)
            return ProjectedScreenPoint(
                normalizedPoint: CGPoint(x: normX, y: normY),
                isInsideFOV: true,
                offscreenDirection: nil
            )
        } else {
            let offDir: OffscreenDirection
            if relBearing < -halfH {
                offDir = .left
            } else if relBearing > halfH {
                offDir = .right
            } else if relElevation > halfV {
                offDir = .top
            } else {
                offDir = .bottom
            }
            return ProjectedScreenPoint(
                normalizedPoint: CGPoint(x: 0.5, y: 0.5),
                isInsideFOV: false,
                offscreenDirection: offDir
            )
        }
    }
}

// MARK: - 1D Circular Kalman Filter for Angular Heading Smoothing
public class CircularKalmanHeadingFilter {
    public private(set) var filteredHeading: Double = 0.0
    private var variance: Double = 1.0
    public let processNoise: Double
    public let measurementNoise: Double
    private var isInitialized: Bool = false
    
    public init(processNoise: Double = 0.08, measurementNoise: Double = 0.45) {
        self.processNoise = processNoise
        self.measurementNoise = measurementNoise
    }
    
    public func update(measurement: Double) -> Double {
        if !isInitialized {
            filteredHeading = measurement
            isInitialized = true
            return measurement
        }
        
        // Time update
        variance += processNoise
        
        // Angular difference handling [-180..180]
        var diff = measurement - filteredHeading
        while diff > 180.0 { diff -= 360.0 }
        while diff < -180.0 { diff += 360.0 }
        
        // Measurement update
        let gain = variance / (variance + measurementNoise)
        filteredHeading += gain * diff
        variance = (1.0 - gain) * variance
        
        // Normalize 0..360
        if filteredHeading < 0.0 { filteredHeading += 360.0 }
        if filteredHeading >= 360.0 { filteredHeading -= 360.0 }
        
        return filteredHeading
    }
    
    public func reset(to heading: Double) {
        filteredHeading = heading
        variance = 1.0
        isInitialized = true
    }
}
