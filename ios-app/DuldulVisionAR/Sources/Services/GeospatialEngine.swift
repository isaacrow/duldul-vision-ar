import Foundation
import CoreLocation
import ARKit
import RealityKit
import Combine
import SwiftUI

/// Core Geospatial Engine for Duldul: Supporting Mode A (Apple GeoTracking) and Mode B (Fallback ENU + VIO)
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
    
    public func recalibrateSensors() {
        guard let arView = self.arView else { return }
        startFallbackWorldTracking(in: arView)
        if let userCoord = self.userCoordinate {
            refreshPlacements(userCoord: userCoord)
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
            statusMessageArabic = "تتبع مكاني 6DoF عالي الاستقرار"
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
        
        // Refresh 3D Anchors & Calculations
        refreshPlacements(userCoord: loc.coordinate)
    }
    
    public func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
        self.compassAccuracy = newHeading.headingAccuracy
        self.isHeadingCalibrating = (newHeading.headingAccuracy < 0 || newHeading.headingAccuracy > 25.0)
    }
    
    // MARK: - Refresh Geographic Anchors & Entities
    public func syncPlacements(with list: [GeospatialPlacementModel]) {
        self.renderedPlacements = list
        if let userLoc = self.userCoordinate {
            refreshPlacements(userCoord: userLoc)
        }
    }
    
    private func refreshPlacements(userCoord: CLLocationCoordinate2D) {
        guard let arView = self.arView else { return }
        
        // Remove existing anchors
        for anchor in spawned3DAnchors {
            arView.scene.removeAnchor(anchor)
        }
        spawned3DAnchors.removeAll()
        
        var hudItems: [GeoARItem] = []
        let modelCatalog = USDZModelCatalog()
        
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
            
            // If placement is within physical RealityKit 3D anchor range (< 120m)
            if distMeters <= 120.0 {
                let enu = GeoMath.wgs84ToLocalENU(
                    target: placement.coordinate,
                    targetAltitude: placement.altitude,
                    reference: userCoord,
                    referenceAltitude: self.userAltitude
                )
                let rkPos = GeoMath.enuToRealityKitPosition(east: enu.east, north: enu.north, up: enu.up)
                
                var transform = matrix_identity_float4x4
                transform.columns.3 = SIMD4<Float>(rkPos.x, rkPos.y, rkPos.z, 1.0)
                
                let anchor = AnchorEntity(world: transform)
                
                // Fetch model from catalog or use fallback pin
                if let modelItem = modelCatalog.findModel(byId: placement.assetId) {
                    let entity = Reality3DSceneManager.shared.createEntity(
                        for: modelItem,
                        scale: placement.scale,
                        headingDeg: placement.heading
                    )
                    anchor.addChild(entity)
                } else {
                    let genericItem = USDZModelItem(
                        id: "fallback-pin",
                        name: "Spatial Pin",
                        nameArabic: placement.titleArabic,
                        category: .modernMonuments,
                        historicalSummary: "",
                        author: "",
                        proceduralType: .genericPin,
                        estimatedPolygons: 1200,
                        dimensionsMeters: SIMD3<Float>(0.6, 2.0, 0.6)
                    )
                    let entity = Reality3DSceneManager.shared.createEntity(for: genericItem, scale: placement.scale)
                    anchor.addChild(entity)
                }
                
                arView.scene.addAnchor(anchor)
                spawned3DAnchors.append(anchor)
            }
        }
        
        DispatchQueue.main.async {
            self.activeNearbyItems = hudItems.sorted { $0.distanceMeters < $1.distanceMeters }
            self.recomputeScreenProjections()
        }
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
            
            // Relative bearing
            var rel = item.azimuthDegrees - heading
            while rel > 180.0 { rel -= 360.0 }
            while rel < -180.0 { rel += 360.0 }
            item.relativeBearingDegrees = rel
            
            updated.append(item)
        }
        
        self.activeNearbyItems = updated
    }
}
