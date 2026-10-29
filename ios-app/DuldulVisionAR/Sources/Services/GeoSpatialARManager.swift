import Foundation
import CoreLocation
import ARKit
import RealityKit
import Combine
import SwiftUI

public struct GeoARItem: Identifiable {
    public let id: String
    public let title: String
    public let category: SpatialCategory
    public let coordinate: CLLocationCoordinate2D
    public let altitude: Double // Meters
    public var distanceMeters: Double
    public var azimuthDegrees: Double // 0 to 360 relative to True North
    public var relativeBearingDegrees: Double // -180 to +180 relative to camera heading
    public var screenPosition: CGPoint? // Normalized 0..1 in screen space
    public var isInsideFOV: Bool
    public var offscreenEdge: OffscreenEdge?
    public var metadata: String?
    
    public enum OffscreenEdge {
        case left
        case right
        case top
        case bottom
    }
}

public class GeoSpatialARManager: NSObject, ObservableObject, ARSessionDelegate {
    @Published public var geoItems: [GeoARItem] = []
    @Published public var selectedFilter: SpatialFilter = .all
    @Published public var radarRangeMeters: Double = 1500.0
    @Published public var cameraHeadingDegrees: Double = 0.0
    @Published public var cameraPitchDegrees: Double = 0.0
    @Published public var userCoordinate: CLLocationCoordinate2D?
    @Published public var trackingStatusText: String = "جارٍ مزامنة إحداثيات الواقع المعزز الجغرافية..."
    
    public var arView: ARView?
    private var spawnedGeoAnchors: [AnchorEntity] = []
    
    // Field of View parameters for iPhone Wide Camera
    public let horizontalFOV: Double = 63.5 // Degrees
    public let verticalFOV: Double = 49.0   // Degrees
    private let earthRadiusMeters: Double = 6371000.0
    
    public enum SpatialFilter: String, CaseIterable {
        case all = "الكل"
        case bridges = "الجسور"
        case hazards = "الرادارات والسيطرات"
        case route = "الملاحة"
        case shops = "المعالم والمحلات"
    }
    
    public override init() {
        super.init()
    }
    
    public func startSession(in view: ARView) {
        self.arView = view
        view.session.delegate = self
        
        let config = ARWorldTrackingConfiguration()
        // Gravity and Heading aligns +X to True East, -Z to True North, +Y to Gravity Up!
        config.worldAlignment = .gravityAndHeading
        config.planeDetection = [.horizontal]
        
        if ARWorldTrackingConfiguration.supportsSceneReconstruction(.meshWithClassification) {
            config.sceneReconstruction = .meshWithClassification
        }
        
        if ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth) {
            config.frameSemantics.insert(.sceneDepth)
            config.frameSemantics.insert(.smoothedSceneDepth)
        }
        
