'use client';

import { useState, useEffect } from 'react';

const GENRE_GRADIENTS: Record<string, string> = {
  default: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  chill: 'linear-gradient(135deg, #ff6b6b 0%, #ffc371 100%)',
  jazz: 'linear-gradient(135deg, #2c1810 0%, #8b6914 100%)',
  rock: 'linear-gradient(135deg, #1a0a2e 0%, #e94560 100%)',
  electronic: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  lofi: 'linear-gradient(135deg, #2d3436 0%, #636e72 100%)',
  funk: 'linear-gradient(135deg, #f9ca24 0%, #e94560 100%)',
  rnb: 'linear-gradient(135deg, #2d1b69 0%, #e94560 100%)',
};

interface Props {
  genre: string;
}

export default function AmbientBackground({ genre }: Props) {
  const [currentGradient, setCurrentGradient] = useState(GENRE_GRADIENTS.default);
  const [nextGradient, setNextGradient] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const target = GENRE_GRADIENTS[genre] || GENRE_GRADIENTS.default;
    if (target === currentGradient) return;

    setNextGradient(target);
    setTransitioning(true);

    const timer = setTimeout(() => {
      setCurrentGradient(target);
      setNextGradient(null);
      setTransitioning(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [genre, currentGradient]);

  return (
    <div className="fixed inset-0 -z-10">
      <div
        className="absolute inset-0 transition-opacity duration-[1500ms]"
        style={{ background: currentGradient }}
      />
      {nextGradient && (
        <div
          className="absolute inset-0 transition-opacity duration-[1500ms]"
          style={{
            background: nextGradient,
            opacity: transitioning ? 1 : 0,
          }}
        />
      )}
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
}
