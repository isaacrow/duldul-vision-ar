import Foundation
import ARKit
import RealityKit
import Vision
import Combine

public class ARKitVisionManager: NSObject, ObservableObject, ARSessionDelegate {
    @Published public var detectedEntities: [SpatialAnchorModel] = []
    @Published public var isLiDARAvailable: Bool = false
    @Published public var trackingStateDescription: String = "جارٍ تهيئة مستشعر ARKit..."
    @Published public var liveDetectedVehicles: Int = 0
    
    public var arView: ARView?
    private var lastAnalysisTimestamp: TimeInterval = 0
    private let analysisInterval: TimeInterval = 0.2 // 5 FPS decoupled AI inference
    private var isAnalyzing: Bool = false
    private var spawnedChevronAnchors: [AnchorEntity] = []
    
    public var onEntityRecognized: ((SpatialAnchorModel) -> Void)?
    
    public override init() {
        super.init()
        self.isLiDARAvailable = ARWorldTrackingConfiguration.supportsSceneReconstruction(.meshWithClassification)
    }
    
    public func startSession(in view: ARView) {
        self.arView = view
        view.session.delegate = self
        
        let config = ARWorldTrackingConfiguration()
        config.planeDetection = [.horizontal, .vertical]
        config.environmentTexturing = .automatic
        
        // Activate Apple LiDAR hardware depth mesh if supported (iPhone Pro models)
        if ARWorldTrackingConfiguration.supportsSceneReconstruction(.meshWithClassification) {
            config.sceneReconstruction = .meshWithClassification
            print("[ARKitVisionManager] Apple LiDAR Mesh Reconstruction: ACTIVE")
        }
        
        // Activate Hardware Scene Depth
        if ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth) {
            config.frameSemantics.insert(.sceneDepth)
            config.frameSemantics.insert(.smoothedSceneDepth)
            print("[ARKitVisionManager] Apple Hardware Scene Depth: ACTIVE")
        }
        
