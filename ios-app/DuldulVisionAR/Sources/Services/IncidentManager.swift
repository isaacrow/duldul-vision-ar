import Foundation
import CoreLocation
import Combine
import AudioToolbox

public enum IncidentType: String, Codable, CaseIterable {
    case checkpoint = "checkpoint"
    case speedCamera = "speed_camera"
    case trafficJam = "traffic_jam"
    case accident = "accident"
    case roadwork = "road_work"
    case hazard = "hazard"
    case closure = "closure"
    
    public var titleArabic: String {
        switch self {
        case .checkpoint: return "سيطرة / تدقيق أمني"
        case .speedCamera: return "كاميرا مراقبة سرعة"
        case .trafficJam: return "ازدحام مروري خانق"
        case .accident: return "حادث سير"
        case .roadwork: return "أعمال صيانة وإكساء"
        case .hazard: return "حفرة أو عائق في الطريق"
        case .closure: return "طريق مقطوع"
        }
    }
    
    public var iconName: String {
        switch self {
        case .checkpoint: return "shield.lefthalf.filled"
        case .speedCamera: return "camera.fill"
        case .trafficJam: return "car.2.fill"
        case .accident: return "exclamationmark.triangle.fill"
        case .roadwork: return "hammer.fill"
        case .hazard: return "cone.fill"
        case .closure: return "nosign"
        }
    }
}

public struct CommunityIncident: Identifiable, Codable {
    public let id: String
    public let type: IncidentType
    public let title: String
    public let lat: Double
    public let lng: Double
    public var votes: Int
    public let timestamp: Date
    
    public init(
        id: String = UUID().uuidString,
        type: IncidentType,
        title: String,
        lat: Double,
        lng: Double,
        votes: Int = 1,
        timestamp: Date = Date()
    ) {
        self.id = id
        self.type = type
        self.title = title
        self.lat = lat
        self.lng = lng
        self.votes = votes
        self.timestamp = timestamp
    }
}

public class IncidentManager: ObservableObject {
    private static let initialBaghdadIncidents: [CommunityIncident] = [
        CommunityIncident(type: .speedCamera, title: "كاميرا رادار سرعة (100 كم/س) - سريع محمد القاسم", lat: 33.3150, lng: 44.4120, votes: 28),
        CommunityIncident(type: .speedCamera, title: "كاميرا مراقبة سرعة - طريق مطار بغداد الدولي", lat: 33.2750, lng: 44.3000, votes: 41),
        CommunityIncident(type: .speedCamera, title: "كاميرا رادار - سريع الدورة", lat: 33.2550, lng: 44.3950, votes: 19),
        CommunityIncident(type: .checkpoint, title: "سيطرة الصقور - مدخل بغداد الغربي", lat: 33.2680, lng: 44.2050, votes: 35),
        CommunityIncident(type: .checkpoint, title: "سيطرة الشعب - مدخل بغداد الشمالي", lat: 33.4210, lng: 44.3890, votes: 24),
        CommunityIncident(type: .roadwork, title: "أعمال إكساء وتطوير - مجسر ونفق الفنون الجميلة", lat: 33.3480, lng: 44.3880, votes: 12),
        CommunityIncident(type: .trafficJam, title: "حركة بطيئة - تقاطع ساحة النسور", lat: 33.3050, lng: 44.3620, votes: 15)
    ]
    
    @Published public var incidents: [CommunityIncident] = initialBaghdadIncidents
    @Published public var nearbyAlert: CommunityIncident?
    
    public var serverBaseURL: String {
        return AppConfig.backendBaseURL
    }
    private var pollTimer: Timer?
    
    public init() {
        loadLocalPersistedIncidents()
        fetchLiveIncidents()
        startPolling()
    }
    
    private func startPolling() {
        pollTimer = Timer.scheduledTimer(withTimeInterval: 25.0, repeats: true) { [weak self] _ in
            self?.fetchLiveIncidents()
        }
    }
    
    private func loadLocalPersistedIncidents() {
        if let data = UserDefaults.standard.data(forKey: "duldul_local_incidents"),
           let saved = try? JSONDecoder().decode([CommunityIncident].self, from: data), !saved.isEmpty {
            self.incidents.insert(contentsOf: saved, at: 0)
        }
    }
    
