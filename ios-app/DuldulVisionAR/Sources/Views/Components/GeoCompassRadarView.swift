import SwiftUI

public struct GeoCompassRadarView: View {
    let headingDegrees: Double
    let items: [GeoARItem]
    let maxRangeMeters: Double
    @State private var sweepAngle: Double = 0
    
    public init(headingDegrees: Double, items: [GeoARItem], maxRangeMeters: Double = 1500.0) {
        self.headingDegrees = headingDegrees
        self.items = items
        self.maxRangeMeters = maxRangeMeters
    }
    
    public var body: some View {
        ZStack {
            // Dark Frosted Glass Circular Housing
            Circle()
                .fill(Color(red: 0.04, green: 0.07, blue: 0.14).opacity(0.85))
                .overlay(Circle().stroke(Color.cyan.opacity(0.4), lineWidth: 1.5))
                .shadow(color: Color.black.opacity(0.5), radius: 10, x: 0, y: 5)
            
            // Concentric Metric Range Rings
            ForEach([0.33, 0.66, 1.0], id: \.self) { frac in
                Circle()
                    .stroke(Color.cyan.opacity(0.18), lineWidth: 1)
                    .scaleEffect(CGFloat(frac))
            }
            
            // Crosshairs
            Path { path in
                path.move(to: CGPoint(x: 55, y: 4))
                path.addLine(to: CGPoint(x: 55, y: 106))
                path.move(to: CGPoint(x: 4, y: 55))
                path.addLine(to: CGPoint(x: 106, y: 55))
            }
            .stroke(Color.cyan.opacity(0.15), lineWidth: 1)
            
            // Camera Field of View (FOV) Wedge (Pointing Up = Camera Direction)
            Path { path in
                let center = CGPoint(x: 55, y: 55)
                path.move(to: center)
                path.addArc(
                    center: center,
                    radius: 50,
                    startAngle: .degrees(-90 - 32),
                    endAngle: .degrees(-90 + 32),
                    clockwise: false
                )
                path.closeSubpath()
            }
            .fill(
                LinearGradient(
                    colors: [Color.cyan.opacity(0.28), Color.cyan.opacity(0.02)],
                    startPoint: .center,
                    endPoint: .top
                )
            )
            
            // Rotating Radar Sweep Beam
            Path { path in
                let center = CGPoint(x: 55, y: 55)
                path.move(to: center)
                path.addArc(
                    center: center,
                    radius: 51,
                    startAngle: .degrees(sweepAngle),
                    endAngle: .degrees(sweepAngle + 35),
                    clockwise: false
                )
                path.closeSubpath()
            }
            .fill(
                RadialGradient(
                    colors: [Color.cyan.opacity(0.35), Color.clear],
                    center: .center,
                    startRadius: 0,
                    endRadius: 52
                )
            )
            .rotationEffect(.degrees(sweepAngle))
            
            // Geographic Points of Interest
            ForEach(items) { item in
                let radius = CGFloat(min(1.0, item.distanceMeters / maxRangeMeters)) * 45.0
                // Convert relative bearing to radar position (0° is Straight Ahead / Up)
                let angleRad = (item.relativeBearingDegrees - 90.0) * .pi / 180.0
                let posX = 55.0 + radius * cos(angleRad)
                let posY = 55.0 + radius * sin(angleRad)
                
                Circle()
                    .fill(dotColor(for: item.category))
                    .frame(width: item.isInsideFOV ? 6.5 : 4.5, height: item.isInsideFOV ? 6.5 : 4.5)
                    .overlay(Circle().stroke(Color.white, lineWidth: item.isInsideFOV ? 1.0 : 0))
                    .shadow(color: dotColor(for: item.category), radius: 4)
                    .position(x: posX, y: posY)
            }
            
            // User Vehicle / Direction Arrow at Center
            Image(systemName: "location.north.fill")
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(.cyan)
                .shadow(color: .cyan, radius: 6)
            
            // Compass Cardinal Ticks (N, E, S, W)
            Text("N")
                .font(.system(size: 8, weight: .black, design: .monospaced))
                .foregroundColor(.cyan)
                .position(x: 55, y: 10)
                .rotationEffect(.degrees(-headingDegrees), anchor: .center)
            
            // Bottom Range Label
            VStack {
                Spacer()
                Text("\(Int(maxRangeMeters))m")
                    .font(.system(size: 8, weight: .bold, design: .monospaced))
                    .foregroundColor(.white.opacity(0.65))
                    .padding(.bottom, 3)
            }
        }
        .frame(width: 110, height: 110)
        .onAppear {
            withAnimation(.linear(duration: 2.8).repeatForever(autoreverses: false)) {
                sweepAngle = 360
            }
        }
    }
    
    private func dotColor(for category: SpatialCategory) -> Color {
        switch category {
        case .landmark: return .cyan
        case .obstacle: return .orange
        case .sign: return .yellow
        case .shop: return .green
        case .vehicle: return .blue
        }
    }
}
