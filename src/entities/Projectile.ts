import { Entity } from './Entity';
import { Vec2 } from '../engine/Vec';

export class Projectile extends Entity {
  damage: number;
  color: string;
  fromPlayer: boolean;
  life = 1.6;

  constructor(x: number, y: number, dir: Vec2, speed: number, damage: number, color: string, fromPlayer: boolean) {
    super(x, y, 10, 10);
    this.vel = dir.normalized().scale(speed);
    this.damage = damage;
    this.color = color;
    this.fromPlayer = fromPlayer;
  }

  update(dt: number): void {
    this.pos = this.pos.add(this.vel.scale(dt));
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
