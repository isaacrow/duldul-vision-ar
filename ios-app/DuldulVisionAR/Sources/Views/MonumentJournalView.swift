import SwiftUI
import CoreLocation

public struct MonumentJournalView: View {
    @EnvironmentObject var discoveryManager: CityMonumentsDiscoveryManager
    @EnvironmentObject var navManager: NavigationManager
    @State private var selectedCategory: MonumentCategory? = nil
    @State private var selectedMonument: CityMonument? = nil
    @Environment(\.dismiss) private var dismiss
    
    public init() {}
    
    private var filteredMonuments: [CityMonument] {
        if let cat = selectedCategory {
            return discoveryManager.monuments.filter { $0.category == cat }
        }
        return discoveryManager.monuments
    }
    
    public var body: some View {
        NavigationView {
            ZStack {
                Color(red: 0.05, green: 0.07, blue: 0.12).edgesIgnoringSafeArea(.all)
                
                ScrollView {
                    VStack(spacing: 18) {
                        // 1. Explorer Profile Header Card (Liquid Glass Gold)
                        VStack(spacing: 12) {
                            HStack {
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("سجل استكشاف معالم بغداد والرافدين")
                                        .font(.system(size: 11, weight: .bold))
                                        .foregroundColor(.yellow.opacity(0.8))
                                    Text(discoveryManager.explorerProfile.explorerTitle)
                                        .font(.system(size: 20, weight: .black))
                                        .foregroundColor(.white)
                                }
                                Spacer()
                                Image(systemName: "sparkles.square.filled.on.square")
                                    .font(.system(size: 32))
                                    .foregroundColor(.yellow)
                            }
                            
                            // Stats Counter Bar
                            HStack(spacing: 12) {
                                StatBox(
                                    title: "المعالم المكتشفة",
                                    value: "\(discoveryManager.explorerProfile.discoveredCount) / \(discoveryManager.explorerProfile.totalAvailableCount)",
                                    icon: "checkmark.seal.fill",
                                    color: .green
                                )
                                StatBox(
                                    title: "نقاط المستكشف",
                                    value: "\(discoveryManager.explorerProfile.totalPoints)",
                                    icon: "star.fill",
                                    color: .yellow
                                )
                                StatBox(
                                    title: "الرتبة المكانية",
                                    value: "الفئة الأولى",
                                    icon: "shield.fill",
                                    color: .cyan
                                )
                            }
                        }
                        .padding(16)
                        .background(
                            LinearGradient(
                                colors: [Color(red: 0.12, green: 0.15, blue: 0.24), Color(red: 0.07, green: 0.09, blue: 0.15)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .cornerRadius(22)
                        .overlay(RoundedRectangle(cornerRadius: 22).stroke(Color.yellow.opacity(0.3), lineWidth: 1.5))
                        .padding(.horizontal, 16)
                        .padding(.top, 8)
                        
                        // 2. Category Filter Pills
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                FilterPill(title: "جميع المعالم", isSelected: selectedCategory == nil) {
                                    selectedCategory = nil
                                }
                                ForEach(MonumentCategory.allCases, id: \.self) { cat in
                                    FilterPill(title: cat.titleArabic, isSelected: selectedCategory == cat) {
                                        selectedCategory = cat
                                    }
                                }
                            }
                            .padding(.horizontal, 16)
                        }
                        
                        // 3. Monuments & Artifacts Grid
                        LazyVStack(spacing: 12) {
                            ForEach(filteredMonuments) { mon in
                                MonumentCard(monument: mon) {
                                    self.selectedMonument = mon
                                } onNavigate: {
                                    navManager.calculateRoute(
                                        to: CLLocationCoordinate2D(latitude: mon.lat, longitude: mon.lng),
                                        destName: mon.nameArabic
                                    ) { success in
                                        if success {
                                            navManager.isNavigating = true
                                            dismiss()
                                        }
                                    }
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.bottom, 30)
                    }
                }
            }
            .navigationTitle("دليل المعالم ثلاثي الأبعاد")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(item: $selectedMonument) { mon in
                MonumentDetailSheet(monument: mon) {
                    navManager.calculateRoute(
                        to: CLLocationCoordinate2D(latitude: mon.lat, longitude: mon.lng),
                        destName: mon.nameArabic
                    ) { success in
                        if success {
                            navManager.isNavigating = true
                            self.selectedMonument = nil
                            dismiss()
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Subcomponents
private struct StatBox: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 3) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(color)
            Text(value)
                .font(.system(size: 13, weight: .black, design: .monospaced))
                .foregroundColor(.white)
            Text(title)
                .font(.system(size: 9.5))
                .foregroundColor(.gray)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(Color.black.opacity(0.4))
        .cornerRadius(12)
    }
}

private struct FilterPill: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 11.5, weight: .bold))
                .foregroundColor(isSelected ? .black : .white)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Color.yellow : Color.white.opacity(0.08))
                .cornerRadius(16)
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(isSelected ? Color.yellow : Color.white.opacity(0.15), lineWidth: 1))
        }
    }
}

