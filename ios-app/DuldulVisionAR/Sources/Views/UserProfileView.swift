import SwiftUI

/// Profile, Saved Geographic AR Experiences, Sensor Calibration & Data Management
public struct UserProfileView: View {
    @EnvironmentObject var persistenceService: GeospatialPersistenceService
    @EnvironmentObject var discoveryManager: CityMonumentsDiscoveryManager
    @EnvironmentObject var modelCatalog: USDZModelCatalog
    
    @State private var showExportSheet: Bool = false
    @State private var exportedJSON: String = ""
    @State private var showCalibrationDialog: Bool = false
    @State private var showStudioForEdit: GeospatialPlacementModel? = nil
    
    public init() {}
    
    public var body: some View {
        ZStack {
            Color(red: 0.05, green: 0.07, blue: 0.11).edgesIgnoringSafeArea(.all)
            
            ScrollView {
                VStack(spacing: 20) {
                    // 1. User Header & Explorer Rank
                    profileHeaderCard
                    
                    // 2. Hardware Sensors & AR Calibration Status
                    sensorDiagnosticsCard
                    
                    // 3. Saved AR Geographic Experiences
                    savedExperiencesSection
                    
                    // 4. Data Export & Backup Section
                    dataManagementCard
                }
                .padding(16)
                .padding(.bottom, 80)
            }
        }
        .sheet(isPresented: $showExportSheet) {
            JSONExportSheet(jsonText: exportedJSON)
        }
        .sheet(item: $showStudioForEdit) { item in
            ARGeographicStudioView(
                initialCoordinate: item.coordinate,
                initialModelId: item.assetId
            )
            .environmentObject(persistenceService)
            .environmentObject(modelCatalog)
        }
    }
    
    // MARK: - Profile Card
    private var profileHeaderCard: some View {
        VStack(alignment: .trailing, spacing: 12) {
            HStack(spacing: 14) {
                VStack(alignment: .leading, spacing: 3) {
                    Text("كشاف الرافدين المعتمد")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                    Text("مستكشف التراث والواقع المعزز في العراق")
                        .font(.system(size: 11.5))
                        .foregroundColor(.gray)
                }
                Spacer()
                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: [.cyan, .blue], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 52, height: 52)
                    Image(systemName: "person.crop.circle.fill")
                        .foregroundColor(.white)
                        .font(.system(size: 38))
                }
            }
            
            Divider().background(Color.white.opacity(0.1))
            
