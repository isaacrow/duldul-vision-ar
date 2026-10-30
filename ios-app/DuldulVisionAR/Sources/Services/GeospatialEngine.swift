import Foundation
import CoreLocation
import ARKit
import RealityKit
import Combine
import SwiftUI

/// Core Geospatial Engine for Duldul: Supporting Mode A (Apple GeoTracking with ARGeoAnchor) and Mode B (Fallback ENU + VIO)
public class GeospatialEngine: NSObject, ObservableObject, ARSessionDelegate, CLLocationManagerDelegate {
    // MARK: - Published Engine State
    @Published public var activeMode: ARTrackingEngineMode = .modeBGeographicFallbackENU
    @Published public var appleGeoTrackingSupportedOnDevice: Bool = false
    @Published public var appleGeoTrackingAvailableAtLocation: Bool = false
    @Published public var appleGeoTrackingStatusMessage: String = "جارٍ فحص توفر التتبع الجغرافي من آبل..."
    
    // Telemetry & Accuracy Bounds
    @Published public var userCoordinate: CLLocationCoordinate2D?
    @Published public var userAltitude: Double = 0.0
    @Published public var gpsHorizontalAccuracy: Double = 5.0
    @Published public var altitudeAccuracy: Double = 3.0
    @Published public var compassAccuracy: Double = 8.0
    @Published public var isHeadingCalibrating: Bool = false
    @Published public var cameraHeadingDegrees: Double = 0.0
    @Published public var cameraPitchDegrees: Double = 0.0
    @Published public var isSpeedHazardWarningActive: Bool = false
    
    // Rendered Items in AR
    @Published public var renderedPlacements: [GeospatialPlacementModel] = []
    @Published public var activeNearbyItems: [GeoARItem] = []
    @Published public var selectedPlacement: GeospatialPlacementModel?
    @Published public var statusMessageArabic: String = "تهيئة محرك التموضع الجغرافي..."
    
    // Session Reference Origin (VIO Stability Fix)
    public private(set) var sessionOriginCoordinate: CLLocationCoordinate2D?
    public private(set) var sessionOriginAltitude: Double = 0.0
    private var isAnchorsSpawned: Bool = false
    
    // Low-Level References
    public var arView: ARView?
    private let locationManager = CLLocationManager()
    private let kalmanFilter = CircularKalmanHeadingFilter(processNoise: 0.06, measurementNoise: 0.35)
    private var spawned3DAnchors: [AnchorEntity] = []
    
    public override init() {
        super.init()
        setupLocationManager()
        checkAppleGeoTrackingDeviceSupport()
    }
    
    // MARK: - Location Manager Setup
    private func setupLocationManager() {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBestForNavigation
        locationManager.distanceFilter = 1.0 // 1 meter updates
        locationManager.headingFilter = 1.0   // 1 degree updates
        locationManager.requestWhenInUseAuthorization()
        locationManager.startUpdatingLocation()
        locationManager.startUpdatingHeading()
    }
    
    // MARK: - Hardware Capability Checks
    private func checkAppleGeoTrackingDeviceSupport() {
        self.appleGeoTrackingSupportedOnDevice = ARGeoTrackingConfiguration.isSupported
    }
    
    public func checkAppleGeoTrackingAvailability(at coord: CLLocationCoordinate2D) {
        guard ARGeoTrackingConfiguration.isSupported else {
            DispatchQueue.main.async {
                self.appleGeoTrackingAvailableAtLocation = false
                self.appleGeoTrackingStatusMessage = "جهازك لا يدعم ARGeoTracking عتادياً. نمط التموضع الافتراضي هو Mode B."
            }
            return
        }
        
        ARGeoTrackingConfiguration.checkAvailability(at: coord) { [weak self] (isAvailable, error) in
            DispatchQueue.main.async {
                guard let self = self else { return }
                self.appleGeoTrackingAvailableAtLocation = isAvailable
                if isAvailable {
                    self.appleGeoTrackingStatusMessage = "تتبع آبل الجغرافي فائق الدقة (Mode A) متاح في هذه المنطقة!"
                } else {
                    self.appleGeoTrackingStatusMessage = "خدمة Apple GeoTracking غير مدعومة في هذه الرقعة الجغرافية من العراق. تم تفعيل المحرك البديل ENU + VIO (Mode B) بدقة المستشعرات الميدانية."
                }
            }
        }
    }
    
