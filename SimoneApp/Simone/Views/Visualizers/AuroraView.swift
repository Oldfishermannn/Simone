import SwiftUI

struct AuroraView: View {
    let spectrumData: [Float]

    var body: some View {
        Canvas { context, size in
            let w = size.width
            let h = size.height
            let colors: [Color] = [
                MorandiPalette.rose,
                MorandiPalette.mauve,
                MorandiPalette.sage,
                MorandiPalette.blue,
            ]

            for layer in 0..<4 {
                let offset = Float(layer) * 0.15
                var path = Path()
                path.move(to: CGPoint(x: 0, y: h))

                let points = 32
                for i in 0...points {
                    let x = w * CGFloat(i) / CGFloat(points)
                    let bin = min(i * spectrumData.count / max(points, 1), spectrumData.count - 1)
                    let value = spectrumData[max(0, bin)]
                    let baseY = h * (0.6 - CGFloat(layer) * 0.08)
                    let amplitude = h * 0.35 * CGFloat(value + offset * 0.5)
                    let y = baseY - amplitude

                    if i == 0 {
                        path.addLine(to: CGPoint(x: x, y: y))
                    } else {
                        let prevX = w * CGFloat(i - 1) / CGFloat(points)
                        let cx = (prevX + x) / 2
                        path.addQuadCurve(
                            to: CGPoint(x: x, y: y),
                            control: CGPoint(x: cx, y: y - CGFloat(value) * 20)
                        )
                    }
                }

                path.addLine(to: CGPoint(x: w, y: h))
                path.closeSubpath()

                context.opacity = 0.25 - Double(layer) * 0.04
                context.fill(
                    path,
                    with: .linearGradient(
                        Gradient(colors: [
                            colors[layer].opacity(0.8),
                            colors[layer].opacity(0.1)
                        ]),
                        startPoint: CGPoint(x: w/2, y: 0),
                        endPoint: CGPoint(x: w/2, y: h)
                    )
                )
            }
        }
        .frame(height: 180)
    }
}
