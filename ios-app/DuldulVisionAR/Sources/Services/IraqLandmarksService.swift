import Foundation
import CoreLocation

public struct IraqLandmarkItem: Identifiable, Codable {
    public let id: String
    public let nameArabic: String
    public let nameEnglish: String
    public let cityName: String
    public let coordinate: CLLocationCoordinate2D
    public let altitudeMeters: Double
    public let historicalPeriod: String
    public let builtYear: String
    public let historicalDescription: String
    public let defaultAssetId: String
    public let isArtisticReconstruction: Bool
    public let positioningConfidenceMeters: Double
    
    enum CodingKeys: String, CodingKey {
        case id, nameArabic, nameEnglish, cityName, latitude, longitude, altitudeMeters, historicalPeriod, builtYear, historicalDescription, defaultAssetId, isArtisticReconstruction, positioningConfidenceMeters
    }
    
    public init(
        id: String,
        nameArabic: String,
        nameEnglish: String,
        cityName: String,
        coordinate: CLLocationCoordinate2D,
        altitudeMeters: Double = 0.0,
        historicalPeriod: String,
        builtYear: String,
        historicalDescription: String,
        defaultAssetId: String,
        isArtisticReconstruction: Bool = false,
        positioningConfidenceMeters: Double = 5.0
    ) {
        self.id = id
        self.nameArabic = nameArabic
        self.nameEnglish = nameEnglish
        self.cityName = cityName
        self.coordinate = coordinate
        self.altitudeMeters = altitudeMeters
        self.historicalPeriod = historicalPeriod
        self.builtYear = builtYear
        self.historicalDescription = historicalDescription
        self.defaultAssetId = defaultAssetId
        self.isArtisticReconstruction = isArtisticReconstruction
        self.positioningConfidenceMeters = positioningConfidenceMeters
    }
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        nameArabic = try container.decode(String.self, forKey: .nameArabic)
        nameEnglish = try container.decode(String.self, forKey: .nameEnglish)
        cityName = try container.decode(String.self, forKey: .cityName)
        let lat = try container.decode(Double.self, forKey: .latitude)
        let lon = try container.decode(Double.self, forKey: .longitude)
        coordinate = CLLocationCoordinate2D(latitude: lat, longitude: lon)
        altitudeMeters = try container.decode(Double.self, forKey: .altitudeMeters)
        historicalPeriod = try container.decode(String.self, forKey: .historicalPeriod)
        builtYear = try container.decode(String.self, forKey: .builtYear)
        historicalDescription = try container.decode(String.self, forKey: .historicalDescription)
        defaultAssetId = try container.decode(String.self, forKey: .defaultAssetId)
        isArtisticReconstruction = try container.decode(Bool.self, forKey: .isArtisticReconstruction)
        positioningConfidenceMeters = try container.decode(Double.self, forKey: .positioningConfidenceMeters)
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(nameArabic, forKey: .nameArabic)
        try container.encode(nameEnglish, forKey: .nameEnglish)
        try container.encode(cityName, forKey: .cityName)
        try container.encode(coordinate.latitude, forKey: .latitude)
        try container.encode(coordinate.longitude, forKey: .longitude)
        try container.encode(altitudeMeters, forKey: .altitudeMeters)
        try container.encode(historicalPeriod, forKey: .historicalPeriod)
        try container.encode(builtYear, forKey: .builtYear)
        try container.encode(historicalDescription, forKey: .historicalDescription)
        try container.encode(defaultAssetId, forKey: .defaultAssetId)
        try container.encode(isArtisticReconstruction, forKey: .isArtisticReconstruction)
        try container.encode(positioningConfidenceMeters, forKey: .positioningConfidenceMeters)
    }
}

public class IraqLandmarksService: ObservableObject {
    @Published public var landmarks: [IraqLandmarkItem] = []
    @Published public var selectedCityFilter: String = "الكل"
    
    public static let iraqiCities: [String] = [
        "الكل", "بغداد", "بابل", "كربلاء المقدسة", "النجف الأشرف", "ذي قار", "أربيل", "الموصل", "البصرة"
    ]
    
    public init() {
        loadLandmarks()
    }
    
