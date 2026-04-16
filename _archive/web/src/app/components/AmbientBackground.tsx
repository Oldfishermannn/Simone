'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Rich multi-stop gradients
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

// Particle colors per genre — [primary, secondary, tertiary]
const GENRE_PARTICLE_COLORS: Record<string, [string, string, string]> = {
  default: ['201,160,220', '180,200,230', '220,180,200'],
  chill: ['140,200,240', '180,160,220', '160,220,200'],
  jazz: ['240,190,120', '220,160,100', '200,140,80'],
  rock: ['240,80,100', '220,60,160', '200,100,120'],
  electronic: ['80,140,255', '160,80,240', '100,200,255'],
  lofi: ['170,180,190', '150,160,180', '190,185,175'],
  funk: ['240,210,80', '240,160,80', '255,130,100'],
  rnb: ['200,100,240', '240,120,200', '160,80,220'],
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  opacity: number;
  baseOpacity: number;
  colorIdx: number;
  pulsePhase: number;
  pulseSpeed: number;
  driftAngle: number;
  driftSpeed: number;
  life: number; // 0-1, particles fade in then drift
}

interface Props {
  genre: string;
}

const PARTICLE_COUNT = 60;

export default function AmbientBackground({ genre }: Props) {
  const [current, setCurrent] = useState(GENRE_GRADIENTS.default);
  const [next, setNext] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef(0);
  const genreRef = useRef(genre);

  // Update genre ref for particle colors
  useEffect(() => {
    genreRef.current = genre;
  }, [genre]);

  // Create a particle
  const createParticle = useCallback((w: number, h: number, forceNew?: boolean): Particle => {
    const isBig = Math.random() < 0.15; // 15% chance of big particle
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: isBig ? 2 + Math.random() * 4 : 0.8 + Math.random() * 2,
      baseRadius: isBig ? 2 + Math.random() * 4 : 0.8 + Math.random() * 2,
      opacity: forceNew ? 0 : Math.random() * 0.6,
      baseOpacity: 0.15 + Math.random() * 0.5,
      colorIdx: Math.floor(Math.random() * 3),
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.005 + Math.random() * 0.02,
      driftAngle: Math.random() * Math.PI * 2,
      driftSpeed: 0.0003 + Math.random() * 0.001,
      life: forceNew ? 0 : 0.5 + Math.random() * 0.5,
    };
  }, []);

  // Initialize particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    };
    resize();
    window.addEventListener('resize', resize);

    // Create initial particles
    if (particlesRef.current.length === 0) {
      const w = canvas.width;
      const h = canvas.height;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particlesRef.current.push(createParticle(w, h));
      }
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const colors = GENRE_PARTICLE_COLORS[genreRef.current] || GENRE_PARTICLE_COLORS.default;

      particlesRef.current.forEach((p) => {
        // Update life (fade in)
        if (p.life < 1) p.life = Math.min(1, p.life + 0.005);

        // Pulse
        p.pulsePhase += p.pulseSpeed;
        const pulse = Math.sin(p.pulsePhase);
        p.radius = p.baseRadius * (1 + pulse * 0.4);
        p.opacity = p.baseOpacity * (0.6 + pulse * 0.4) * p.life;

        // Drift — circular motion overlay
        p.driftAngle += p.driftSpeed;
        const driftX = Math.cos(p.driftAngle) * 0.15;
        const driftY = Math.sin(p.driftAngle) * 0.15;

        // Move
        p.x += (p.vx + driftX) * dpr;
        p.y += (p.vy + driftY) * dpr;

        // Wrap around edges
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        // Draw glow
        const color = colors[p.colorIdx];
        const r = p.radius * dpr;
        const glowR = r * 4;

        // Outer glow
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        glow.addColorStop(0, `rgba(${color}, ${p.opacity * 0.3})`);
        glow.addColorStop(0.4, `rgba(${color}, ${p.opacity * 0.1})`);
        glow.addColorStop(1, `rgba(${color}, 0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(p.x - glowR, p.y - glowR, glowR * 2, glowR * 2);

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${p.opacity * 0.8})`;
        ctx.fill();
      });

      // Draw connecting lines between nearby particles (subtle constellation effect)
      const maxDist = 120 * dpr;
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const a = particlesRef.current[i];
          const b = particlesRef.current[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const lineOpacity = (1 - dist / maxDist) * 0.06 * Math.min(a.life, b.life);
            const color = colors[a.colorIdx];
            ctx.strokeStyle = `rgba(${color}, ${lineOpacity})`;
            ctx.lineWidth = 0.5 * dpr;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [createParticle]);

  // Gradient crossfade
  useEffect(() => {
    const target = GENRE_GRADIENTS[genre] || GENRE_GRADIENTS.default;
    if (target === current) return;

    setNext(target);
    setTransitioning(true);

    const timer = setTimeout(() => {
      setCurrent(target);
      setNext(null);
      setTransitioning(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [genre, current]);

  return (
    <div className="fixed inset-0 -z-10 noise-overlay">
      {/* Base gradient */}
      <div
        className="absolute inset-0 transition-opacity duration-[2000ms]"
        style={{ background: current }}
      />

      {/* Next gradient (crossfade) */}
      {next && (
        <div
          className="absolute inset-0 transition-opacity duration-[2000ms]"
          style={{ background: next, opacity: transitioning ? 1 : 0 }}
        />
      )}

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)',
        }}
      />
    </div>
  );
}
