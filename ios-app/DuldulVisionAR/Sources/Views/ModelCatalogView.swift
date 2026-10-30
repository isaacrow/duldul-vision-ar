import SwiftUI
import RealityKit

/// 3D Models Library View for Duldul
public struct ModelCatalogView: View {
    @EnvironmentObject var modelCatalog: USDZModelCatalog
    @EnvironmentObject var persistenceService: GeospatialPersistenceService
    
    @State private var selectedCategory: ModelHeritageCategory? = nil
    @State private var selectedModel: USDZModelItem? = nil
    @State private var showStudioForModel: USDZModelItem? = nil
    
    public init() {}
    
    private var filteredModels: [USDZModelItem] {
        if let cat = selectedCategory {
            return modelCatalog.models.filter { $0.category == cat }
        }
        return modelCatalog.models
    }
    
    public var body: some View {
        ZStack {
            Color(red: 0.05, green: 0.07, blue: 0.11).edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 0) {
                // Top Header
                headerView
                
                // Category Filter Pills
                categoryFilterBar
                
                // Grid of 3D Models
                ScrollView {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 14) {
                        ForEach(filteredModels) { model in
                            ModelCard(model: model) {
                                self.selectedModel = model
                            }
                        }
                    }
                    .padding(16)
                    .padding(.bottom, 80)
                }
            }
        }
        .sheet(item: $selectedModel) { model in
            ModelDetailSheet(model: model) {
                self.selectedModel = nil
                self.showStudioForModel = model
            }
        }
        .sheet(item: $showStudioForModel) { model in
            ARGeographicStudioView(initialModelId: model.id)
                .environmentObject(persistenceService)
                .environmentObject(modelCatalog)
        }
    }
    
    // MARK: - Header
    private var headerView: some View {
        HStack {
            VStack(alignment: .trailing, spacing: 2) {
                Text("مكتبة النماذج ثلاثية الأبعاد")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.white)
                Text("مجسمات الآثار والتراث الرافديني المعدة للواقع المعزز")
                    .font(.system(size: 11.5))
                    .foregroundColor(.gray)
            }
            Spacer()
            Image(systemName: "cube.fill")
                .foregroundColor(.cyan)
                .font(.system(size: 22))
        }
        .padding(.horizontal, 16)
        .padding(.top, 12)
        .padding(.bottom, 8)
    }
    
    // MARK: - Categories Bar
    private var categoryFilterBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                Button(action: { selectedCategory = nil }) {
                    Text("الكل (\(modelCatalog.models.count))")
                        .font(.system(size: 12.5, weight: .semibold))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(selectedCategory == nil ? Color.cyan : Color.white.opacity(0.06))
                        .foregroundColor(selectedCategory == nil ? .black : .white)
                        .cornerRadius(16)
                }
                
                ForEach(ModelHeritageCategory.allCases, id: \.self) { cat in
                    Button(action: { selectedCategory = cat }) {
                        HStack(spacing: 4) {
                            Image(systemName: cat.iconName)
                            Text(cat.rawValue)
                        }
                        .font(.system(size: 12.5, weight: .semibold))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(selectedCategory == cat ? Color.cyan : Color.white.opacity(0.06))
                        .foregroundColor(selectedCategory == cat ? .black : .white)
                        .cornerRadius(16)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 6)
        }
    }
}