    private func persistIncidentLocally(_ incident: CommunityIncident) {
        var saved: [CommunityIncident] = []
        if let data = UserDefaults.standard.data(forKey: "duldul_local_incidents"),
           let existing = try? JSONDecoder().decode([CommunityIncident].self, from: data) {
            saved = existing
        }
        saved.insert(incident, at: 0)
        if let encoded = try? JSONEncoder().encode(saved) {
            UserDefaults.standard.set(encoded, forKey: "duldul_local_incidents")
        }
    }
    
    public func fetchLiveIncidents() {
        guard let url = URL(string: "\(serverBaseURL)/api/incidents") else { return }
        
        URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            guard let self = self, let data = data, error == nil else { return }
            do {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let rawList = json["incidents"] as? [[String: Any]] {
                    
                    let parsed: [CommunityIncident] = rawList.compactMap { dict in
                        guard let typeStr = dict["type"] as? String,
                              let type = IncidentType(rawValue: typeStr),
                              let title = dict["title"] as? String,
                              let lat = dict["lat"] as? Double,
                              let lng = dict["lng"] as? Double else { return nil }
                        
                        let votes = (dict["votes"] as? Int) ?? 1
                        return CommunityIncident(type: type, title: title, lat: lat, lng: lng, votes: votes)
                    }
                    
                    if !parsed.isEmpty {
                        DispatchQueue.main.async {
                            // Merge with existing
                            var merged = self.incidents
                            for p in parsed {
                                if !merged.contains(where: { $0.id == p.id }) {
                                    merged.append(p)
                                }
                            }
                            self.incidents = merged
                        }
                    }
                }
            } catch {
                print("[IncidentManager] Parse error: \(error)")
            }
        }.resume()
    }
    
    public func reportIncident(type: IncidentType, title: String, userLocation: CLLocationCoordinate2D?) {
        guard let location = userLocation ?? CLLocationCoordinate2D(latitude: 33.3152, longitude: 44.3661) as CLLocationCoordinate2D? else {
            return
        }
        let lat = location.latitude
        let lng = location.longitude
        
        let newIncident = CommunityIncident(type: type, title: title, lat: lat, lng: lng)
        DispatchQueue.main.async {
            self.incidents.insert(newIncident, at: 0)
            self.persistIncidentLocally(newIncident)
        }
        
        guard let url = URL(string: "\(serverBaseURL)/api/incidents") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let sessionId = UserDefaults.standard.string(forKey: "duldul_anonymous_session_id") ?? UUID().uuidString
        let payload: [String: Any] = [
            "type": type.rawValue,
            "title": title,
            "lat": lat,
            "lng": lng,
            "sessionId": sessionId
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)
        URLSession.shared.dataTask(with: request) { _, _, _ in }.resume()
    }
    
    public func voteIncident(id: String, upvote: Bool) {
        if let idx = incidents.firstIndex(where: { $0.id == id }) {
            incidents[idx].votes += (upvote ? 1 : -1)
        }
        
        guard let url = URL(string: "\(serverBaseURL)/api/incidents/\(id)/vote") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let sessionId = UserDefaults.standard.string(forKey: "duldul_anonymous_session_id") ?? UUID().uuidString
        let payload: [String: Any] = ["upvote": upvote, "sessionId": sessionId]
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)
        URLSession.shared.dataTask(with: request) { _, _, _ in }.resume()
    }
    
    public func evaluateProximityToHazards(userLocation: CLLocationCoordinate2D) {
        let userLoc = CLLocation(latitude: userLocation.latitude, longitude: userLocation.longitude)
        
        for inc in incidents {
            let incLoc = CLLocation(latitude: inc.lat, longitude: inc.lng)
            let distance = userLoc.distance(from: incLoc)
            
            if distance <= 400.0 {
                if nearbyAlert?.id != inc.id {
                    DispatchQueue.main.async {
                        self.nearbyAlert = inc
                        AudioServicesPlaySystemSound(1005)
                        AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
                    }
                }
                return
            }
        }
        
        if nearbyAlert != nil {
            DispatchQueue.main.async {
                self.nearbyAlert = nil
            }
        }
    }
}
