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
                        
                        let statusRaw = d["status"] as? String ?? "no_data"
                        let speed = d["medianSpeedKmh"] as? Int ?? 0
                        let contributors = d["contributors"] as? Int ?? 0
                        
                        let statusArabic: String
                        if statusRaw == "no_data" || contributors < 3 {
                            statusArabic = "لا توجد بيانات حركة كافية"
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
                            delayMinutes: 0,
                            lat: lat,
                            lng: lng,
                            isFastestRoute: false
                        )
                    }
                    DispatchQueue.main.async {
                        self.bridges = parsed
                    }
                }
            } catch {
                print("[BridgesManager] Decode error: \(error)")
            }
        }.resume()
    }
}
