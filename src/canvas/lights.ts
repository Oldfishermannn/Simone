interface Light {
  x: number;
  y: number;
  color: string;
  intensity: number; // 0-1
  phase: number;    // for ambient pulse offset
}

const LIGHT_COLORS = ['#ff3333', '#ffaa00', '#3399ff', '#bb44ff'] as const;

export class StageLights {
  private lights: Light[] = [];
  private time = 0;
  private neonPhase = 0;

  init(canvasWidth: number): void {
    this.lights = LIGHT_COLORS.map((color, i) => ({
      x: (canvasWidth / (LIGHT_COLORS.length + 1)) * (i + 1),
      y: 40,
      color,
      intensity: 0.3,
      phase: (i / LIGHT_COLORS.length) * Math.PI * 2,
    }));
  }

  update(dt: number, energy: number, isPlaying: boolean): void {
    this.time += dt;
    this.neonPhase += dt * 1.2;

    for (const light of this.lights) {
      if (isPlaying) {
        // Pulse intensity with overall energy + individual phase offset
        light.intensity = 0.4 + energy * 0.6 * (0.7 + 0.3 * Math.sin(this.time * 6 + light.phase));
      } else {
        // Gentle ambient glow
        light.intensity = 0.15 + 0.1 * Math.sin(this.time * 1.5 + light.phase);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const light of this.lights) {
      const radius = 120 + light.intensity * 80;
      const grad = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, radius);
      // Parse hex color and build rgba
      const r = parseInt(light.color.slice(1, 3), 16);
      const g = parseInt(light.color.slice(3, 5), 16);
      const b = parseInt(light.color.slice(5, 7), 16);
      grad.addColorStop(0, `rgba(${r},${g},${b},${(light.intensity * 0.9).toFixed(2)})`);
      grad.addColorStop(0.4, `rgba(${r},${g},${b},${(light.intensity * 0.35).toFixed(2)})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(light.x, light.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawNeonBar(ctx: CanvasRenderingContext2D, width: number): void {
    const h = 6;
    // Phase-shifting pink <-> cyan gradient
    const phase = this.neonPhase;
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    // Oscillate stop colors between pink and cyan
    const t = (Math.sin(phase) + 1) / 2; // 0-1
    const c1 = `rgba(255,${Math.round(0 + t * 255)},255,0.9)`;    // pink->white->cyan
    const c2 = `rgba(0,255,${Math.round(255 - t * 255)},0.9)`;     // cyan->green->...
    grad.addColorStop(0, '#ff00ff');
    grad.addColorStop(0.3 + 0.2 * Math.sin(phase * 0.7), c1);
    grad.addColorStop(0.5, '#00ffff');
    grad.addColorStop(0.7 + 0.15 * Math.cos(phase * 0.9), c2);
    grad.addColorStop(1, '#ff00ff');

    ctx.save();
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, h);

    // Second thin bright line
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(0, h - 1, width, 2);
    ctx.restore();
  }

  /** Reposition lights after canvas resize */
  resize(canvasWidth: number): void {
    if (this.lights.length === 0) return;
    const count = this.lights.length;
    this.lights.forEach((light, i) => {
      light.x = (canvasWidth / (count + 1)) * (i + 1);
    });
  }
}
