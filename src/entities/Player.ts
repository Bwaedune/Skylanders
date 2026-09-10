import { Entity } from './Entity';
import { Vec2, clamp } from '../engine/Vec';
import type { CharacterDef } from '../data/characters';
import { drawCreature } from '../engine/Sprite';

export class Player extends Entity {
  def: CharacterDef;
  maxHealth: number;
  health: number;
  facing: 1 | -1 = 1;
  walkPhase = 0;
  moving = false;
  attackTimer = 0;
  attackFlash = 0;
  hurtFlash = 0;
  invuln = 0;
  secondaryCooldown = 0;
  secondaryMax = 4.5;
  glideTimer = 0;
  level = 1;
  attackDamageBonus = 0;

  constructor(x: number, y: number, def: CharacterDef) {
    super(x, y, 34, 34);
    this.def = def;
    this.maxHealth = def.health;
    this.health = def.health;
  }

  get isGiant(): boolean {
    return this.def.isGiant;
  }

  get attackDamage(): number {
    return this.def.attackDamage + this.attackDamageBonus;
  }

  /** Applies persisted per-hero level bonuses: more max health and attack
   * damage the more this specific hero has been used and leveled up. */
  applyLevel(level: number): void {
    this.level = level;
    const growth = 1 + (level - 1) * 0.15;
    this.maxHealth = Math.round(this.def.health * growth);
    this.health = this.maxHealth;
    this.attackDamageBonus = Math.round((level - 1) * this.def.attackDamage * 0.12);
  }

  canAttack(): boolean {
    return this.attackTimer <= 0;
  }

  triggerAttack(): void {
    this.attackTimer = this.def.attackCooldown;
    this.attackFlash = 1;
  }

  canUseSecondary(): boolean {
    return this.secondaryCooldown <= 0;
  }

  triggerSecondary(): void {
    this.secondaryCooldown = this.secondaryMax;
  }

  takeDamage(amount: number): void {
    if (this.invuln > 0) return;
    this.health = clamp(this.health - amount, 0, this.maxHealth);
    this.hurtFlash = 1;
    this.invuln = 0.6;
  }

  heal(amount: number): void {
    this.health = clamp(this.health + amount, 0, this.maxHealth);
  }

  tickTimers(dt: number): void {
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.secondaryCooldown = Math.max(0, this.secondaryCooldown - dt);
    this.attackFlash = Math.max(0, this.attackFlash - dt * 3);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt * 4);
    this.invuln = Math.max(0, this.invuln - dt);
    this.glideTimer = Math.max(0, this.glideTimer - dt);
    if (this.moving) {
      this.walkPhase = (this.walkPhase + dt * 3) % 1;
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
        walkPhase: this.moving ? this.walkPhase : 0.25,
        attackFlash: this.attackFlash,
        hurtFlash: this.hurtFlash,
        scale: this.def.isGiant ? 1.9 : 1.3,
      },
    );
    if (this.invuln > 0 && Math.floor(this.invuln * 20) % 2 === 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.width * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  attackHitbox(): { x: number; y: number; w: number; h: number } {
    const reach = this.def.attackType === 'melee' ? this.def.attackRange : 0;
    const w = reach + this.width / 2;
    const h = this.height;
    const x = this.facing === 1 ? this.pos.x : this.pos.x - w;
    return { x, y: this.pos.y - h / 2, w, h };
  }

  aimDirection(target: Vec2): Vec2 {
    return new Vec2(target.x - this.pos.x, target.y - this.pos.y).normalized();
  }
}
