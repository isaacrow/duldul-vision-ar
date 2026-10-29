import SwiftUI
import CoreLocation

public struct ReportHazardSheet: View {
    @Environment(\.presentationMode) var presentationMode
    @EnvironmentObject var incidentManager: IncidentManager
    let userLocation: CLLocationCoordinate2D?
    
    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]
    
    public var body: some View {
        ZStack {
            Color(red: 0.07, green: 0.09, blue: 0.13).edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 16) {
                // Drag Handle
                Capsule()
                    .fill(Color.white.opacity(0.3))
                    .frame(width: 36, height: 4)
                    .padding(.top, 10)
                
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("إبلاغ مباشر أثناء القيادة")
                            .font(.system(size: 18, weight: .black))
                            .foregroundColor(.white)
                        Text("مساهمتك تحمي وتنبّه السائقين خلفك على الطريق")
                            .font(.system(size: 11))
                            .foregroundColor(.gray)
                    }
                    Spacer()
                    
                    Text("+50 نقطة")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.green)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Color.green.opacity(0.18))
                        .cornerRadius(12)
                }
                .padding(.horizontal, 20)
                
                // Grid of Hazard Tiles
                ScrollView {
                    LazyVGrid(columns: columns, spacing: 12) {
                        ForEach(IncidentType.allCases, id: \.self) { type in
                            Button(action: {
                                let generator = UIImpactFeedbackGenerator(style: .medium)
                                generator.impactOccurred()
                                incidentManager.reportIncident(type: type, title: type.titleArabic, userLocation: userLocation)
                                presentationMode.wrappedValue.dismiss()
                            }) {
                                VStack(spacing: 8) {
                                    Image(systemName: type.iconName)
                                        .font(.system(size: 26, weight: .bold))
                                        .foregroundColor(colorForType(type))
                                    
                                    Text(type.titleArabic)
                                        .font(.system(size: 12, weight: .heavy))
                                        .foregroundColor(.white)
                                        .multilineTextAlignment(.center)
                                }
                                .frame(maxWidth: .infinity)
                                .frame(height: 90)
                                .background(Color(red: 0.11, green: 0.14, blue: 0.20))
                                .cornerRadius(16)
                                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.1), lineWidth: 1))
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 20)
                }
            }
        }
    }
    
    private func colorForType(_ type: IncidentType) -> Color {
        switch type {
        case .checkpoint: return .blue
        case .speedCamera: return .red
        case .trafficJam: return .orange
        case .accident: return .red
        case .roadwork: return .yellow
        case .hazard: return .orange
        case .closure: return .red
        }
    }
}
