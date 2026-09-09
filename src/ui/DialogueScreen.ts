import type { Game, Screen } from '../engine/Game';
import type { DialogueLine } from '../data/levels';
import { el, button } from './dom';

export class DialogueScreen implements Screen {
  private root!: HTMLElement;
  private index = 0;
  private lines: DialogueLine[];
  private onDone: () => void;

  constructor(lines: DialogueLine[], onDone: () => void) {
    this.lines = lines;
    this.onDone = onDone;
  }

  mount(game: Game): void {
    this.root = el('div', { class: 'screen center-col', style: 'justify-content:flex-end;padding-bottom:0' }, []);
    game.uiRoot.appendChild(this.root);
    this.renderLine();
  }

  private renderLine(): void {
    this.root.innerHTML = '';
    if (this.index >= this.lines.length) {
      this.onDone();
      return;
    }
    const line = this.lines[this.index];
    const isLast = this.index === this.lines.length - 1;
    const box = el('div', { class: 'dialogue-box', style: 'position:static;width:100%;margin:20px' }, [
      el('div', { class: 'dialogue-portrait', style: `background:radial-gradient(circle,${line.portraitColor},#0d101c)` }, []),
      el('div', { class: 'dialogue-text' }, [
        el('div', { class: 'speaker' }, [line.speaker]),
        el('p', {}, [line.text]),
        el('div', { style: 'margin-top:10px;text-align:right' }, [
          button(isLast ? 'Continue' : 'Next ›', () => {
            this.index++;
            this.renderLine();
          }),
        ]),
      ]),
    ]);
    this.root.appendChild(el('div', { style: 'flex:1' }, []));
    this.root.appendChild(box);
  }

  unmount(): void {
    this.root.remove();
  }
}
