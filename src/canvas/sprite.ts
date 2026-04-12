import type { AnimationState } from '@/types';

// Sprite sheet config: 32x48 frames, 7 per row, 3 rows
const FRAME_W = 32;
const FRAME_H = 48;
const FRAMES_PER_ROW = 7;

const ANIM_CONFIG: Record<AnimationState, { row: number; frameCount: number; fps: number }> = {
  idle:    { row: 0, frameCount: 4, fps: 4 },
  playing: { row: 1, frameCount: 7, fps: 8 },
  talking: { row: 2, frameCount: 4, fps: 6 },
};

export class Sprite {
  characterId: string;
  color: string;
  state: AnimationState = 'idle';
  x = 0;
  y = 0;
  scale = 3;
  energy = 0; // 0-1

  private image: HTMLImageElement | null = null;
  private loaded = false;
  private frame = 0;
  private frameTime = 0;

  constructor(characterId: string, color: string) {
    this.characterId = characterId;
    this.color = color;
  }

  async load(src: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.image = img;
        this.loaded = true;
        resolve();
      };
      img.onerror = () => {
        // Gracefully fall back to placeholder
        this.loaded = false;
        resolve();
      };
      img.src = src;
    });
  }

  update(dt: number): void {
    const config = ANIM_CONFIG[this.state];
    // Energy drives speed: faster when energy is high (playing)
    const speedMult = this.state === 'playing' ? 1 + this.energy * 2 : 1;
    const interval = 1 / (config.fps * speedMult);

    this.frameTime += dt;
    if (this.frameTime >= interval) {
      this.frameTime -= interval;
      this.frame = (this.frame + 1) % config.frameCount;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.loaded && this.image) {
      const config = ANIM_CONFIG[this.state];
      // Frame position in sheet
      const srcX = (this.frame % FRAMES_PER_ROW) * FRAME_W;
      const srcY = config.row * FRAME_H;
      const dw = FRAME_W * this.scale;
      const dh = FRAME_H * this.scale;
      ctx.drawImage(
        this.image,
        srcX, srcY, FRAME_W, FRAME_H,
        this.x - dw / 2, this.y - dh,
        dw, dh,
      );
    } else {
      this.drawPlaceholder(ctx);
    }
  }

  drawPlaceholder(ctx: CanvasRenderingContext2D): void {
    const s = this.scale;
    // Bounce effect when playing
    const bounce = this.state === 'playing'
      ? Math.sin(this.frame * 0.8) * 4 * (1 + this.energy)
      : 0;

    const baseX = this.x;
    const baseY = this.y + bounce;

    ctx.save();

    // --- Head (8x8 px scaled) ---
    const headW = 8 * s;
    const headH = 8 * s;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.state === 'playing' ? 12 + this.energy * 16 : 4;
    ctx.fillRect(baseX - headW / 2, baseY - 24 * s, headW, headH);

    // Eyes
    ctx.fillStyle = '#000';
    ctx.shadowBlur = 0;
    ctx.fillRect(baseX - headW / 2 + 2 * s, baseY - 22 * s, 2 * s, 2 * s);
    ctx.fillRect(baseX + headW / 2 - 4 * s, baseY - 22 * s, 2 * s, 2 * s);

    // Talking mouth animation
    if (this.state === 'talking') {
      const mouthOpen = (this.frame % 2 === 0) ? 2 * s : s;
      ctx.fillStyle = '#000';
      ctx.fillRect(baseX - 2 * s, baseY - 18 * s, 4 * s, mouthOpen);
    }

    // --- Body (10x14 px scaled) ---
    const bodyW = 10 * s;
    const bodyH = 14 * s;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.state === 'playing' ? 8 + this.energy * 10 : 2;

    // Slightly darker body
    ctx.globalAlpha = 0.75;
    ctx.fillRect(baseX - bodyW / 2, baseY - 16 * s, bodyW, bodyH);
    ctx.globalAlpha = 1;

    // --- Legs (two 4x8 px blocks) ---
    const legH = 8 * s;
    const legW = 4 * s;
    const legY = baseY - 2 * s;

    // Leg swing when playing
    const legSwing = this.state === 'playing' ? Math.sin(this.frame * 1.2) * 3 : 0;
    ctx.shadowBlur = 0;
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(baseX - bodyW / 2, legY + legSwing, legW, legH);
    ctx.fillRect(baseX + bodyW / 2 - legW, legY - legSwing, legW, legH);
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  containsPoint(px: number, py: number): boolean {
    const s = this.scale;
    const w = 10 * s;
    const h = 32 * s; // head + body + legs approximate height
    return (
      px >= this.x - w / 2 &&
      px <= this.x + w / 2 &&
      py >= this.y - h &&
      py <= this.y
    );
  }
}
