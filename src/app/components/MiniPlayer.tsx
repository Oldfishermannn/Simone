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

    const draw = () => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      const barCount = 32;
      const step = Math.floor(data.length / barCount);
      const barW = w / barCount;

      for (let i = 0; i < barCount; i++) {
        const val = data[i * step] / 255;
        const barH = val * h;
        ctx.fillStyle = `rgba(233, 69, 96, ${0.4 + val * 0.6})`;
        ctx.fillRect(i * barW + 1, h - barH, barW - 2, barH);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [analyser]);

  if (!isPlaying && !genre) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 backdrop-blur-md bg-black/30 rounded-xl mx-4 mb-2">
      <button
        onClick={onTogglePlay}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white"
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      <canvas
        ref={canvasRef}
        width={200}
        height={32}
        className="flex-1 h-8 rounded opacity-80"
      />
      <span className="text-xs text-white/60 capitalize">{genre || ''}</span>
    </div>
  );
}
