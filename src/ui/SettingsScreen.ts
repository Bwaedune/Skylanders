import type { Game, Screen } from '../engine/Game';
import { el, button } from './dom';
import { buildAudioSettings } from './SettingsControls';

export class SettingsScreen implements Screen {
  private root!: HTMLElement;

  mount(game: Game): void {
    this.root = el('div', { class: 'screen center-col' }, [
      el('h1', { class: 'title', style: 'font-size:28px;margin:0;color:#f6d132' }, ['Settings']),
      buildAudioSettings(game.save),
      button('Back', () => game.goTo({ name: 'menu' }), 'btn secondary'),
    ]);
    game.uiRoot.appendChild(this.root);
  }

  unmount(): void {
    this.root.remove();
  }
}
