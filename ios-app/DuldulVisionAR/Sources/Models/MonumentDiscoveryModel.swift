import Foundation
import CoreLocation

public enum MonumentCategory: String, Codable, CaseIterable {
    case monument = "monument"     // نُصب وتماثيل كبرى
    case historic = "historic"     // معالم تراثية تاريخية
    case ancient = "ancient"       // آثار حضارية قديمة
    case artifact = "artifact"     // كبسولات وقطع أثرية مخفية جاهزة للاكتشاف
    
    public var titleArabic: String {
        switch self {
        case .monument: return "نُصب وتماثيل كبرى"
        case .historic: return "معالم تراثية"
        case .ancient: return "آثار حضارية"
        case .artifact: return "كنوز أثرية مخفية"
        }
    }
    
    public var iconName: String {
        switch self {
        case .monument: return "building.columns.fill"
        case .historic: return "clock.fill"
        case .ancient: return "shield.lefthalf.filled"
        case .artifact: return "sparkles"
        }
    }
}

public enum Artifact3DType: String, Codable {
    case holographicBeacon         // منارة ضوئية ليزرية عائمة فوق النصب
    case rotatingCrystalPlaque     // لوح كريستالي ذهبي دوّار بنقوش تراثية
    case mesopotamianGoldenRelic   // مجسم أثري ذهبي ثلاثي الأبعاد
    case historicAstrolabe         // أسطرلاب عباسي فلكي مجسم
    case ancientCylinderSeal       // ختم أسطواني بابلي ذهبي
}

public struct CityMonument: Identifiable, Codable {
    public let id: String
    public let nameArabic: String
    public let englishName: String
    public let category: MonumentCategory
    public let lat: Double
    public let lng: Double
    public let historicalSummary: String
    public let builtYear: String
    public let architectName: String?
    public let artifactType: Artifact3DType
    public let pointsReward: Int
    public var isDiscovered: Bool
    public var discoveryDate: Date?
    
    // Dynamic proximity metrics
    public var distanceMeters: Double = 0.0
    public var isNearby: Bool = false // < 150m
    public var canBeCollected: Bool = false // < 35m
    
    public init(
        id: String,
        nameArabic: String,
        englishName: String,
        category: MonumentCategory,
        lat: Double,
        lng: Double,
        historicalSummary: String,
        builtYear: String,
        architectName: String? = nil,
        artifactType: Artifact3DType,
        pointsReward: Int = 100,
        isDiscovered: Bool = false,
        discoveryDate: Date? = nil
    ) {
        self.id = id
        self.nameArabic = nameArabic
        self.englishName = englishName
        self.category = category
        self.lat = lat
        self.lng = lng
        self.historicalSummary = historicalSummary
        self.builtYear = builtYear
        self.architectName = architectName
        self.artifactType = artifactType
        self.pointsReward = pointsReward
        self.isDiscovered = isDiscovered
        self.discoveryDate = discoveryDate
    }
}

public struct UserExplorerProfile: Codable {
    public var explorerTitle: String // "كشاف دجلة", "مستكشف بغداد", "حارس الرافدين"
    public var totalPoints: Int
    public var discoveredCount: Int
    public var totalAvailableCount: Int
    
    public init(
        explorerTitle: String = "مستكشف بغداد الواعد",
        totalPoints: Int = 0,
        discoveredCount: Int = 0,
        totalAvailableCount: Int = 15
    ) {
        self.explorerTitle = explorerTitle
        self.totalPoints = totalPoints
        self.discoveredCount = discoveredCount
        self.totalAvailableCount = totalAvailableCount
    }
}