// MARK: - Model Card
struct ModelCard: View {
    let model: USDZModelItem
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            VStack(alignment: .trailing, spacing: 8) {
                // Preview Icon Container
                ZStack {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(Color(red: 0.10, green: 0.13, blue: 0.18))
                    
                    VStack(spacing: 6) {
                        Image(systemName: model.category.iconName)
                            .font(.system(size: 32))
                            .foregroundColor(.cyan)
                        
                        Text("\(model.estimatedPolygons / 1000)k مضلع")
                            .font(.system(size: 10, design: .monospaced))
                            .foregroundColor(.gray)
                    }
                }
                .frame(height: 110)
                
                VStack(alignment: .trailing, spacing: 3) {
                    Text(model.nameArabic)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.trailing)
                        .lineLimit(1)
                    
                    Text(model.name)
                        .font(.system(size: 10.5))
                        .foregroundColor(.gray)
                        .lineLimit(1)
                    
                    HStack {
                        if model.isArtisticReconstruction {
                            Text("إعادة بناء فنية")
                                .font(.system(size: 9))
                                .foregroundColor(.orange)
                        } else {
                            Text("أثر تاريخي موثق")
                                .font(.system(size: 9))
                                .foregroundColor(.green)
                        }
                        Spacer()
                    }
                }
            }
            .padding(10)
            .background(Color.white.opacity(0.04))
            .cornerRadius(16)
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.08), lineWidth: 1))
        }
    }
}

// MARK: - Model Detail Sheet
struct ModelDetailSheet: View {
    let model: USDZModelItem
    let onDeployToStudio: () -> Void
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        ZStack {
            Color(red: 0.06, green: 0.08, blue: 0.12).edgesIgnoringSafeArea(.all)
            
            ScrollView {
                VStack(alignment: .trailing, spacing: 16) {
                    // Header & Dismiss
                    HStack {
                        Button("إغلاق") { dismiss() }
                            .foregroundColor(.cyan)
                        Spacer()
                        Text(model.nameArabic)
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.white)
                    }
                    
                    // 3D Preview Frame
                    ZStack {
                        RoundedRectangle(cornerRadius: 18)
                            .fill(Color(red: 0.10, green: 0.13, blue: 0.20))
                        
                        VStack(spacing: 8) {
                            Image(systemName: model.category.iconName)
                                .font(.system(size: 54))
                                .foregroundColor(.cyan)
                            Text("معاينة المجسم ثلاثي الأبعاد")
                                .font(.system(size: 12))
                                .foregroundColor(.gray)
                        }
                    }
                    .frame(height: 180)
                    
                    // Historical Summary
                    VStack(alignment: .trailing, spacing: 6) {
                        Text("النبذة التاريخية والأثرية:")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                        Text(model.historicalSummary)
                            .font(.system(size: 12.5))
                            .foregroundColor(.gray)
                            .multilineTextAlignment(.trailing)
                    }
                    .padding(14)
                    .background(Color.white.opacity(0.04))
                    .cornerRadius(14)
                    
                    // Technical Metadata Grid
                    VStack(alignment: .trailing, spacing: 10) {
                        Text("بيانات النموذج والترخيص:")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                        
                        MetaRow(label: "المؤلف والمصدر:", value: model.author)
                        MetaRow(label: "الترخيص:", value: model.license)
                        MetaRow(label: "الأبعاد الحقيقية:", value: "\(model.dimensionsMeters.x)م عرض × \(model.dimensionsMeters.y)م ارتفاع × \(model.dimensionsMeters.z)م عمق")
                        MetaRow(label: "عدد المضلعات:", value: "\(model.estimatedPolygons) مضلع PBR")
                        MetaRow(label: "نوع التوثيق:", value: model.isArtisticReconstruction ? "إعادة بناء فنية ثلاثية الأبعاد" : "توثيق تاريخي مطابق للأصل")
                    }
                    .padding(14)
                    .background(Color.white.opacity(0.04))
                    .cornerRadius(14)
                    
                    // Deploy Button
                    Button(action: onDeployToStudio) {
                        HStack(spacing: 8) {
                            Image(systemName: "mappin.and.ellipse")
                            Text("تثبيت هذا المجسم على إحداثيات جغرافية")
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

struct MetaRow: View {
    let label: String
    let value: String
    
    var body: some View {
        VStack(alignment: .trailing, spacing: 2) {
            Text(label)
                .font(.system(size: 11))
                .foregroundColor(.gray)
            Text(value)
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(.white)
                .multilineTextAlignment(.trailing)
        }
    }
}
