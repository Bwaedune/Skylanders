import { Entity } from './Entity';
import { Vec2, dist, clamp } from '../engine/Vec';
import { Projectile } from './Projectile';
import type { CreatureShape } from '../engine/Sprite';
import { drawCreature } from '../engine/Sprite';

export interface EnemyDef {
  name: string;
  shape: CreatureShape;
  body: string;
  accent: string;
  eye: string;
  health: number;
  speed: number;
  damage: number;
  attackRange: number;
  attackCooldown: number;
  aggroRange: number;
  kind: 'melee' | 'ranged';
  isBoss?: boolean;
  glimmerDrop: number;
  scale?: number;
}

export class Enemy extends Entity {
  def: EnemyDef;
  health: number;
  attackTimer = 0;
  facing: 1 | -1 = -1;
  walkPhase = Math.random();
  attackFlash = 0;
  hurtFlash = 0;

  constructor(x: number, y: number, def: EnemyDef) {
    super(x, y, def.isBoss ? 64 : 36, def.isBoss ? 64 : 36);
    this.def = def;
    this.health = def.health;
  }

  takeDamage(amount: number): void {
    this.health -= amount;
    this.hurtFlash = 1;
    if (this.health <= 0) this.alive = false;
  }

  update(
    dt: number,
    playerPos: Vec2,
    tryMove: (dx: number, dy: number) => void,
    spawnProjectile: (p: Projectile) => void,
    dealMeleeDamage: (dmg: number) => void,
  ): void {
    this.walkPhase = (this.walkPhase + dt * 2.5) % 1;
    this.attackFlash = Math.max(0, this.attackFlash - dt * 3);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt * 4);
    this.attackTimer = Math.max(0, this.attackTimer - dt);

    const d = dist(this.pos.x, this.pos.y, playerPos.x, playerPos.y);
    const toPlayer = new Vec2(playerPos.x - this.pos.x, playerPos.y - this.pos.y).normalized();
    this.facing = toPlayer.x >= 0 ? 1 : -1;

    if (d <= this.def.aggroRange) {
      if (this.def.kind === 'melee') {
        if (d > this.def.attackRange * 0.7) {
          const move = toPlayer.scale(this.def.speed * dt);
          tryMove(move.x, move.y);
        } else if (this.attackTimer <= 0) {
          this.attackTimer = this.def.attackCooldown;
          this.attackFlash = 1;
          dealMeleeDamage(this.def.damage);
        }
      } else {
        if (d < this.def.attackRange * 0.6) {
          const move = toPlayer.scale(-this.def.speed * dt);
          tryMove(move.x, move.y);
        } else if (d > this.def.attackRange) {
          const move = toPlayer.scale(this.def.speed * dt);
          tryMove(move.x, move.y);
        }
        if (this.attackTimer <= 0 && d <= this.def.attackRange) {
          this.attackTimer = this.def.attackCooldown;
          this.attackFlash = 1;
          spawnProjectile(
            new Projectile(this.pos.x, this.pos.y, toPlayer, 220, this.def.damage, this.def.accent, false),
          );
        }
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawCreature(
      ctx,
      this.pos.x,
      this.pos.y,
      { shape: this.def.shape, body: this.def.body, accent: this.def.accent, eye: this.def.eye },
      {
        facing: this.facing,
        walkPhase: this.walkPhase,
        attackFlash: this.attackFlash,
        hurtFlash: this.hurtFlash,
        scale: this.def.scale ?? (this.def.isBoss ? 2.1 : 1.15),
      },
    );
    // health bar
    const w = this.width;
    const pct = clamp(this.health / this.def.health, 0, 1);
    const barY = this.pos.y - this.height / 2 - (this.def.isBoss ? 26 : 14);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(this.pos.x - w / 2, barY, w, 6);
    ctx.fillStyle = pct > 0.4 ? '#5fe07a' : '#e05f5f';
    ctx.fillRect(this.pos.x - w / 2, barY, w * pct, 6);
  }
}
