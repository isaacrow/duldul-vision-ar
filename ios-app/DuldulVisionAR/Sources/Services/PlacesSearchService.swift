import Foundation
import CoreLocation
import Combine

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
    
    private var searchCancellable: AnyCancellable?
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
    
    private var cancellables = Set<AnyCancellable>()
    
    public func updateQuery(_ query: String) {
        if query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            searchResults = []
            isSearching = false
            return
        }
        isSearching = true
        querySubject.send(query)
    }
    
    private func executeSearch(query: String) {
        guard let encoded = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let url = URL(string: "\(AppConfig.backendBaseURL)/api/places?q=\(encoded)&limit=25") else {
            isSearching = false
            return
        }
        
        URLSession.shared.dataTask(with: url) { [weak self] data, _, error in
            DispatchQueue.main.async {
                self?.isSearching = false
                guard let self = self, let data = data, error == nil else { return }
                
                do {
                    if let rawArray = try JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
                        let parsed: [PlaceSearchResult] = rawArray.compactMap { d in
                            guard let id = (d["id"] as? String) ?? (d["id"] as? Int).map(String.init),
                                  let nameAr = (d["name_ar"] as? String) ?? (d["name"] as? String),
                                  let lat = d["lat"] as? Double,
                                  let lng = d["lng"] as? Double else { return nil }
                            
                            let nameEn = (d["name_en"] as? String) ?? nameAr
                            let city = (d["city"] as? String) ?? "العراق"
                            let cat = (d["category"] as? String) ?? "معلم"
                            let source = (d["source"] as? String) ?? "OpenStreetMap"
                            
                            return PlaceSearchResult(
                                id: id,
                                nameArabic: nameAr,
                                nameEnglish: nameEn,
                                city: city,
                                category: cat,
                                lat: lat,
                                lng: lng,
                                source: source
                            )
                        }
                        self.searchResults = parsed
                    }
                } catch {
                    print("[PlacesSearchService] Search decode error: \(error)")
                }
            }
        }.resume()
    }
}
