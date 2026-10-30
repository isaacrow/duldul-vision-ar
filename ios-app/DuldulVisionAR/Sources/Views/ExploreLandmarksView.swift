import SwiftUI
import CoreLocation

/// Historical and Cultural Landmarks Discovery View across Iraq
public struct ExploreLandmarksView: View {
    @EnvironmentObject var landmarksService: IraqLandmarksService
    @EnvironmentObject var persistenceService: GeospatialPersistenceService
    @EnvironmentObject var modelCatalog: USDZModelCatalog
    
    @State private var selectedLandmark: IraqLandmarkItem? = nil
    @State private var showStudioForLandmark: IraqLandmarkItem? = nil
    
    public init() {}
    
    public var body: some View {
        ZStack {
            Color(red: 0.05, green: 0.07, blue: 0.11).edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 0) {
                // Header
                headerView
                
                // City Filter Horizontal Bar
                cityFilterBar
                
                // Landmarks List
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(landmarksService.filteredLandmarks) { item in
                            LandmarkCard(item: item) {
                                self.selectedLandmark = item
                            } onPlanAR: {
                                self.showStudioForLandmark = item
                            }
                        }
                    }
                    .padding(16)
                    .padding(.bottom, 80)
                }
            }
        }
        .sheet(item: $selectedLandmark) { item in
            LandmarkDetailSheet(item: item) {
                self.selectedLandmark = nil
                self.showStudioForLandmark = item
            }
        }
        .sheet(item: $showStudioForLandmark) { item in
            ARGeographicStudioView(
                initialCoordinate: item.coordinate,
                initialModelId: item.defaultAssetId
            )
            .environmentObject(persistenceService)
            .environmentObject(modelCatalog)
        }
    }
    
    // MARK: - Header
    private var headerView: some View {
        HStack {
            VStack(alignment: .trailing, spacing: 2) {
                Text("استكشاف معالم العراق التاريخية")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.white)
                Text("معالم بابل، أور، بغداد، كربلاء، أربيل والموصل بإحداثيات حقيقية")
                    .font(.system(size: 11.5))
                    .foregroundColor(.gray)
            }
            Spacer()
            Image(systemName: "safari.fill")
                .foregroundColor(.cyan)
                .font(.system(size: 22))
        }
        .padding(.horizontal, 16)
        .padding(.top, 12)
        .padding(.bottom, 8)
    }
    
    // MARK: - City Filter Bar
    private var cityFilterBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(IraqLandmarksService.iraqiCities, id: \.self) { city in
                    let isSelected = landmarksService.selectedCityFilter == city
                    Button(action: {
                        landmarksService.selectedCityFilter = city
                    }) {
                        Text(city)
                            .font(.system(size: 12.5, weight: .semibold))
                            .padding(.horizontal, 14)
                            .padding(.vertical, 7)
                            .background(isSelected ? Color.cyan : Color.white.opacity(0.06))
                            .foregroundColor(isSelected ? .black : .white)
                            .cornerRadius(16)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 6)
        }
    }
}

// MARK: - Landmark Card
struct LandmarkCard: View {
    let item: IraqLandmarkItem
    let onSelect: () -> Void
    let onPlanAR: () -> Void
    
    var body: some View {
        VStack(alignment: .trailing, spacing: 10) {
            HStack(alignment: .top) {
                Button(action: onPlanAR) {
                    HStack(spacing: 4) {
                        Image(systemName: "cube.transparent")
                        Text("تخطيط AR")
                    }
                    .font(.system(size: 11, weight: .bold))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Color.cyan.opacity(0.18))
                    .foregroundColor(.cyan)
                    .cornerRadius(12)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text(item.nameArabic)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)
                    
                    HStack(spacing: 6) {
                        Text(item.historicalPeriod)
                            .font(.system(size: 11))
                            .foregroundColor(.gray)
                        Text("•")
                            .foregroundColor(.gray)
                        Text(item.cityName)
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(.cyan)
                    }
                }
            }
            
            Text(item.historicalDescription)
                .font(.system(size: 12))
                .foregroundColor(.gray)
                .multilineTextAlignment(.trailing)
                .lineLimit(2)
            
            HStack {
                Text(item.isArtisticReconstruction ? "إعادة بناء فنية" : "أثر أصلي موثق")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(item.isArtisticReconstruction ? .orange : .green)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(8)
                
                Spacer()
                
                Text("\(String(format: "%.4f", item.coordinate.latitude))°N, \(String(format: "%.4f", item.coordinate.longitude))°E")
                    .font(.system(size: 10.5, design: .monospaced))
                    .foregroundColor(.gray)
            }
        }
        .padding(14)
        .background(Color.white.opacity(0.04))
        .cornerRadius(16)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.08), lineWidth: 1))
        .onTapGesture(perform: onSelect)
    }
}

// MARK: - Landmark Detail Sheet
struct LandmarkDetailSheet: View {
    let item: IraqLandmarkItem
    let onPlanAR: () -> Void
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        ZStack {
            Color(red: 0.06, green: 0.08, blue: 0.12).edgesIgnoringSafeArea(.all)
            
            ScrollView {
                VStack(alignment: .trailing, spacing: 16) {
                    HStack {
                        Button("إغلاق") { dismiss() }
                            .foregroundColor(.cyan)
                        Spacer()
                        Text(item.nameArabic)
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.white)
                    }
                    
                    VStack(alignment: .trailing, spacing: 4) {
                        Text(item.nameEnglish)
                            .font(.system(size: 13))
                            .foregroundColor(.gray)
                        Text("\(item.cityName) • \(item.historicalPeriod) (\(item.builtYear))")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(.cyan)
                    }
                    
                    Text(item.historicalDescription)
                        .font(.system(size: 13.5))
                        .foregroundColor(.white.opacity(0.9))
                        .multilineTextAlignment(.trailing)
                        .lineSpacing(4)
                    
                    VStack(alignment: .trailing, spacing: 8) {
                        Text("البيانات الجغرافية الدقيقة:")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.white)
                        MetaRow(label: "الإحداثيات الجغرافية:", value: "\(item.coordinate.latitude)° شمالاً, \(item.coordinate.longitude)° شرقاً")
                        MetaRow(label: "الارتفاع التقديري:", value: "\(Int(item.altitudeMeters)) متر فوق سطح البحر")
                        MetaRow(label: "دقة التموضع المكانية:", value: "±\(item.positioningConfidenceMeters) متر")
                        MetaRow(label: "تصنيف الأثر:", value: item.isArtisticReconstruction ? "إعادة بناء فنية مستندة للحفريات" : "صرح أثري تاريخي قائم ومحقق")
                    }
                    .padding(14)
                    .background(Color.white.opacity(0.04))
                    .cornerRadius(14)
                    
                    Button(action: {
                        dismiss()
                        onPlanAR()
                    }) {
                        HStack(spacing: 8) {
                            Image(systemName: "mappin.and.ellipse")
                            Text("فتح في استوديو التموضع الجغرافي AR")
                        }
                        .font(.system(size: 14, weight: .bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.cyan)
                        .foregroundColor(.black)
                        .cornerRadius(16)
                    }
                }
                .padding(20)
            }
        }
    }
}
