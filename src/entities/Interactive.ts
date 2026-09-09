import { Entity } from './Entity';
import { TILE_SIZE } from '../world/TileMap';
import type { ElementId } from '../data/elements';
import { ELEMENTS } from '../data/elements';
import type { Rect } from '../engine/Vec';

export class Switch extends Entity {
  pressed = false;
  requiresGiant: boolean;
  linkedGateIds: number[] = [];
  private triggeredOnce = false;

  constructor(gx: number, gy: number, requiresGiant = false) {
    super(gx * TILE_SIZE + TILE_SIZE / 2, gy * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE * 0.8, TILE_SIZE * 0.8);
    this.requiresGiant = requiresGiant;
  }

  tryPress(isGiant: boolean): boolean {
    if (this.requiresGiant && !isGiant) return false;
    if (!this.pressed) {
      this.pressed = true;
      this.triggeredOnce = true;
    }
    return true;
  }

  wasJustTriggered(): boolean {
    if (this.triggeredOnce) {
      this.triggeredOnce = false;
      return true;
    }
    return false;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.pressed ? '#5fe07a' : this.requiresGiant ? '#c9a86b' : '#e0b84f';
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, TILE_SIZE * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 3;
    ctx.stroke();
    if (this.requiresGiant) {
      ctx.fillStyle = '#2a2a2a';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('G', this.pos.x, this.pos.y + 5);
    }
  }
}

export class Gate extends Entity {
  open = false;

  constructor(gx: number, gy: number) {
    super(gx * TILE_SIZE + TILE_SIZE / 2, gy * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
  }

  bounds(): Rect {
    if (this.open) return { x: -9999, y: -9999, w: 0, h: 0 };
    return super.bounds();
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.open) return;
    ctx.fillStyle = '#4a4a5a';
    ctx.fillRect(this.pos.x - this.width / 2, this.pos.y - this.height / 2, this.width, this.height);
    ctx.strokeStyle = '#1a1a24';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.pos.x - this.width / 2, this.pos.y - this.height / 2, this.width, this.height);
  }
}

export class PushBlock extends Entity {
  constructor(gx: number, gy: number) {
    super(gx * TILE_SIZE + TILE_SIZE / 2, gy * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE * 0.9, TILE_SIZE * 0.9);
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#8a6a45';
    ctx.fillRect(this.pos.x - this.width / 2, this.pos.y - this.height / 2, this.width, this.height);
    ctx.strokeStyle = '#5a4227';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.pos.x - this.width / 2, this.pos.y - this.height / 2, this.width, this.height);
  }
}

/** An element-locked obstacle. Cleared permanently when the active hero's
 * element matches (and, for giant seals, when the hero is a Giant). */
export class Barrier extends Entity {
  cleared = false;
  requiredElement: ElementId | null;
  requiresGiant: boolean;

  constructor(gx: number, gy: number, requiredElement: ElementId | null, requiresGiant = false) {
    super(gx * TILE_SIZE + TILE_SIZE / 2, gy * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
    this.requiredElement = requiredElement;
    this.requiresGiant = requiresGiant;
  }

  canClear(element: ElementId, isGiant: boolean): boolean {
    if (this.requiresGiant) return isGiant;
    return this.requiredElement === element;
  }

  bounds(): Rect {
    if (this.cleared) return { x: -9999, y: -9999, w: 0, h: 0 };
    return super.bounds();
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.cleared) return;
    const color = this.requiresGiant ? '#c9a86b' : this.requiredElement ? ELEMENTS[this.requiredElement].color : '#888';
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(this.pos.x - this.width / 2, this.pos.y - this.height / 2, this.width, this.height);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.pos.x - this.width / 2, this.pos.y - this.height / 2, this.width, this.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.requiresGiant ? '⛰' : '✦', this.pos.x, this.pos.y + 6);
  }
}

export class Chest extends Entity {
  opened = false;
  glimmer: number;
  shards: number;

  constructor(gx: number, gy: number, glimmer = 50, shards = 0) {
    super(gx * TILE_SIZE + TILE_SIZE / 2, gy * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE * 0.7, TILE_SIZE * 0.6);
    this.glimmer = glimmer;
    this.shards = shards;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.opened ? '#6b5a3a' : '#e0b84f';
    ctx.fillRect(this.pos.x - this.width / 2, this.pos.y - this.height / 2, this.width, this.height);
    ctx.strokeStyle = '#4a3a1a';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.pos.x - this.width / 2, this.pos.y - this.height / 2, this.width, this.height);
    if (!this.opened) {
      ctx.fillStyle = '#4a3a1a';
      ctx.fillRect(this.pos.x - 3, this.pos.y - this.height / 2, 6, this.height);
    }
  }
}

export class ExitPortal extends Entity {
  active = false;

  constructor(gx: number, gy: number) {
    super(gx * TILE_SIZE + TILE_SIZE / 2, gy * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
  }

  bounds(): Rect {
    return { x: -9999, y: -9999, w: 0, h: 0 };
  }

  render(ctx: CanvasRenderingContext2D, t: number): void {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(t * (this.active ? 2 : 0.3));
    ctx.strokeStyle = this.active ? '#8de07a' : '#555';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, TILE_SIZE * 0.45, 0, Math.PI * 1.5);
    ctx.stroke();
    ctx.restore();
    if (!this.active) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('sealed', this.pos.x, this.pos.y + TILE_SIZE * 0.7);
    }
  }
}