        view.session.run(config, options: [.resetTracking, .removeExistingAnchors])
        self.trackingStatusText = "نظام التموضع الجغرافي AR (True Heading) نشط"
    }
    
    public func pauseSession() {
        arView?.session.pause()
    }
    
    // MARK: - ARSessionDelegate: Frame Update
    public func session(_ session: ARSession, didUpdate frame: ARFrame) {
        // Extract Camera Pitch and Yaw from Camera Transform
        let cameraTransform = frame.camera.transform
        
        // Forward vector in ARKit is -Z (columns.2)
        let forward = -SIMD3<Float>(cameraTransform.columns.2.x, cameraTransform.columns.2.y, cameraTransform.columns.2.z)
        let forwardXZ = SIMD2<Float>(forward.x, forward.z)
        let lengthXZ = simd_length(forwardXZ)
        
        if lengthXZ > 0.001 {
            // Pitch angle (tilt up/down)
            let pitchRad = atan2(forward.y, lengthXZ)
            let pitchDeg = Double(pitchRad) * 180.0 / .pi
            
            // Yaw angle (compass heading)
            // With .gravityAndHeading: +X is East, -Z is North
            var yawRad = atan2(Double(forward.x), -Double(forward.z))
            if yawRad < 0 { yawRad += 2.0 * .pi }
            let yawDeg = yawRad * 180.0 / .pi
            
            DispatchQueue.main.async {
                self.cameraPitchDegrees = pitchDeg
                self.cameraHeadingDegrees = yawDeg
                self.recomputeGeoProjections()
            }
        }
    }
    
    // MARK: - Sync Geographic Data Sources
    public func updateGeographicWorld(
        userLoc: CLLocationCoordinate2D,
        userHeading: Double,
        bridges: [BaghdadBridge],
        incidents: [CommunityIncident],
        routeSteps: [RouteStep],
        scannedShops: [SpatialAnchorModel]
    ) {
        self.userCoordinate = userLoc
        
        var rawList: [GeoARItem] = []
        
        // 1. Bridges Layer
        for b in bridges {
            let item = buildGeoItem(
                id: "bridge-\(b.id)",
                title: b.nameArabic,
                category: .landmark,
                coord: CLLocationCoordinate2D(latitude: b.lat, longitude: b.lng),
                metadata: "\(b.statusArabic) • \(b.speedKmh) كم/س",
                userLoc: userLoc
            )
            rawList.append(item)
        }
        
        // 2. Hazards Layer (Speed Cameras, Checkpoints)
        for inc in incidents {
            let cat: SpatialCategory = (inc.type == .checkpoint) ? .obstacle : .sign
            let item = buildGeoItem(
                id: "inc-\(inc.id)",
                title: inc.title,
                category: cat,
                coord: CLLocationCoordinate2D(latitude: inc.lat, longitude: inc.lng),
                metadata: inc.type.titleArabic,
                userLoc: userLoc
            )
            rawList.append(item)
        }
        
        // 3. Navigation Maneuver Points
        for step in routeSteps {
            if let destCoord = userLoc as CLLocationCoordinate2D? {
                // Place turn marker along user vector
                let stepItem = buildGeoItem(
                    id: "route-step-\(step.id)",
                    title: step.instruction,
                    category: .sign,
                    coord: destCoord,
                    metadata: "\(Int(step.distanceMeters))م • \(step.streetName)",
                    userLoc: userLoc
                )
                rawList.append(stepItem)
                break // Show immediate upcoming maneuver
            }
        }
        
        // 4. Scanned Real POIs from OCR
        for s in scannedShops {
            if let w = s.worldCoords {
                let shopItem = buildGeoItem(
                    id: s.id,
                    title: s.title,
                    category: s.category,
                    coord: CLLocationCoordinate2D(latitude: w.latitude, longitude: w.longitude),
                    metadata: "تم الرصد عبر الذكاء البصري",
                    userLoc: userLoc
                )
                rawList.append(shopItem)
            }
        }
        
        DispatchQueue.main.async {
            self.geoItems = rawList
            self.recomputeGeoProjections()
            self.syncRealityKitGeoAnchors(userLoc: userLoc)
        }
    }
    
    // MARK: - True Geographic Math & Screen Projection
    private func buildGeoItem(
        id: String,
        title: String,
        category: SpatialCategory,
        coord: CLLocationCoordinate2D,
        metadata: String?,
        userLoc: CLLocationCoordinate2D
    ) -> GeoARItem {
        let dist = calculateHaversineDistance(from: userLoc, to: coord)
        let azimuth = calculateAzimuth(from: userLoc, to: coord)
        
        return GeoARItem(
            id: id,
            title: title,
            category: category,
            coordinate: coord,
            altitude: 0.0,
            distanceMeters: dist,
            azimuthDegrees: azimuth,
            relativeBearingDegrees: 0,
            screenPosition: nil,
            isInsideFOV: false,
            offscreenEdge: nil,
            metadata: metadata
        )
    }
    
    private func recomputeGeoProjections() {
        let heading = self.cameraHeadingDegrees
        let pitch = self.cameraPitchDegrees
        let halfHFOV = horizontalFOV / 2.0
        let halfVFOV = verticalFOV / 2.0
        
        var updated: [GeoARItem] = []
        
        for var item in self.geoItems {
            // Filter by range
            guard item.distanceMeters <= self.radarRangeMeters else { continue }
            
            // Calculate relative bearing: (-180 to +180)
            var rel = item.azimuthDegrees - heading
            while rel > 180 { rel -= 360 }
            while rel < -180 { rel += 360 }
            item.relativeBearingDegrees = rel
            
            // Elevation angle to target based on distance
            let elevationAngleDeg: Double = 0.0 // Assumed flat / ground elevation
            let relElevation = elevationAngleDeg - pitch
            
            // Check if inside camera FOV
            if abs(rel) <= halfHFOV && abs(relElevation) <= halfVFOV {
                item.isInsideFOV = true
                item.offscreenEdge = nil
                
                // Project to normalized screen coordinate [0..1]
                let normX = 0.5 + (rel / horizontalFOV)
                let normY = 0.5 - (relElevation / verticalFOV)
                item.screenPosition = CGPoint(x: normX, y: normY)
            } else {
                item.isInsideFOV = false
                item.screenPosition = nil
                
                // Determine which screen edge to point indicator
                if rel < -halfHFOV {
                    item.offscreenEdge = .left
                } else if rel > halfHFOV {
                    item.offscreenEdge = .right
                } else if relElevation > halfVFOV {
                    item.offscreenEdge = .top
                } else {
                    item.offscreenEdge = .bottom
                }
            }
            
            updated.append(item)
        }
        
        // Sort by distance (closer items rendered in front)
        self.geoItems = updated.sorted(by: { $0.distanceMeters < $1.distanceMeters })
    }
    
    // MARK: - RealityKit 3D Anchoring Aligned with True Earth Coordinates
    private func syncRealityKitGeoAnchors(userLoc: CLLocationCoordinate2D) {
        guard let arView = self.arView else { return }
        
        // Clear previous
        for anchor in spawnedGeoAnchors {
            arView.scene.removeAnchor(anchor)
        }
        spawnedGeoAnchors.removeAll()
        
        // With .gravityAndHeading:
        // +X = East (meters)
        // -Z = North (meters)
        for item in geoItems.prefix(8) { // Anchor nearest 8 items directly in RealityKit 3D space
            let deltaEastMeters = (item.coordinate.longitude - userLoc.longitude) * (.pi / 180.0) * earthRadiusMeters * cos(userLoc.latitude * .pi / 180.0)
            let deltaNorthMeters = (item.coordinate.latitude - userLoc.latitude) * (.pi / 180.0) * earthRadiusMeters
            
            let posX = Float(deltaEastMeters)
            let posZ = -Float(deltaNorthMeters)
            let posY: Float = -0.5 // Road level
            
            // Clamp 3D RealityKit rendering to 80m for visibility, beyond that screen billboard handles
            let visualDist = sqrt(posX*posX + posZ*posZ)
            let scaleFactor = (visualDist > 80.0) ? (80.0 / visualDist) : 1.0
            
            var transform = matrix_identity_float4x4
            transform.columns.3 = SIMD4<Float>(posX * Float(scaleFactor), posY, posZ * Float(scaleFactor), 1.0)
            
            let anchor = AnchorEntity(world: transform)
            
            // 3D Visual Geo Pin
            let pinMesh = MeshResource.generateCylinder(height: 1.8, radius: 0.08)
            let pinMaterial = SimpleMaterial(color: UIColor.systemCyan.withAlphaComponent(0.85), isMetallic: true)
            let pinEntity = ModelEntity(mesh: pinMesh, materials: [pinMaterial])
            
            let capMesh = MeshResource.generateSphere(radius: 0.28)
            let capColor: UIColor = (item.category == .landmark) ? .systemBlue : ((item.category == .obstacle) ? .systemOrange : .systemGreen)
            let capMaterial = SimpleMaterial(color: capColor, isMetallic: false)
            let capEntity = ModelEntity(mesh: capMesh, materials: [capMaterial])
            capEntity.position.y = 0.9
            
            anchor.addChild(pinEntity)
            anchor.addChild(capEntity)
            
            arView.scene.addAnchor(anchor)
            spawnedGeoAnchors.append(anchor)
        }
    }
    
    // MARK: - Spherical Geodesic Formulas
    private func calculateHaversineDistance(from: CLLocationCoordinate2D, to: CLLocationCoordinate2D) -> Double {
        let lat1 = from.latitude * .pi / 180.0
        let lon1 = from.longitude * .pi / 180.0
        let lat2 = to.latitude * .pi / 180.0
        let lon2 = to.longitude * .pi / 180.0
        
        let dLat = lat2 - lat1
        let dLon = lon2 - lon1
        
        let a = sin(dLat / 2.0) * sin(dLat / 2.0) +
                cos(lat1) * cos(lat2) * sin(dLon / 2.0) * sin(dLon / 2.0)
        let c = 2.0 * atan2(sqrt(a), sqrt(1.0 - a))
        return earthRadiusMeters * c
    }
    
    private func calculateAzimuth(from: CLLocationCoordinate2D, to: CLLocationCoordinate2D) -> Double {
        let lat1 = from.latitude * .pi / 180.0
        let lon1 = from.longitude * .pi / 180.0
        let lat2 = to.latitude * .pi / 180.0
        let lon2 = to.longitude * .pi / 180.0
        
        let dLon = lon2 - lon1
        let y = sin(dLon) * cos(lat2)
        let x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dLon)
        var azimuthRad = atan2(y, x)
        var azimuthDeg = azimuthRad * 180.0 / .pi
        if azimuthDeg < 0 { azimuthDeg += 360.0 }
        return azimuthDeg
    }
}
