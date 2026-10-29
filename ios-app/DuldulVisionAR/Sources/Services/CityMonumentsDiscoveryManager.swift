import Foundation
import CoreLocation
import RealityKit
import ARKit
import Combine
import AudioToolbox
import UIKit

public class CityMonumentsDiscoveryManager: ObservableObject {
    @Published public var monuments: [CityMonument] = []
    @Published public var explorerProfile: UserExplorerProfile = UserExplorerProfile()
    @Published public var activeNearbyMonument: CityMonument?
    @Published public var newlyDiscoveredMonument: CityMonument?
    @Published public var showDiscoveryCelebration: Bool = false
    
    private var spawnedMonumentAnchors: [String: AnchorEntity] = [:]
    private let earthRadiusMeters: Double = 6371000.0
    private let userDefaultsKey = "duldul_discovered_monuments_v1"
    
    public init() {
        loadMonumentsCatalog()
        restoreDiscoveredState()
    }
    
    // MARK: - Initial Curated Monuments & Spatial Artifacts
    private func loadMonumentsCatalog() {
        monuments = [
            // 1. نصب التحرير
            CityMonument(
                id: "mon-tahrir",
                nameArabic: "نصب التحرير",
                englishName: "Freedom Monument",
                category: .monument,
                lat: 33.3283,
                lng: 44.4093,
                historicalSummary: "أيقونة بغداد الخالدة في ساحة التحرير، صممه النحات جواد سليم عام 1961 ليجسد ملحمة تحرر الشعب العراقي عبر 14 قطعة برونزية تروي قصة حضارات وادي الرافدين.",
                builtYear: "1961 م",
                architectName: "جواد سليم & رفعت الجادرجي",
                artifactType: .holographicBeacon,
                pointsReward: 250
            ),
            // 2. نصب الشهيد
            CityMonument(
                id: "mon-shaheed",
                nameArabic: "نصب الشهيد",
                englishName: "Al-Shaheed Monument",
                category: .monument,
                lat: 33.3429,
                lng: 44.4443,
                historicalSummary: "تحفة معمارية عالمية على ضفاف الرصافة، قبة فيروزية إسلامية منقسمة ترتفع 40 متراً تحضن بداخلها شعلة الشهيد الخالدة والراية المنبثقة من باطن الأرض.",
                builtYear: "1983 م",
                architectName: "إسماعيل فتاح الترك",
                artifactType: .holographicBeacon,
                pointsReward: 250
            ),
            // 3. برج بغداد (المأمون)
            CityMonument(
                id: "mon-tower",
                nameArabic: "برج بغداد (برج المأمون)",
                englishName: "Baghdad Tower",
                category: .monument,
                lat: 33.3032,
                lng: 44.3547,
                historicalSummary: "أعلى صرح معماري في العاصمة بغداد بارتفاع 205 أمتار يطل على جانبي الكرخ والرصافة، ويضم قرصاً ومطعماً دواراً في قمته.",
                builtYear: "1994 م",
                architectName: "هندسة الاتصالات العراقية",
                artifactType: .holographicBeacon,
                pointsReward: 200
            ),
            // 4. ساعة القشلة وسراي بغداد
            CityMonument(
                id: "mon-qishla",
                nameArabic: "ساعة القشلة وسراي بغداد",
                englishName: "Al-Qishla Clock Tower",
                category: .historic,
                lat: 33.3395,
                lng: 44.3888,
                historicalSummary: "برج الساعة التاريخي في قلب شارع المتنبي التراثي، شيدت ساعته الشهيرة عام 1869 في العهد العثماني بآلية ميكانيكية مشابهة لساعة بيغ بن اللندنية.",
                builtYear: "1869 م",
                architectName: "مدحت باشا",
                artifactType: .rotatingCrystalPlaque,
                pointsReward: 200
            ),
            // 5. تمثال كهرمانة والأربعين حرامي
            CityMonument(
                id: "mon-kahramana",
                nameArabic: "تمثال كهرمانة",
                englishName: "Kahramana Monument",
                category: .monument,
                lat: 33.3134,
                lng: 44.4216,
                historicalSummary: "نصب ساحة كهرمانة وسط الكرادة، يجسد شخصية كهرمانة من قصص ألف ليلة وليلة وهي تصب الزيت المغلي في جرار اللصوص الأربعين.",
                builtYear: "1971 م",
                architectName: "محمد غني حكمت",
                artifactType: .rotatingCrystalPlaque,
                pointsReward: 150
            ),
            // 6. تمثال أبو الطيب المتنبي
            CityMonument(
                id: "mon-mutanabbi",
                nameArabic: "تمثال المتنبي",
                englishName: "Al-Mutanabbi Statue",
                category: .monument,
                lat: 33.3402,
                lng: 44.3872,
                historicalSummary: "يرتفع عند مدخل شارع المتنبي على ضفاف نهر دجلة الخالد، شاهداً على أمجاد الشعر العربي وحركة الكتب والأدب في بغداد.",
                builtYear: "1960 م",
                architectName: "محمد غني حكمت",
                artifactType: .rotatingCrystalPlaque,
                pointsReward: 150
            ),
            // 7. المدرسة المستنصرية
            CityMonument(
                id: "mon-mustansiriya",
                nameArabic: "المدرسة المستنصرية",
                englishName: "Mustansiriya Madrasah",
                category: .ancient,
                lat: 33.3385,
                lng: 44.3897,
                historicalSummary: "أقدم جامعة إسلامية متكاملة في العالم بنيت عام 1233 م على يد الخليفة العباسي المستنصر بالله، تدرس فيها الطب والرياضيات والعلوم الشرعية.",
                builtYear: "1233 م",
                architectName: "الخليفة المستنصر بالله",
                artifactType: .historicAstrolabe,
                pointsReward: 300
            ),
            // 8. بوابة عشتار وبابل التاريخية
            CityMonument(
                id: "mon-ishtar-gate",
                nameArabic: "بوابة عشتار العظيمة",
                englishName: "Ishtar Gate of Babylon",
                category: .ancient,
                lat: 32.5422,
                lng: 44.4221,
                historicalSummary: "البوابة الثامنة لمدينة بابل الداخلية شيدت من الآجر المزجج باللون الأزرق الموشى بصور التنانين والثيران المقدسة في عهد الملك نبوخذ نصر الثاني.",
                builtYear: "575 ق.م",
                architectName: "نبوخذ نصر الثاني",
                artifactType: .mesopotamianGoldenRelic,
                pointsReward: 500
            ),
            // 9. ملوية سامراء
            CityMonument(
                id: "mon-malwiya",
                nameArabic: "ملوية سامراء",
                englishName: "Spiral Minaret of Samarra",
                category: .ancient,
                lat: 34.2062,
                lng: 43.8762,
                historicalSummary: "مئذنة المسجد الجامع الحلزونية الفريدة التي ترتفع 52 متراً فوق سهول سامراء، شيدها الخليفة العباسي المتوكل عام 851 م.",
                builtYear: "851 م",
                architectName: "الخليفة المتوكل على الله",
                artifactType: .mesopotamianGoldenRelic,
                pointsReward: 400
            ),
            // --- كبسولات وقطع أثرية مخفية في شوارع بغداد (Ready to be Discovered) ---
            // 10. درهم عباسي نادر
            CityMonument(
                id: "art-safafir-coin",
                nameArabic: "درهم عباسي من دار السلام",
                englishName: "Abbasid Silver Dirham Relic",
                category: .artifact,
                lat: 33.3371,
                lng: 44.3915,
                historicalSummary: "عملة فضية مسكوكة في مدينة السلام (بغداد) تعود لعهد الخليفة هارون الرشيد، اكتشفها السائق في أزقة سوق الصفافير العريقة.",
                builtYear: "796 م",
                artifactType: .historicAstrolabe,
                pointsReward: 150
            ),
            // 11. ختم أسطواني سومري
            CityMonument(
                id: "art-rasheed-seal",
                nameArabic: "ختم أسطواني سومري ذهبي",
                englishName: "Sumerian Cylinder Seal",
                category: .artifact,
                lat: 33.3325,
                lng: 44.3992,
                historicalSummary: "ختم أسطواني ملكي منقوش بالكتابة المسمارية القديمة ونقوش شجرة الحياة، تم رصده في شارع الرشيد بالقرب من مقهى البرازيلية.",
                builtYear: "2400 ق.م",
                artifactType: .ancientCylinderSeal,
                pointsReward: 180
            ),
            // 12. بلورة دجلة الفيروزية
            CityMonument(
                id: "art-abu-nuwas-crystal",
                nameArabic: "بلورة دجلة الفيروزية",
                englishName: "Tigris River Azure Crystal",
                category: .artifact,
                lat: 33.3180,
                lng: 44.4150,
                historicalSummary: "قطعة بلورية متوهجة باللون الفيروزي تطفو فوق ضفاف شارع أبو نواس، تعكس أضواء بساتين النخيل وأمواج نهر دجلة.",
                builtYear: "أثر حديث",
                artifactType: .rotatingCrystalPlaque,
                pointsReward: 120
            ),
            // 13. نخلة الرافدين الذهبية
            CityMonument(
                id: "art-zawraa-palm",
                nameArabic: "نخلة الرافدين الذهبية",
                englishName: "Golden Mesopotamia Palm",
                category: .artifact,
                lat: 33.3120,
                lng: 44.3750,
                historicalSummary: "رمز الخصب والبركة في بلاد الرافدين، مجسم نخلة من الذهب الخالص عائم في فضاء متنزه الزوراء بانتظار الكابتن المكتشف.",
                builtYear: "رمز تراثي",
                artifactType: .mesopotamianGoldenRelic,
                pointsReward: 200
            ),
            // 14. نجمة عشتار الثمانية
            CityMonument(
                id: "art-nisoor-star",
                nameArabic: "نجمة عشتار الثمانية",
                englishName: "Eight-Pointed Star of Ishtar",
                category: .artifact,
                lat: 33.3050,
                lng: 44.3620,
                historicalSummary: "نجمة الصباح البابلية المضيئة تطفو في ساحة النسور بالكرخ، تمنح السائقين والمارة طاقة استكشافية ونقاط خبرة عالية.",
                builtYear: "رمز حضاري",
                artifactType: .rotatingCrystalPlaque,
                pointsReward: 160
            )
        ]
        
        updateExplorerTitle()
    }
    
