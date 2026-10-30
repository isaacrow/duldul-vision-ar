import Foundation
import RealityKit
import UIKit
import Combine

/// Reusable RealityKit 3D rendering and model entity builder for Duldul
public class Reality3DSceneManager {
    public static let shared = Reality3DSceneManager()
    
    private init() {}
    
    // MARK: - PBR Materials for Iraqi Heritage
    public struct HeritageMaterials {
        /// Glazed Lapis Lazuli (Ishtar Gate blue)
        public static var ishtarLapisLazuli: SimpleMaterial {
            return SimpleMaterial(color: UIColor(red: 0.06, green: 0.24, blue: 0.65, alpha: 1.0), roughness: 0.15, isMetallic: false)
        }
        
        /// Babylonian Gold Trim
        public static var babylonianGold: SimpleMaterial {
            return SimpleMaterial(color: UIColor(red: 0.94, green: 0.76, blue: 0.22, alpha: 1.0), roughness: 0.25, isMetallic: true)
        }
        
        /// Basalt Stone (Lion of Babylon black/dark grey)
        public static var basaltStone: SimpleMaterial {
            return SimpleMaterial(color: UIColor(red: 0.18, green: 0.20, blue: 0.22, alpha: 1.0), roughness: 0.85, isMetallic: false)
        }
        
        /// Mesopotamian Sun-Dried Mudbrick (Ur Ziggurat)
        public static var mudbrickZiggurat: SimpleMaterial {
            return SimpleMaterial(color: UIColor(red: 0.72, green: 0.58, blue: 0.42, alpha: 1.0), roughness: 0.92, isMetallic: false)
        }
        
        /// Baghdad Turquoise Ceramic (Al-Shaheed Monument)
        public static var baghdadTurquoise: SimpleMaterial {
            return SimpleMaterial(color: UIColor(red: 0.10, green: 0.62, blue: 0.66, alpha: 1.0), roughness: 0.18, isMetallic: false)
        }
        
        /// Patinated Abbasid Bronze (Freedom Monument Frieze)
        public static var abbasidBronze: SimpleMaterial {
            return SimpleMaterial(color: UIColor(red: 0.55, green: 0.42, blue: 0.26, alpha: 1.0), roughness: 0.40, isMetallic: true)
        }
        
        /// Brass Astrolabe
        public static var brassAstrolabe: SimpleMaterial {
            return SimpleMaterial(color: UIColor(red: 0.88, green: 0.70, blue: 0.30, alpha: 1.0), roughness: 0.20, isMetallic: true)
        }
    }
    
    // MARK: - Generate 3D Model Entity
    public func createEntity(for modelItem: USDZModelItem, scale: Float = 1.0, headingDeg: Double = 0.0) -> ModelEntity {
        let root = ModelEntity()
        root.name = modelItem.id
        
        switch modelItem.proceduralType {
        case .zigguratTiered:
            buildZigguratMesh(into: root)
        case .ishtarGateArch:
            buildIshtarGateMesh(into: root)
        case .basaltLion:
            buildBasaltLionMesh(into: root)
        case .alShaheedSplitDome:
            buildShaheedDomeMesh(into: root)
        case .freedomFriezeRelief:
            buildFreedomFriezeMesh(into: root)
        case .leaningMinaret:
            buildLeaningMinaretMesh(into: root)
        case .astrolabeArmillary:
            buildAstrolabeMesh(into: root)
        case .cylinderSeal:
            buildCylinderSealMesh(into: root)
        case .genericPin:
            buildGenericPinMesh(into: root)
        }
        
        // Apply uniform scale
        let effectiveScale = modelItem.defaultScale * scale
        root.scale = SIMD3<Float>(repeating: effectiveScale)
        
        // Apply geographic orientation (yaw rotation around Y axis)
        let yawRad = Float(headingDeg * .pi / 180.0)
        root.orientation = simd_quatf(angle: yawRad, axis: SIMD3<Float>(0, 1, 0))
        
        return root
    }
    