        view.session.run(config, options: [.resetTracking, .removeExistingAnchors])
        spawnNavigationFloorChevrons()
    }
    
    public func pauseSession() {
        arView?.session.pause()
    }
    
    // MARK: - ARSessionDelegate
    public func session(_ session: ARSession, didUpdate frame: ARFrame) {
        let currentTime = frame.timestamp
        guard currentTime - lastAnalysisTimestamp >= analysisInterval, !isAnalyzing else { return }
        
        lastAnalysisTimestamp = currentTime
        isAnalyzing = true
        
        // Pass CVPixelBuffer to Apple Neural Engine Vision Framework
        analyzeFrame(frame: frame)
    }
    
    public func session(_ session: ARSession, cameraDidChangeTrackingState camera: ARCamera) {
        switch camera.trackingState {
        case .normal:
            trackingStateDescription = "تتبع مكاني 6DoF عالي الدقة (LiDAR نشط)"
        case .limited(let reason):
            trackingStateDescription = "التتبع محدود: \(reason)"
        case .notAvailable:
            trackingStateDescription = "مستشعر التتبع المكاني غير متاح"
        }
    }
    
    // MARK: - Apple Vision Framework OCR & Sign Recognition
    private func analyzeFrame(frame: ARFrame) {
        let pixelBuffer = frame.capturedImage
        
        let request = VNRecognizeTextRequest { [weak self] (req, error) in
            defer { self?.isAnalyzing = false }
            guard let self = self, error == nil else { return }
            
            guard let observations = req.results as? [VNRecognizedTextObservation] else { return }
            
            for obs in observations {
                guard let topCandidate = obs.topCandidates(1).first, topCandidate.confidence > 0.85 else { continue }
                let text = topCandidate.string.trimmingCharacters(in: .whitespacesAndNewlines)
                guard text.count >= 3 else { continue }
                
                // Calculate screen point for 3D Raycasting
                let boundingBox = obs.boundingBox
                let screenPoint = CGPoint(
                    x: boundingBox.midX * UIScreen.main.bounds.width,
                    y: (1.0 - boundingBox.midY) * UIScreen.main.bounds.height
                )
                
                // Raycast from 2D screen into physical 3D ARKit/LiDAR mesh
                self.raycastTo3DWorld(screenPoint: screenPoint, detectedText: text, confidence: topCandidate.confidence, frame: frame)
            }
        }
        
        // Support both Arabic and English text recognition
        request.recognitionLanguages = ["ar-SA", "en-US"]
        request.recognitionLevel = .accurate
        request.usesCPUOnly = false // Accelerated on Apple Neural Engine (NPU)
        
        let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: .right, options: [:])
        DispatchQueue.global(qos: .userInitiated).async {
            try? handler.perform([request])
        }
    }
    
    private func raycastTo3DWorld(screenPoint: CGPoint, detectedText: String, confidence: Float, frame: ARFrame) {
        guard let arView = self.arView else { return }
        
        // Shoot raycast into physical LiDAR/mesh surface
        let results = arView.raycast(from: screenPoint, allowing: .estimatedPlane, alignment: .any)
        
        if let firstHit = results.first {
            let worldTransform = firstHit.worldTransform
            let position = SIMD3<Float>(worldTransform.columns.3.x, worldTransform.columns.3.y, worldTransform.columns.3.z)
            
            // Check if already anchored nearby to prevent duplicate clutter
            let isDuplicate = detectedEntities.contains { entity in
                simd_distance(entity.position, position) < 1.5
            }
            guard !isDuplicate else { return }
            
            let anchorModel = SpatialAnchorModel(
                title: detectedText,
                category: .shop,
                confidence: confidence,
                position: position
            )
            
            DispatchQueue.main.async {
                self.detectedEntities.append(anchorModel)
                self.spawnRealityKitEntity(at: worldTransform, title: detectedText)
                self.onEntityRecognized?(anchorModel)
            }
        }
    }
    
    // MARK: - RealityKit 3D Floating Entity Generation
    private func spawnRealityKitEntity(at transform: simd_float4x4, title: String) {
        guard let arView = self.arView else { return }
        
        let anchor = AnchorEntity(world: transform)
        
        // 3D Glass Pill Marker
        let mesh = MeshResource.generateBox(size: [0.35, 0.12, 0.04], cornerRadius: 0.02)
        let material = SimpleMaterial(color: UIColor.systemBlue.withAlphaComponent(0.85), isMetallic: true)
        let modelEntity = ModelEntity(mesh: mesh, materials: [material])
        
        // Floating 3D Text
        let textMesh = MeshResource.generateText(
            title,
            extrusionDepth: 0.01,
            font: .boldSystemFont(ofSize: 0.04),
            containerFrame: CGRect(x: -0.15, y: -0.02, width: 0.3, height: 0.05),
            alignment: .center,
            lineBreakMode: .byTruncatingTail
        )
        let textMaterial = SimpleMaterial(color: .white, isMetallic: false)
        let textEntity = ModelEntity(mesh: textMesh, materials: [textMaterial])
        textEntity.position.z = 0.025
        
        modelEntity.addChild(textEntity)
        anchor.addChild(modelEntity)
        arView.scene.addAnchor(anchor)
    }
    
    // MARK: - 3D Holographic Navigation Chevrons on Floor
    public func spawnNavigationFloorChevrons() {
        guard let arView = self.arView else { return }
        
        for anchor in spawnedChevronAnchors {
            arView.scene.removeAnchor(anchor)
        }
        spawnedChevronAnchors.removeAll()
        
        for i in 1...6 {
            let zOffset = -Float(i) * 2.8
            var transform = matrix_identity_float4x4
            transform.columns.3 = SIMD4<Float>(0, -0.65, zOffset, 1.0)
            
            let anchor = AnchorEntity(world: transform)
            let chevronMesh = MeshResource.generateBox(size: [0.9, 0.03, 0.35], cornerRadius: 0.02)
            let chevronMaterial = SimpleMaterial(color: UIColor.systemCyan.withAlphaComponent(0.82), isMetallic: true)
            let entity = ModelEntity(mesh: chevronMesh, materials: [chevronMaterial])
            
            anchor.addChild(entity)
            arView.scene.addAnchor(anchor)
            spawnedChevronAnchors.append(anchor)
        }
    }
}
