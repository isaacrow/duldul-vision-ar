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
    public let votes: Int
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
    @Published public var incidents: [CommunityIncident] = []
    @Published public var nearbyAlert: CommunityIncident?
    
    public var serverBaseURL: String = "https://performances-revolutionary-webcams-regarded.trycloudflare.com"
    private var pollTimer: Timer?
    
    public init() {
        loadSeedIncidents()
        startPolling()
    }
    
    private func loadSeedIncidents() {
        incidents = [
            CommunityIncident(type: .checkpoint, title: "سيطرة مدخل الجادرية", lat: 33.2785, lng: 44.3820, votes: 14),
            CommunityIncident(type: .speedCamera, title: "كاميرا رادار طريق المطار", lat: 33.2650, lng: 44.2980, votes: 28),
            CommunityIncident(type: .trafficJam, title: "ازدحام خانق عند جسر الجادرية", lat: 33.2840, lng: 44.3810, votes: 9),
            CommunityIncident(type: .accident, title: "حادث مروري على سريع محمد القاسم", lat: 33.3250, lng: 44.4150, votes: 6),
            CommunityIncident(type: .roadwork, title: "أعمال صيانة شارع فلسطين", lat: 33.3480, lng: 44.4250, votes: 12)
        ]
    }
    
    private func startPolling() {
        pollTimer = Timer.scheduledTimer(withTimeInterval: 25.0, repeats: true) { [weak self] _ in
            self?.fetchLiveIncidents()
        }
        fetchLiveIncidents()
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
                            self.incidents = parsed
                        }
                    }
                }
            } catch {
                print("[IncidentManager] Parse error: \(error)")
            }
        }.resume()
    }
    
    public func reportIncident(type: IncidentType, title: String, userLocation: CLLocationCoordinate2D?) {
        let lat = userLocation?.latitude ?? 33.3152
        let lng = userLocation?.longitude ?? 44.3661
        
        let newIncident = CommunityIncident(type: type, title: title, lat: lat, lng: lng)
        DispatchQueue.main.async {
            self.incidents.insert(newIncident, at: 0)
        }
        
        guard let url = URL(string: "\(serverBaseURL)/api/incidents") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let payload: [String: Any] = [
            "type": type.rawValue,
            "title": title,
            "lat": lat,
            "lng": lng
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
            URLSession.shared.dataTask(with: request) { _, _, _ in }.resume()
        } catch {}
    }
    
    // Check if user is near an active hazard (within 500 meters)
    public func checkProximityAlerts(userLocation: CLLocation) {
        for incident in incidents {
            let loc = CLLocation(latitude: incident.lat, longitude: incident.lng)
            let distance = userLocation.distance(from: loc)
            if distance <= 450 {
                DispatchQueue.main.async {
                    if self.nearbyAlert?.id != incident.id {
                        self.nearbyAlert = incident
                        // Play alert sound
                        AudioServicesPlaySystemSound(1005)
                    }
                }
                return
            }
        }
        DispatchQueue.main.async {
            self.nearbyAlert = nil
        }
    }
}
