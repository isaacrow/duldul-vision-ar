import SwiftUI

public struct GeoOffscreenIndicatorView: View {
    let item: GeoARItem
    let onTap: () -> Void
    
    public init(item: GeoARItem, onTap: @escaping () -> Void) {
        self.item = item
        self.onTap = onTap
    }
    
    public var body: some View {
        Button(action: {
            let gen = UIImpactFeedbackGenerator(style: .light)
            gen.impactOccurred()
            onTap()
        }) {
            HStack(spacing: 5) {
                if item.offscreenEdge == .left {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 11, weight: .black))
                        .foregroundColor(.cyan)
                }
                
                VStack(alignment: item.offscreenEdge == .left ? .leading : .trailing, spacing: 1) {
                    Text(item.title)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.white)
                        .lineLimit(1)
                    
                    Text("\(Int(item.distanceMeters))m")
                        .font(.system(size: 9.5, weight: .bold, design: .monospaced))
                        .foregroundColor(.cyan)
                }
                
                if item.offscreenEdge == .right {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 11, weight: .black))
                        .foregroundColor(.cyan)
                }
            }
            .padding(.horizontal, 9)
            .padding(.vertical, 5)
            .background(Color(red: 0.06, green: 0.09, blue: 0.16).opacity(0.85))
            .cornerRadius(12)
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.cyan.opacity(0.4), lineWidth: 1))
            .shadow(color: Color.black.opacity(0.4), radius: 6)
        }
        .buttonStyle(PlainButtonStyle())
    }
}