    // MARK: - Restore Persistent Discovered State
    private func restoreDiscoveredState() {
        if let savedIds = UserDefaults.standard.stringArray(forKey: userDefaultsKey) {
            let idSet = Set(savedIds)
            for i in 0..<monuments.count {
                if idSet.contains(monuments[i].id) {
                    monuments[i].isDiscovered = true
                }
            }
            recalculatePoints()
        }
    }
    
    private func saveDiscoveredState() {
        let discoveredIds = monuments.filter { $0.isDiscovered }.map { $0.id }
        UserDefaults.standard.set(discoveredIds, forKey: userDefaultsKey)
    }
    
    // MARK: - Live GPS Coordinate Tracking & Proximity
    public func updateLocations(userLoc: CLLocationCoordinate2D, arView: ARView?) {
        var closestNearby: CityMonument?
        var minDistance: Double = 999999.0
        
        for i in 0..<monuments.count {
            let monCoord = CLLocationCoordinate2D(latitude: monuments[i].lat, longitude: monuments[i].lng)
            let dist = calculateDistance(from: userLoc, to: monCoord)
            monuments[i].distanceMeters = dist
            
            let isNear = dist <= 160.0
            let canCollect = dist <= 38.0
            
            monuments[i].isNearby = isNear
            monuments[i].canBeCollected = canCollect
            
            if isNear && dist < minDistance {
                minDistance = dist
                closestNearby = monuments[i]
            }
        }
        
        DispatchQueue.main.async {
            self.activeNearbyMonument = closestNearby
            self.objectWillChange.send()
            
            // Sync RealityKit 3D Objects Over Nearby Monuments
            if let arView = arView {
                self.syncRealityKitMonumentEntities(userLoc: userLoc, arView: arView)
            }
        }
    }
    