    // MARK: - Start AR Tracking Session
    public func startSession(in view: ARView, preferredMode: ARTrackingEngineMode? = nil) {
        self.arView = view
        view.session.delegate = self
        
        let targetMode = preferredMode ?? self.activeMode
        
        if targetMode == .modeAAppleGeoTracking && appleGeoTrackingSupportedOnDevice && appleGeoTrackingAvailableAtLocation {
            startAppleGeoTracking(in: view)
        } else {
            startFallbackWorldTracking(in: view)
        }
    }
    
    private func startAppleGeoTracking(in view: ARView) {
        let config = ARGeoTrackingConfiguration()
        config.planeDetection = [.horizontal]
        config.environmentTexturing = .automatic
        
        view.session.run(config, options: [.resetTracking, .removeExistingAnchors])
        self.activeMode = .modeAAppleGeoTracking
        self.statusMessageArabic = "نمط التتبع الجغرافي من آبل (Mode A) قيد التشغيل"
    }
    
    private func startFallbackWorldTracking(in view: ARView) {
        let config = ARWorldTrackingConfiguration()
        // Gravity + Heading aligns: +X = True East, -Z = True North, +Y = Up
        config.worldAlignment = .gravityAndHeading
        config.planeDetection = [.horizontal]
        config.environmentTexturing = .automatic
        
        if ARWorldTrackingConfiguration.supportsSceneReconstruction(.meshWithClassification) {
            config.sceneReconstruction = .meshWithClassification
        }
        
        if ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth) {
            config.frameSemantics.insert(.sceneDepth)
            config.frameSemantics.insert(.smoothedSceneDepth)
        }
        
