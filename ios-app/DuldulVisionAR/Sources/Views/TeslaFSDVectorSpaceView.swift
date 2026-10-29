import SwiftUI
import SceneKit

public struct TeslaFSDVectorSpaceView: View {
    @EnvironmentObject var navManager: NavigationManager
    @EnvironmentObject var incidentManager: IncidentManager
    
    public var body: some View {
        ZStack {
            // Dark 3D Vector Space Canvas (Matches Tesla FSD Screenshots)
            TeslaSceneView(currentSpeed: navManager.currentSpeedKmh)
                .edgesIgnoringSafeArea(.all)
            
            // Tesla Cockpit HUD Overlay
            VStack {
                // Top Row: PRND & Speedometer (Left) + Maneuver (Center)
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 6) {
                        // PRND Bar
                        HStack(spacing: 8) {
                            Text("P").foregroundColor(.gray)
                            Text("R").foregroundColor(.gray)
                            Text("N").foregroundColor(.gray)
                            Text("D").foregroundColor(.cyan).fontWeight(.heavy)
                            
                            Text("READY")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.green)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.green.opacity(0.18))
                                .cornerRadius(6)
                            
                            HStack(spacing: 3) {
                                Image(systemName: "battery.75")
                                Text("86%")
                            }
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)
                        }
                        
                        // Speedometer & Speed Limit Badge
                        HStack(alignment: .lastTextBaseline, spacing: 10) {
                            Text("\(Int(navManager.currentSpeedKmh > 0 ? navManager.currentSpeedKmh : 88))")
                                .font(.system(size: 56, weight: .black, design: .rounded))
                                .foregroundColor(navManager.isSpeedExceeded ? .red : .white)
                            
                            Text("KM/H")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(.gray)
                            
                            // 100 MAX Badge
                            VStack(spacing: 0) {
                                Text("\(navManager.speedLimitKmh)")
                                    .font(.system(size: 13, weight: .black))
                                Text("MAX")
                                    .font(.system(size: 7, weight: .bold))
                                    .foregroundColor(.gray)
                            }
                            .frame(width: 38, height: 38)
                            .background(Color.white)
                            .foregroundColor(.black)
                            .clipShape(Circle())
                            .overlay(Circle().stroke(Color.red, lineWidth: 3.5))
                            .offset(y: -8)
                        }
                    }
                    
                    Spacer()
                    
                    // Maneuver Banner (Center)
                    HStack(spacing: 12) {
                        Image(systemName: "arrow.turn.up.right")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(.cyan)
                        
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(navManager.isNavigating ? "\(Int(navManager.distanceToNextManeuverMeters)) م" : "2.5 كم")
                                .font(.system(size: 17, weight: .heavy))
                                .foregroundColor(.white)
                            Text(navManager.isNavigating ? navManager.nextManeuverText : "طريق محمد القاسم السريع")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(.gray)
                                .lineLimit(1)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Color(red: 0.08, green: 0.10, blue: 0.14).opacity(0.85))
                    .cornerRadius(18)
                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.white.opacity(0.12), lineWidth: 1))
                }
                .padding(.horizontal, 20)
                .padding(.top, 14)
                
                Spacer()
                
                // Bottom Cockpit Bar
                HStack {
                    HStack(spacing: 10) {
                        Image(systemName: "shield.lefthalf.filled")
                            .foregroundColor(.cyan)
                            .frame(width: 32, height: 32)
                            .background(Color.cyan.opacity(0.15))
                            .cornerRadius(8)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("رؤية تسلا المكانية (Tesla FSD V12)")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.white)
                            Text("محرك الرصد ثلاثي الأبعاد نشط (Apple Metal)")
                                .font(.system(size: 10))
                                .foregroundColor(.gray)
                        }
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Color(red: 0.08, green: 0.10, blue: 0.14).opacity(0.85))
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.1), lineWidth: 1))
                    
                    Spacer()
                    
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 8, height: 8)
                        Text("مستشعرات Apple LiDAR نشطة")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color(red: 0.08, green: 0.10, blue: 0.14).opacity(0.85))
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.1), lineWidth: 1))
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 16)
            }
        }
    }
}

// SceneKit 3D Implementation of the Tesla Road & Ego Car
struct TeslaSceneView: UIViewRepresentable {
    var currentSpeed: Double
    
