import SwiftUI

struct FountainView: View {
    let spectrumData: [Float]
    private let barCount = 24

    var body: some View {
        VStack(spacing: 0) {
            // Arch top
            UnevenRoundedRectangle(
                topLeadingRadius: 140,
                bottomLeadingRadius: 0,
                bottomTrailingRadius: 0,
                topTrailingRadius: 140
            )
            .stroke(Color.white.opacity(0.06), lineWidth: 1)
            .frame(height: 40)
            .background(
                LinearGradient(
                    colors: [Color.white.opacity(0.04), .clear],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .clipShape(UnevenRoundedRectangle(
                    topLeadingRadius: 140,
                    bottomLeadingRadius: 0,
                    bottomTrailingRadius: 0,
                    topTrailingRadius: 140
                ))
            )

            // Bars
            HStack(alignment: .bottom, spacing: 5) {
                ForEach(0..<barCount, id: \.self) { i in
                    let bin = min(i * (spectrumData.count / barCount), spectrumData.count - 1)
                    let value = CGFloat(spectrumData[bin])
                    let height = max(8, value * 130)
                    let color = MorandiPalette.color(at: i)

                    RoundedRectangle(cornerRadius: 3)
                        .fill(
                            LinearGradient(
                                colors: [color.opacity(0.9), color.opacity(0.3)],
                                startPoint: .bottom,
                                endPoint: .top
                            )
                        )
                        .frame(width: 6, height: height)
                        .shadow(color: color.opacity(0.4), radius: 4, y: -2)
                }
            }
            .frame(height: 140, alignment: .bottom)

            // Pool line
            LinearGradient(
                colors: [.clear, MorandiPalette.rose.opacity(0.2), MorandiPalette.mauve.opacity(0.2), .clear],
                startPoint: .leading,
                endPoint: .trailing
            )
            .frame(height: 1)

            // Reflection
            HStack(alignment: .top, spacing: 5) {
                ForEach(0..<barCount, id: \.self) { i in
                    let bin = min(i * (spectrumData.count / barCount), spectrumData.count - 1)
                    let value = CGFloat(spectrumData[bin])
                    let height = max(4, value * 78)

                    RoundedRectangle(cornerRadius: 3)
                        .fill(MorandiPalette.color(at: i).opacity(0.8))
                        .frame(width: 6, height: height)
                }
            }
            .frame(height: 28, alignment: .top)
            .scaleEffect(y: -1)
            .opacity(0.06)
            .mask(
                LinearGradient(colors: [.clear, .white], startPoint: .bottom, endPoint: .top)
            )
        }
        .padding(.horizontal, 16)
    }
}