        view.session.run(config, options: [.resetTracking, .removeExistingAnchors])
        self.activeMode = .modeBGeographicFallbackENU
        self.statusMessageArabic = "المحرك الجغرافي البديل ENU + VIO (Mode B) نشط"
    }
    
    public func pauseSession() {
        arView?.session.pause()
    }
    
    // MARK: - Manual Sensor & Origin Recalibration
    public func recalibrateSensors() {
        guard let arView = self.arView else { return }
        
        for anchor in spawned3DAnchors {
            arView.scene.removeAnchor(anchor)
        }
        spawned3DAnchors.removeAll()
        isAnchorsSpawned = false
        
        startFallbackWorldTracking(in: arView)
        
        if let userCoord = self.userCoordinate {
            self.sessionOriginCoordinate = userCoord
            self.sessionOriginAltitude = self.userAltitude
            spawnPhysical3DAnchors()
        }
    }
    
    // MARK: - ARSessionDelegate: Frame Update
    public func session(_ session: ARSession, didUpdate frame: ARFrame) {
        let cameraTransform = frame.camera.transform
        
        // Forward vector in ARKit is -Z (columns.2)
        let forward = -SIMD3<Float>(cameraTransform.columns.2.x, cameraTransform.columns.2.y, cameraTransform.columns.2.z)
        let forwardXZ = SIMD2<Float>(forward.x, forward.z)
        let lengthXZ = simd_length(forwardXZ)
        
        if lengthXZ > 0.001 {
            let pitchRad = atan2(forward.y, lengthXZ)
            let pitchDeg = Double(pitchRad) * 180.0 / .pi
            
            // Camera yaw angle in True North frame
            var rawYawRad = atan2(Double(forward.x), -Double(forward.z))
            if rawYawRad < 0.0 { rawYawRad += 2.0 * .pi }
            let rawYawDeg = rawYawRad * 180.0 / .pi
            
            let smoothHeading = kalmanFilter.update(measurement: rawYawDeg)
            
            DispatchQueue.main.async {
                self.cameraPitchDegrees = pitchDeg
                self.cameraHeadingDegrees = smoothHeading
                self.recomputeScreenProjections()
            }
        }
    }
    
    public func session(_ session: ARSession, cameraDidChangeTrackingState camera: ARCamera) {
        switch camera.trackingState {
        case .normal:
            statusMessageArabic = "تتبع مكاني 6DoF عالي الاستقرار (VIO ثابت)"
        case .limited(let reason):
            switch reason {
            case .excessiveMotion:
                statusMessageArabic = "يرجى إبطاء حركة الكاميرا للمحافظة على المحاذاة"
            case .insufficientFeatures:
                statusMessageArabic = "الإضاءة خافتة أو المعالم البصرية قليلة"
            case .initializing:
                statusMessageArabic = "جارٍ مسح البيئة المحيطة لتثبيت الإحداثيات..."
            case .relocalizing:
                statusMessageArabic = "جارٍ استعادة التموضع المكاني..."
            @unknown default:
                statusMessageArabic = "التتبع محدود"
            }
        case .notAvailable:
            statusMessageArabic = "حساسات التتبع المكاني غير متاحة حالياً"
        }
    }
    
    // MARK: - Mode A: Apple ARGeoAnchor Delegate Handling
    public func session(_ session: ARSession, didAdd anchors: [ARAnchor]) {
        guard let arView = self.arView else { return }
        let modelCatalog = USDZModelCatalog()
        
        for anchor in anchors {
            if let geoAnchor = anchor as? ARGeoAnchor {
                let anchorEntity = AnchorEntity(anchor: geoAnchor)
                if let placement = renderedPlacements.first(where: { $0.id == geoAnchor.name }),
                   let modelItem = modelCatalog.findModel(byId: placement.assetId) {
                    let entity = Reality3DSceneManager.shared.createEntity(
                        for: modelItem,
                        scale: placement.scale,
                        headingDeg: placement.heading
                    )
                    anchorEntity.addChild(entity)
                }
                arView.scene.addAnchor(anchorEntity)
                spawned3DAnchors.append(anchorEntity)
            }
        }
    }
    
    // MARK: - CLLocationManagerDelegate
    public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let loc = locations.last else { return }
        
        self.userCoordinate = loc.coordinate
        self.userAltitude = loc.altitude
        self.gpsHorizontalAccuracy = loc.horizontalAccuracy
        self.altitudeAccuracy = loc.verticalAccuracy
        
        // Safety warning: If user travels faster than 25 km/h, activate safety alert
        let speedKmh = max(0.0, loc.speed) * 3.6
        self.isSpeedHazardWarningActive = (speedKmh > 25.0)
        
        // Check Apple GeoTracking availability for this coordinate
        checkAppleGeoTrackingAvailability(at: loc.coordinate)
        
        // Update HUD distances & azimuths continuously without destroying 3D anchors
        updateHUDDistanceMetrics(userCoord: loc.coordinate)
        
        // Spawn 3D anchors ONCE when stable origin is acquired, avoiding GPS jitter destroying VIO
        if !isAnchorsSpawned && loc.horizontalAccuracy > 0 && loc.horizontalAccuracy <= 25.0 {
            self.sessionOriginCoordinate = loc.coordinate
            self.sessionOriginAltitude = loc.altitude
            spawnPhysical3DAnchors()
        }
    }
    
    public func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
        self.compassAccuracy = newHeading.headingAccuracy
        self.isHeadingCalibrating = (newHeading.headingAccuracy < 0 || newHeading.headingAccuracy > 25.0)
    }
    
    // MARK: - Placements Synchronization
    public func syncPlacements(with list: [GeospatialPlacementModel]) {
        self.renderedPlacements = list
        if let userLoc = self.userCoordinate {
            updateHUDDistanceMetrics(userCoord: userLoc)
            if !isAnchorsSpawned {
                self.sessionOriginCoordinate = userLoc
                self.sessionOriginAltitude = self.userAltitude
                spawnPhysical3DAnchors()
            }
        }
    }
    
    // MARK: - Continuous HUD Metrics Update (Lightweight & Jitter-Free)
    private func updateHUDDistanceMetrics(userCoord: CLLocationCoordinate2D) {
        var hudItems: [GeoARItem] = []
        for placement in renderedPlacements {
            let distMeters = GeoMath.haversineDistance(from: userCoord, to: placement.coordinate)
            let azimuth = GeoMath.calculateAzimuth(from: userCoord, to: placement.coordinate)
            
            let item = GeoARItem(
                id: placement.id,
                title: placement.titleArabic,
                category: .landmark,
                coordinate: placement.coordinate,
                altitude: placement.altitude,
                distanceMeters: distMeters,
                azimuthDegrees: azimuth,
                relativeBearingDegrees: 0.0,
                screenPosition: nil,
                isInsideFOV: false,
                offscreenEdge: nil,
                metadata: "\(placement.verificationStatus.rawValue) • دقة ±\(String(format: "%.1f", placement.positioningAccuracy))م"
            )
            hudItems.append(item)
        }
        
        DispatchQueue.main.async {
            self.activeNearbyItems = hudItems.sorted { $0.distanceMeters < $1.distanceMeters }
            self.recomputeScreenProjections()
        }
    }
    
    // MARK: - Spawn Physical 3D Anchors (Called Once at Session Origin)
    private func spawnPhysical3DAnchors() {
        guard let arView = self.arView, let origin = self.sessionOriginCoordinate else { return }
        
        // Remove existing anchors cleanly
        for anchor in spawned3DAnchors {
            arView.scene.removeAnchor(anchor)
        }
        spawned3DAnchors.removeAll()
        
        let modelCatalog = USDZModelCatalog()
        
        if activeMode == .modeAAppleGeoTracking {
            // Mode A: Add ARGeoAnchor directly to ARKit session
            for placement in renderedPlacements {
                let geoAnchor = ARGeoAnchor(name: placement.id, coordinate: placement.coordinate, altitude: placement.altitude)
                arView.session.add(anchor: geoAnchor)
            }
        } else {
            // Mode B: Local ENU Transformation relative to Session Reference Origin
            for placement in renderedPlacements {
                let distMeters = GeoMath.haversineDistance(from: origin, to: placement.coordinate)
                
                // Only place in RealityKit 3D scene if within proximity (< 120m)
                if distMeters <= 120.0 {
                    let enu = GeoMath.wgs84ToLocalENU(
                        target: placement.coordinate,
                        targetAltitude: placement.altitude,
                        reference: origin,
                        referenceAltitude: self.sessionOriginAltitude
                    )
                    let rkPos = GeoMath.enuToRealityKitPosition(east: enu.east, north: enu.north, up: enu.up)
                    
                    var transform = matrix_identity_float4x4
                    transform.columns.3 = SIMD4<Float>(rkPos.x, rkPos.y, rkPos.z, 1.0)
                    
                    let anchor = AnchorEntity(world: transform)
                    
                    if let modelItem = modelCatalog.findModel(byId: placement.assetId) {
                        let entity = Reality3DSceneManager.shared.createEntity(
                            for: modelItem,
                            scale: placement.scale,
                            headingDeg: placement.heading
                        )
                        anchor.addChild(entity)
                    }
                    
                    arView.scene.addAnchor(anchor)
                    spawned3DAnchors.append(anchor)
                }
            }
        }
        
        self.isAnchorsSpawned = true
    }
    
    // MARK: - Recompute Screen Projections
    private func recomputeScreenProjections() {
        let heading = self.cameraHeadingDegrees
        let pitch = self.cameraPitchDegrees
        
        var updated: [GeoARItem] = []
        for var item in activeNearbyItems {
            let proj = GeoMath.projectToScreen(
                azimuthDeg: item.azimuthDegrees,
                distanceMeters: item.distanceMeters,
                altitudeMeters: item.altitude,
                cameraHeadingDeg: heading,
                cameraPitchDeg: pitch
            )
            
            item.isInsideFOV = proj.isInsideFOV
            item.screenPosition = proj.normalizedPoint
            
            if let off = proj.offscreenDirection {
                switch off {
                case .left: item.offscreenEdge = .left
                case .right: item.offscreenEdge = .right
                case .top: item.offscreenEdge = .top
                case .bottom: item.offscreenEdge = .bottom
                }
            } else {
                item.offscreenEdge = nil
            }
            
            var rel = item.azimuthDegrees - heading
            while rel > 180.0 { rel -= 360.0 }
            while rel < -180.0 { rel += 360.0 }
            item.relativeBearingDegrees = rel
            
            updated.append(item)
        }
        
        self.activeNearbyItems = updated
    }
}
