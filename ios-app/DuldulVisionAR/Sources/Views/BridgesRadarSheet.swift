import SwiftUI

public struct BridgesRadarSheet: View {
    @EnvironmentObject var bridgesManager: BridgesManager
    @Environment(\.presentationMode) var presentationMode
    
    public var body: some View {
        ZStack {
            Color(red: 0.07, green: 0.09, blue: 0.13).edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 14) {
                Capsule()
                    .fill(Color.white.opacity(0.3))
                    .frame(width: 36, height: 4)
                    .padding(.top, 10)
                
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("رادار جسور بغداد")
                            .font(.system(size: 20, weight: .black))
                            .foregroundColor(.white)
                        Text("مؤشرات السرعة والازدحام اللحظية على نهر دجلة")
                            .font(.system(size: 11))
                            .foregroundColor(.gray)
                    }
                    Spacer()
                    
                    Button(action: { presentationMode.wrappedValue.dismiss() }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 22))
                            .foregroundColor(.gray)
                    }
                }
                .padding(.horizontal, 20)
                
                ScrollView {
                    VStack(spacing: 10) {
                        ForEach(bridgesManager.bridges) { bridge in
                            BridgeCardView(bridge: bridge)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 20)
                }
            }
        }
    }
}

struct BridgeCardView: View {
    let bridge: BaghdadBridge
    
    var body: some View {
        HStack(spacing: 14) {
            // Speed Circle
            ZStack {
                Circle()
                    .fill(colorForSpeed(bridge.speedKmh).opacity(0.18))
                    .frame(width: 48, height: 48)
                
                VStack(spacing: 0) {
                    Text("\(bridge.speedKmh)")
                        .font(.system(size: 16, weight: .black, design: .rounded))
                        .foregroundColor(colorForSpeed(bridge.speedKmh))
                    Text("كم/س")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundColor(.gray)
                }
            }
            
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(bridge.nameArabic)
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundColor(.white)
                    
                    if bridge.isFastestRoute {
                        Text("الأسرع حالياً")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.green)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.green.opacity(0.18))
                            .cornerRadius(6)
                    }
                }
                
                Text(bridge.statusArabic)
                    .font(.system(size: 11))
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                Text("+\(bridge.delayMinutes) د")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(bridge.delayMinutes > 8 ? .red : .green)
                Text("تأخير")
                    .font(.system(size: 9))
                    .foregroundColor(.gray)
            }
        }
        .padding(12)
        .background(Color(red: 0.11, green: 0.14, blue: 0.20))
        .cornerRadius(16)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.08), lineWidth: 1))
    }
    
    private func colorForSpeed(_ speed: Int) -> Color {
        if speed >= 50 { return .green }
        if speed >= 25 { return .orange }
        return .red
    }
}
