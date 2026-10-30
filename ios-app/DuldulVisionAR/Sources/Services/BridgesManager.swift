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
    // 12 Authentic Baghdad Bridges with Precise Real Coordinates
    private static let defaultBaghdadBridges: [BaghdadBridge] = [
        BaghdadBridge(id: "jadriya", nameArabic: "جسر الجادرية", statusArabic: "سالك", speedKmh: 68, delayMinutes: 0, lat: 33.2797, lng: 44.3725, isFastestRoute: true),
        BaghdadBridge(id: "14_tammuz", nameArabic: "جسر 14 تموز (المعلق)", statusArabic: "حركة طبيعية", speedKmh: 55, delayMinutes: 2, lat: 33.2981, lng: 44.4011),
        BaghdadBridge(id: "jumhuriya", nameArabic: "جسر الجمهورية", statusArabic: "حركة بطيئة", speedKmh: 35, delayMinutes: 4, lat: 33.3267, lng: 44.4072),
        BaghdadBridge(id: "sinak", nameArabic: "جسر السنك", statusArabic: "سالك", speedKmh: 50, delayMinutes: 1, lat: 33.3333, lng: 44.4042),
        BaghdadBridge(id: "ahrar", nameArabic: "جسر الأحرار", statusArabic: "حركة بطيئة", speedKmh: 28, delayMinutes: 5, lat: 33.3392, lng: 44.3986),
        BaghdadBridge(id: "shuhada", nameArabic: "جسر الشهداء", statusArabic: "حركة متوسطة", speedKmh: 42, delayMinutes: 2, lat: 33.3444, lng: 44.3917),
        BaghdadBridge(id: "bab_al_muadham", nameArabic: "جسر باب المعظم", statusArabic: "مزدحم جزئياً", speedKmh: 22, delayMinutes: 7, lat: 33.3567, lng: 44.3822),
        BaghdadBridge(id: "sarafiya", nameArabic: "جسر الصرافية (الحديدي)", statusArabic: "سالك", speedKmh: 48, delayMinutes: 1, lat: 33.3644, lng: 44.3764),
        BaghdadBridge(id: "aaimmah", nameArabic: "جسر الأئمة", statusArabic: "حركة طبيعية", speedKmh: 45, delayMinutes: 2, lat: 33.3769, lng: 44.3619),
        BaghdadBridge(id: "kuraiat", nameArabic: "جسر الكريعات", statusArabic: "سالك", speedKmh: 60, delayMinutes: 0, lat: 33.3981, lng: 44.3483),
        BaghdadBridge(id: "dora", nameArabic: "جسر الدورة السريع", statusArabic: "سالك", speedKmh: 75, delayMinutes: 0, lat: 33.2486, lng: 44.4258),
        BaghdadBridge(id: "muthanna", nameArabic: "جسر المثنى (شمال بغداد)", statusArabic: "سالك", speedKmh: 70, delayMinutes: 0, lat: 33.4358, lng: 44.3311)
    ]
    
    @Published public var bridges: [BaghdadBridge] = defaultBaghdadBridges
    @Published public var isLoading: Bool = false
    
    public init() {
        fetchLiveBridges()
    }
    
    public func fetchLiveBridges() {
        guard let url = URL(string: "\(AppConfig.backendBaseURL)/api/bridges") else { return }
        isLoading = true
        
        URLSession.shared.dataTask(with: url) { [weak self] data, _, error in
            DispatchQueue.main.async {
                self?.isLoading = false
            }
            guard let self = self, let data = data, error == nil else { return }
            do {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let bridgesArray = json["bridges"] as? [[String: Any]] {
                    let parsed: [BaghdadBridge] = bridgesArray.compactMap { d in
                        guard let id = d["id"] as? String,
                              let nameAr = d["name_ar"] as? String,
                              let lat = d["lat"] as? Double,
                              let lng = d["lng"] as? Double else { return nil }
                        
                        let speed = d["medianSpeedKmh"] as? Int ?? 50
                        let contributors = d["contributors"] as? Int ?? 0
                        
                        let statusArabic: String
                        if contributors < 3 {
                            statusArabic = speed > 50 ? "سالك" : "حركة معتادة"
                        } else if speed > 50 {
                            statusArabic = "سالك"
                        } else if speed > 25 {
                            statusArabic = "حركة بطيئة"
                        } else {
                            statusArabic = "مزدحم"
                        }
                        
                        return BaghdadBridge(
                            id: id,
                            nameArabic: nameAr,
                            statusArabic: statusArabic,
                            speedKmh: speed,
                            delayMinutes: speed < 25 ? 6 : 0,
                            lat: lat,
                            lng: lng,
                            isFastestRoute: false
                        )
                    }
                    if !parsed.isEmpty {
                        DispatchQueue.main.async {
                            self.bridges = parsed
                        }
                    }
                }
            } catch {
                print("[BridgesManager] Decode error: \(error)")
            }
        }.resume()
    }
}
