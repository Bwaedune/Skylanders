import { TileMap, TILE_SIZE } from './TileMap';
import { moveWithCollision, collides, type Solid } from './Physics';
import type { LevelDef } from '../data/levels';
import { ENEMY_DEFS } from '../data/enemies';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { Switch, Gate, PushBlock, Barrier, Chest, ExitPortal } from '../entities/Interactive';
import type { CharacterDef } from '../data/characters';
import { Vec2, rectsOverlap, dist } from '../engine/Vec';
import { Camera } from '../engine/Camera';
import { Input } from '../engine/Input';
import { SaveManager } from '../save/SaveManager';

export type LevelStatus = 'playing' | 'won' | 'lost';

interface Effect {
  pos: Vec2;
  color: string;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
}

export interface HUD {
  health: number;
  maxHealth: number;
  glimmer: number;
  shards: number;
  secondaryPct: number;
  bossName: string | null;
  bossHealth: number;
  bossMaxHealth: number;
  hint: string;
  message: string | null;
}

const KEYS = {
  up: ['w', 'arrowup'],
  down: ['s', 'arrowdown'],
  left: ['a', 'arrowleft'],
  right: ['d', 'arrowright'],
  attack: [' ', 'j', 'f'],
  secondary: ['k', 'shift'],
};

export class Level {
  def: LevelDef;
  map: TileMap;
  player: Player;
  enemies: Enemy[] = [];
  boss: Enemy | null = null;
  projectiles: Projectile[] = [];
  switches: Switch[] = [];
  gates: Gate[] = [];
  pushBlocks: PushBlock[] = [];
  barriers: Barrier[] = [];
  chests: Chest[] = [];
  exitPortal: ExitPortal;
  camera = new Camera();
  status: LevelStatus = 'playing';
  time = 0;
  message: string | null = null;
  private messageTimer = 0;
  private effects: Effect[] = [];
  private save: SaveManager;
  private turret: { pos: Vec2; timer: number; tickTimer: number } | null = null;
  collectedGlimmer = 0;
  collectedShards = 0;

  constructor(def: LevelDef, character: CharacterDef, save: SaveManager) {
    this.def = def;
    this.save = save;
    this.map = new TileMap({ rows: def.map });

    this.player = new Player(
      def.playerStart.gx * TILE_SIZE + TILE_SIZE / 2,
      def.playerStart.gy * TILE_SIZE + TILE_SIZE / 2,
      character,
    );

    for (const s of def.switches) this.switches.push(new Switch(s.gx, s.gy, s.requiresGiant));
    for (const g of def.gates) this.gates.push(new Gate(g.gx, g.gy));
    for (const b of def.pushBlocks) this.pushBlocks.push(new PushBlock(b.gx, b.gy));
    for (const b of def.barriers) this.barriers.push(new Barrier(b.gx, b.gy, b.element, b.requiresGiant));
    for (const c of def.chests) this.chests.push(new Chest(c.gx, c.gy, c.glimmer, c.shards));
    for (const e of def.enemies) {
      const enemyDef = ENEMY_DEFS[e.type];
      this.enemies.push(new Enemy(e.gx * TILE_SIZE + TILE_SIZE / 2, e.gy * TILE_SIZE + TILE_SIZE / 2, enemyDef));
    }
    if (def.boss) {
      const bossDef = ENEMY_DEFS[def.boss.type];
      this.boss = new Enemy(def.boss.gx * TILE_SIZE + TILE_SIZE / 2, def.boss.gy * TILE_SIZE + TILE_SIZE / 2, bossDef);
    }
    this.exitPortal = new ExitPortal(def.exit.gx, def.exit.gy);
  }

  private isKeyDown(input: Input, names: string[]): boolean {
    return names.some((n) => input.isDown(n));
  }
  private wasKeyPressed(input: Input, names: string[]): boolean {
    return names.some((n) => input.wasPressed(n));
  }

