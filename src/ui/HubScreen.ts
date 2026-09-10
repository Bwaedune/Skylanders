import type { Game, Screen } from '../engine/Game';
import { el, button } from './dom';
import { LEVELS } from '../data/levels/index';
import { getCharacter } from '../data/characters';
import { audio } from '../engine/Audio';

export class HubScreen implements Screen {
  private root!: HTMLElement;

  mount(game: Game): void {
    audio.startMusic('hub');
    const save = game.save.get();
    const hero = getCharacter(save.selectedCharacter);

    const levelCards = LEVELS.map((lvl, i) => {
      const prevCompleted = i === 0 || !!save.levels[LEVELS[i - 1].id]?.completed;
      const completed = !!save.levels[lvl.id]?.completed;
      const locked = !prevCompleted;
      const card = el('div', { class: `card${locked ? ' locked' : ''}` }, [
        el('span', { class: 'badge' }, [lvl.subtitle]),
        el('h3', {}, [lvl.name]),
        el('p', {}, [locked ? 'Complete the previous isle to unlock.' : lvl.hint]),
        completed ? el('span', { class: 'badge', style: 'color:#5fe07a' }, ['✓ Cleared']) : el('span', {}, []),
      ]);
      if (!locked) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => this.enterLevel(game, lvl.id));
      }
      return card;
    });

    this.root = el('div', { class: 'screen' }, [
      el('div', { class: 'topbar' }, [
        el('div', { class: 'title', style: 'font-size:20px;color:#f6d132' }, ['Starfall Bastion']),
        el('div', { class: 'currency-pill' }, [
          el('span', {}, [`✦ ${save.glimmer} Glimmer`]),
          el('span', {}, [`◆ ${save.shards} Hero Crystals`]),
        ]),
      ]),
      el('div', { class: 'center-col', style: 'flex:0;padding:14px 18px;flex-direction:row;justify-content:space-between;align-items:center;gap:12px' }, [
        el('div', { style: 'display:flex;align-items:center;gap:14px' }, [
          el('div', { class: 'portrait', style: `width:64px;height:64px;background:radial-gradient(circle,${hero.body},#0d101c)` }, []),
          el('div', { style: 'text-align:left' }, [
            el('div', { style: 'font-weight:800' }, [hero.name]),
            el('div', { class: 'small-hint' }, [`${hero.title} · ${hero.element}`]),
          ]),
        ]),
        el('div', { class: 'row' }, [
          button('Change Hero', () => game.goTo({ name: 'characterSelect', returnTo: 'hub' }), 'btn secondary'),
          button('Hero Vault', () => game.goTo({ name: 'vault' })),
        ]),
      ]),
      el('div', { class: 'grid level-grid', style: 'flex:1' }, levelCards),
    ]);
    game.uiRoot.appendChild(this.root);
  }

  private enterLevel(game: Game, levelId: string): void {
    const lvl = LEVELS.find((l) => l.id === levelId)!;
    const flag = `intro-${levelId}`;
    if (!game.save.hasStoryFlag(flag)) {
      game.save.setStoryFlag(flag);
      game.goTo({
        name: 'dialogue',
        lines: lvl.introDialogue,
        onDone: () => game.goTo({ name: 'level', levelId }),
      });
    } else {
      game.goTo({ name: 'level', levelId });
    }
  }

  unmount(): void {
    this.root.remove();
  }
}