            HStack {
                StatBadge(title: "التجارب المحفوظة", value: "\(persistenceService.savedPlacements.count)")
                Spacer()
                StatBadge(title: "المعالم المستكشفة", value: "\(discoveryManager.explorerProfile.discoveredCount)")
                Spacer()
                StatBadge(title: "النماذج المتاحة", value: "\(modelCatalog.models.count)")
            }
        }
        .padding(16)
        .background(Color.white.opacity(0.04))
        .cornerRadius(18)
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.white.opacity(0.08), lineWidth: 1))
    }
    
    // MARK: - Sensor Diagnostics
    private var sensorDiagnosticsCard: some View {
        VStack(alignment: .trailing, spacing: 10) {
            HStack {
                Button(action: { showCalibrationDialog = true }) {
                    Text("معايرة البوصلة")
                        .font(.system(size: 11, weight: .bold))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(Color.cyan.opacity(0.15))
                        .foregroundColor(.cyan)
                        .cornerRadius(10)
                }
                Spacer()
                Text("تشخيص دقة المستشعرات الميدانية")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
            }
            
            VStack(spacing: 8) {
                SensorRow(label: "مستشعر Apple LiDAR العميق:", status: "نشط ومدعوم عتادياً", isGood: true)
                SensorRow(label: "محاذاة الجاذبية والشمال الحقيقي:", status: "Active Gravity + Heading", isGood: true)
                SensorRow(label: "مرشح كالمان لثبات التوجيه:", status: "1D Circular Kalman Active", isGood: true)
                SensorRow(label: "تتبع آبل الجغرافي في العراق:", status: "غير مدعوم (يعمل بالنمط البديل B)", isGood: false)
            }
        }
        .padding(14)
        .background(Color.white.opacity(0.04))
        .cornerRadius(16)
        .alert(isPresented: $showCalibrationDialog) {
            Alert(
                title: Text("معايرة بوصلة الجهاز"),
                message: Text("لتحقيق أقصى دقة توجيه، حرّك جهاز الآيفون على شكل رقم 8 في الهواء بعيداً عن الأسطح المعدنية الكبيرة."),
                dismissButton: .default(Text("فهمت ذلك"))
            )
        }
    }
    
    // MARK: - Saved Experiences
    private var savedExperiencesSection: some View {
        VStack(alignment: .trailing, spacing: 12) {
            HStack {
                Text("\(persistenceService.savedPlacements.count) تجربة")
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundColor(.gray)
                Spacer()
                Text("تجارب الواقع المعزز الجغرافية المحفوظة")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
            }
            
            if persistenceService.savedPlacements.isEmpty {
                Text("لا توجد تجارب محفوظة حالياً. استخدم استوديو التموضع الجغرافي لإضافة مجسمات على الخريطة.")
                    .font(.system(size: 12))
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.trailing)
                    .padding()
            } else {
                ForEach(persistenceService.savedPlacements) { item in
                    VStack(alignment: .trailing, spacing: 8) {
                        HStack {
                            Button(action: {
                                persistenceService.deletePlacement(byId: item.id)
                            }) {
                                Image(systemName: "trash")
                                    .foregroundColor(.red.opacity(0.8))
                                    .font(.system(size: 13))
                            }
                            
                            Spacer()
                            
                            Text(item.titleArabic)
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.white)
                        }
                        
                        HStack {
                            Text(item.verificationStatus.rawValue)
                                .font(.system(size: 9.5, weight: .bold))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(Color(hex: item.verificationStatus.badgeColorHex).opacity(0.2))
                                .foregroundColor(Color(hex: item.verificationStatus.badgeColorHex))
                                .cornerRadius(8)
                            
                            Spacer()
                            
                            Text("\(String(format: "%.4f", item.latitude))°N, \(String(format: "%.4f", item.longitude))°E")
                                .font(.system(size: 11, design: .monospaced))
                                .foregroundColor(.gray)
                        }
                        
                        HStack {
                            Text("المقياس: \(String(format: "%.1f", item.scale))x • الاتجاه: \(Int(item.heading))° • الدقة: ±\(String(format: "%.1f", item.positioningAccuracy))م")
                                .font(.system(size: 10))
                                .foregroundColor(.gray)
                            Spacer()
                            Text(item.dataProvenance)
                                .font(.system(size: 10))
                                .foregroundColor(.cyan)
                        }
                    }
                    .padding(12)
                    .background(Color.white.opacity(0.03))
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.06), lineWidth: 1))
                }
            }
        }
        .padding(14)
        .background(Color.white.opacity(0.04))
        .cornerRadius(16)
    }
    
    // MARK: - Data Management & Export
    private var dataManagementCard: some View {
        VStack(alignment: .trailing, spacing: 10) {
            Text("النسخ الاحتياطي وتصدير البيانات")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.white)
            
            Text("يمكنك تصدير كافة التجارب والمواقع الجغرافية بصيغة JSON الموحدة لمشاركتها أو أرشفتها.")
                .font(.system(size: 11.5))
                .foregroundColor(.gray)
                .multilineTextAlignment(.trailing)
            
            Button(action: {
                if let json = persistenceService.exportPlacementsJSON() {
                    exportedJSON = json
                    showExportSheet = true
                }
            }) {
                HStack {
                    Image(systemName: "square.and.arrow.up")
                    Text("تصدير التجارب المكانية (GeoJSON / Placements JSON)")
                }
                .font(.system(size: 13, weight: .bold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(Color.cyan.opacity(0.18))
                .foregroundColor(.cyan)
                .cornerRadius(12)
            }
        }
        .padding(14)
        .background(Color.white.opacity(0.04))
        .cornerRadius(16)
    }
}

struct StatBadge: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 16, weight: .bold, design: .monospaced))
                .foregroundColor(.cyan)
            Text(title)
                .font(.system(size: 10.5))
                .foregroundColor(.gray)
        }
    }
}

struct SensorRow: View {
    let label: String
    let status: String
    let isGood: Bool
    
    var body: some View {
        HStack {
            Text(status)
                .font(.system(size: 10.5, weight: .semibold))
                .foregroundColor(isGood ? .green : .orange)
            Spacer()
            Text(label)
                .font(.system(size: 11))
                .foregroundColor(.gray)
        }
    }
}

struct JSONExportSheet: View {
    let jsonText: String
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ZStack {
                Color(red: 0.06, green: 0.08, blue: 0.12).edgesIgnoringSafeArea(.all)
                ScrollView {
                    Text(jsonText)
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundColor(.white.opacity(0.85))
                        .padding()
                }
            }
            .navigationBarTitle("تصدير البيانات", displayMode: .inline)
            .navigationBarItems(trailing: Button("إغلاق") { dismiss() })
        }
    }
}

extension Color {
    init(hex: String) {
        let clean = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: clean).scanHexInt64(&int)
        let r, g, b: UInt64
        switch clean.count {
        case 6:
            (r, g, b) = (int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
            self.init(red: Double(r) / 255.0, green: Double(g) / 255.0, blue: Double(b) / 255.0)
        default:
            self.init(.gray)
        }
    }
}
