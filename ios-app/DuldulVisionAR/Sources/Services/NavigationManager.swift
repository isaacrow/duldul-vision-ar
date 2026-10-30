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
    @Published public var snappedLocation: CLLocationCoordinate2D?
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
    @Published public var isRerouting: Bool = false
    
    private var lastSpokenInstruction: String = ""
    private var lastRerouteTimestamp: Date = Date.distantPast
    
    // Server Base URL
    public var serverBaseURL: String {
        return AppConfig.backendBaseURL
    }
    
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
        guard let start = userLocation else {
            print("[NavigationManager] Cannot calculate route without active GPS user location.")
            completion(false)
            return
        }
        
        let urlString = "\(serverBaseURL)/api/route?startLat=\(start.latitude)&startLng=\(start.longitude)&endLat=\(destCoords.latitude)&endLng=\(destCoords.longitude)"
        guard let url = URL(string: urlString) else {
            completion(false)
            return
        }
        
        URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            guard let self = self, let data = data, error == nil else {
                DispatchQueue.main.async { completion(false) }
                return
            }
            
            do {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let primary = json["primaryRoute"] as? [String: Any] {
                    
                    let distKm = (primary["distanceKm"] as? Double) ?? 0.0
                    let durMin = (primary["durationMin"] as? Int) ?? 0
                    
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
                                distanceMeters: (s["distanceMeters"] as? Double) ?? 0,
                                durationSeconds: (s["durationSeconds"] as? Double) ?? 0,
                                maneuverType: (s["maneuverType"] as? String) ?? "straight",
                                streetName: (s["streetName"] as? String) ?? destName
                            )
                        }
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
                    DispatchQueue.main.async { completion(false) }
                }
            } catch {
                DispatchQueue.main.async { completion(false) }
            }
        }.resume()
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
        guard let route = activeRoute, !route.coordinates.isEmpty, currentStepIndex < route.steps.count else { return }
        
        // 1. Calculate Real Snapped Position on Route Geometry
        let rawCoord = currentLocation.coordinate
        let snapResult = snapCoordinateToRoute(coord: rawCoord, polyline: route.coordinates)
        self.snappedLocation = snapResult.snappedCoord
        
        // 2. Off-Route Detection & Auto-Reroute Trigger
        let offRouteDistance = snapResult.distanceMeters
        if offRouteDistance > 45.0 {
            // Diverged more than 45 meters from road centerline
            triggerAutoReroute(currentLocation: currentLocation, destination: route.coordinates.last, destinationName: route.destinationName)
            return
        }
        
        // 3. Real Step Progress Calculation
        let currentStep = route.steps[currentStepIndex]
        let currentStepTarget = getStepTargetCoordinate(stepIndex: currentStepIndex, route: route)
        let locA = CLLocation(latitude: snapResult.snappedCoord.latitude, longitude: snapResult.snappedCoord.longitude)
        let locB = CLLocation(latitude: currentStepTarget.latitude, longitude: currentStepTarget.longitude)
        let distanceToStepManeuver = locA.distance(from: locB)
        self.distanceToNextManeuverMeters = distanceToStepManeuver
        
        // 4. Step Transition and Authentic Iraqi Dialect Voice Delivery
        if distanceToStepManeuver <= 35.0 && currentStepIndex < route.steps.count - 1 {
            currentStepIndex += 1
            let nextStep = route.steps[currentStepIndex]
            nextManeuverText = nextStep.instruction
            nextManeuverStreet = nextStep.streetName
            
            let iraqiInstruction = formatIraqiVoiceInstruction(step: nextStep)
            speakIraqiGuidance(text: iraqiInstruction)
        } else if currentStepIndex == route.steps.count - 1 && distanceToStepManeuver <= 25.0 {
            speakIraqiGuidance(text: "وصلت لوجهتك بالسلامة يا غالي!")
            stopNavigation()
        }
    }
    
    // MARK: - Autonomous Road Snapping Geometry Math
    private struct SnapResult {
        let snappedCoord: CLLocationCoordinate2D
        let distanceMeters: Double
        let segmentIndex: Int
    }
    
    private func snapCoordinateToRoute(coord: CLLocationCoordinate2D, polyline: [CLLocationCoordinate2D]) -> SnapResult {
        guard polyline.count >= 2 else {
            return SnapResult(snappedCoord: coord, distanceMeters: 0, segmentIndex: 0)
        }
        
        var minDistance = Double.infinity
        var closestCoord = polyline[0]
        var closestSegment = 0
        
        let p = CLLocation(latitude: coord.latitude, longitude: coord.longitude)
        
        for i in 0..<(polyline.count - 1) {
            let a = polyline[i]
            let b = polyline[i + 1]
            
            let projected = projectPointOnSegment(point: coord, segA: a, segB: b)
            let projLoc = CLLocation(latitude: projected.latitude, longitude: projected.longitude)
            let dist = p.distance(from: projLoc)
            
            if dist < minDistance {
                minDistance = dist
                closestCoord = projected
                closestSegment = i
            }
        }
        
        return SnapResult(snappedCoord: closestCoord, distanceMeters: minDistance, segmentIndex: closestSegment)
    }
    
    private func projectPointOnSegment(
        point: CLLocationCoordinate2D,
        segA: CLLocationCoordinate2D,
        segB: CLLocationCoordinate2D
    ) -> CLLocationCoordinate2D {
        let dx = segB.longitude - segA.longitude
        let dy = segB.latitude - segA.latitude
        
        if dx == 0 && dy == 0 {
            return segA
        }
        
        let t = max(0, min(1, ((point.longitude - segA.longitude) * dx + (point.latitude - segA.latitude) * dy) / (dx * dx + dy * dy)))
        return CLLocationCoordinate2D(
            latitude: segA.latitude + t * dy,
            longitude: segA.longitude + t * dx
        )
    }
    
    private func getStepTargetCoordinate(stepIndex: Int, route: ActiveRoute) -> CLLocationCoordinate2D {
        guard !route.coordinates.isEmpty else { return CLLocationCoordinate2D(latitude: 0, longitude: 0) }
        let fraction = Double(stepIndex + 1) / Double(max(1, route.steps.count))
        let targetIndex = min(route.coordinates.count - 1, Int(fraction * Double(route.coordinates.count - 1)))
        return route.coordinates[targetIndex]
    }
    
    // MARK: - Auto-Reroute Engine
    private func triggerAutoReroute(currentLocation: CLLocation, destination: CLLocationCoordinate2D?, destinationName: String) {
        guard let dest = destination else { return }
        guard Date().timeIntervalSince(lastRerouteTimestamp) > 8.0 else { return } // Debounce reroutes
        
        lastRerouteTimestamp = Date()
        isRerouting = true
        speakIraqiGuidance(text: "جاي نعيد حساب الطريق...")
        
        calculateRoute(to: dest, destName: destinationName) { [weak self] success in
            self?.isRerouting = false
            if success {
                self?.speakIraqiGuidance(text: "تم تحديث المسار، كمل كبل")
            }
        }
    }
    
    // MARK: - Authentic Iraqi Dialect Speech Formatting
    private func formatIraqiVoiceInstruction(step: RouteStep) -> String {
        let street = step.streetName.isEmpty ? "الشارع" : step.streetName
        let dist = Int(step.distanceMeters)
        
        switch step.maneuverType {
        case "turn-right":
            return dist > 50 ? "ورا \(dist) متر، لوف يمنة على \(street)" : "لوف يمنة هسة"
        case "turn-left":
            return dist > 50 ? "ورا \(dist) متر، لوف يسرة على \(street)" : "لوف يسرة هسة"
        case "straight":
            return "واصل السير كبل على \(street)"
        case "roundabout":
            return "ادخل الفلكة وخذ المخرج المناسب"
        case "arrive":
            return "وصلت لوجهتك: \(street)"
        default:
            return step.instruction
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
