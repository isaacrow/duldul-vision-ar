import SwiftUI
import CoreLocation

public struct GeoLandmarkDetailSheet: View {
    let item: GeoARItem
    let onNavigate: (CLLocationCoordinate2D, String) -> Void
    let onClose: () -> Void
    
    public init(
        item: GeoARItem,
        onNavigate: @escaping (CLLocationCoordinate2D, String) -> Void,
        onClose: @escaping () -> Void
    ) {
        self.item = item
        self.onNavigate = onNavigate
        self.onClose = onClose
    }
    
    public var body: some View {
        VStack(spacing: 14) {
            // Header: Grabber + Close
            HStack {
                Capsule()
                    .fill(Color.white.opacity(0.3))
                    .frame(width: 36, height: 4)
            }
            .frame(maxWidth: .infinity)
            .padding(.top, 4)
            
            HStack(spacing: 12) {
                // Category Icon
                ZStack {
                    Circle()
                        .fill(Color.cyan.opacity(0.2))
                        .frame(width: 44, height: 44)
                    
                    Image(systemName: iconName)
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.cyan)
                }
                
                VStack(alignment: .leading, spacing: 3) {
                    Text(item.title)
                        .font(.system(size: 17, weight: .black))
                        .foregroundColor(.white)
                    
                    if let meta = item.metadata {
                        Text(meta)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.white.opacity(0.75))
                    }
                }
                
                Spacer()
                
                Button(action: onClose) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 22))
                        .foregroundColor(.white.opacity(0.5))
                }
            }
            
            // Geographic Telemetry Metrics Card
            HStack(spacing: 12) {
                MetricPill(
                    title: "المسافة الجغرافية",
                    value: formatDistance(item.distanceMeters),
                    icon: "ruler"
                )
                
                MetricPill(
                    title: "زاوية السمت (Bearing)",
                    value: "\(Int(item.azimuthDegrees))°",
                    icon: "location.north"
                )
                
                MetricPill(
                    title: "خط العرض / الطول",
                    value: String(format: "%.4f, %.4f", item.coordinate.latitude, item.coordinate.longitude),
                    icon: "globe"
                )
            }
            
            // Action Button: Start Navigation
            Button(action: {
                let gen = UIImpactFeedbackGenerator(style: .heavy)
                gen.impactOccurred()
                onNavigate(item.coordinate, item.title)
            }) {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.triangle.turn.up.right.diamond.fill")
                        .font(.system(size: 16, weight: .bold))
                    Text("ابدأ الملاحة وتوجيه الواقع المعزز فوراً")
                        .font(.system(size: 15, weight: .black))
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(
                    LinearGradient(
                        colors: [Color.blue, Color(red: 0.0, green: 0.7, blue: 1.0)],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .cornerRadius(18)
                .shadow(color: Color.blue.opacity(0.5), radius: 10, y: 4)
            }
        }
        .padding(18)
        .background(
            Color(red: 0.08, green: 0.11, blue: 0.18).opacity(0.96)
        )
        .cornerRadius(24)
        .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color.white.opacity(0.18), lineWidth: 1.5))
        .shadow(color: Color.black.opacity(0.6), radius: 25, y: 10)
        .padding(.horizontal, 16)
        .padding(.bottom, 12)
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
            return String(format: "%.1f كم", meters / 1000.0)
        } else {
            return "\(Int(meters)) متر"
        }
    }
}

private struct MetricPill: View {
    let title: String
    let value: String
    let icon: String
    
    var body: some View {
        VStack(spacing: 3) {
            Text(title)
                .font(.system(size: 9, weight: .medium))
                .foregroundColor(.white.opacity(0.6))
            
            HStack(spacing: 3) {
                Image(systemName: icon)
                    .font(.system(size: 9))
                    .foregroundColor(.cyan)
                Text(value)
                    .font(.system(size: 11, weight: .bold, design: .monospaced))
                    .foregroundColor(.white)
                    .lineLimit(1)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 7)
        .background(Color.white.opacity(0.06))
        .cornerRadius(12)
    }
}
