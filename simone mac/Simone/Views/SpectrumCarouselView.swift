import SwiftUI

struct SpectrumCarouselView: View {
    @Bindable var state: AppState

    @State private var currentIndex: Int = 0
    @State private var scrollPosition: Int? = 0

    private let styles = VisualizerStyle.allCases

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30.0)) { _ in
            let spectrumData = state.audioEngine.spectrumData

            ScrollView(.horizontal, showsIndicators: false) {
                LazyHStack(spacing: 0) {
                    ForEach(Array(styles.enumerated()), id: \.element.id) { index, style in
                        visualizerView(for: style, spectrumData: spectrumData)
                            .containerRelativeFrame(.horizontal)
                            .id(index)
                    }
                }
                .scrollTargetLayout()
            }
            .scrollTargetBehavior(.paging)
            .scrollPosition(id: $scrollPosition)
            .onChange(of: scrollPosition) { _, newValue in
                if let idx = newValue {
                    currentIndex = idx
                    state.selectedVisualizer = styles[idx]
                }
            }
        }
        .overlay(alignment: .bottom) {
            // Dot indicators centered at bottom
            HStack(spacing: 4) {
                ForEach(Array(styles.enumerated()), id: \.element.id) { index, _ in
                    Circle()
                        .fill(
                            index == currentIndex
                                ? MorandiPalette.rose
                                : Color.white.opacity(0.3)
                        )
                        .frame(width: index == currentIndex ? 6 : 5,
                               height: index == currentIndex ? 6 : 5)
                }
            }
            .padding(.bottom, 6)
            .animation(.spring(response: 0.3, dampingFraction: 0.7), value: currentIndex)
        }
        .clipped()
        .overlay(
            ScrollWheelOverlay { delta in
                let newIndex: Int
                if delta > 0 {
                    newIndex = max(0, currentIndex - 1)
                } else {
                    newIndex = min(styles.count - 1, currentIndex + 1)
                }
                if newIndex != currentIndex {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.75)) {
                        scrollPosition = newIndex
                    }
                }
            }
        )
    }

    @ViewBuilder
    private func visualizerView(for style: VisualizerStyle, spectrumData: [Float]) -> some View {
        switch style {
        case .fountain:
            FountainView(spectrumData: spectrumData)
        case .aurora:
            AuroraView(spectrumData: spectrumData)
        case .vinyl:
            VinylView(spectrumData: spectrumData)
        case .silkWave:
            SilkWaveView(spectrumData: spectrumData)
        case .constellation:
            ConstellationView(spectrumData: spectrumData)
        case .particleFlow:
            ParticleFlowView(spectrumData: spectrumData)
        case .ripple:
            RippleView(spectrumData: spectrumData)
        case .ringPulse:
            RingPulseView(spectrumData: spectrumData)
        }
    }
}

// MARK: - Mouse scroll wheel capture

private struct ScrollWheelOverlay: NSViewRepresentable {
    let onScroll: (_ deltaX: CGFloat) -> Void

    func makeNSView(context: Context) -> ScrollWheelView {
        let view = ScrollWheelView()
        view.onScroll = onScroll
        return view
    }

    func updateNSView(_ nsView: ScrollWheelView, context: Context) {
        nsView.onScroll = onScroll
    }
}

private class ScrollWheelView: NSView {
    var onScroll: ((_ deltaX: CGFloat) -> Void)?
    private var accumulated: CGFloat = 0
    private let threshold: CGFloat = 15

    override func scrollWheel(with event: NSEvent) {
        let delta = abs(event.scrollingDeltaX) > abs(event.scrollingDeltaY)
            ? event.scrollingDeltaX
            : -event.scrollingDeltaY

        accumulated += delta

        if abs(accumulated) > threshold {
            onScroll?(accumulated)
            accumulated = 0
        }
    }
}
