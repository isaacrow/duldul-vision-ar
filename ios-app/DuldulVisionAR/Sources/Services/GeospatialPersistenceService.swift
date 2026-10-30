import Foundation
import Combine

/// Local Persistence Manager for Duldul Geographic AR Experiences & Studio Placements
public class GeospatialPersistenceService: ObservableObject {
    @Published public var savedPlacements: [GeospatialPlacementModel] = []
    
    private let fileName = "duldul_geospatial_placements_v2.json"
    
    public init() {
        loadPlacements()
    }
    
    private var fileURL: URL {
        let paths = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)
        let dir = paths[0].appendingPathComponent("DuldulVisionAR", isDirectory: true)
        
        if !FileManager.default.fileExists(atPath: dir.path) {
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true, attributes: nil)
        }
        return dir.appendingPathComponent(fileName)
    }
    
    // MARK: - Load Placements
    public func loadPlacements() {
        let url = fileURL
        if let data = try? Data(contentsOf: url),
           let decoded = try? JSONDecoder().decode([GeospatialPlacementModel].self, from: data) {
            self.savedPlacements = decoded
        } else {
            // Seed initial verified Iraqi AR experiences
            seedDefaultExperiences()
        }
    }
    
    // MARK: - Seed Curated Pre-Placements
    private func seedDefaultExperiences() {
        let defaults: [GeospatialPlacementModel] = [
            GeospatialPlacementModel(
                id: "seed-babylon-lion",
                title: "أسد بابل الأثري",
                titleArabic: "نصب أسد بابل الحجري",
                latitude: 32.5435,
                longitude: 44.4225,
                altitude: 27.0,
                heading: 45.0,
                scale: 1.0,
                geographicAnchorId: "geo-anchor-babylon-01",
                assetId: "model-lion-babylon",
                positioningAccuracy: 1.5,
                altitudeUncertainty: 0.8,
                headingUncertainty: 3.0,
                creationTimestamp: Date(),
                dataProvenance: "مسح بابل الأثري الميداني",
                verificationStatus: .physicallyVerified,
                positioningMode: .modeBGeographicFallbackENU,
                notes: "تم التحقق من الإحداثيات عند قاعدة التمثال الأصلية في المدينة الأثرية."
            ),
            GeospatialPlacementModel(
                id: "seed-tahrir-relief",
                title: "إفريز نصب التحرير",
                titleArabic: "جدارية جواد سليم البرونزية",
                latitude: 33.3283,
                longitude: 44.4093,
                altitude: 34.0,
                heading: 270.0,
                scale: 0.8,
                geographicAnchorId: "geo-anchor-tahrir-01",
                assetId: "model-freedom-monument",
                positioningAccuracy: 2.0,
                altitudeUncertainty: 1.2,
                headingUncertainty: 4.0,
                creationTimestamp: Date(),
                dataProvenance: "أرشيف بلدية بغداد",
                verificationStatus: .physicallyVerified,
                positioningMode: .modeBGeographicFallbackENU,
                notes: "الجدارية في ساحة التحرير موجهة غرباً نحو جسر الجمهورية."
            ),
            GeospatialPlacementModel(
                id: "seed-ur-ziggurat",
                title: "زقورة أور السومرية",
                titleArabic: "صرح الزقورة الملكي",
                latitude: 30.9628,
                longitude: 46.1031,
                altitude: 6.0,
                heading: 0.0,
                scale: 0.5,
                geographicAnchorId: "geo-anchor-ur-01",
                assetId: "model-ziggurat-ur",
                positioningAccuracy: 1.0,
                altitudeUncertainty: 0.5,
                headingUncertainty: 2.0,
                creationTimestamp: Date(),
                dataProvenance: "مسح الناصرية الرقمي",
                verificationStatus: .physicallyVerified,
                positioningMode: .modeBGeographicFallbackENU,
                notes: "الزاوية الشمالية موجهة نحو الشمال المغناطيسي الدقيق."
            )
        ]
        
        self.savedPlacements = defaults
        persistToDisk()
    }
    
    // MARK: - Save or Add New Placement
    public func savePlacement(_ placement: GeospatialPlacementModel) {
        if let index = savedPlacements.firstIndex(where: { $0.id == placement.id }) {
            savedPlacements[index] = placement
        } else {
            savedPlacements.insert(placement, at: 0)
        }
        persistToDisk()
    }
    
    // MARK: - Delete Placement
    public func deletePlacement(byId id: String) {
        savedPlacements.removeAll { $0.id == id }
        persistToDisk()
    }
    
    // MARK: - Mark as Physically Verified on Site
    public func markAsPhysicallyVerified(id: String, accuracy: Double) {
        if let index = savedPlacements.firstIndex(where: { $0.id == id }) {
            var item = savedPlacements[index]
            item.verificationStatus = .physicallyVerified
            item.positioningAccuracy = accuracy
            item.notes = (item.notes ?? "") + " • تم التحقق الميداني عبر كاميرا دلدل بنجاح."
            savedPlacements[index] = item
            persistToDisk()
        }
    }
    
    // MARK: - Write to Disk
    private func persistToDisk() {
        let url = fileURL
        do {
            let data = try JSONEncoder().encode(savedPlacements)
            try data.write(to: url, options: [.atomicWrite])
        } catch {
            print("[GeospatialPersistenceService] Write error: \(error.localizedDescription)")
        }
    }
    
    // MARK: - Export and Import
    public func exportPlacementsJSON() -> String? {
        guard let data = try? JSONEncoder().encode(savedPlacements) else { return nil }
        return String(data: data, encoding: .utf8)
    }
    
    public func importPlacements(from jsonString: String) -> Bool {
        guard let data = jsonString.data(using: .utf8),
              let list = try? JSONDecoder().decode([GeospatialPlacementModel].self, from: data) else {
            return false
        }
        self.savedPlacements = list
        persistToDisk()
        return true
    }
}
