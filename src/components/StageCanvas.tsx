'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { BandMember, EnergyLevels } from '@/types';
import { StageRenderer } from '@/canvas/stage-renderer';

interface StageCanvasProps {
  members: BandMember[];
  isPlaying: boolean;
  energy: EnergyLevels;
  onCharacterClick: (characterId: string) => void;
}

export default function StageCanvas({
  members,
  isPlaying,
  energy,
  onCharacterClick,
}: StageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<StageRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Init renderer on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const renderer = new StageRenderer();
    rendererRef.current = renderer;

    // Set initial canvas size to container dimensions
    const { width, height } = container.getBoundingClientRect();
    canvas.width = Math.max(width, 320);
    canvas.height = Math.max(height, 200);

    renderer.init(canvas, members);

    // Sync initial props
    renderer.setPlaying(isPlaying);
    renderer.setEnergy(energy);

    // ResizeObserver for responsive sizing
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          renderer.resize(w, h, members);
        }
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      renderer.destroy();
      rendererRef.current = null;
    };
    // Only run on mount — members identity is stable for preset characters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync isPlaying
  useEffect(() => {
    rendererRef.current?.setPlaying(isPlaying);
  }, [isPlaying]);

  // Sync energy
  useEffect(() => {
    rendererRef.current?.setEnergy(energy);
  }, [energy]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const renderer = rendererRef.current;
      if (!canvas || !renderer) return;

      const rect = canvas.getBoundingClientRect();
      // Map CSS pixels to canvas pixels
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const characterId = renderer.getCharacterAtPoint(x, y);
      if (characterId) {
        onCharacterClick(characterId);
      }
    },
    [onCharacterClick],
  );

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="w-full h-full cursor-pointer"
        style={{ display: 'block' }}
      />
    </div>
  );
}
