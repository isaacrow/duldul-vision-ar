import Foundation
import RealityKit
import SwiftUI

public enum ModelHeritageCategory: String, Codable, CaseIterable {
    case ancientBabylon = "آثار بابل وسومر"
    case islamicAbbasid = "التراث العباسي والإسلامي"
    case modernMonuments = "النُصب الوطنية الحديثة"
    case architecturalHeritage = "العمارة التراثية والمدن"
    
    public var iconName: String {
        switch self {
        case .ancientBabylon: return "crown.fill"
        case .islamicAbbasid: return "moon.stars.fill"
        case .modernMonuments: return "building.columns.fill"
        case .architecturalHeritage: return "house.lodge.fill"
        }
    }
}

public enum ProceduralMeshType: String, Codable {
    case zigguratTiered
    case ishtarGateArch
    case alShaheedSplitDome
    case freedomFriezeRelief
    case leaningMinaret
    case astrolabeArmillary
    case cylinderSeal
    case basaltLion
    case genericPin
}

public struct USDZModelItem: Identifiable, Codable {
    public let id: String
    public let name: String
    public let nameArabic: String
    public let category: ModelHeritageCategory
    public let historicalSummary: String
    public let author: String
    public let license: String
    public let defaultScale: Float
    public let defaultAltitudeOffset: Double
    public let proceduralType: ProceduralMeshType
    public let assetFilename: String?
    public let estimatedPolygons: Int
    public let dimensionsMeters: SIMD3<Float> // Width, Height, Depth
    public let version: String
    public let isArtisticReconstruction: Bool
    
    public init(
        id: String,
        name: String,
        nameArabic: String,
        category: ModelHeritageCategory,
        historicalSummary: String,
        author: String,
        license: String = "مشاع إبداعي - توثيق التراث الرقمي العراقي (CC-BY 4.0)",
        defaultScale: Float = 1.0,
        defaultAltitudeOffset: Double = 0.0,
        proceduralType: ProceduralMeshType,
        assetFilename: String? = nil,
        estimatedPolygons: Int,
        dimensionsMeters: SIMD3<Float>,
        version: String = "1.0",
        isArtisticReconstruction: Bool = false
    ) {
        self.id = id
        self.name = name
        self.nameArabic = nameArabic
        self.category = category
        self.historicalSummary = historicalSummary
        self.author = author
        self.license = license
        self.defaultScale = defaultScale
        self.defaultAltitudeOffset = defaultAltitudeOffset
        self.proceduralType = proceduralType
        self.assetFilename = assetFilename
        self.estimatedPolygons = estimatedPolygons
        self.dimensionsMeters = dimensionsMeters
        self.version = version
        self.isArtisticReconstruction = isArtisticReconstruction
    }
}

public class USDZModelCatalog: ObservableObject {
    @Published public var models: [USDZModelItem] = []
    
    public init() {
        loadCatalog()
    }
    
