import type { Game, Screen } from '../engine/Game';
import { el, button } from './dom';
import { CHARACTERS } from '../data/characters';
import { ELEMENTS } from '../data/elements';
import { audio } from '../engine/Audio';

export class VaultScreen implements Screen {
  private root!: HTMLElement;
  private game!: Game;

  mount(game: Game): void {
    this.game = game;
    audio.startMusic('hub');
    this.render();
  }

  private render(): void {
    const game = this.game;
    const save = game.save.get();

    const cards = CHARACTERS.map((c) => {
      const unlocked = game.save.isUnlocked(c.id);
      const elDef = ELEMENTS[c.element];
      const bodyEls: HTMLElement[] = [
        el('div', { class: 'portrait', style: `background:radial-gradient(circle,${c.body},#0d101c)` }, []),
        el('span', { class: 'badge', style: `color:${elDef.color}` }, [c.isGiant ? `${elDef.name} · Giant` : elDef.name]),
        el('h3', {}, [c.name]),
        el('p', {}, [c.lore]),
      ];

      const unlock = c.unlock;
      if (unlocked) {
        bodyEls.push(el('span', { class: 'badge', style: 'color:#5fe07a' }, ['✓ Unlocked']));
      } else if (unlock.kind === 'story') {
        bodyEls.push(el('span', { class: 'small-hint' }, ['Unlocks through the story']));
      } else if (unlock.kind === 'glimmer' || unlock.kind === 'shard') {
        const cost = unlock.cost;
        const currencyLabel = unlock.kind === 'shard' ? 'Hero Crystals' : 'Glimmer';
        const affordable = unlock.kind === 'shard' ? save.shards >= cost : save.glimmer >= cost;
        bodyEls.push(
          button(
            `Summon — ${cost} ${currencyLabel}`,
            () => {
              const ok = c.unlock.kind === 'shard' ? game.save.spendShards(cost) : game.save.spendGlimmer(cost);
              if (ok) {
                game.save.unlock(c.id);
                this.render();
              }
            },
            affordable ? 'btn' : 'btn secondary',
          ),
        );
        if (!affordable) bodyEls[bodyEls.length - 1].setAttribute('disabled', 'true');
      }

      return el('div', { class: `card${unlocked ? '' : ' locked'}` }, bodyEls);
    });

    const newRoot = el('div', { class: 'screen' }, [
      el('div', { class: 'topbar' }, [
        el('div', { class: 'title', style: 'font-size:20px;color:#f6d132' }, ['Hero Vault']),
        el('div', { class: 'currency-pill' }, [
          el('span', {}, [`✦ ${save.glimmer} Glimmer`]),
          el('span', {}, [`◆ ${save.shards} Hero Crystals`]),
        ]),
        button('Back', () => game.goTo({ name: 'hub' }), 'btn secondary'),
      ]),
      el('p', { class: 'small-hint', style: 'padding:0 18px' }, [
        'No portal, no figures — every hero here is summoned straight into your roster. Earn Glimmer and Hero Crystals by exploring the isles.',
      ]),
      el('div', { class: 'grid char-grid', style: 'flex:1' }, cards),
    ]);

    this.root?.remove();
    this.root = newRoot;
    game.uiRoot.appendChild(this.root);
  }

  unmount(): void {
    this.root.remove();
  }
}
