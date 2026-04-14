import SwiftUI

struct VinylView: View {
    let spectrumData: [Float]
    @State private var rotation: Double = 0

    var body: some View {
        ZStack {
            Circle()
                .fill(
                    RadialGradient(
                        colors: [Color.white.opacity(0.08), Color.white.opacity(0.02)],
                        center: .center, startRadius: 20, endRadius: 60
                    )
                )
                .frame(width: 120, height: 120)
                .overlay(Circle().stroke(Color.white.opacity(0.1), lineWidth: 0.5))
                .rotationEffect(.degrees(rotation))

            Circle()
                .fill(MorandiPalette.rose.opacity(0.3))
                .frame(width: 30, height: 30)
                .rotationEffect(.degrees(rotation))

            Canvas { context, size in
                let center = CGPoint(x: size.width/2, y: size.height/2)
                let barCount = 24
                let innerRadius: CGFloat = 65
                let maxBarLength: CGFloat = 40

                for i in 0..<barCount {
                    let angle = (Double(i) / Double(barCount)) * 2 * .pi - .pi / 2
                    let bin = min(i * spectrumData.count / barCount, spectrumData.count - 1)
                    let value = CGFloat(spectrumData[max(0, bin)])
                    let barLength = max(4, value * maxBarLength)

                    let x1 = center.x + innerRadius * cos(angle)
                    let y1 = center.y + innerRadius * sin(angle)
                    let x2 = center.x + (innerRadius + barLength) * cos(angle)
                    let y2 = center.y + (innerRadius + barLength) * sin(angle)

                    var barPath = Path()
                    barPath.move(to: CGPoint(x: x1, y: y1))
                    barPath.addLine(to: CGPoint(x: x2, y: y2))

                    context.stroke(
                        barPath,
                        with: .color(MorandiPalette.color(at: i).opacity(0.8)),
                        lineWidth: 3
                    )
                }
            }
        }
        .frame(height: 180)
        .onAppear {
            withAnimation(.linear(duration: 8).repeatForever(autoreverses: false)) {
                rotation = 360
            }
        }
    }
}
