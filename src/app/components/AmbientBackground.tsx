'use client';

import { useState, useEffect } from 'react';

// Rich multi-stop gradients with warm, atmospheric feel
const GENRE_GRADIENTS: Record<string, string> = {
  default: 'radial-gradient(ellipse at 20% 80%, #1a1a3e 0%, #0d0d1a 50%, #0a0a12 100%)',
  chill: 'radial-gradient(ellipse at 30% 70%, #2d1b3d 0%, #1a2744 40%, #0d1520 100%)',
  jazz: 'radial-gradient(ellipse at 70% 80%, #2a1a0e 0%, #1a1025 40%, #0d0d14 100%)',
  rock: 'radial-gradient(ellipse at 50% 100%, #2a0a1a 0%, #1a0a2e 40%, #0d0d14 100%)',
  electronic: 'radial-gradient(ellipse at 80% 20%, #0a1a2e 0%, #150a30 40%, #0d0d14 100%)',
  lofi: 'radial-gradient(ellipse at 40% 60%, #1a1a20 0%, #15151e 40%, #0d0d14 100%)',
  funk: 'radial-gradient(ellipse at 60% 90%, #2a1a0a 0%, #1a1025 40%, #0d0d14 100%)',
  rnb: 'radial-gradient(ellipse at 50% 70%, #1a0a30 0%, #200a20 40%, #0d0d14 100%)',
};

// Subtle accent orb colors per genre
const GENRE_ORBS: Record<string, [string, string]> = {
  default: ['rgba(201, 160, 220, 0.08)', 'rgba(180, 200, 230, 0.05)'],
  chill: ['rgba(160, 200, 230, 0.12)', 'rgba(180, 160, 220, 0.08)'],
  jazz: ['rgba(230, 180, 120, 0.12)', 'rgba(200, 140, 100, 0.06)'],
  rock: ['rgba(230, 100, 120, 0.10)', 'rgba(200, 80, 160, 0.06)'],
  electronic: ['rgba(100, 140, 230, 0.12)', 'rgba(160, 100, 230, 0.08)'],
  lofi: ['rgba(160, 170, 180, 0.08)', 'rgba(140, 150, 170, 0.05)'],
  funk: ['rgba(230, 200, 100, 0.10)', 'rgba(230, 140, 100, 0.06)'],
  rnb: ['rgba(180, 100, 220, 0.12)', 'rgba(220, 120, 180, 0.08)'],
};

interface Props {
  genre: string;
}

export default function AmbientBackground({ genre }: Props) {
  const [current, setCurrent] = useState({ gradient: GENRE_GRADIENTS.default, orbs: GENRE_ORBS.default });
  const [next, setNext] = useState<{ gradient: string; orbs: [string, string] } | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const targetGradient = GENRE_GRADIENTS[genre] || GENRE_GRADIENTS.default;
    const targetOrbs = GENRE_ORBS[genre] || GENRE_ORBS.default;
    if (targetGradient === current.gradient) return;

    setNext({ gradient: targetGradient, orbs: targetOrbs });
    setTransitioning(true);

    const timer = setTimeout(() => {
      setCurrent({ gradient: targetGradient, orbs: targetOrbs });
      setNext(null);
      setTransitioning(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [genre, current.gradient]);

  return (
    <div className="fixed inset-0 -z-10 noise-overlay">
      {/* Base gradient */}
      <div
        className="absolute inset-0 transition-opacity duration-[2000ms]"
        style={{ background: current.gradient }}
      />

      {/* Floating orbs for depth */}
      <div
        className="absolute w-[60vmax] h-[60vmax] rounded-full blur-[120px] animate-breathe"
        style={{
          background: current.orbs[0],
          top: '20%', left: '-10%',
          transition: 'background 2s ease',
        }}
      />
      <div
        className="absolute w-[40vmax] h-[40vmax] rounded-full blur-[100px] animate-breathe"
        style={{
          background: current.orbs[1],
          bottom: '10%', right: '-5%',
          animationDelay: '1.5s',
          transition: 'background 2s ease',
        }}
      />

      {/* Next gradient (crossfade) */}
      {next && (
        <>
          <div
            className="absolute inset-0 transition-opacity duration-[2000ms]"
            style={{
              background: next.gradient,
              opacity: transitioning ? 1 : 0,
            }}
          />
          <div
            className="absolute w-[60vmax] h-[60vmax] rounded-full blur-[120px] transition-opacity duration-[2000ms]"
            style={{
              background: next.orbs[0],
              top: '20%', left: '-10%',
              opacity: transitioning ? 1 : 0,
            }}
          />
        </>
      )}

      {/* Subtle vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </div>
  );
}