    // MARK: - RealityKit Procedural 3D Holographic Monument Entities
    private func syncRealityKitMonumentEntities(userLoc: CLLocationCoordinate2D, arView: ARView) {
        // Find monuments within 120 meters to anchor in physical RealityKit space
        let closeMonuments = monuments.filter { $0.distanceMeters <= 120.0 }
        
        // Remove anchors for monuments no longer in range
        let closeIds = Set(closeMonuments.map { $0.id })
        for (id, anchor) in spawnedMonumentAnchors {
            if !closeIds.contains(id) {
                arView.scene.removeAnchor(anchor)
                spawnedMonumentAnchors.removeValue(forKey: id)
            }
        }
        
        // Spawn 3D AR Objects over Monuments
        for mon in closeMonuments {
            guard spawnedMonumentAnchors[mon.id] == nil else { continue }
            
            // Compute metric position in .gravityAndHeading space
            // +X = East, -Z = North
            let deltaEast = (mon.lng - userLoc.longitude) * (.pi / 180.0) * earthRadiusMeters * cos(userLoc.latitude * .pi / 180.0)
            let deltaNorth = (mon.lat - userLoc.latitude) * (.pi / 180.0) * earthRadiusMeters
            
            let posX = Float(deltaEast)
            let posZ = -Float(deltaNorth)
            let posY: Float = 0.5 // Floating above ground
            
            var transform = matrix_identity_float4x4
            transform.columns.3 = SIMD4<Float>(posX, posY, posZ, 1.0)
            
            let anchor = AnchorEntity(world: transform)
            let modelEntity = build3DArtifactEntity(for: mon)
            anchor.addChild(modelEntity)
            
            arView.scene.addAnchor(anchor)
            spawnedMonumentAnchors[mon.id] = anchor
        }
    }
    
