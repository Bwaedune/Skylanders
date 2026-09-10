import type { Game, Screen } from '../engine/Game';
import { el, button } from './dom';
import { audio } from '../engine/Audio';

export class MainMenuScreen implements Screen {
  private root!: HTMLElement;

  mount(game: Game): void {
    audio.startMusic('hub');
    const hasSave = game.save.get().glimmer > 0 || Object.keys(game.save.get().levels).length > 0;

    this.root = el('div', { class: 'screen center-col' }, [
      el('h1', { class: 'title', style: 'font-size:44px;margin:0;color:#f6d132;text-shadow:0 4px 0 #6b4f0f' }, [
        'AETHERFALL ISLES',
      ]),
      el('p', { class: 'small-hint', style: 'max-width:420px;font-size:14px' }, [
        'The isles are shattered and the Fractured King\'s creatures roam free. Gather heroes, brave the isles, and set the sky right again — no portal required, every hero unlocks right here.',
      ]),
      el('div', { class: 'row' }, [
        button(hasSave ? 'Continue' : 'Begin Your Journey', () => game.goTo({ name: 'hub' })),
        button('Reset Save', () => {
          if (confirm('Erase all progress, heroes, and currency?')) {
            game.save.resetAll();
            game.goTo({ name: 'menu' });
          }
        }, 'btn secondary'),
        button('Settings', () => game.goTo({ name: 'settings' }), 'btn secondary'),
      ]),
      el('p', { class: 'small-hint' }, ['WASD/Arrows to move · Space to attack · Shift for hero power']),
    ]);
    game.uiRoot.appendChild(this.root);
  }

  unmount(): void {
    this.root.remove();
  }
}