  private solidBlockers(exclude?: Solid): Solid[] {
    const list: Solid[] = [];
    for (const g of this.gates) if (!g.open) list.push(g);
    for (const b of this.barriers) if (!b.cleared) list.push(b);
    for (const p of this.pushBlocks) if (p !== exclude) list.push(p);
    return list;
  }

  private passableTile = (tile: string): boolean => {
    return tile === '^' && this.player.def.element === 'gale';
  };

  update(dt: number, input: Input): void {
    if (this.status !== 'playing') return;
    this.time += dt;
    this.player.tickTimers(dt);
    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0) this.message = null;
    }

    this.handleMovement(dt, input);
    this.handleActions(input);
    this.updateSwitchesAndGates();
    this.updateHazards(dt);
    this.updateChests();
    this.updateProjectiles(dt);
    this.updateEnemies(dt);
    this.updateTurret(dt);
    this.updateEffects(dt);
    this.checkExit();

    if (this.player.health <= 0) {
      this.status = 'lost';
    }
  }

  private handleMovement(dt: number, input: Input): void {
    let dx = 0;
    let dy = 0;
    if (this.isKeyDown(input, KEYS.up)) dy -= 1;
    if (this.isKeyDown(input, KEYS.down)) dy += 1;
    if (this.isKeyDown(input, KEYS.left)) dx -= 1;
    if (this.isKeyDown(input, KEYS.right)) dx += 1;

    this.player.moving = dx !== 0 || dy !== 0;
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx = (dx / len) * this.player.def.speed * dt;
      dy = (dy / len) * this.player.def.speed * dt;
      if (dx > 0) this.player.facing = 1;
      if (dx < 0) this.player.facing = -1;
    }

    // Push-block resolution: attempt to move a block if the player is
    // walking into it and its far side is clear.
    for (const block of this.pushBlocks) {
      const bounds = this.player.bounds();
      const nextPlayerRect = { x: bounds.x + dx, y: bounds.y + dy, w: bounds.w, h: bounds.h };
      if (rectsOverlap(nextPlayerRect, block.bounds())) {
        const blockBounds = block.bounds();
        const dest = { x: blockBounds.x + dx, y: blockBounds.y + dy, w: blockBounds.w, h: blockBounds.h };
        const blocked = collides(dest, this.map, this.solidBlockers(block), this.passableTile);
        if (!blocked) {
          block.pos.x += dx;
          block.pos.y += dy;
        }
      }
    }

    const rect = this.player.bounds();
    const result = moveWithCollision(rect, dx, dy, this.map, this.solidBlockers(), this.passableTile);
    this.player.pos.x = result.x + rect.w / 2;
    this.player.pos.y = result.y + rect.h / 2;
  }

  private handleActions(input: Input): void {
    if (this.wasKeyPressed(input, KEYS.attack) && this.player.canAttack()) {
      this.player.triggerAttack();
      this.performPrimaryAttack();
    }
    if (this.wasKeyPressed(input, KEYS.secondary) && this.player.canUseSecondary()) {
      this.player.triggerSecondary();
      this.performSecondaryAbility();
    }
  }

  private allEnemies(): Enemy[] {
    return this.boss && this.boss.alive ? [...this.enemies, this.boss] : this.enemies;
  }

  private performPrimaryAttack(): void {
    const p = this.player;
    if (p.def.attackType === 'melee') {
      const hb = p.attackHitbox();
      for (const e of this.allEnemies()) {
        if (rectsOverlap(hb, e.bounds())) {
          e.takeDamage(p.def.attackDamage);
        }
      }
    } else {
      const dir = new Vec2(p.facing, 0);
      this.projectiles.push(
        new Projectile(p.pos.x + p.facing * 20, p.pos.y, dir, 360, p.def.attackDamage, p.def.accent, true),
      );
    }
  }

  private showMessage(text: string, duration = 2.2): void {
    this.message = text;
    this.messageTimer = duration;
  }

  private spawnEffect(pos: Vec2, color: string, maxRadius: number): void {
    this.effects.push({ pos: pos.clone(), color, radius: 0, maxRadius, life: 0.5, maxLife: 0.5 });
  }

  private performSecondaryAbility(): void {
    const p = this.player;
    const front = new Vec2(p.pos.x + p.facing * 60, p.pos.y);
    this.spawnEffect(p.def.isGiant ? p.pos : front, p.def.accent, p.def.isGiant ? 130 : 90);

    switch (p.def.id) {
      case 'cinderjaw': {
        for (const e of this.allEnemies()) {
          if (dist(e.pos.x, e.pos.y, front.x, front.y) < 90) e.takeDamage(24);
        }
        break;
      }
      case 'squallwing':
      case 'prism': {
        const dashDist = p.def.id === 'prism' ? 140 : 110;
        for (const frac of [1, 0.7, 0.4, 0]) {
          const tx = p.pos.x + p.facing * dashDist * frac;
          const rect = { x: tx - p.width / 2, y: p.pos.y - p.height / 2, w: p.width, h: p.height };
          const blockers = p.def.id === 'prism' ? [] : this.solidBlockers();
          if (!collides(rect, this.map, blockers, this.passableTile) || p.def.id === 'prism') {
            p.pos.x = tx;
            p.glideTimer = 0.5;
            break;
          }
        }
        break;
      }
      case 'brinehook': {
        for (const e of this.allEnemies()) {
          const d = dist(e.pos.x, e.pos.y, p.pos.x, p.pos.y);
          if (d < 110) {
            e.takeDamage(16);
            const push = new Vec2(e.pos.x - p.pos.x, e.pos.y - p.pos.y).normalized().scale(40);
            e.pos.x += push.x;
            e.pos.y += push.y;
          }
        }
        break;
      }
      case 'rubblehorn': {
        for (const frac of [1, 0.7, 0.4, 0]) {
          const tx = p.pos.x + p.facing * 130 * frac;
          const rect = { x: tx - p.width / 2, y: p.pos.y - p.height / 2, w: p.width, h: p.height };
          if (!collides(rect, this.map, this.solidBlockers(), this.passableTile)) {
            p.pos.x = tx;
            break;
          }
        }
        for (const e of this.allEnemies()) {
          if (dist(e.pos.x, e.pos.y, p.pos.x, p.pos.y) < 70) e.takeDamage(30);
        }
        break;
      }
      case 'sparkwrench': {
        this.turret = { pos: p.pos.clone(), timer: 6, tickTimer: 0 };
        break;
      }
      case 'hollowmask': {
        for (const e of this.allEnemies()) {
          const d = dist(e.pos.x, e.pos.y, p.pos.x, p.pos.y);
          if (d < 130) {
            e.attackTimer = Math.max(e.attackTimer, 2.2);
            const push = new Vec2(e.pos.x - p.pos.x, e.pos.y - p.pos.y).normalized().scale(60);
            e.pos.x += push.x;
            e.pos.y += push.y;
          }
        }
        break;
      }
      case 'thornbud': {
        p.heal(30);
        break;
      }
      case 'boulderguard':
      case 'magmatitan': {
        for (const e of this.allEnemies()) {
          if (dist(e.pos.x, e.pos.y, p.pos.x, p.pos.y) < 130) {
            e.takeDamage(20);
            e.attackTimer = Math.max(e.attackTimer, 1.2);
          }
        }
        for (const b of this.barriers) {
          if (!b.cleared && b.requiresGiant && dist(b.pos.x, b.pos.y, p.pos.x, p.pos.y) < 130) {
            b.cleared = true;
            this.showMessage('The rockfall seal shatters!');
          }
        }
        for (const sw of this.switches) {
          if (sw.requiresGiant && !sw.pressed && dist(sw.pos.x, sw.pos.y, p.pos.x, p.pos.y) < 130) {
            sw.tryPress(true);
          }
        }
        break;
      }
    }
  }

  private updateSwitchesAndGates(): void {
    for (const sw of this.switches) {
      const overlapsPlayer = rectsOverlap(this.player.bounds(), sw.bounds());
      const overlapsBlock = this.pushBlocks.some((b) => rectsOverlap(b.bounds(), sw.bounds()));
      if (overlapsPlayer || overlapsBlock) {
        sw.tryPress(this.player.isGiant);
      }
      if (sw.wasJustTriggered()) {
        const idx = this.switches.indexOf(sw);
        const def = this.def.switches[idx];
        for (const gi of def.opensGates) this.gates[gi].open = true;
        for (const bi of def.opensBarriers ?? []) this.barriers[bi].cleared = true;
        this.showMessage('A mechanism grinds open somewhere nearby...');
      }
    }

    // Barriers cleared by walking into them with the matching element/giant.
    for (const b of this.barriers) {
      if (b.cleared) continue;
      const near = dist(b.pos.x, b.pos.y, this.player.pos.x, this.player.pos.y) < TILE_SIZE * 0.8;
      if (near && b.canClear(this.player.def.element, this.player.isGiant)) {
        b.cleared = true;
        this.showMessage(b.requiresGiant ? 'A Giant clears the rockfall seal!' : 'The barrier gives way!');
      }
    }
  }

  private updateHazards(dt: number): void {
    const gx = Math.floor(this.player.pos.x / TILE_SIZE);
    const gy = Math.floor(this.player.pos.y / TILE_SIZE);
    const tile = this.map.tileAt(gx, gy);
    if (tile === 'L' && this.player.def.element !== 'ember') {
      this.player.takeDamage(28 * dt);
    } else if (tile === 'W' && this.player.def.element !== 'tide') {
      this.player.takeDamage(10 * dt);
      this.player.vel = this.player.vel.scale(0.9);
    }
  }

  private updateChests(): void {
    for (const c of this.chests) {
      if (!c.opened && rectsOverlap(this.player.bounds(), c.bounds())) {
        c.opened = true;
        this.collectedGlimmer += c.glimmer;
        this.collectedShards += c.shards ?? 0;
        this.save.addCurrency(c.glimmer, c.shards ?? 0);
        this.showMessage(
          c.shards ? `Found a Hero Crystal! +${c.shards} shards` : `Found treasure! +${c.glimmer} glimmer`,
        );
      }
    }
  }

  private updateProjectiles(dt: number): void {
    for (const proj of this.projectiles) {
      proj.update(dt);
      if (!proj.alive) continue;
      const gx = Math.floor(proj.pos.x / TILE_SIZE);
      const gy = Math.floor(proj.pos.y / TILE_SIZE);
      if (this.map.isSolidTile(this.map.tileAt(gx, gy)) && !this.passableTile(this.map.tileAt(gx, gy))) {
        proj.alive = false;
        continue;
      }
      for (const blocker of this.solidBlockers()) {
        if (rectsOverlap(proj.bounds(), blocker.bounds())) proj.alive = false;
      }
      if (proj.fromPlayer) {
        for (const e of this.allEnemies()) {
          if (e.alive && rectsOverlap(proj.bounds(), e.bounds())) {
            e.takeDamage(proj.damage);
            proj.alive = false;
          }
        }
      } else if (rectsOverlap(proj.bounds(), this.player.bounds())) {
        this.player.takeDamage(proj.damage);
        proj.alive = false;
      }
    }
    this.projectiles = this.projectiles.filter((p) => p.alive);
  }

  private updateEnemies(dt: number): void {
    const tryMove = (e: Enemy) => (dx: number, dy: number) => {
      const rect = e.bounds();
      const result = moveWithCollision(rect, dx, dy, this.map, this.solidBlockers(), this.passableTile);
      e.pos.x = result.x + rect.w / 2;
      e.pos.y = result.y + rect.h / 2;
    };
    const spawnProjectile = (proj: Projectile) => this.projectiles.push(proj);

    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.update(dt, this.player.pos, tryMove(e), spawnProjectile, (dmg) => this.player.takeDamage(dmg));
    }
    const wasBossAlive = this.boss?.alive;
    if (this.boss && this.boss.alive) {
      this.boss.update(dt, this.player.pos, tryMove(this.boss), spawnProjectile, (dmg) =>
        this.player.takeDamage(dmg),
      );
    }
    if (wasBossAlive && this.boss && !this.boss.alive) {
      this.save.addCurrency(this.boss.def.glimmerDrop, 0);
      this.exitPortal.active = true;
      this.showMessage(`${this.def.boss?.name ?? 'The boss'} is defeated! The way is open.`);
    }

    for (const e of this.enemies) {
      if (!e.alive) {
        this.save.addCurrency(e.def.glimmerDrop, 0);
      }
    }
    this.enemies = this.enemies.filter((e) => e.alive);

    if (!this.def.boss) this.exitPortal.active = true;
  }

  private updateTurret(dt: number): void {
    if (!this.turret) return;
    this.turret.timer -= dt;
    this.turret.tickTimer -= dt;
    if (this.turret.timer <= 0) {
      this.turret = null;
      return;
    }
    if (this.turret.tickTimer <= 0) {
      this.turret.tickTimer = 0.5;
      let nearest: Enemy | null = null;
      let nearestD = 220;
      for (const e of this.allEnemies()) {
        const d = dist(e.pos.x, e.pos.y, this.turret.pos.x, this.turret.pos.y);
        if (d < nearestD) {
          nearestD = d;
          nearest = e;
        }
      }
      if (nearest) {
        nearest.takeDamage(8);
        this.spawnEffect(nearest.pos, '#f6d132', 24);
      }
    }
  }

  private updateEffects(dt: number): void {
    for (const fx of this.effects) {
      fx.life -= dt;
      fx.radius = fx.maxRadius * (1 - fx.life / fx.maxLife);
    }
    this.effects = this.effects.filter((fx) => fx.life > 0);
  }

  private checkExit(): void {
    if (this.exitPortal.active && dist(this.player.pos.x, this.player.pos.y, this.exitPortal.pos.x, this.exitPortal.pos.y) < TILE_SIZE * 0.6) {
      this.status = 'won';
    }
  }

  getHUD(): HUD {
    return {
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      glimmer: this.save.get().glimmer,
      shards: this.save.get().shards,
      secondaryPct: 1 - this.player.secondaryCooldown / this.player.secondaryMax,
      bossName: this.boss && this.boss.alive ? this.def.boss?.name ?? null : null,
      bossHealth: this.boss?.health ?? 0,
      bossMaxHealth: this.boss?.def.health ?? 0,
      hint: this.def.hint,
      message: this.message,
    };
  }

  render(ctx: CanvasRenderingContext2D, viewW: number, viewH: number): void {
    this.camera.follow(this.player.pos.x, this.player.pos.y, viewW, viewH, this.map.worldWidth(), this.map.worldHeight(), 1 / 60);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, viewW, viewH);

    ctx.save();
    this.camera.apply(ctx);

    this.map.render(ctx, this.def.biome);

    for (const b of this.barriers) b.render(ctx);
    for (const g of this.gates) g.render(ctx);
    for (const s of this.switches) s.render(ctx);
    for (const c of this.chests) c.render(ctx);
    for (const p of this.pushBlocks) p.render(ctx);
    this.exitPortal.render(ctx, this.time);

    if (this.turret) {
      ctx.fillStyle = '#f6d132';
      ctx.beginPath();
      ctx.arc(this.turret.pos.x, this.turret.pos.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8a6a1a';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const drawables = [...this.enemies, this.player, ...(this.boss?.alive ? [this.boss] : [])].sort(
      (a, b) => a.pos.y - b.pos.y,
    );
    for (const d of drawables) d.render(ctx);

    for (const proj of this.projectiles) proj.render(ctx);

    for (const fx of this.effects) {
      ctx.globalAlpha = Math.max(0, fx.life / fx.maxLife) * 0.7;
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(fx.pos.x, fx.pos.y, fx.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}