    private func build3DArtifactEntity(for monument: CityMonument) -> ModelEntity {
        let root = ModelEntity()
        
        switch monument.artifactType {
        case .holographicBeacon:
            // 1. Vertical Light Pillar / Laser
            let pillarMesh = MeshResource.generateBox(size: [0.3, 8.0, 0.3], cornerRadius: 0.15)
            let pillarMat = SimpleMaterial(color: UIColor.systemCyan.withAlphaComponent(0.65), isMetallic: false)
            let pillar = ModelEntity(mesh: pillarMesh, materials: [pillarMat])
            pillar.position.y = 4.0
            root.addChild(pillar)
            
            // 2. Rotating Holographic Golden Ring
            let ringMesh = MeshResource.generateBox(size: [1.8, 0.08, 1.8], cornerRadius: 0.04)
            let ringMat = SimpleMaterial(color: UIColor.systemYellow.withAlphaComponent(0.95), isMetallic: true)
            let ring = ModelEntity(mesh: ringMesh, materials: [ringMat])
            ring.position.y = 2.2
            root.addChild(ring)
            
            // 3. Central Glowing Diamond Crystal
            let crystalMesh = MeshResource.generateSphere(radius: 0.45)
            let crystalMat = SimpleMaterial(color: UIColor.systemTeal, isMetallic: true)
            let crystal = ModelEntity(mesh: crystalMesh, materials: [crystalMat])
            crystal.position.y = 2.2
            root.addChild(crystal)
            
        case .rotatingCrystalPlaque:
            // Floating Antique Bronze Plaque
            let boxMesh = MeshResource.generateBox(size: [1.2, 0.7, 0.08], cornerRadius: 0.03)
            let boxMat = SimpleMaterial(color: UIColor(red: 0.85, green: 0.65, blue: 0.25, alpha: 0.95), isMetallic: true)
            let plaque = ModelEntity(mesh: boxMesh, materials: [boxMat])
            plaque.position.y = 1.6
            root.addChild(plaque)
            
            // Holographic Aura Core
            let coreMesh = MeshResource.generateSphere(radius: 0.2)
            let coreMat = SimpleMaterial(color: UIColor.systemYellow, isMetallic: false)
            let core = ModelEntity(mesh: coreMesh, materials: [coreMat])
            core.position.y = 2.4
            root.addChild(core)
            
        case .mesopotamianGoldenRelic, .ancientCylinderSeal:
            // Ancient Mesopotamian Golden Column with Aura
            let colMesh = MeshResource.generateBox(size: [0.7, 1.4, 0.7], cornerRadius: 0.35)
            let colMat = SimpleMaterial(color: UIColor(red: 0.95, green: 0.80, blue: 0.15, alpha: 0.95), isMetallic: true)
            let col = ModelEntity(mesh: colMesh, materials: [colMat])
            col.position.y = 1.4
            root.addChild(col)
            
            // Golden Crown Star
            let starMesh = MeshResource.generateBox(size: [0.6, 0.6, 0.6], cornerRadius: 0.08)
            let starMat = SimpleMaterial(color: UIColor.systemYellow, isMetallic: true)
            let star = ModelEntity(mesh: starMesh, materials: [starMat])
            star.position.y = 2.5
            root.addChild(star)
            
        case .historicAstrolabe:
            // Concentric Brass Celestial Rings
            let outerRingMesh = MeshResource.generateBox(size: [1.4, 0.06, 1.4], cornerRadius: 0.02)
            let innerRingMesh = MeshResource.generateBox(size: [0.9, 0.05, 0.9], cornerRadius: 0.02)
            let astrolabeMat = SimpleMaterial(color: UIColor(red: 0.80, green: 0.55, blue: 0.20, alpha: 0.95), isMetallic: true)
            
            let outer = ModelEntity(mesh: outerRingMesh, materials: [astrolabeMat])
            outer.position.y = 1.8
            let inner = ModelEntity(mesh: innerRingMesh, materials: [astrolabeMat])
            inner.position.y = 1.8
            
            root.addChild(outer)
            root.addChild(inner)
        }
        
        // Add Floating 3D Arabic Text Above Artifact
        let textMesh = MeshResource.generateText(
            monument.nameArabic,
            extrusionDepth: 0.015,
            font: .boldSystemFont(ofSize: 0.12),
            containerFrame: CGRect(x: -0.6, y: -0.08, width: 1.2, height: 0.18),
            alignment: .center,
            lineBreakMode: .byTruncatingTail
        )
        let textMat = SimpleMaterial(color: .white, isMetallic: false)
        let textEntity = ModelEntity(mesh: textMesh, materials: [textMat])
        textEntity.position.y = 3.2
        root.addChild(textEntity)
        
        return root
    }
    
