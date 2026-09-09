import { hashRandom2, makeRng } from '../engine/Rand';

export const TILE_SIZE = 40;

export type TileCode = '.' | '#' | '^' | 'L' | 'W' | ' ';

export interface TileMapDef {
  rows: string[];
}

export interface BiomePalette {
  floor: string;
  floorAlt: string;
  wall: string;
  wallShade: string;
  chasm: string;
  lava: string;
  water: string;
}

export class TileMap {
  readonly width: number;
  readonly height: number;
  readonly tiles: TileCode[][];
  private cache: HTMLCanvasElement | null = null;
  private cacheKey = '';
  private hazardTiles: { gx: number; gy: number; tile: TileCode; seed: number }[] = [];

  constructor(def: TileMapDef) {
    this.tiles = def.rows.map((row) => row.split('') as TileCode[]);
    this.height = this.tiles.length;
    this.width = Math.max(...this.tiles.map((r) => r.length));
    for (let gy = 0; gy < this.height; gy++) {
      for (let gx = 0; gx < this.width; gx++) {
        const t = this.tileAt(gx, gy);
        if (t === 'L' || t === 'W') {
          this.hazardTiles.push({ gx, gy, tile: t, seed: hashRandom2(gx, gy) * 1000 });
        }
      }
    }
  }

  tileAt(gx: number, gy: number): TileCode {
    if (gy < 0 || gy >= this.height || gx < 0 || gx >= this.width) return '#';
    return this.tiles[gy][gx] ?? '#';
  }

  setTile(gx: number, gy: number, tile: TileCode): void {
    if (gy < 0 || gy >= this.height || gx < 0 || gx >= this.width) return;
    this.tiles[gy][gx] = tile;
  }

  worldWidth(): number {
    return this.width * TILE_SIZE;
  }

  worldHeight(): number {
    return this.height * TILE_SIZE;
  }

  isSolidTile(tile: TileCode): boolean {
    return tile === '#' || tile === '^';
  }

  render(ctx: CanvasRenderingContext2D, biome: BiomePalette, time: number): void {
    const key = JSON.stringify(biome);
    if (!this.cache || this.cacheKey !== key) {
      this.cache = this.buildCache(biome);
      this.cacheKey = key;
    }
    ctx.drawImage(this.cache, 0, 0);
    this.renderHazards(ctx, biome, time);
  }

  private buildCache(biome: BiomePalette): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.worldWidth();
    canvas.height = this.worldHeight();
    const ctx = canvas.getContext('2d')!;

    for (let gy = 0; gy < this.height; gy++) {
      for (let gx = 0; gx < this.width; gx++) {
        const t = this.tileAt(gx, gy);
        const px = gx * TILE_SIZE;
        const py = gy * TILE_SIZE;
        if (t === '#') {
          this.paintWall(ctx, px, py, gx, gy, biome);
        } else if (t === '^') {
          this.paintChasm(ctx, px, py, gx, gy);
        } else {
          this.paintFloor(ctx, px, py, gx, gy, biome, t);
        }
      }
    }

    // Ambient occlusion: darken the floor edge where it meets a wall/chasm.
    for (let gy = 0; gy < this.height; gy++) {
      for (let gx = 0; gx < this.width; gx++) {
        const t = this.tileAt(gx, gy);
        if (t === '#' || t === '^') continue;
        const px = gx * TILE_SIZE;
        const py = gy * TILE_SIZE;
        this.paintEdgeAO(ctx, px, py, gx, gy);
      }
    }

