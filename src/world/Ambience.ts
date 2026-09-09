interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

/** Lightweight drifting dust motes for atmosphere. Purely cosmetic, so plain
 * Math.random() is fine here — nothing about gameplay depends on it. */
export class Ambience {
  private motes: Mote[] = [];
  private worldW: number;
  private worldH: number;

  constructor(worldW: number, worldH: number, count = 22) {
    this.worldW = worldW;
    this.worldH = worldH;
    for (let i = 0; i < count; i++) {
      this.motes.push({
        x: Math.random() * worldW,
        y: Math.random() * worldH,
        vx: (Math.random() - 0.5) * 8,
        vy: -4 - Math.random() * 6,
        size: 1 + Math.random() * 1.6,
        alpha: 0.08 + Math.random() * 0.16,
      });
    }
  }

  update(dt: number): void {
    for (const m of this.motes) {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.x < 0) m.x += this.worldW;
      if (m.x > this.worldW) m.x -= this.worldW;
      if (m.y < 0) m.y += this.worldH;
      if (m.y > this.worldH) m.y -= this.worldH;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const m of this.motes) {
      ctx.fillStyle = `rgba(255,255,255,${m.alpha})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
