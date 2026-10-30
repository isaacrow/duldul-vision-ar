import Foundation
import CoreLocation
import Combine
import MapKit

public struct PlaceSearchResult: Identifiable, Codable {
    public let id: String
    public let nameArabic: String
    public let nameEnglish: String
    public let city: String
    public let category: String
    public let lat: Double
    public let lng: Double
    public let source: String
    
    public var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }
}

public class PlacesSearchService: ObservableObject {
    @Published public var searchResults: [PlaceSearchResult] = []
    @Published public var isSearching: Bool = false
    @Published public var selectedPlace: PlaceSearchResult?
    
    private var cancellables = Set<AnyCancellable>()
    private let querySubject = PassthroughSubject<String, Never>()
    
    public init() {
        setupDebouncedSearch()
    }
    
    private func setupDebouncedSearch() {
        querySubject
            .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
            .removeDuplicates()
            .sink { [weak self] query in
                self?.executeSearch(query: query)
            }
            .store(in: &cancellables)
    }
    
    public func updateQuery(_ query: String) {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty {
            searchResults = []
            isSearching = false
            return
        }
        isSearching = true
        querySubject.send(trimmed)
    }
    
    private func executeSearch(query: String) {
        guard !query.isEmpty else {
            self.searchResults = []
            self.isSearching = false
            return
        }
        
        let dispatchGroup = DispatchGroup()
        var combinedResults: [PlaceSearchResult] = []
        let syncQueue = DispatchQueue(label: "com.duldul.search.sync")
        
        // 1. Native Apple Maps MKLocalSearch (Works 100% on-device in Iraq)
        dispatchGroup.enter()
        let localSearchReq = MKLocalSearch.Request()
        localSearchReq.naturalLanguageQuery = query
        localSearchReq.region = MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 33.3152, longitude: 44.3661),
            span: MKCoordinateSpan(latitudeDelta: 3.5, longitudeDelta: 3.5)
        )
        let localSearch = MKLocalSearch(request: localSearchReq)
        localSearch.start { response, error in
            defer { dispatchGroup.leave() }
            if let items = response?.mapItems {
                let parsed: [PlaceSearchResult] = items.compactMap { item in
                    guard let name = item.name else { return nil }
                    let coord = item.placemark.coordinate
                    let city = item.placemark.locality ?? item.placemark.administrativeArea ?? "العراق"
                    return PlaceSearchResult(
                        id: "mk_\(coord.latitude)_\(coord.longitude)",
                        nameArabic: name,
                        nameEnglish: item.phoneNumber ?? name,
                        city: city,
                        category: item.pointOfInterestCategory?.rawValue ?? "موقع",
                        lat: coord.latitude,
                        lng: coord.longitude,
                        source: "Apple Maps"
                    )
                }
                syncQueue.async {
                    combinedResults.append(contentsOf: parsed)
                }
            }
        }
        
        // 2. OpenStreetMap Photon Public Geocoder API
        if let encoded = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
           let photonURL = URL(string: "https://photon.komoot.io/api/?q=\(encoded)&lat=33.3152&lon=44.3661&limit=15") {
            dispatchGroup.enter()
            URLSession.shared.dataTask(with: photonURL) { data, _, error in
                defer { dispatchGroup.leave() }
                guard let data = data, error == nil else { return }
                do {
                    if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let features = json["features"] as? [[String: Any]] {
                        let parsed: [PlaceSearchResult] = features.compactMap { feat in
                            guard let geom = feat["geometry"] as? [String: Any],
                                  let coords = geom["coordinates"] as? [Double],
                                  coords.count >= 2,
                                  let props = feat["properties"] as? [String: Any] else { return nil }
                            
                            let name = (props["name"] as? String) ?? (props["street"] as? String) ?? query
                            let city = (props["city"] as? String) ?? (props["state"] as? String) ?? "العراق"
                            let cat = (props["osm_value"] as? String) ?? "معلم"
                            let osmId = (props["osm_id"] as? Int).map(String.init) ?? UUID().uuidString
                            
                            return PlaceSearchResult(
                                id: "osm_\(osmId)",
                                nameArabic: name,
                                nameEnglish: (props["name:en"] as? String) ?? name,
                                city: city,
                                category: cat,
                                lat: coords[1],
                                lng: coords[0],
                                source: "OpenStreetMap"
                            )
                        }
                        syncQueue.async {
                            combinedResults.append(contentsOf: parsed)
                        }
                    }
                } catch {
                    print("[PlacesSearchService] Photon decode error: \(error)")
                }
            }.resume()
        }
        
        // 3. Finalize & Publish Deduplicated Results
        dispatchGroup.notify(queue: DispatchQueue.main) { [weak self] in
            guard let self = self else { return }
            self.isSearching = false
            
            // Deduplicate by normalized name
            var seen = Set<String>()
            var unique: [PlaceSearchResult] = []
            for item in combinedResults {
                let norm = item.nameArabic.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
                if !seen.contains(norm) {
                    seen.insert(norm)
                    unique.append(item)
                }
            }
            self.searchResults = unique
        }
    }
}
