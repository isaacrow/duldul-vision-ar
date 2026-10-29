import Foundation

public struct BaghdadBridge: Identifiable, Codable {
    public let id: String
    public let nameArabic: String
    public let statusArabic: String // سالك، مزدحم، بطيء
    public let speedKmh: Int
    public let delayMinutes: Int
    public let lat: Double
    public let lng: Double
    public let isFastestRoute: Bool
    
    public init(
        id: String,
        nameArabic: String,
        statusArabic: String,
        speedKmh: Int,
        delayMinutes: Int,
        lat: Double,
        lng: Double,
        isFastestRoute: Bool = false
    ) {
        self.id = id
        self.nameArabic = nameArabic
        self.statusArabic = statusArabic
        self.speedKmh = speedKmh
        self.delayMinutes = delayMinutes
        self.lat = lat
        self.lng = lng
        self.isFastestRoute = isFastestRoute
    }
}

public class BridgesManager: ObservableObject {
    @Published public var bridges: [BaghdadBridge] = []
    
    public init() {
        loadBridges()
    }
    
    public func loadBridges() {
        bridges = [
            BaghdadBridge(id: "jadriya", nameArabic: "جسر الجادرية", statusArabic: "ازدحام متوسط", speedKmh: 35, delayMinutes: 8, lat: 33.2840, lng: 44.3810),
            BaghdadBridge(id: "sinak", nameArabic: "جسر السنك", statusArabic: "سالك بطلاقة", speedKmh: 65, delayMinutes: 1, lat: 33.3280, lng: 44.4020, isFastestRoute: true),
            BaghdadBridge(id: "ahrar", nameArabic: "جسر الأحرار", statusArabic: "حركة بطيئة", speedKmh: 28, delayMinutes: 10, lat: 33.3340, lng: 44.3980),
            BaghdadBridge(id: "shuhada", nameArabic: "جسر الشهداء", statusArabic: "سالك", speedKmh: 50, delayMinutes: 3, lat: 33.3410, lng: 44.3910),
            BaghdadBridge(id: "sarrafiya", nameArabic: "جسر الصرافية (الحديدي)", statusArabic: "سالك", speedKmh: 55, delayMinutes: 2, lat: 33.3590, lng: 44.3790),
            BaghdadBridge(id: "bab_muadham", nameArabic: "جسر باب المعظم", statusArabic: "ازدحام خانق", speedKmh: 14, delayMinutes: 18, lat: 33.3510, lng: 44.3850),
            BaghdadBridge(id: "ramadan14", nameArabic: "جسر 14 رمضان (الأعظمية)", statusArabic: "سالك بطلاقة", speedKmh: 70, delayMinutes: 1, lat: 33.3750, lng: 44.3640, isFastestRoute: true),
            BaghdadBridge(id: "muthanna", nameArabic: "جسر المثنى (شمال بغداد)", statusArabic: "سالك", speedKmh: 68, delayMinutes: 2, lat: 33.4320, lng: 44.3310),
            BaghdadBridge(id: "muallaq", nameArabic: "الجسر المعلق (الكرادة)", statusArabic: "تدقيق أمني خفيف", speedKmh: 40, delayMinutes: 6, lat: 33.3010, lng: 44.4080),
            BaghdadBridge(id: "dolaie", nameArabic: "جسر الدباش (الغزالية)", statusArabic: "سالك", speedKmh: 60, delayMinutes: 2, lat: 33.3680, lng: 44.3050)
        ]
    }
}
