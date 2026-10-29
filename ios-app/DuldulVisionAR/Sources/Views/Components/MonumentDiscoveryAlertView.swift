import SwiftUI

public struct MonumentDiscoveryAlertView: View {
    let monument: CityMonument
    let onDiscoverTap: () -> Void
    let onInspectTap: () -> Void
    
    public init(
        monument: CityMonument,
        onDiscoverTap: @escaping () -> Void,
        onInspectTap: @escaping () -> Void
    ) {
        self.monument = monument
        self.onDiscoverTap = onDiscoverTap
        self.onInspectTap = onInspectTap
    }
    
    public var body: some View {
        HStack(spacing: 12) {
            // Glowing Monument Category Icon
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [Color.yellow.opacity(0.8), Color.orange.opacity(0.9)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 44, height: 44)
                    .shadow(color: Color.yellow.opacity(0.6), radius: 8)
                
                Image(systemName: monument.category.iconName)
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.black)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(monument.nameArabic)
                        .font(.system(size: 15, weight: .black))
                        .foregroundColor(.white)
                    
                    Text("+\(monument.pointsReward) نقطة")
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .foregroundColor(.yellow)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.yellow.opacity(0.18))
                        .cornerRadius(6)
                }
                
                Text(monument.canBeCollected ? "مجسم الـ AR ثلاثي الأبعاد جاهز للاكتشاف!" : "على بعد \(Int(monument.distanceMeters))م • اقترب لفتحه في الـ AR")
                    .font(.system(size: 11.5, weight: .medium))
                    .foregroundColor(monument.canBeCollected ? .green : .white.opacity(0.75))
            }
            
            Spacer()
            
            if !monument.isDiscovered {
                Button(action: onDiscoverTap) {
                    Text(monument.canBeCollected ? "اكتشف الآن" : "عرض")
                        .font(.system(size: 12, weight: .black))
                        .foregroundColor(monument.canBeCollected ? .black : .white)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(
                            monument.canBeCollected
                            ? LinearGradient(colors: [Color.yellow, Color.orange], startPoint: .top, endPoint: .bottom)
                            : LinearGradient(colors: [Color.blue, Color.cyan], startPoint: .top, endPoint: .bottom)
                        )
                        .cornerRadius(14)
                        .shadow(color: monument.canBeCollected ? Color.yellow.opacity(0.5) : Color.blue.opacity(0.4), radius: 6)
                }
            } else {
                Image(systemName: "checkmark.seal.fill")
                    .font(.system(size: 24))
                    .foregroundColor(.yellow)
                    .padding(.trailing, 4)
            }
        }
        .padding(12)
        .background(
            Color(red: 0.08, green: 0.10, blue: 0.18).opacity(0.96)
        )
        .cornerRadius(20)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(
                    LinearGradient(
                        colors: [Color.yellow.opacity(0.6), Color.cyan.opacity(0.4)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1.5
                )
        )
        .shadow(color: Color.black.opacity(0.6), radius: 15, y: 8)
        .padding(.horizontal, 16)
        .onTapGesture {
            onInspectTap()
        }
    }
}
