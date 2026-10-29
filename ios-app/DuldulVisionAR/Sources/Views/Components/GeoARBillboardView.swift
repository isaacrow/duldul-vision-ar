import SwiftUI

public struct GeoARBillboardView: View {
    let item: GeoARItem
    let isSelected: Bool
    let onTap: () -> Void
    
    // Scale billboard inversely with distance to simulate 3D perspective
    private var depthScale: CGFloat {
        let dist = item.distanceMeters
        if dist < 100 { return 1.05 }
        if dist < 300 { return 0.95 }
        if dist < 700 { return 0.85 }
        return 0.72
    }
    
    public init(item: GeoARItem, isSelected: Bool = false, onTap: @escaping () -> Void) {
        self.item = item
        self.isSelected = isSelected
        self.onTap = onTap
    }
    
    public var body: some View {
        Button(action: {
            let gen = UIImpactFeedbackGenerator(style: .medium)
            gen.impactOccurred()
            onTap()
        }) {
            VStack(spacing: 0) {
                // Frosted Liquid Glass Main Badge
                HStack(spacing: 8) {
                    // Category Icon Dot
                    ZStack {
                        Circle()
                            .fill(badgeColor.opacity(0.25))
                            .frame(width: 26, height: 26)
                        
                        Image(systemName: iconName)
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(badgeColor)
                    }
                    
                    VStack(alignment: .leading, spacing: 1) {
                        Text(item.title)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.white)
                            .lineLimit(1)
                        
                        if let meta = item.metadata {
                            Text(meta)
                                .font(.system(size: 10, weight: .medium))
                                .foregroundColor(.white.opacity(0.7))
                                .lineLimit(1)
                        }
                    }
                    
                    Spacer(minLength: 4)
                    
                    // Live Metric Distance Pill
                    Text(formatDistance(item.distanceMeters))
                        .font(.system(size: 11, weight: .black, design: .monospaced))
                        .foregroundColor(badgeColor)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 3)
                        .background(Color.black.opacity(0.45))
                        .cornerRadius(8)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 7)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(isSelected ? Color.blue.opacity(0.85) : Color(red: 0.08, green: 0.12, blue: 0.20).opacity(0.85))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(isSelected ? Color.cyan : Color.white.opacity(0.22), lineWidth: isSelected ? 2 : 1)
                )
                .shadow(color: isSelected ? Color.cyan.opacity(0.6) : Color.black.opacity(0.45), radius: 12, y: 6)
                
                // Downward Spatial Stem Pointing to Exact Geographic Location on Road
                VStack(spacing: 0) {
                    Rectangle()
                        .fill(
                            LinearGradient(
                                colors: [badgeColor.opacity(0.8), badgeColor.opacity(0.1)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .frame(width: 2, height: 22)
                    
                    Circle()
                        .fill(badgeColor)
                        .frame(width: 6, height: 6)
                        .shadow(color: badgeColor, radius: 4)
                }
            }
        }
        .buttonStyle(PlainButtonStyle())
        .scaleEffect(depthScale)
        .animation(.spring(response: 0.35, dampingFraction: 0.75), value: depthScale)
    }
    
    private var badgeColor: Color {
        switch item.category {
        case .landmark: return .cyan
        case .obstacle: return .orange
        case .sign: return .yellow
        case .shop: return .green
        case .vehicle: return .blue
        }
    }
    
    private var iconName: String {
        switch item.category {
        case .landmark: return "bridge"
        case .obstacle: return "shield.lefthalf.filled"
        case .sign: return "camera.fill"
        case .shop: return "bag.fill"
        case .vehicle: return "car.fill"
        }
    }
    
    private func formatDistance(_ meters: Double) -> String {
        if meters >= 1000 {
            return String(format: "%.1f km", meters / 1000.0)
        } else {
            return "\(Int(meters))m"
        }
    }
}