    // MARK: - 1. Ziggurat of Ur (Stepped 3-Tier Mudbrick Pyramid with Central Stairway)
    private func buildZigguratMesh(into parent: Entity) {
        let mat = HeritageMaterials.mudbrickZiggurat
        let gold = HeritageMaterials.babylonianGold
        
        // Tier 1 (Base platform)
        let tier1Mesh = MeshResource.generateBox(size: [6.0, 1.2, 4.5], cornerRadius: 0.05)
        let tier1 = ModelEntity(mesh: tier1Mesh, materials: [mat])
        tier1.position = SIMD3<Float>(0, 0.6, 0)
        parent.addChild(tier1)
        
        // Tier 2 (Middle platform)
        let tier2Mesh = MeshResource.generateBox(size: [4.2, 1.0, 3.2], cornerRadius: 0.05)
        let tier2 = ModelEntity(mesh: tier2Mesh, materials: [mat])
        tier2.position = SIMD3<Float>(0, 1.7, 0)
        parent.addChild(tier2)
        
        // Tier 3 (Upper shrine platform)
        let tier3Mesh = MeshResource.generateBox(size: [2.5, 0.9, 2.0], cornerRadius: 0.05)
        let tier3 = ModelEntity(mesh: tier3Mesh, materials: [gold])
        tier3.position = SIMD3<Float>(0, 2.65, 0)
        parent.addChild(tier3)
        
        // Central ceremonial ramp/staircase
        let rampMesh = MeshResource.generateBox(size: [0.8, 0.3, 3.2], cornerRadius: 0.02)
        let ramp = ModelEntity(mesh: rampMesh, materials: [mat])
        ramp.position = SIMD3<Float>(0, 0.9, 2.4)
        ramp.orientation = simd_quatf(angle: -Float.pi / 8.0, axis: SIMD3<Float>(1, 0, 0))
        parent.addChild(ramp)
    }
    
    // MARK: - 2. Ishtar Gate (Twin Towers + Vaulted Archway + Gold Trim)
    private func buildIshtarGateMesh(into parent: Entity) {
        let blueMat = HeritageMaterials.ishtarLapisLazuli
        let goldMat = HeritageMaterials.babylonianGold
        
        // Left Bastion Tower
        let leftTowerMesh = MeshResource.generateBox(size: [1.2, 4.0, 1.4], cornerRadius: 0.06)
        let leftTower = ModelEntity(mesh: leftTowerMesh, materials: [blueMat])
        leftTower.position = SIMD3<Float>(-1.8, 2.0, 0)
        parent.addChild(leftTower)
        
        // Right Bastion Tower
        let rightTowerMesh = MeshResource.generateBox(size: [1.2, 4.0, 1.4], cornerRadius: 0.06)
        let rightTower = ModelEntity(mesh: rightTowerMesh, materials: [blueMat])
        rightTower.position = SIMD3<Float>(1.8, 2.0, 0)
        parent.addChild(rightTower)
        
        // Central Archway Header / Lintel
        let archLintelMesh = MeshResource.generateBox(size: [2.4, 0.9, 1.0], cornerRadius: 0.04)
        let archLintel = ModelEntity(mesh: archLintelMesh, materials: [blueMat])
        archLintel.position = SIMD3<Float>(0, 3.2, 0)
        parent.addChild(archLintel)
        
        // Golden Frieze Band Across Top
        let goldBandMesh = MeshResource.generateBox(size: [4.9, 0.22, 1.45], cornerRadius: 0.02)
        let goldBand = ModelEntity(mesh: goldBandMesh, materials: [goldMat])
        goldBand.position = SIMD3<Float>(0, 3.9, 0)
        parent.addChild(goldBand)
        
        // Crenellations (Crowning battlements)
        for i in -3...3 {
            let crenelMesh = MeshResource.generateBox(size: [0.35, 0.35, 0.35], cornerRadius: 0.02)
            let crenel = ModelEntity(mesh: crenelMesh, materials: [goldMat])
            crenel.position = SIMD3<Float>(Float(i) * 0.7, 4.2, 0)
            parent.addChild(crenel)
        }
    }
    
