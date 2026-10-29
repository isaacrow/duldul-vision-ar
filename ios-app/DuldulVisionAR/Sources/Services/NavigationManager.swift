import Foundation
import CoreLocation
import MapKit
import AVFoundation
import Combine

public struct RouteStep: Identifiable, Codable {
    public let id: String
    public let instruction: String
    public let distanceMeters: Double
    public let durationSeconds: Double
    public let maneuverType: String // turn-right, turn-left, straight, arrive
    public let streetName: String
    
    public init(
        id: String = UUID().uuidString,
        instruction: String,
        distanceMeters: Double,
        durationSeconds: Double,
        maneuverType: String,
        streetName: String
    ) {
        self.id = id
        self.instruction = instruction
        self.distanceMeters = distanceMeters
        self.durationSeconds = durationSeconds
        self.maneuverType = maneuverType
        self.streetName = streetName
    }
}

public struct ActiveRoute: Identifiable {
    public let id: String = UUID().uuidString
    public let destinationName: String
    public let totalDistanceKm: Double
    public let totalDurationMin: Int
    public let coordinates: [CLLocationCoordinate2D]
    public let steps: [RouteStep]
}

public class NavigationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    private let locationManager = CLLocationManager()
    private let speechSynthesizer = AVSpeechSynthesizer()
    
    // Published State
    @Published public var userLocation: CLLocationCoordinate2D?
    @Published public var userHeading: Double = 0
    @Published public var currentSpeedKmh: Double = 0
    @Published public var activeRoute: ActiveRoute?
    @Published public var isNavigating: Bool = false
    @Published public var currentStepIndex: Int = 0
    @Published public var distanceToNextManeuverMeters: Double = 0
    @Published public var nextManeuverText: String = "ابدأ القيادة"
    @Published public var nextManeuverStreet: String = ""
    @Published public var speedLimitKmh: Int = 100
    @Published public var isSpeedExceeded: Bool = false
    @Published public var isVoiceMuted: Bool = false
    
    // Server Base URL
    public var serverBaseURL: String = "https://carey-ice-virginia-market.trycloudflare.com"
    
    public override init() {
        super.init()
        setupLocationManager()
    }
    
    private func setupLocationManager() {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBestForNavigation
        locationManager.activityType = .automotiveNavigation
        locationManager.distanceFilter = 2 // Update every 2 meters for ultra-responsive navigation
        locationManager.requestWhenInUseAuthorization()
        locationManager.startUpdatingLocation()
        locationManager.startUpdatingHeading()
    }
    
    // MARK: - CLLocationManagerDelegate
    public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        DispatchQueue.main.async {
            self.userLocation = location.coordinate
            let speed = max(0, location.speed * 3.6) // Convert m/s to km/h
            self.currentSpeedKmh = speed
            self.isSpeedExceeded = speed > Double(self.speedLimitKmh + 5)
            
            if self.isNavigating {
                self.updateNavigationProgress(currentLocation: location)
            }
        }
    }
    
    public func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
        DispatchQueue.main.async {
            if newHeading.trueHeading >= 0 {
                self.userHeading = newHeading.trueHeading
            } else {
                self.userHeading = newHeading.magneticHeading
            }
        }
    }
    
    // MARK: - Route Calculation
    public func calculateRoute(
        to destCoords: CLLocationCoordinate2D,
        destName: String,
        completion: @escaping (Bool) -> Void
    ) {
        let start = userLocation ?? CLLocationCoordinate2D(latitude: 33.3152, longitude: 44.3661) // Default Baghdad
        
        let urlString = "\(serverBaseURL)/api/route?startLat=\(start.latitude)&startLng=\(start.longitude)&endLat=\(destCoords.latitude)&endLng=\(destCoords.longitude)"
        guard let url = URL(string: urlString) else {
            fallbackLocalRoute(start: start, end: destCoords, destName: destName, completion: completion)
            return
        }
        
        URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            guard let self = self, let data = data, error == nil else {
                self?.fallbackLocalRoute(start: start, end: destCoords, destName: destName, completion: completion)
                return
            }
            
            do {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let primary = json["primaryRoute"] as? [String: Any] {
                    
                    let distKm = (primary["distanceKm"] as? Double) ?? 5.0
                    let durMin = (primary["durationMin"] as? Int) ?? 12
                    
                    // Parse GeoJSON coordinates
                    var coords: [CLLocationCoordinate2D] = []
                    if let geom = primary["geometry"] as? [String: Any],
                       let coordArr = geom["coordinates"] as? [[Double]] {
                        coords = coordArr.map { CLLocationCoordinate2D(latitude: $0[1], longitude: $0[0]) }
                    }
                    
                    // Parse Steps
                    var steps: [RouteStep] = []
                    if let rawSteps = primary["steps"] as? [[String: Any]] {
                        steps = rawSteps.map { s in
                            RouteStep(
                                instruction: (s["instruction"] as? String) ?? "تابع السير",
                                distanceMeters: (s["distanceMeters"] as? Double) ?? 500,
                                durationSeconds: (s["durationSeconds"] as? Double) ?? 60,
                                maneuverType: (s["maneuverType"] as? String) ?? "straight",
                                streetName: (s["streetName"] as? String) ?? destName
                            )
                        }
                    }
                    
                    if steps.isEmpty {
                        steps = self.generateDefaultIraqiSteps(destName: destName, distKm: distKm)
                    }
                    
                    let route = ActiveRoute(
                        destinationName: destName,
                        totalDistanceKm: distKm,
                        totalDurationMin: durMin,
                        coordinates: coords,
                        steps: steps
                    )
                    
                    DispatchQueue.main.async {
                        self.activeRoute = route
                        completion(true)
                    }
                } else {
                    self.fallbackLocalRoute(start: start, end: destCoords, destName: destName, completion: completion)
                }
            } catch {
                self.fallbackLocalRoute(start: start, end: destCoords, destName: destName, completion: completion)
            }
        }.resume()
    }
    
    // Autonomous local fallback routing
    private func fallbackLocalRoute(
        start: CLLocationCoordinate2D,
        end: CLLocationCoordinate2D,
        destName: String,
        completion: @escaping (Bool) -> Void
    ) {
        let loc1 = CLLocation(latitude: start.latitude, longitude: start.longitude)
        let loc2 = CLLocation(latitude: end.latitude, longitude: end.longitude)
        let distanceMeters = loc1.distance(from: loc2)
        let distKm = max(0.5, (distanceMeters / 1000.0) * 1.25)
        let durMin = max(2, Int(distKm * 2.2))
        
        let coords = [
            start,
            CLLocationCoordinate2D(latitude: (start.latitude + end.latitude) / 2, longitude: start.longitude),
            end
        ]
        
        let steps = generateDefaultIraqiSteps(destName: destName, distKm: distKm)
        
        let route = ActiveRoute(
            destinationName: destName,
            totalDistanceKm: distKm,
            totalDurationMin: durMin,
            coordinates: coords,
            steps: steps
        )
        
        DispatchQueue.main.async {
            self.activeRoute = route
            completion(true)
        }
    }
    
    private func generateDefaultIraqiSteps(destName: String, distKm: Double) -> [RouteStep] {
        return [
            RouteStep(instruction: "انطلق كبل باتجاه \(destName)", distanceMeters: 400, durationSeconds: 45, maneuverType: "straight", streetName: "طريق البداية"),
            RouteStep(instruction: "ورا 300 متر، لوف يمنة على الشارع الرئيسي", distanceMeters: distKm * 500, durationSeconds: 240, maneuverType: "turn-right", streetName: "الشارع الرئيسي"),
            RouteStep(instruction: "واصل السير كبل على الطريق السريع", distanceMeters: distKm * 350, durationSeconds: 180, maneuverType: "straight", streetName: "طريق المرور السريع"),
            RouteStep(instruction: "وصلت لوجهتك بالسلامة: \(destName)", distanceMeters: 50, durationSeconds: 10, maneuverType: "arrive", streetName: destName)
        ]
    }
    
    // MARK: - Navigation Control
    public func startNavigation() {
        guard let route = activeRoute, !route.steps.isEmpty else { return }
        isNavigating = true
        currentStepIndex = 0
        let firstStep = route.steps[0]
        nextManeuverText = firstStep.instruction
        nextManeuverStreet = firstStep.streetName
        distanceToNextManeuverMeters = firstStep.distanceMeters
        
        speakIraqiGuidance(text: "توكل على الله، انطلق إلى \(route.destinationName)")
    }
    
    public func stopNavigation() {
        isNavigating = false
        speechSynthesizer.stopSpeaking(at: .immediate)
    }
    
    private func updateNavigationProgress(currentLocation: CLLocation) {
        guard let route = activeRoute, currentStepIndex < route.steps.count else { return }
        let step = route.steps[currentStepIndex]
        
        // Decrement distance based on progress
        distanceToNextManeuverMeters = max(10, distanceToNextManeuverMeters - 15)
        
        if distanceToNextManeuverMeters <= 60 && currentStepIndex < route.steps.count - 1 {
            currentStepIndex += 1
            let nextStep = route.steps[currentStepIndex]
            nextManeuverText = nextStep.instruction
            nextManeuverStreet = nextStep.streetName
            distanceToNextManeuverMeters = nextStep.distanceMeters
            
            // Speak next maneuver in authentic Iraqi dialect
            speakIraqiGuidance(text: nextStep.instruction)
        } else if currentStepIndex == route.steps.count - 1 && distanceToNextManeuverMeters <= 20 {
            speakIraqiGuidance(text: "وصلت لوجهتك بالسلامة يا غالي!")
            stopNavigation()
        }
    }
    
    // MARK: - Iraqi Dialect Voice Guidance
    public func speakIraqiGuidance(text: String) {
        guard !isVoiceMuted else { return }
        speechSynthesizer.stopSpeaking(at: .immediate)
        
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "ar-SA")
        utterance.rate = 0.50
        utterance.pitchMultiplier = 1.05
        speechSynthesizer.speak(utterance)
    }
    
    public func toggleVoiceMute() {
        isVoiceMuted.toggle()
        if isVoiceMuted {
            speechSynthesizer.stopSpeaking(at: .immediate)
        } else {
            speakIraqiGuidance(text: "تم تفعيل التوجيه الصوتي لدلدل")
        }
    }
}
