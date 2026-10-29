import SwiftUI

public struct LiquidGlassModifier: ViewModifier {
    public var cornerRadius: CGFloat = 22
    public var isInteractive: Bool = false
    
    public init(cornerRadius: CGFloat = 22, isInteractive: Bool = false) {
        self.cornerRadius = cornerRadius
        self.isInteractive = isInteractive
    }
    
    public func body(content: Content) -> some View {
        content
            .background(
                ZStack {
                    // Optical blur base
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .fill(.ultraThinMaterial)
                    
                    // Real Liquid Glass Specular Reflection (Top highlight)
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(0.22),
                                    Color.white.opacity(0.06),
                                    Color.clear
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                }
            )
            .overlay(
                // Double-edged refractive glass bevel
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(
                        LinearGradient(
                            stops: [
                                .init(color: Color.white.opacity(0.65), location: 0.0),
                                .init(color: Color.white.opacity(0.25), location: 0.35),
                                .init(color: Color.white.opacity(0.08), location: 0.7),
                                .init(color: Color.white.opacity(0.03), location: 1.0)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1.2
                    )
            )
            .shadow(color: Color.black.opacity(0.38), radius: 24, x: 0, y: 10)
            .shadow(color: Color.black.opacity(0.12), radius: 6, x: 0, y: 2)
    }
}

public extension View {
    func liquidGlass(cornerRadius: CGFloat = 22, isInteractive: Bool = false) -> some View {
        self.modifier(LiquidGlassModifier(cornerRadius: cornerRadius, isInteractive: isInteractive))
    }
}
