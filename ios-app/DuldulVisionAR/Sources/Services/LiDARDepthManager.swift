import Foundation
import ARKit
import Metal
import MetalKit
import Combine

public struct DepthSample {
    public let distanceMeters: Float
    public let confidence: ARConfidenceLevel
    public let screenPoint: CGPoint
}

public class LiDARDepthManager: ObservableObject {
    @Published public var centerDistanceMeters: Float = 0.0
    @Published public var minimumObstacleDistance: Float = 99.0
    @Published public var isLiDARHardwareActive: Bool = false
    @Published public var depthResolutionString: String = "غير متاح"
    @Published public var safetyDistanceWarning: Bool = false
    
    public init() {
        self.isLiDARHardwareActive = ARWorldTrackingConfiguration.supportsSceneReconstruction(.meshWithClassification)
    }
    
    // Process real hardware CVPixelBuffer depth map from ARFrame.sceneDepth
    public func processDepthMap(from frame: ARFrame) {
        guard let sceneDepth = frame.smoothedSceneDepth ?? frame.sceneDepth else { return }
        
        let depthMap = sceneDepth.depthMap
        let confidenceMap = sceneDepth.confidenceMap
        
        CVPixelBufferLockBaseAddress(depthMap, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(depthMap, .readOnly) }
        
        let width = CVPixelBufferGetWidth(depthMap)
        let height = CVPixelBufferGetHeight(depthMap)
        
        DispatchQueue.main.async {
            self.depthResolutionString = "\(width)x\(height) (LiDAR TOF)"
        }
        
        guard let baseAddress = CVPixelBufferGetBaseAddress(depthMap) else { return }
        let floatBuffer = baseAddress.assumingMemoryBound(to: Float32.self)
        
        // Sample center point (crosshair in front of camera)
        let centerX = width / 2
        let centerY = height / 2
        let centerIndex = centerY * width + centerX
        let centerDepth = floatBuffer[centerIndex]
        
        // Scan bottom-center cone for immediate vehicle or road obstacle
        var minDetected: Float = 99.0
        let startY = Int(Float(height) * 0.45)
        let endY = Int(Float(height) * 0.85)
        let startX = Int(Float(width) * 0.35)
        let endX = Int(Float(width) * 0.65)
        
        for y in stride(from: startY, to: endY, by: 4) {
            for x in stride(from: startX, to: endX, by: 4) {
                let idx = y * width + x
                let d = floatBuffer[idx]
                if d > 0.3 && d < minDetected {
                    minDetected = d
                }
            }
        }
        
        DispatchQueue.main.async {
            if centerDepth > 0.2 && centerDepth < 40.0 {
                self.centerDistanceMeters = centerDepth
            }
            self.minimumObstacleDistance = minDetected
            // Warning if an obstacle is within 3.5 meters
            self.safetyDistanceWarning = minDetected < 3.5
        }
    }
}
