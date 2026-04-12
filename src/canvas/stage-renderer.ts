import type { BandMember, AnimationState, EnergyLevels } from '@/types';
import { Sprite } from './sprite';
import { StageLights } from './lights';

export class StageRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private sprites: Sprite[] = [];
  private members: BandMember[] = [];
  private lights = new StageLights();
  private isPlaying = false;
  private energy: EnergyLevels = { low: 0, mid: 0, high: 0, overall: 0 };
  private rafId: number | null = null;
  private lastTime = 0;
  private destroyed = false;

  init(canvas: HTMLCanvasElement, members: BandMember[]): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.members = members;
    this.lights.init(canvas.width);
    this._createSprites(canvas.width, canvas.height);
    this.lastTime = performance.now();
    this._loop(this.lastTime);
  }

  private _createSprites(w: number, h: number): void {
    this.sprites = this.members.map((m, i) => {
      const sprite = new Sprite(m.id, m.color);
      sprite.x = (w / (this.members.length + 1)) * (i + 1);
      // Place characters at ~75% canvas height (stage floor area)
      sprite.y = h * 0.78;
      return sprite;
    });
  }

  private _loop = (timestamp: number): void => {
    if (this.destroyed) return;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1); // cap at 100ms
    this.lastTime = timestamp;
    this.update(dt);
    this._render();
    this.rafId = requestAnimationFrame(this._loop);
  };

  update(dt: number): void {
    if (!this.canvas) return;

    // Map energy bands to instruments
    // low → drums / bass, mid → guitar / vocals, high → keys
    for (const sprite of this.sprites) {
      const member = this.members.find(m => m.id === sprite.characterId);
      if (!member) continue;

      let bandEnergy = 0;
      if (member.instrument === 'drums' || member.instrument === 'bass') {
        bandEnergy = this.energy.low;
      } else if (member.instrument === 'guitar' || member.instrument === 'vocals') {
        bandEnergy = this.energy.mid;
      } else if (member.instrument === 'keys') {
        bandEnergy = this.energy.high;
      }
      sprite.energy = bandEnergy;
      sprite.update(dt);
    }

    this.lights.update(dt, this.energy.overall, this.isPlaying);
  }

  private _render(): void {
    const canvas = this.canvas;
    const ctx = this.ctx;
    if (!canvas || !ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // 1. Dark background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);

    // 2. Neon top bar
    this.lights.drawNeonBar(ctx, w);

    // 3. "CYBER BAND" title
    this._drawTitle(ctx, w);

    // 4. Stage floor gradient
    this._drawFloor(ctx, w, h);

    // 5. Stage lights
    this.lights.draw(ctx);

    // 6. Sprites
    for (const sprite of this.sprites) {
      sprite.draw(ctx);
    }

    // 7. Character name labels
    this._drawLabels(ctx);
  }

  private _drawTitle(ctx: CanvasRenderingContext2D, w: number): void {
    ctx.save();
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 18;
    ctx.fillText('CYBER BAND', w / 2, 36);
    // Second pass for extra glow
    ctx.shadowBlur = 36;
    ctx.globalAlpha = 0.4;
    ctx.fillText('CYBER BAND', w / 2, 36);
    ctx.restore();
  }

  private _drawFloor(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const floorY = h * 0.80;
    const grad = ctx.createLinearGradient(0, floorY, 0, h);
    grad.addColorStop(0, 'rgba(0,255,255,0.08)');
    grad.addColorStop(0.3, 'rgba(255,0,255,0.06)');
    grad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, floorY, w, h - floorY);

    // Floor line
    ctx.save();
    ctx.strokeStyle = 'rgba(0,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(w, floorY);
    ctx.stroke();
    ctx.restore();
  }

  private _drawLabels(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.sprites.length; i++) {
      const sprite = this.sprites[i];
      const member = this.members[i];
      if (!member) continue;

      ctx.save();
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = member.color;
      ctx.shadowColor = member.color;
      ctx.shadowBlur = 8;
      ctx.fillText(member.name, sprite.x, sprite.y + 16);

      // Instrument in smaller text
      ctx.font = '9px "Courier New", monospace';
      ctx.globalAlpha = 0.7;
      ctx.shadowBlur = 4;
      ctx.fillText(member.instrument.toUpperCase(), sprite.x, sprite.y + 28);
      ctx.restore();
    }
  }

  // --- Public API ---

  setPlaying(playing: boolean): void {
    this.isPlaying = playing;
    const state: AnimationState = playing ? 'playing' : 'idle';
    for (const sprite of this.sprites) {
      // Don't override 'talking' state
      if (sprite.state !== 'talking') {
        sprite.state = state;
      }
    }
  }

  setEnergy(levels: EnergyLevels): void {
    this.energy = levels;
  }

  getCharacterAtPoint(x: number, y: number): string | null {
    // Check in reverse order (front sprites on top visually)
    for (let i = this.sprites.length - 1; i >= 0; i--) {
      if (this.sprites[i].containsPoint(x, y)) {
        return this.members[i]?.id ?? null;
      }
    }
    return null;
  }

  setCharacterState(id: string, state: AnimationState): void {
    const sprite = this.sprites.find(s => s.characterId === id);
    if (sprite) {
      sprite.state = state;
    }
  }

  resize(w: number, h: number, members: BandMember[]): void {
    if (!this.canvas) return;
    this.canvas.width = w;
    this.canvas.height = h;
    this.members = members;
    this.lights.resize(w);
    this._createSprites(w, h);
  }

  destroy(): void {
    this.destroyed = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.canvas = null;
    this.ctx = null;
  }
}