private struct MonumentCard: View {
    let monument: CityMonument
    let onInspect: () -> Void
    let onNavigate: () -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            // Icon / Discovered Seal
            ZStack {
                Circle()
                    .fill(monument.isDiscovered ? Color.yellow.opacity(0.2) : Color.white.opacity(0.06))
                    .frame(width: 48, height: 48)
                
                Image(systemName: monument.isDiscovered ? "checkmark.seal.fill" : monument.category.iconName)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(monument.isDiscovered ? .yellow : .gray)
            }
            
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(monument.nameArabic)
                        .font(.system(size: 15, weight: .black))
                        .foregroundColor(.white)
                    
                    if monument.isDiscovered {
                        Text("تم الاكتشاف")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.black)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.yellow)
                            .cornerRadius(6)
                    }
                }
                
                Text(monument.historicalSummary)
                    .font(.system(size: 11))
                    .foregroundColor(.white.opacity(0.7))
                    .lineLimit(2)
                
                if monument.distanceMeters > 0 {
                    Text(String(format: "المسافة: %.1f كم • %@", monument.distanceMeters / 1000.0, monument.builtYear))
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .foregroundColor(.cyan)
                }
            }
            
            Spacer()
            
            Button(action: onNavigate) {
                VStack(spacing: 2) {
                    Image(systemName: "arrow.triangle.turn.up.right.diamond.fill")
                        .font(.system(size: 16))
                    Text("انطلق")
                        .font(.system(size: 10, weight: .bold))
                }
                .foregroundColor(.white)
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                .background(Color.blue.opacity(0.85))
                .cornerRadius(12)
            }
        }
        .padding(12)
        .background(Color(red: 0.08, green: 0.11, blue: 0.18).opacity(0.92))
        .cornerRadius(18)
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(monument.isDiscovered ? Color.yellow.opacity(0.3) : Color.white.opacity(0.12), lineWidth: 1))
        .onTapGesture {
            onInspect()
        }
    }
}

public struct MonumentDetailSheet: View {
    let monument: CityMonument
    let onNavigate: () -> Void
    @Environment(\.dismiss) private var dismiss
    
    public var body: some View {
        ZStack {
            Color(red: 0.07, green: 0.09, blue: 0.15).edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 16) {
                Capsule()
                    .fill(Color.white.opacity(0.3))
                    .frame(width: 36, height: 4)
                    .padding(.top, 8)
                
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(monument.nameArabic)
                            .font(.system(size: 22, weight: .black))
                            .foregroundColor(.white)
                        Text(monument.englishName)
                            .font(.system(size: 13))
                            .foregroundColor(.gray)
                    }
                    Spacer()
                    Text("+\(monument.pointsReward) نقطة")
                        .font(.system(size: 13, weight: .black, design: .monospaced))
                        .foregroundColor(.yellow)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(Color.yellow.opacity(0.18))
                        .cornerRadius(10)
                }
                
                // Holographic 3D Object Feature Box
                HStack(spacing: 12) {
                    Image(systemName: "cube.transparent.fill")
                        .font(.system(size: 28))
                        .foregroundColor(.cyan)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("مجسم الـ AR ثلاثي الأبعاد المربوط")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.white)
                        Text("منارة ليزرية عائمة وألواح تاريخية مجسمة في سماء النصب")
                            .font(.system(size: 11))
                            .foregroundColor(.gray)
                    }
                    Spacer()
                }
                .padding(12)
                .background(Color.cyan.opacity(0.1))
                .cornerRadius(14)
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.cyan.opacity(0.3), lineWidth: 1))
                
                Text(monument.historicalSummary)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.white.opacity(0.9))
                    .lineSpacing(5)
                
                Spacer()
                
                Button(action: onNavigate) {
                    HStack(spacing: 8) {
                        Image(systemName: "arrow.triangle.turn.up.right.diamond.fill")
                        Text("ابدأ الملاحة نحو النصب")
                    }
                    .font(.system(size: 16, weight: .black))
                    .foregroundColor(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(LinearGradient(colors: [Color.yellow, Color.orange], startPoint: .leading, endPoint: .trailing))
                    .cornerRadius(16)
                }
            }
            .padding(20)
        }
    }
}