    return canvas;
  }

  private neighborSolid(gx: number, gy: number): boolean {
    const t = this.tileAt(gx, gy);
    return t === '#' || t === '^';
  }

  private paintFloor(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    gx: number,
    gy: number,
    biome: BiomePalette,
    t: TileCode,
  ): void {
    const base = t === '.' && (gx + gy) % 2 === 0 ? biome.floorAlt : biome.floor;
    ctx.fillStyle = base;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    if (t === 'L') {
      ctx.fillStyle = 'rgba(20, 6, 2, 0.55)';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    } else if (t === 'W') {
      ctx.fillStyle = 'rgba(4, 16, 24, 0.35)';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    }

    // Fine speckle grain, deterministic per tile so it never flickers.
    const rng = makeRng(gx * 9176 + gy * 5323 + 7);
    const speckleCount = 4;
    for (let i = 0; i < speckleCount; i++) {
      const sx = px + rng() * TILE_SIZE;
      const sy = py + rng() * TILE_SIZE;
      const light = rng() > 0.5;
      ctx.fillStyle = light ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.09)';
      const r = 1 + rng() * 2.2;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Faint mortar seam between floor tiles.
    ctx.strokeStyle = 'rgba(0,0,0,0.10)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

    if (t === 'L') {
      // A few cracked-rock lines across the vent floor.
      ctx.strokeStyle = 'rgba(255,140,50,0.5)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px + rng() * TILE_SIZE, py);
      ctx.lineTo(px + rng() * TILE_SIZE, py + TILE_SIZE);
      ctx.stroke();
    } else if (t === 'W') {
      ctx.strokeStyle = 'rgba(160,220,255,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py + TILE_SIZE * 0.3 + rng() * 8);
      ctx.quadraticCurveTo(px + TILE_SIZE / 2, py + rng() * TILE_SIZE, px + TILE_SIZE, py + TILE_SIZE * 0.6);
      ctx.stroke();
    }
  }

  private paintWall(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    gx: number,
    gy: number,
    biome: BiomePalette,
  ): void {
    ctx.fillStyle = biome.wall;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Brick coursing: two half-height rows in a running-bond pattern, so the
    // vertical seam alternates side on every other row.
    const brickH = TILE_SIZE / 2;
    const offsetLeft = gy % 2 === 0;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, py + brickH);
    ctx.lineTo(px + TILE_SIZE, py + brickH);
    const seamX = offsetLeft ? px + TILE_SIZE / 2 : px;
    if (seamX > px) {
      ctx.moveTo(seamX, py);
      ctx.lineTo(seamX, py + brickH);
    }
    ctx.stroke();

    // Per-brick subtle shade variance.
    const rng = makeRng(gx * 733 + gy * 1931 + 41);
    for (let i = 0; i < 2; i++) {
      const shade = rng() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)';
      ctx.fillStyle = shade;
      ctx.fillRect(px, py + i * brickH, TILE_SIZE, brickH);
    }

    // Grime speckles.
    for (let i = 0; i < 3; i++) {
      const sx = px + rng() * TILE_SIZE;
      const sy = py + rng() * TILE_SIZE;
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.arc(sx, sy, 1 + rng() * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Top highlight bevel only where the wall faces open space above.
    if (!this.neighborSolid(gx, gy - 1)) {
      const grad = ctx.createLinearGradient(0, py, 0, py + 8);
      grad.addColorStop(0, 'rgba(255,255,255,0.22)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(px, py, TILE_SIZE, 8);
    }
    // Bottom contact shadow where a wall meets floor below (reads as depth).
    if (!this.neighborSolid(gx, gy + 1)) {
      const grad = ctx.createLinearGradient(0, py + TILE_SIZE - 10, 0, py + TILE_SIZE);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, biome.wallShade);
      ctx.fillStyle = grad;
      ctx.fillRect(px, py + TILE_SIZE - 10, TILE_SIZE, 10);
    }
  }

  private paintChasm(ctx: CanvasRenderingContext2D, px: number, py: number, gx: number, gy: number): void {
    const grad = ctx.createRadialGradient(
      px + TILE_SIZE / 2,
      py + TILE_SIZE / 2,
      2,
      px + TILE_SIZE / 2,
      py + TILE_SIZE / 2,
      TILE_SIZE * 0.75,
    );
    grad.addColorStop(0, '#1a1f2e');
    grad.addColorStop(1, '#020204');
    ctx.fillStyle = grad;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    const rng = makeRng(gx * 331 + gy * 971 + 3);
    for (let i = 0; i < 3; i++) {
      const sx = px + rng() * TILE_SIZE;
      const sy = py + rng() * TILE_SIZE;
      ctx.fillStyle = `rgba(180,200,255,${0.08 + rng() * 0.1})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.6 + rng() * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private paintEdgeAO(ctx: CanvasRenderingContext2D, px: number, py: number, gx: number, gy: number): void {
    const size = 12;
    if (this.neighborSolid(gx, gy - 1)) {
      const g = ctx.createLinearGradient(0, py, 0, py + size);
      g.addColorStop(0, 'rgba(0,0,0,0.30)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(px, py, TILE_SIZE, size);
    }
    if (this.neighborSolid(gx, gy + 1)) {
      const g = ctx.createLinearGradient(0, py + TILE_SIZE - size, 0, py + TILE_SIZE);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.30)');
      ctx.fillStyle = g;
      ctx.fillRect(px, py + TILE_SIZE - size, TILE_SIZE, size);
    }
    if (this.neighborSolid(gx - 1, gy)) {
      const g = ctx.createLinearGradient(px, 0, px + size, 0);
      g.addColorStop(0, 'rgba(0,0,0,0.30)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(px, py, size, TILE_SIZE);
    }
    if (this.neighborSolid(gx + 1, gy)) {
      const g = ctx.createLinearGradient(px + TILE_SIZE - size, 0, px + TILE_SIZE, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.30)');
      ctx.fillStyle = g;
      ctx.fillRect(px + TILE_SIZE - size, py, size, TILE_SIZE);
    }
  }

  private renderHazards(ctx: CanvasRenderingContext2D, biome: BiomePalette, time: number): void {
    for (const h of this.hazardTiles) {
      const px = h.gx * TILE_SIZE;
      const py = h.gy * TILE_SIZE;
      if (h.tile === 'L') {
        const pulse = 0.5 + 0.5 * Math.sin(time * 2.2 + h.seed);
        const grad = ctx.createRadialGradient(
          px + TILE_SIZE / 2,
          py + TILE_SIZE / 2,
          2,
          px + TILE_SIZE / 2,
          py + TILE_SIZE / 2,
          TILE_SIZE * 0.7,
        );
        grad.addColorStop(0, `rgba(255,${180 + pulse * 40 | 0},60,${0.55 + pulse * 0.25})`);
        grad.addColorStop(0.6, biome.lava);
        grad.addColorStop(1, 'rgba(60,10,4,0.4)');
        ctx.fillStyle = grad;
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);

        // Rising embers.
        for (let i = 0; i < 2; i++) {
          const t = ((time * 0.4 + h.seed * 0.13 + i * 0.5) % 1);
          const ex = px + TILE_SIZE * (0.3 + 0.4 * Math.sin(h.seed + i));
          const ey = py + TILE_SIZE * (1 - t);
          ctx.fillStyle = `rgba(255,200,120,${1 - t})`;
          ctx.beginPath();
          ctx.arc(ex, ey, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const shimmer = 0.5 + 0.5 * Math.sin(time * 1.4 + h.seed);
        ctx.fillStyle = `rgba(150,220,255,${0.10 + shimmer * 0.1})`;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = `rgba(220,245,255,${0.15 + shimmer * 0.2})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        const waveY = py + TILE_SIZE * 0.5 + Math.sin(time * 2 + h.seed) * 4;
        ctx.moveTo(px, waveY);
        ctx.quadraticCurveTo(px + TILE_SIZE / 2, waveY - 6, px + TILE_SIZE, waveY);
        ctx.stroke();
      }
    }
  }
}

