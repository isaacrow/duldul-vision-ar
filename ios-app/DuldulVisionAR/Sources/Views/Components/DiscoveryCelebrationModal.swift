import SwiftUI

public struct DiscoveryCelebrationModal: View {
    let monument: CityMonument
    let onDismiss: () -> Void
    
    @State private var pulseScale: CGFloat = 0.8
    @State private var rotationDegrees: Double = 0
    
    public init(monument: CityMonument, onDismiss: @escaping () -> Void) {
        self.monument = monument
        self.onDismiss = onDismiss
    }
    
    public var body: some View {
        ZStack {
            Color.black.opacity(0.85)
                .edgesIgnoringSafeArea(.all)
                .onTapGesture { onDismiss() }
            
            VStack(spacing: 18) {
                // Celebration Badge & Aura
                ZStack {
                    Circle()
                        .stroke(
                            LinearGradient(
                                colors: [Color.yellow, Color.orange, Color.clear],
                                startPoint: .top,
                                endPoint: .bottom
                            ),
                            lineWidth: 3
                        )
                        .frame(width: 100, height: 100)
                        .rotationEffect(.degrees(rotationDegrees))
                    
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [Color.yellow.opacity(0.4), Color.clear],
                                center: .center,
                                startRadius: 5,
                                endRadius: 50
                            )
                        )
                        .frame(width: 90, height: 90)
                    
                    Image(systemName: "sparkles")
                        .font(.system(size: 40, weight: .black))
                        .foregroundColor(.yellow)
                        .scaleEffect(pulseScale)
                }
                .padding(.top, 10)
                
                VStack(spacing: 4) {
                    Text("تم اكتشاف صرح تاريخي جديد!")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.yellow)
                    
                    Text(monument.nameArabic)
                        .font(.system(size: 22, weight: .black))
                        .foregroundColor(.white)
                    
                    Text(monument.englishName)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.gray)
                }
                
                // Points Reward Badge
                HStack(spacing: 6) {
                    Image(systemName: "star.fill")
                        .foregroundColor(.yellow)
                    Text("+\(monument.pointsReward) نقطة كشاف")
                        .font(.system(size: 15, weight: .black, design: .monospaced))
                        .foregroundColor(.white)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Color.yellow.opacity(0.2))
                .cornerRadius(14)
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.yellow.opacity(0.5), lineWidth: 1))
                
                // Historical Lore Card
                VStack(alignment: .leading, spacing: 8) {
                    Text(monument.historicalSummary)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.white.opacity(0.9))
                        .lineSpacing(4)
                        .multilineTextAlignment(.leading)
                    
                    Divider()
                        .background(Color.white.opacity(0.2))
                    
                    HStack {
                        if let architect = monument.architectName {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("المصمم / الباني")
                                    .font(.system(size: 10))
                                    .foregroundColor(.gray)
                                Text(architect)
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(.cyan)
                            }
                        }
                        
                        Spacer()
                        
                        VStack(alignment: .trailing, spacing: 2) {
                            Text("سنة التشييد")
                                .font(.system(size: 10))
                                .foregroundColor(.gray)
                            Text(monument.builtYear)
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.yellow)
                        }
                    }
                }
                .padding(14)
                .background(Color.white.opacity(0.06))
                .cornerRadius(16)
                
                // Confirm Button
                Button(action: onDismiss) {
                    Text("متابعة الاستكشاف")
                        .font(.system(size: 15, weight: .black))
                        .foregroundColor(.black)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(
                            LinearGradient(
                                colors: [Color.yellow, Color.orange],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .cornerRadius(16)
                        .shadow(color: Color.yellow.opacity(0.5), radius: 10, y: 4)
                }
            }
            .padding(22)
            .background(
                Color(red: 0.08, green: 0.10, blue: 0.16)
            )
            .cornerRadius(28)
            .overlay(RoundedRectangle(cornerRadius: 28).stroke(Color.yellow.opacity(0.4), lineWidth: 1.5))
            .shadow(color: Color.black.opacity(0.8), radius: 30)
            .padding(.horizontal, 24)
        }
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.6)) {
                pulseScale = 1.0
            }
            withAnimation(.linear(duration: 8.0).repeatForever(autoreverses: false)) {
                rotationDegrees = 360
            }
        }
    }
}