    private func loadCatalog() {
        models = [
            // 1. أسد بابل
            USDZModelItem(
                id: "model-lion-babylon",
                name: "Lion of Babylon",
                nameArabic: "تمثال أسد بابل التاريخي",
                category: .ancientBabylon,
                historicalSummary: "تحفة بابلية منحوتة من حجر البازلت الأسود الصلب، يعود لعهد الملك نبوخذ نصر الثاني في القرن السادس قبل الميلاد. يجسد أسداً يسحق محارباً بشجاعة وقوة.",
                author: "هيئة الآثار والتراث العراقية - توثيق رقمي ثلاثي الأبعاد",
                license: "الملكية العامة للآثار الوطنية العراقية",
                defaultScale: 1.0,
                defaultAltitudeOffset: 0.0,
                proceduralType: .basaltLion,
                assetFilename: "lion_of_babylon",
                estimatedPolygons: 18500,
                dimensionsMeters: SIMD3<Float>(1.95, 1.55, 1.0),
                isArtisticReconstruction: false
            ),
            
            // 2. بوابة عشتار
            USDZModelItem(
                id: "model-ishtar-gate",
                name: "Ishtar Gate",
                nameArabic: "بوابة عشتار البابلية العظيمة",
                category: .ancientBabylon,
                historicalSummary: "البوابة الثامنة لمدينة بابل الداخلية، شيدت من الآجر المزجج باللون الأزرق الملكي اللازوردي، مزينة بأشكال الأسود والتنانين (الموشخوشو) والثيران المقدسة.",
                author: "مشروع إعادة بناء بابل الرقمي - مستند إلى حفريات روبرت كولدفاي",
                license: "إعادة بناء فنية ثلاثية الأبعاد مرخصة (CC-BY-SA 4.0)",
                defaultScale: 0.35,
                defaultAltitudeOffset: 0.0,
                proceduralType: .ishtarGateArch,
                assetFilename: "ishtar_gate",
                estimatedPolygons: 45000,
                dimensionsMeters: SIMD3<Float>(14.0, 11.5, 6.0),
                isArtisticReconstruction: true
            ),
            
            // 3. زقورة أور السومرية
            USDZModelItem(
                id: "model-ziggurat-ur",
                name: "Ziggurat of Ur",
                nameArabic: "زقورة أور السومرية المدرجة",
                category: .ancientBabylon,
                historicalSummary: "أقدم وأكمل زقورة سومرية مدرجة في بلاد الرافدين، بناها الملك أور-نامو في العصر البرونزي حوالي 2100 ق.م تقديساً لإله القمر (نانا). شيدت من طابوق الآجر والطين.",
                author: "فريق المسح الأثري الرقمي لمحافظة ذي قار",
                license: "مشاع التوثيق الرقمي الوطني",
                defaultScale: 0.2,
                defaultAltitudeOffset: 0.0,
                proceduralType: .zigguratTiered,
                assetFilename: "ziggurat_of_ur",
                estimatedPolygons: 32000,
                dimensionsMeters: SIMD3<Float>(24.0, 15.0, 20.0),
                isArtisticReconstruction: false
            ),
            
            // 4. قبة نصب الشهيد
            USDZModelItem(
                id: "model-shaheed-dome",
                name: "Al-Shaheed Monument Dome",
                nameArabic: "قبة نصب الشهيد الفيروزية",
                category: .modernMonuments,
                historicalSummary: "تحفة معمارية صممها النحات إسماعيل فتاح الترك عام 1983. تتكون من قبة إسلامية بيضاوية مشطورة ترتفع 40 متراً مكسوة بقطع السيراميك الفيروزي البغدادي اللامع.",
                author: "الأمانة العامة لبغداد - الأرشيف المعماري",
                license: "ترخيص التوثيق الثقافي العراقي",
                defaultScale: 0.25,
                defaultAltitudeOffset: 0.0,
                proceduralType: .alShaheedSplitDome,
                assetFilename: "al_shaheed_monument",
                estimatedPolygons: 28000,
                dimensionsMeters: SIMD3<Float>(18.0, 20.0, 18.0),
                isArtisticReconstruction: false
            ),
            
            // 5. إفريز نصب التحرير
            USDZModelItem(
                id: "model-freedom-monument",
                name: "Freedom Monument Frieze",
                nameArabic: "إفريز نصب التحرير البرونزي",
                category: .modernMonuments,
                historicalSummary: "جدارية برونزية ملحمية بطول 50 متراً أنجزها الفنان الرائد جواد سليم عام 1961 في ساحة التحرير. تحكي في 14 مشهداً كفاح وتاريخ بلاد الرافدين وصولاً إلى الحرية.",
                author: "وزارة الثقافة العراقية - دائرة الفنون التشكيلية",
                license: "الملكية الثقافية المحمية - لأغراض التعليم والواقع المعزز",
                defaultScale: 0.4,
                defaultAltitudeOffset: 2.5,
                proceduralType: .freedomFriezeRelief,
                assetFilename: nil,
                estimatedPolygons: 36000,
                dimensionsMeters: SIMD3<Float>(16.0, 3.2, 0.8),
                isArtisticReconstruction: false
            ),
            
            // 6. منارة الحدباء المائلة
            USDZModelItem(
                id: "model-hadba-minaret",
                name: "Al-Hadba Leaning Minaret",
                nameArabic: "منارة الحدباء المائلة التاريخية",
                category: .islamicAbbasid,
                historicalSummary: "مئذنة جامع النوري الكبير في الموصل شيدت عام 1172 م في عهد نور الدين زنكي. اشتهرت بانحنائها الهندسي الفريد وزخارفها الآجرية المعقدة المكونة من 7 طبقات هندسية.",
                author: "مبادرة إحياء روح الموصل - اليونسكو وحكومة العراق",
                license: "إعادة بناء توثيقية رقمية للأثر قبل الترميم",
                defaultScale: 0.3,
                defaultAltitudeOffset: 0.0,
                proceduralType: .leaningMinaret,
                assetFilename: nil,
                estimatedPolygons: 24000,
                dimensionsMeters: SIMD3<Float>(4.5, 22.0, 4.5),
                isArtisticReconstruction: false
            ),
            
            // 7. أسطرلاب عباسي فلكي
            USDZModelItem(
                id: "model-astrolabe",
                name: "Abbasid Astrolabe",
                nameArabic: "أسطرلاب بغداد العباسي الفلكي",
                category: .islamicAbbasid,
                historicalSummary: "آلة فلكية دقيقة مصنوعة من النحاس الأصفر والذهب كانت تستخدم في بيت الحكمة ببغداد لتحديد أوقات الصلاة والقبلة ومواقع النجوم وحساب خطوط الطول والعرض الجغرافية.",
                author: "متحف التاريخ والعلوم ببغداد",
                license: "مشاع إبداعي مفتوح للتعليم (CC0)",
                defaultScale: 1.5,
                defaultAltitudeOffset: 0.8,
                proceduralType: .astrolabeArmillary,
                assetFilename: "astrolabe",
                estimatedPolygons: 16000,
                dimensionsMeters: SIMD3<Float>(0.6, 0.6, 0.15),
                isArtisticReconstruction: true
            ),
            
            // 8. ختم أسطواني سومري
            USDZModelItem(
                id: "model-cylinder-seal",
                name: "Sumerian Cylinder Seal",
                nameArabic: "ختم أسطواني سومري ملكي",
                category: .ancientBabylon,
                historicalSummary: "أسطوانة حجرية محفورة بدقة عالية بتفاصيل أسطورة جلجامش وشجرة الحياة، يعود للألف الثالث قبل الميلاد. يتدحرج على الطين الطري لترك بصمة قانونية ورسمية.",
                author: "المتحف العراقي الوطني - بغداد",
                license: "الملكية العامة للآثار",
                defaultScale: 2.0,
                defaultAltitudeOffset: 0.5,
                proceduralType: .cylinderSeal,
                assetFilename: nil,
                estimatedPolygons: 12000,
                dimensionsMeters: SIMD3<Float>(0.3, 0.5, 0.3),
                isArtisticReconstruction: false
            )
        ]
    }
    
    public func findModel(byId id: String) -> USDZModelItem? {
        return models.first { $0.id == id }
    }
}