    // MARK: - Discover & Collect Spatial Monument
    public func discoverMonument(id: String) {
        guard let index = monuments.firstIndex(where: { $0.id == id }) else { return }
        guard !monuments[index].isDiscovered else { return }
        
        monuments[index].isDiscovered = true
        monuments[index].discoveryDate = Date()
        
        self.newlyDiscoveredMonument = monuments[index]
        self.showDiscoveryCelebration = true
        
        // Haptic feedback
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.success)
        
        // Sound Chime
        AudioServicesPlaySystemSound(1025)
        
        saveDiscoveredState()
        recalculatePoints()
    }
    
    private func recalculatePoints() {
        let discovered = monuments.filter { $0.isDiscovered }
        let points = discovered.reduce(0) { $0 + $1.pointsReward }
        
        explorerProfile.totalPoints = points
        explorerProfile.discoveredCount = discovered.count
        explorerProfile.totalAvailableCount = monuments.count
        
        updateExplorerTitle()
    }
    
    private func updateExplorerTitle() {
        let count = explorerProfile.discoveredCount
        if count >= 10 {
            explorerProfile.explorerTitle = "حارس الرافدين الذهبي"
        } else if count >= 6 {
            explorerProfile.explorerTitle = "مستكشف بغداد الأكبر"
        } else if count >= 3 {
            explorerProfile.explorerTitle = "كشاف دجلة التراثي"
        } else {
            explorerProfile.explorerTitle = "مستكشف بغداد الواعد"
        }
    }
    
    private func calculateDistance(from: CLLocationCoordinate2D, to: CLLocationCoordinate2D) -> Double {
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
}
