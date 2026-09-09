import type { Game, Screen } from '../engine/Game';
import { Level } from '../world/Level';
import { getLevel } from '../data/levels/index';
import { getCharacter } from '../data/characters';
import { el, button } from './dom';

export class LevelScreen implements Screen {
  private level!: Level;
  private game!: Game;
  private hudRoot!: HTMLElement;
  private healthInner!: HTMLElement;
  private healthText!: HTMLElement;
  private glimmerText!: HTMLElement;
  private shardText!: HTMLElement;
  private bossPanel!: HTMLElement;
  private bossName!: HTMLElement;
  private bossInner!: HTMLElement;
  private cooldownRing!: HTMLElement;
  private toast!: HTMLElement;
  private hintEl!: HTMLElement;
  private overlay: HTMLElement | null = null;
  private paused = false;
  private resultShown = false;
  private levelId: string;

  constructor(levelId: string) {
    this.levelId = levelId;
  }

  mount(game: Game): void {
    this.game = game;
    this.startLevel();
  }

  private startLevel(): void {
    const def = getLevel(this.levelId);
    const character = getCharacter(this.game.save.get().selectedCharacter);
    this.level = new Level(def, character, this.game.save);
    this.paused = false;
    this.resultShown = false;
    this.buildHud(def.name, def.subtitle);
  }

  private buildHud(name: string, subtitle: string): void {
    this.hudRoot?.remove();
    this.overlay?.remove();
    this.overlay = null;

    this.healthInner = el('div', { class: 'healthbar-inner' }, []);
    this.healthText = el('div', { style: 'font-size:11px;font-weight:800;margin-top:2px' }, []);
    this.glimmerText = el('span', {}, []);
    this.shardText = el('span', {}, []);
    this.bossName = el('div', { style: 'font-size:12px;font-weight:800;margin-bottom:4px' }, []);
    this.bossInner = el('div', { class: 'healthbar-inner', style: 'background:linear-gradient(180deg,#ff8a7a,#e05f5f)' }, []);
    this.bossPanel = el('div', { class: 'hud-panel', style: 'display:none;position:absolute;top:12px;left:50%;transform:translateX(-50%);width:260px' }, [
      this.bossName,
      el('div', { class: 'healthbar-outer', style: 'width:100%' }, [this.bossInner]),
    ]);
    this.cooldownRing = el('div', { class: 'cooldown-ring' }, ['⚡']);
    this.toast = el('div', { class: 'toast', style: 'display:none' }, []);
    this.hintEl = el('div', { class: 'hud-panel', style: 'position:absolute;bottom:12px;left:12px;max-width:320px;font-size:12px' }, []);

    this.hudRoot = el('div', { class: 'hud-layer' }, [
      el('div', { class: 'hud-top' }, [
        el('div', { class: 'hud-panel', style: 'display:flex;flex-direction:column;gap:4px' }, [
          el('div', { style: 'font-size:11px;font-weight:800;color:#8fe3d0' }, [`${subtitle} · ${name}`]),
          el('div', { class: 'healthbar-outer' }, [this.healthInner]),
          this.healthText,
        ]),
        el('div', { style: 'display:flex;gap:10px;align-items:flex-start' }, [
          el('div', { class: 'hud-panel currency-pill' }, [this.glimmerText, this.shardText]),
          button('❚❚', () => this.togglePause(), 'btn secondary'),
        ]),
      ]),
      this.bossPanel,
      this.toast,
      this.hintEl,
      el('div', { style: 'position:absolute;bottom:14px;right:14px' }, [this.cooldownRing]),
    ]);
    this.game.uiRoot.appendChild(this.hudRoot);
  }

  private togglePause(): void {
    this.paused = !this.paused;
    if (this.paused) {
      this.showOverlay('Paused', [
        { label: 'Resume', action: () => this.togglePause() },
        { label: 'Quit to Bastion', action: () => this.game.goTo({ name: 'hub' }), cls: 'btn secondary' },
      ]);
    } else {
      this.overlay?.remove();
      this.overlay = null;
    }
  }

  private showOverlay(title: string, actions: { label: string; action: () => void; cls?: string }[], body?: string): void {
    this.overlay?.remove();
    this.overlay = el('div', { class: 'overlay' }, [
      el('div', { class: 'panel' }, [
        el('h2', { class: 'title', style: 'margin:0;color:#f6d132' }, [title]),
        ...(body ? [el('p', { class: 'small-hint' }, [body])] : []),
        el(
          'div',
          { class: 'row' },
          actions.map((a) => button(a.label, a.action, a.cls ?? 'btn')),
        ),
      ]),
    ]);
    this.hudRoot.appendChild(this.overlay);
  }

  tick(dt: number): void {
    const input = this.game.input;
    if (input.wasPressed('escape') && !this.resultShown) this.togglePause();

    if (!this.paused && !this.resultShown) {
      this.level.update(dt, input);
    }
    this.level.render(this.game.ctx2d, this.game.canvas.width, this.game.canvas.height);
    this.refreshHud();

    if (this.level.status !== 'playing' && !this.resultShown) {
      this.resultShown = true;
      if (this.level.status === 'won') this.handleWin();
      else this.handleLose();
    }
  }

  private refreshHud(): void {
    const hud = this.level.getHUD();
    const pct = Math.max(0, hud.health / hud.maxHealth);
    this.healthInner.style.width = `${pct * 100}%`;
    this.healthText.textContent = `${Math.ceil(hud.health)} / ${hud.maxHealth} HP`;
    this.glimmerText.textContent = `✦ ${hud.glimmer}`;
    this.shardText.textContent = `◆ ${hud.shards}`;
    this.hintEl.textContent = `💡 ${hud.hint}`;

    if (hud.bossName) {
      this.bossPanel.style.display = 'block';
      this.bossName.textContent = hud.bossName;
      this.bossInner.style.width = `${Math.max(0, hud.bossHealth / hud.bossMaxHealth) * 100}%`;
    } else {
      this.bossPanel.style.display = 'none';
    }

    const secPct = Math.round(hud.secondaryPct * 100);
    this.cooldownRing.textContent = secPct >= 100 ? '⚡' : `${secPct}%`;
    this.cooldownRing.style.opacity = secPct >= 100 ? '1' : '0.6';

    if (hud.message) {
      this.toast.textContent = hud.message;
      this.toast.style.display = 'block';
    } else {
      this.toast.style.display = 'none';
    }
  }

  private handleWin(): void {
    const def = this.level.def;
    const wasAlreadyUnlocked = def.unlockCharacterId ? this.game.save.isUnlocked(def.unlockCharacterId) : true;
    this.game.save.recordLevelProgress(def.id, { completed: true });
    if (def.unlockCharacterId && !wasAlreadyUnlocked) {
      this.game.save.unlock(def.unlockCharacterId);
    }
    this.showOverlay(
      'Isle Secured!',
      [
        {
          label: 'Continue',
          action: () =>
            this.game.goTo({
              name: 'dialogue',
              lines: def.victoryDialogue,
              onDone: () => this.game.goTo({ name: 'hub' }),
            }),
        },
      ],
      `+${this.level.collectedGlimmer} Glimmer and ${this.level.collectedShards} Hero Crystals collected this run.`,
    );
  }

  private handleLose(): void {
    this.showOverlay('Fallen in Battle', [
      { label: 'Retry', action: () => this.startLevel() },
      { label: 'Quit to Bastion', action: () => this.game.goTo({ name: 'hub' }), cls: 'btn secondary' },
    ]);
  }

  unmount(): void {
    this.hudRoot.remove();
  }
}
