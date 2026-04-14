import SwiftUI

struct ConstellationView: View {
    let spectrumData: [Float]

    var body: some View {
        Canvas { context, size in
            let w = size.width
            let h = size.height
            let starCount = 24

            var positions: [CGPoint] = []
            var brightnesses: [CGFloat] = []
            var colors: [Color] = []

            for i in 0..<starCount {
                let bin = min(i * spectrumData.count / starCount, spectrumData.count - 1)
                let value = CGFloat(spectrumData[max(0, bin)])

                let angle = Double(i) / Double(starCount) * 2 * .pi
                let radius = w * 0.3 * (0.5 + value * 0.5)
                let x = w/2 + radius * cos(angle)
                let y = h/2 + radius * sin(angle) * 0.6

                positions.append(CGPoint(x: x, y: y))
                brightnesses.append(value)
                colors.append(MorandiPalette.color(at: i))
            }

            // Draw connections
            for i in 0..<positions.count {
                for j in (i+1)..<positions.count {
                    let dist = hypot(
                        positions[i].x - positions[j].x,
                        positions[i].y - positions[j].y
                    )
                    if dist < w * 0.25 {
                        var line = Path()
                        line.move(to: positions[i])
                        line.addLine(to: positions[j])
                        let opacity = (1 - dist / (w * 0.25)) * 0.15
                        context.stroke(line, with: .color(.white.opacity(opacity)), lineWidth: 0.5)
                    }
                }
            }

            // Draw stars
            for i in 0..<positions.count {
                let starSize = 2 + brightnesses[i] * 6
                let rect = CGRect(
                    x: positions[i].x - starSize/2,
                    y: positions[i].y - starSize/2,
                    width: starSize, height: starSize
                )
                context.fill(
                    Path(ellipseIn: rect),
                    with: .color(colors[i].opacity(0.4 + Double(brightnesses[i]) * 0.6))
                )

                // Glow
                let glowSize = starSize * 3
                let glowRect = CGRect(
                    x: positions[i].x - glowSize/2,
                    y: positions[i].y - glowSize/2,
                    width: glowSize, height: glowSize
                )
                context.fill(
                    Path(ellipseIn: glowRect),
                    with: .color(colors[i].opacity(Double(brightnesses[i]) * 0.15))
                )
            }
        }
        .frame(height: 180)
    }
}