    // MARK: - 3. Basalt Lion of Babylon (Carved Black Basalt Pedestal and Form)
    private func buildBasaltLionMesh(into parent: Entity) {
        let basalt = HeritageMaterials.basaltStone
        
        // Pedestal base
        let baseMesh = MeshResource.generateBox(size: [2.2, 0.45, 1.2], cornerRadius: 0.04)
        let base = ModelEntity(mesh: baseMesh, materials: [basalt])
        base.position = SIMD3<Float>(0, 0.225, 0)
        parent.addChild(base)
        
        // Lion Body (Massive torso)
        let torsoMesh = MeshResource.generateBox(size: [1.6, 0.9, 0.85], cornerRadius: 0.15)
        let torso = ModelEntity(mesh: torsoMesh, materials: [basalt])
        torso.position = SIMD3<Float>(-0.1, 0.9, 0)
        parent.addChild(torso)
        
        // Head & Mane
        let headMesh = MeshResource.generateSphere(radius: 0.42)
        let head = ModelEntity(mesh: headMesh, materials: [basalt])
        head.position = SIMD3<Float>(0.85, 1.25, 0)
        parent.addChild(head)
        
        // Subdued human figure underneath lion's paws
        let figureMesh = MeshResource.generateBox(size: [0.9, 0.28, 0.6], cornerRadius: 0.05)
        let figure = ModelEntity(mesh: figureMesh, materials: [basalt])
        figure.position = SIMD3<Float>(0.2, 0.55, 0)
        parent.addChild(figure)
    }
    
    // MARK: - 4. Al-Shaheed Split Turquoise Dome
    private func buildShaheedDomeMesh(into parent: Entity) {
        let turquoise = HeritageMaterials.baghdadTurquoise
        let gold = HeritageMaterials.babylonianGold
        
        // Circular Platform
        let platMesh = MeshResource.generateBox(size: [5.6, 0.2, 5.6], cornerRadius: 2.7)
        let platform = ModelEntity(mesh: platMesh, materials: [HeritageMaterials.basaltStone])
        platform.position = SIMD3<Float>(0, 0.1, 0)
        parent.addChild(platform)
        
        // Left Dome Half
        let leftDomeMesh = MeshResource.generateSphere(radius: 1.4)
        let leftDome = ModelEntity(mesh: leftDomeMesh, materials: [turquoise])
        leftDome.position = SIMD3<Float>(-0.65, 1.4, 0)
        leftDome.scale = SIMD3<Float>(0.6, 1.35, 1.0)
        parent.addChild(leftDome)
        
        // Right Dome Half
        let rightDomeMesh = MeshResource.generateSphere(radius: 1.4)
        let rightDome = ModelEntity(mesh: rightDomeMesh, materials: [turquoise])
        rightDome.position = SIMD3<Float>(0.65, 1.4, 0)
        rightDome.scale = SIMD3<Float>(0.6, 1.35, 1.0)
        parent.addChild(rightDome)
        
        // Central Golden Eternal Flame Beacon
        let flameMesh = MeshResource.generateBox(size: [0.32, 1.8, 0.32], cornerRadius: 0.15)
        let flame = ModelEntity(mesh: flameMesh, materials: [gold])
        flame.position = SIMD3<Float>(0, 1.1, 0)
        parent.addChild(flame)
    }
    
    // MARK: - 5. Freedom Monument Frieze (Bronze Wall Relief)
    private func buildFreedomFriezeMesh(into parent: Entity) {
        let bronze = HeritageMaterials.abbasidBronze
        let marble = HeritageMaterials.mudbrickZiggurat
        
        // Travertine White Marble Wall
        let wallMesh = MeshResource.generateBox(size: [5.2, 1.4, 0.3], cornerRadius: 0.02)
        let wall = ModelEntity(mesh: wallMesh, materials: [marble])
        wall.position = SIMD3<Float>(0, 1.2, 0)
        parent.addChild(wall)
        
        // Central Bronze Horse / Freedom Figure
        let horseMesh = MeshResource.generateBox(size: [0.9, 0.7, 0.45], cornerRadius: 0.08)
        let horse = ModelEntity(mesh: horseMesh, materials: [bronze])
        horse.position = SIMD3<Float>(0, 1.2, 0.18)
        parent.addChild(horse)
        
        // Left Relief Figures (Struggle and Captivity)
        let leftMesh = MeshResource.generateBox(size: [1.6, 0.65, 0.42], cornerRadius: 0.06)
        let leftGroup = ModelEntity(mesh: leftMesh, materials: [bronze])
        leftGroup.position = SIMD3<Float>(-1.5, 1.2, 0.18)
        parent.addChild(leftGroup)
        
        // Right Relief Figures (Peace, Agriculture and Dawn)
        let rightMesh = MeshResource.generateBox(size: [1.6, 0.65, 0.42], cornerRadius: 0.06)
        let rightGroup = ModelEntity(mesh: rightMesh, materials: [bronze])
        rightGroup.position = SIMD3<Float>(1.5, 1.2, 0.18)
        parent.addChild(rightGroup)
    }
    
