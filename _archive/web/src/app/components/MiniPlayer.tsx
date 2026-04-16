'use client';

import { useRef, useEffect } from 'react';

// Genre-specific bar colors [start, end]
const GENRE_BAR_COLORS: Record<string, [[number,number,number],[number,number,number]]> = {
  default: [[201,160,220],[232,180,184]],
  chill:   [[140,200,240],[180,160,220]],
  jazz:    [[240,190,120],[220,160,100]],
  rock:    [[240,80,100],[220,60,160]],
  electronic: [[80,140,255],[160,80,240]],
  lofi:    [[170,180,190],[150,160,180]],
  funk:    [[240,210,80],[255,130,100]],
  rnb:     [[200,100,240],[240,120,200]],
};

interface Props {
  isPlaying: boolean;
  genre: string;
  analyser: AnalyserNode | null;
  onTogglePlay: () => void;
}

export default function MiniPlayer({ isPlaying, genre, analyser, onTogglePlay }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const smoothRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const W = 320, H = 56;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const barCount = 48;
    if (!smoothRef.current || smoothRef.current.length !== barCount) {
      smoothRef.current = new Float32Array(barCount);
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      const step = Math.floor(data.length / barCount);
      const barW = W / barCount;
      const gap = 1.2;
      const smooth = smoothRef.current!;

      const colors = GENRE_BAR_COLORS[genre] || GENRE_BAR_COLORS.default;
      const [c1, c2] = colors;

      for (let i = 0; i < barCount; i++) {
        const raw = data[i * step] / 255;
        // Smooth interpolation for fluid motion
        smooth[i] += (raw - smooth[i]) * 0.18;
        const val = smooth[i];

        const barH = Math.max(2.5, val * H * 0.92);
        const x = i * barW + gap;
        const bw = barW - gap * 2;

        // Per-bar gradient from genre start to end color
        const t = i / barCount;
        const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
        const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
        const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);

        // Vertical gradient per bar — bright top, faded bottom
        const grad = ctx.createLinearGradient(x, H - barH, x, H);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.6 + val * 0.4})`);
        grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${0.3 + val * 0.3})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.08)`);
        ctx.fillStyle = grad;

        // Rounded bar
        const radius = bw / 2;
        ctx.beginPath();
        ctx.roundRect(x, H - barH, bw, barH, [radius, radius, 0, 0]);
        ctx.fill();

        // Glow on loud bars
        if (val > 0.5) {
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${(val - 0.5) * 0.8})`;
          ctx.shadowBlur = 8 + val * 12;
          ctx.beginPath();
          ctx.roundRect(x, H - barH, bw, barH, [radius, radius, 0, 0]);
          ctx.fill();
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }

        // Bright cap on top of each bar
        if (barH > 4) {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + val * 0.35})`;
          ctx.beginPath();
          ctx.roundRect(x, H - barH, bw, 2.5, [radius, radius, 0, 0]);
          ctx.fill();
        }
      }

      // Reflection (mirrored, very faint)
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.scale(1, -0.3);
      ctx.translate(0, -H / 0.3 - H);
      for (let i = 0; i < barCount; i++) {
        const val = smooth[i];
        const barH = Math.max(2.5, val * H * 0.92);
        const x = i * barW + gap;
        const bw = barW - gap * 2;
        const t = i / barCount;
        const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
        const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
        const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.3 + val * 0.3})`;
        const radius = bw / 2;
        ctx.beginPath();
        ctx.roundRect(x, H - barH, bw, barH, [radius, radius, 0, 0]);
        ctx.fill();
      }
      ctx.restore();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [analyser, genre]);

  if (!isPlaying && !genre) return null;

  return (
    <div className="glass-strong rounded-2xl mx-4 mb-2 px-4 py-3 flex items-center gap-4 animate-fade-up">
      <button
        onClick={onTogglePlay}
        className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300
                   hover:scale-110 active:scale-95 shadow-lg"
        style={{
          background: 'linear-gradient(135deg, var(--simone-accent), var(--simone-accent-warm))',
          boxShadow: '0 0 16px rgba(201,160,220,0.3)',
        }}
      >
        <span className="text-[#0d0d1a] text-sm font-bold" style={{ marginLeft: isPlaying ? 0 : '2px' }}>
          {isPlaying ? '⏸' : '▶'}
        </span>
      </button>
      <canvas
        ref={canvasRef}
        style={{ width: 320, height: 56 }}
        className="flex-1"
      />
      <span className="text-[11px] text-white/40 capitalize tracking-wider min-w-[50px] text-right"
            style={{ fontFamily: 'var(--font-body)' }}>
        {genre === 'default' ? '' : genre}
      </span>
    </div>
  );
}
