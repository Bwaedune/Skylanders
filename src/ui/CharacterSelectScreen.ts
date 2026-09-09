import type { Game, Screen } from '../engine/Game';
import { el, button } from './dom';
import { CHARACTERS, type CharacterDef } from '../data/characters';
import { ELEMENTS } from '../data/elements';

export class CharacterSelectScreen implements Screen {
  private root!: HTMLElement;
  private game!: Game;

  private returnTo: 'hub';

  constructor(returnTo: 'hub') {
    this.returnTo = returnTo;
  }

  mount(game: Game): void {
    this.game = game;
    this.render();
  }

  private render(): void {
    const game = this.game;
    const save = game.save.get();

    const cards = CHARACTERS.map((c) => {
      const unlocked = game.save.isUnlocked(c.id);
      const selected = save.selectedCharacter === c.id;
      const elDef = ELEMENTS[c.element];
      const card = el('div', { class: `card${unlocked ? '' : ' locked'}${selected ? ' selected' : ''}` }, [
        el('div', { class: 'portrait', style: `background:radial-gradient(circle,${c.body},#0d101c)` }, []),
        el('span', { class: 'badge', style: `color:${elDef.color}` }, [c.isGiant ? `${elDef.name} · Giant` : elDef.name]),
        el('h3', {}, [c.name]),
        el('p', {}, [c.title]),
        el('div', { class: 'abilities' }, [
          el('div', { class: 'ability-line' }, [el('b', {}, [c.secondary.name + ': ']), c.secondary.description]),
        ]),
        unlocked
          ? el('span', { class: 'small-hint' }, [selected ? 'Selected' : 'Tap to select'])
          : el('span', { class: 'small-hint' }, [this.unlockHint(c)]),
      ]);
      card.addEventListener('click', () => {
        if (!unlocked) return;
        game.save.selectCharacter(c.id);
        this.render();
      });
      return card;
    });

    const newRoot = el('div', { class: 'screen' }, [
      el('div', { class: 'topbar' }, [
        el('div', { class: 'title', style: 'font-size:20px;color:#f6d132' }, ['Choose Your Hero']),
        button('Back', () => game.goTo({ name: this.returnTo }), 'btn secondary'),
      ]),
      el('div', { class: 'grid char-grid', style: 'flex:1' }, cards),
    ]);

    this.root?.remove();
    this.root = newRoot;
    game.uiRoot.appendChild(this.root);
  }

  private unlockHint(c: CharacterDef): string {
    switch (c.unlock.kind) {
      case 'starter':
        return 'Starter hero';
      case 'story':
        return 'Unlocks after a story isle';
      case 'glimmer':
        return `${c.unlock.cost} Glimmer in the Vault`;
      case 'shard':
        return `${c.unlock.cost} Hero Crystals in the Vault`;
    }
  }

  unmount(): void {
    this.root.remove();
  }
}