    // MARK: - 6. Leaning Minaret of Al-Hadba
    private func buildLeaningMinaretMesh(into parent: Entity) {
        let brick = HeritageMaterials.mudbrickZiggurat
        let gold = HeritageMaterials.babylonianGold
        
        // Base Square
        let baseMesh = MeshResource.generateBox(size: [1.1, 1.0, 1.1], cornerRadius: 0.02)
        let base = ModelEntity(mesh: baseMesh, materials: [brick])
        base.position = SIMD3<Float>(0, 0.5, 0)
        parent.addChild(base)
        
        // Leaning Cylindrical Shaft (5° tilt)
        let shaftMesh = MeshResource.generateBox(size: [0.84, 3.5, 0.84], cornerRadius: 0.41)
        let shaft = ModelEntity(mesh: shaftMesh, materials: [brick])
        shaft.position = SIMD3<Float>(0.16, 2.6, 0)
        shaft.orientation = simd_quatf(angle: 0.087, axis: SIMD3<Float>(0, 0, 1)) // 5 degree tilt
        parent.addChild(shaft)
        
        // Top Crescent & Gallery
        let galleryMesh = MeshResource.generateBox(size: [1.0, 0.35, 1.0], cornerRadius: 0.49)
        let gallery = ModelEntity(mesh: galleryMesh, materials: [gold])
        gallery.position = SIMD3<Float>(0.32, 4.4, 0)
        parent.addChild(gallery)
    }
    
    // MARK: - 7. Abbasid Astrolabe Armillary
    private func buildAstrolabeMesh(into parent: Entity) {
        let brass = HeritageMaterials.brassAstrolabe
        let gold = HeritageMaterials.babylonianGold
        
        // Main Mater Disc
        let discMesh = MeshResource.generateBox(size: [1.1, 0.05, 1.1], cornerRadius: 0.54)
        let disc = ModelEntity(mesh: discMesh, materials: [brass])
        disc.position = SIMD3<Float>(0, 0.8, 0)
        disc.orientation = simd_quatf(angle: Float.pi / 4.0, axis: SIMD3<Float>(1, 0, 0))
        parent.addChild(disc)
        
        // Outer Graduated Ring
        let ringMesh = MeshResource.generateBox(size: [1.24, 0.08, 1.24], cornerRadius: 0.61)
        let ring = ModelEntity(mesh: ringMesh, materials: [gold])
        ring.position = SIMD3<Float>(0, 0.8, 0)
        ring.orientation = simd_quatf(angle: Float.pi / 4.0, axis: SIMD3<Float>(1, 0, 0))
        parent.addChild(ring)
        
        // Sighting Alidade Pointer
        let alidadeMesh = MeshResource.generateBox(size: [0.06, 0.04, 1.1], cornerRadius: 0.01)
        let alidade = ModelEntity(mesh: alidadeMesh, materials: [gold])
        alidade.position = SIMD3<Float>(0, 0.84, 0)
        alidade.orientation = simd_quatf(angle: Float.pi / 4.0, axis: SIMD3<Float>(1, 0, 0))
        parent.addChild(alidade)
    }
    
    // MARK: - 8. Sumerian Cylinder Seal
    private func buildCylinderSealMesh(into parent: Entity) {
        let gold = HeritageMaterials.babylonianGold
        let cylinderMesh = MeshResource.generateBox(size: [0.56, 0.8, 0.56], cornerRadius: 0.27)
        let cylinder = ModelEntity(mesh: cylinderMesh, materials: [gold])
        cylinder.position = SIMD3<Float>(0, 0.6, 0)
        parent.addChild(cylinder)
    }
    
    // MARK: - 9. Generic Spatial Pin
    private func buildGenericPinMesh(into parent: Entity) {
        let cyan = HeritageMaterials.baghdadTurquoise
        let gold = HeritageMaterials.babylonianGold
        
        let stemMesh = MeshResource.generateBox(size: [0.16, 1.8, 0.16], cornerRadius: 0.07)
        let stem = ModelEntity(mesh: stemMesh, materials: [cyan])
        stem.position = SIMD3<Float>(0, 0.9, 0)
        parent.addChild(stem)
        
        let sphereMesh = MeshResource.generateSphere(radius: 0.28)
        let sphere = ModelEntity(mesh: sphereMesh, materials: [gold])
        sphere.position = SIMD3<Float>(0, 1.9, 0)
        parent.addChild(sphere)
    }
}