    private func loadLandmarks() {
        landmarks = [
            // 1. بابل - بوابة عشتار
            IraqLandmarkItem(
                id: "iq-babylon-ishtar",
                nameArabic: "بوابة عشتار العظيمة",
                nameEnglish: "Ishtar Gate of Babylon",
                cityName: "بابل",
                coordinate: CLLocationCoordinate2D(latitude: 32.5422, longitude: 44.4219),
                altitudeMeters: 28.0,
                historicalPeriod: "الإمبراطورية البابلية الحديثة",
                builtYear: "575 ق.م",
                historicalDescription: "البوابة الثامنة لحرم بابل الداخلي، شيدت في عهد الملك نبوخذ نصر الثاني بالآجر الأزرق المزجج ونقوش الأسود والثيران.",
                defaultAssetId: "model-ishtar-gate",
                isArtisticReconstruction: true,
                positioningConfidenceMeters: 2.0
            ),
            
            // 2. بابل - تمثال أسد بابل
            IraqLandmarkItem(
                id: "iq-babylon-lion",
                nameArabic: "تمثال أسد بابل الأثري",
                nameEnglish: "Lion of Babylon",
                cityName: "بابل",
                coordinate: CLLocationCoordinate2D(latitude: 32.5435, longitude: 44.4225),
                altitudeMeters: 27.0,
                historicalPeriod: "حضارة بابل القديمة",
                builtYear: "القرن 6 ق.م",
                historicalDescription: "منحوتة تاريخية ضخمة من حجر البازلت الأسود الصلب تجسد أسداً يعلو فارساً بشجاعة، رمز العزة الرافدينية.",
                defaultAssetId: "model-lion-babylon",
                isArtisticReconstruction: false,
                positioningConfidenceMeters: 1.5
            ),
            
            // 3. ذي قار - زقورة أور
            IraqLandmarkItem(
                id: "iq-ur-ziggurat",
                nameArabic: "زقورة أور السومرية",
                nameEnglish: "Great Ziggurat of Ur",
                cityName: "ذي قار",
                coordinate: CLLocationCoordinate2D(latitude: 30.9628, longitude: 46.1031),
                altitudeMeters: 6.0,
                historicalPeriod: "العصر السومري الحديث (سلالة أور الثالثة)",
                builtYear: "2100 ق.م",
                historicalDescription: "أعظم صرح سومري مدرج في وادي الرافدين، بناه الملك أور-نامو للإله نانا، وتتألف من ثلاث طبقات مدرجة من الآجر.",
                defaultAssetId: "model-ziggurat-ur",
                isArtisticReconstruction: false,
                positioningConfidenceMeters: 1.0
            ),
            
            // 4. بغداد - نصب التحرير
            IraqLandmarkItem(
                id: "iq-bgd-tahrir",
                nameArabic: "نصب التحرير",
                nameEnglish: "Freedom Monument",
                cityName: "بغداد",
                coordinate: CLLocationCoordinate2D(latitude: 33.3283, longitude: 44.4093),
                altitudeMeters: 34.0,
                historicalPeriod: "العراق المعاصر",
                builtYear: "1961 م",
                historicalDescription: "ملحمة فنية برونزية أبدعها النحات الخالد جواد سليم في ساحة التحرير بقلب بغداد لتخليد تطلعات الشعب للحرية والسلام.",
                defaultAssetId: "model-freedom-monument",
                isArtisticReconstruction: false,
                positioningConfidenceMeters: 1.0
            ),
            
            // 5. بغداد - نصب الشهيد
            IraqLandmarkItem(
                id: "iq-bgd-shaheed",
                nameArabic: "نصب الشهيد",
                nameEnglish: "Al-Shaheed Monument",
                cityName: "بغداد",
                coordinate: CLLocationCoordinate2D(latitude: 33.3429, longitude: 44.4443),
                altitudeMeters: 36.0,
                historicalPeriod: "العراق المعاصر",
                builtYear: "1983 م",
                historicalDescription: "قبة فيروزية إسلامية منقسمة ترتفع 40 متراً صممها إسماعيل فتاح الترك، تمثل رمز التضحية والخلود الوطني.",
                defaultAssetId: "model-shaheed-dome",
                isArtisticReconstruction: false,
                positioningConfidenceMeters: 1.0
            ),
            
            // 6. بغداد - المدرسة المستنصرية
            IraqLandmarkItem(
                id: "iq-bgd-mustansiriya",
                nameArabic: "المدرسة المستنصرية التاريخية",
                nameEnglish: "Al-Mustansiriya Madrasah",
                cityName: "بغداد",
                coordinate: CLLocationCoordinate2D(latitude: 33.3385, longitude: 44.3892),
                altitudeMeters: 33.0,
                historicalPeriod: "العصر العباسي",
                builtYear: "1227 م",
                historicalDescription: "أقدم جامعة إسلامية متكاملة شيدها الخليفة العباسي المستنصر بالله لتدريس العلوم والطب والفلك والفقه.",
                defaultAssetId: "model-astrolabe",
                isArtisticReconstruction: false,
                positioningConfidenceMeters: 2.0
            ),
            
            // 7. كربلاء - حصن الأخيضر
            IraqLandmarkItem(
                id: "iq-karbala-ukhaidir",
                nameArabic: "حصن وقصر الأخيضر",
                nameEnglish: "Al-Ukhaidir Fortress",
                cityName: "كربلاء المقدسة",
                coordinate: CLLocationCoordinate2D(latitude: 32.4419, longitude: 43.6022),
                altitudeMeters: 45.0,
                historicalPeriod: "العصر العباسي المبكر",
                builtYear: "775 م",
                historicalDescription: "قلعة صحراوية حصينة محاطة بأبراج نصف دائرية وأقواس معمارية رائدة تمثل قمة العمارة العسكرية الإسلامية المبكرة.",
                defaultAssetId: "model-cylinder-seal",
                isArtisticReconstruction: false,
                positioningConfidenceMeters: 2.5
            ),
            
            // 8. أربيل - قلعة أربيل
            IraqLandmarkItem(
                id: "iq-erbil-citadel",
                nameArabic: "قلعة أربيل الأثرية",
                nameEnglish: "Erbil Citadel",
                cityName: "أربيل",
                coordinate: CLLocationCoordinate2D(latitude: 36.1912, longitude: 44.0091),
                altitudeMeters: 415.0,
                historicalPeriod: "أقدم مستوطنة بشرية مأهولة باستمرار (اليونسكو)",
                builtYear: "الألفية الخامسة ق.م",
                historicalDescription: "تل بيضاوي أثري يرتفع وسط مدينة أربيل، استمر بالسكن البشري المتواصل لأكثر من 6000 عام وشهد العهود الآشورية والإسلامية.",
                defaultAssetId: "model-lion-babylon",
                isArtisticReconstruction: false,
                positioningConfidenceMeters: 2.0
            ),
            
            // 9. الموصل - منارة الحدباء وجامع النوري
            IraqLandmarkItem(
                id: "iq-mosul-hadba",
                nameArabic: "منارة الحدباء التاريخية",
                nameEnglish: "Al-Hadba Leaning Minaret",
                cityName: "الموصل",
                coordinate: CLLocationCoordinate2D(latitude: 36.3432, longitude: 43.1275),
                altitudeMeters: 220.0,
                historicalPeriod: "الدولة الزنكية",
                builtYear: "1172 م",
                historicalDescription: "مئذنة تاريخية شامخة بارتفاع 45 متراً شيدها نور الدين زنكي بنقوش وزخارف طابوقية فريدة وانحناء بارز نحو الشرق.",
                defaultAssetId: "model-hadba-minaret",
                isArtisticReconstruction: false,
                positioningConfidenceMeters: 1.5
            ),
            
            // 10. البصرة - شناشيل البصرة القديمة
            IraqLandmarkItem(
                id: "iq-basra-shanashil",
                nameArabic: "شناشيل البصرة التراثية",
                nameEnglish: "Old Basra Shanashil",
                cityName: "البصرة",
                coordinate: CLLocationCoordinate2D(latitude: 30.5133, longitude: 47.8385),
                altitudeMeters: 5.0,
                historicalPeriod: "التراث المعماري البصري",
                builtYear: "القرن 19 م",
                historicalDescription: "شرفات خشبية هندسية بديعة تطل على نهر العشار تجسد عبقرية العمارة التراثية في التهوية الطبيعية والخصوصية.",
                defaultAssetId: "model-astrolabe",
                isArtisticReconstruction: true,
                positioningConfidenceMeters: 3.0
            )
        ]
    }
    
    public var filteredLandmarks: [IraqLandmarkItem] {
        if selectedCityFilter == "الكل" {
            return landmarks
        }
        return landmarks.filter { $0.cityName == selectedCityFilter }
    }
}