    func makeUIView(context: Context) -> SCNView {
        let scnView = SCNView()
        scnView.backgroundColor = UIColor(red: 0.04, green: 0.05, blue: 0.08, alpha: 1.0)
        scnView.antialiasingMode = .multisampling4X
        scnView.preferredFramesPerSecond = 60
        
        let scene = SCNScene()
        scnView.scene = scene
        
        // Camera (Tesla cockpit angle)
        let cameraNode = SCNNode()
        cameraNode.camera = SCNCamera()
        cameraNode.camera?.fieldOfView = 55
        cameraNode.position = SCNVector3(0, 3.2, 7.5)
        cameraNode.eulerAngles = SCNVector3(-0.22, 0, 0)
        scene.rootNode.addChildNode(cameraNode)
        
        // Ambient Light
        let ambientLight = SCNNode()
        ambientLight.light = SCNLight()
        ambientLight.light?.type = .ambient
        ambientLight.light?.color = UIColor(white: 0.55, alpha: 1.0)
        scene.rootNode.addChildNode(ambientLight)
        
        // Directional Light
        let dirLight = SCNNode()
        dirLight.light = SCNLight()
        dirLight.light?.type = .directional
        dirLight.position = SCNVector3(10, 15, 10)
        dirLight.eulerAngles = SCNVector3(-0.7, 0.4, 0)
        scene.rootNode.addChildNode(dirLight)
        
        // Road Floor
        let roadGeo = SCNPlane(width: 30, height: 180)
        roadGeo.firstMaterial?.diffuse.contents = UIColor(red: 0.07, green: 0.09, blue: 0.13, alpha: 1.0)
        let roadNode = SCNNode(geometry: roadGeo)
        roadNode.eulerAngles.x = -.pi / 2
        roadNode.position = SCNVector3(0, -0.05, -70)
        scene.rootNode.addChildNode(roadNode)
        
        // Lane Lines (4 Lanes)
        for laneX in [-5.4, -1.8, 1.8, 5.4] {
            let isOuter = (laneX == -5.4 || laneX == 5.4)
            if isOuter {
                let lineGeo = SCNBox(width: 0.15, height: 0.02, length: 180, chamferRadius: 0)
                lineGeo.firstMaterial?.diffuse.contents = UIColor.gray
                let lineNode = SCNNode(geometry: lineGeo)
                lineNode.position = SCNVector3(laneX, 0.01, -70)
                scene.rootNode.addChildNode(lineNode)
            } else {
                for i in 0..<18 {
                    let dashGeo = SCNBox(width: 0.14, height: 0.02, length: 3.2, chamferRadius: 0)
                    dashGeo.firstMaterial?.diffuse.contents = UIColor.lightGray
                    let dashNode = SCNNode(geometry: dashGeo)
                    dashNode.position = SCNVector3(laneX, 0.01, Double(-i * 10))
                    scene.rootNode.addChildNode(dashNode)
                }
            }
        }
        
        // Ego Car (Tesla Model 3 Blue)
        let egoCar = createTeslaVehicleNode(color: UIColor(red: 0.15, green: 0.40, blue: 0.95, alpha: 1.0))
        egoCar.position = SCNVector3(0, 0, 0)
        scene.rootNode.addChildNode(egoCar)
        
        // Glowing Blue Lane Path Ribbon
        let ribbonGeo = SCNPlane(width: 1.8, height: 32)
        ribbonGeo.firstMaterial?.diffuse.contents = UIColor.systemBlue.withAlphaComponent(0.68)
        ribbonGeo.firstMaterial?.isDoubleSided = true
        let ribbonNode = SCNNode(geometry: ribbonGeo)
        ribbonNode.eulerAngles.x = -.pi / 2
        ribbonNode.position = SCNVector3(0, 0.01, -16)
        scene.rootNode.addChildNode(ribbonNode)
        
        // Surrounding Vehicles (Silver/Grey, as seen in screenshots)
        let leadCar = createTeslaVehicleNode(color: UIColor.lightGray)
        leadCar.position = SCNVector3(0, 0, -14)
        scene.rootNode.addChildNode(leadCar)
        
        let leftCar = createTeslaVehicleNode(color: UIColor.lightGray)
        leftCar.position = SCNVector3(-3.6, 0, -9)
        scene.rootNode.addChildNode(leftCar)
        
        let rightCar = createTeslaVehicleNode(color: UIColor.lightGray)
        rightCar.position = SCNVector3(3.6, 0, -12)
        scene.rootNode.addChildNode(rightCar)
        
        let truck = createTruckNode()
        truck.position = SCNVector3(3.6, 0, -28)
        scene.rootNode.addChildNode(truck)
        
        return scnView
    }
    
    func updateUIView(_ uiView: SCNView, context: Context) {}
    
    private func createTeslaVehicleNode(color: UIColor) -> SCNNode {
        let node = SCNNode()
        let bodyGeo = SCNBox(width: 1.82, height: 0.55, length: 4.3, chamferRadius: 0.15)
        bodyGeo.firstMaterial?.diffuse.contents = color
        let bodyNode = SCNNode(geometry: bodyGeo)
        bodyNode.position.y = 0.45
        node.addChildNode(bodyNode)
        
        let cabinGeo = SCNBox(width: 1.5, height: 0.5, length: 2.2, chamferRadius: 0.1)
        cabinGeo.firstMaterial?.diffuse.contents = UIColor(white: 0.1, alpha: 0.9)
        let cabinNode = SCNNode(geometry: cabinGeo)
        cabinNode.position = SCNVector3(0, 0.88, -0.2)
        node.addChildNode(cabinNode)
        
        // Red tail light bar
        let tailGeo = SCNBox(width: 1.6, height: 0.08, length: 0.05, chamferRadius: 0)
        tailGeo.firstMaterial?.diffuse.contents = UIColor.red
        let tailNode = SCNNode(geometry: tailGeo)
        tailNode.position = SCNVector3(0, 0.52, 2.15)
        node.addChildNode(tailNode)
        
        return node
    }
    
    private func createTruckNode() -> SCNNode {
        let node = SCNNode()
        let trailerGeo = SCNBox(width: 2.3, height: 3.2, length: 7.5, chamferRadius: 0.1)
        trailerGeo.firstMaterial?.diffuse.contents = UIColor(white: 0.75, alpha: 1.0)
        let trailerNode = SCNNode(geometry: trailerGeo)
        trailerNode.position = SCNVector3(0, 1.8, 1.5)
        node.addChildNode(trailerNode)
        
        let cabGeo = SCNBox(width: 2.2, height: 2.2, length: 2.5, chamferRadius: 0.1)
        cabGeo.firstMaterial?.diffuse.contents = UIColor(white: 0.65, alpha: 1.0)
        let cabNode = SCNNode(geometry: cabGeo)
        cabNode.position = SCNVector3(0, 1.3, -3.0)
        node.addChildNode(cabNode)
        
        return node
    }
}
