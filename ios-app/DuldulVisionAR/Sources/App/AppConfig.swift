import Foundation

public enum AppEnvironment {
    case development
    case staging
    case production
}

public struct AppConfig {
    public static var environment: AppEnvironment = .development
    
    /// The single source of truth for backend API connectivity
    /// Defaults to the active local or configured tunnel endpoint
    public static var backendBaseURL: String {
        get {
            if let custom = UserDefaults.standard.string(forKey: "custom_backend_url"), !custom.isEmpty {
                return custom
            }
            #if DEBUG
            return "http://localhost:3000"
            #else
            return "https://carey-ice-virginia-market.trycloudflare.com"
            #endif
        }
        set {
            UserDefaults.standard.set(newValue, forKey: "custom_backend_url")
        }
    }
    
    public static let mapboxFallbackEnabled: Bool = false
    public static let appVersion: String = "1.1.0"
}
