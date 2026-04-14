'use client';

import { useRef, useEffect } from 'react';

interface Props {
  isPlaying: boolean;
  genre: string;
  analyser: AnalyserNode | null;
  onTogglePlay: () => void;
}

export default function MiniPlayer({ isPlaying, genre, analyser, onTogglePlay }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = 240 * dpr;
    canvas.height = 40 * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      const w = 240, h = 40;
      ctx.clearRect(0, 0, w, h);

      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      // Smooth waveform bars with rounded tops
      const barCount = 40;
      const step = Math.floor(data.length / barCount);
      const barW = w / barCount;
      const gap = 1.5;

      for (let i = 0; i < barCount; i++) {
        const val = data[i * step] / 255;
        const barH = Math.max(2, val * h * 0.85);
        const x = i * barW + gap;
        const bw = barW - gap * 2;

        // Gradient from accent to warm accent
        const t = i / barCount;
        const r = Math.round(201 + (232 - 201) * t);
        const g = Math.round(160 + (180 - 160) * t);
        const b = Math.round(220 + (184 - 220) * t);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.3 + val * 0.5})`;

        // Rounded rectangle
        const radius = bw / 2;
        ctx.beginPath();
        ctx.roundRect(x, h - barH, bw, barH, [radius, radius, 0, 0]);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [analyser]);

  if (!isPlaying && !genre) return null;

  return (
    <div className="glass-strong rounded-2xl mx-4 mb-2 px-4 py-3 flex items-center gap-4 animate-fade-up">
      <button
        onClick={onTogglePlay}
        className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300
                   hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, var(--simone-accent), var(--simone-accent-warm))',
        }}
      >
        <span className="text-[#0d0d1a] text-xs" style={{ marginLeft: isPlaying ? 0 : '1px' }}>
          {isPlaying ? '⏸' : '▶'}
        </span>
      </button>
      <canvas
        ref={canvasRef}
        style={{ width: 240, height: 40 }}
        className="flex-1 opacity-90"
      />
      <span className="text-[11px] text-white/40 capitalize tracking-wider min-w-[50px] text-right"
            style={{ fontFamily: 'var(--font-body)' }}>
        {genre === 'default' ? '' : genre}
      </span>
    </div>
  );
}
