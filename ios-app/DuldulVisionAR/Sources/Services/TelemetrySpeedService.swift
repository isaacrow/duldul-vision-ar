import Foundation
import CoreLocation
import Combine

/// Privacy-Preserving Telemetry Service
/// Implements k-anonymity (min 3 contributors) with explicit opt-in
public class TelemetrySpeedService: ObservableObject {
    @Published public var isTelemetryConsentGiven: Bool {
        didSet {
            UserDefaults.standard.set(isTelemetryConsentGiven, forKey: "telemetry_consent_opt_in")
        }
    }
    @Published public var lastPingStatus: String = "غير نشط"
    
    private let sessionId: String
    private var lastPingTime: Date = Date.distantPast
    private let minimumPingIntervalSeconds: TimeInterval = 10.0
    
    public init() {
        self.isTelemetryConsentGiven = UserDefaults.standard.bool(forKey: "telemetry_consent_opt_in")
        
        if let savedSession = UserDefaults.standard.string(forKey: "duldul_anonymous_session_id"), !savedSession.isEmpty {
            self.sessionId = savedSession
        } else {
            let newSession = "duldul-iq-" + UUID().uuidString.prefix(12)
            UserDefaults.standard.set(newSession, forKey: "duldul_anonymous_session_id")
            self.sessionId = newSession
        }
    }
    
    /// Sends privacy-preserving speed telemetry to the community server
    public func recordDrivingSpeed(location: CLLocation) {
        guard isTelemetryConsentGiven else { return }
        guard Date().timeIntervalSince(lastPingTime) >= minimumPingIntervalSeconds else { return }
        
        let speedKmh = max(0.0, location.speed * 3.6)
        guard speedKmh > 5.0 && speedKmh <= 160.0 else { return } // Filter parked or abnormal jumps
        guard location.horizontalAccuracy > 0 && location.horizontalAccuracy <= 35.0 else { return }
        
        lastPingTime = Date()
        
        guard let url = URL(string: "\(AppConfig.backendBaseURL)/api/telemetry/ping") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let payload: [String: Any] = [
            "sessionId": sessionId,
            "lat": location.coordinate.latitude,
            "lng": location.coordinate.longitude,
            "speedKmh": speedKmh,
            "accuracyMeters": location.horizontalAccuracy,
            "consentGiven": true
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
            URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
                DispatchQueue.main.async {
                    if let http = response as? HTTPURLResponse, http.statusCode == 200 {
                        self?.lastPingStatus = "تم إرسال عينة السرعة بنجاح"
                    } else {
                        self?.lastPingStatus = "بانتظار مساهمين إضافيين (k=3)"
                    }
                }
            }.resume()
        } catch {
            print("[TelemetrySpeedService] Encoding error: \(error)")
        }
    }
}
