import { SaveManager } from '../save/SaveManager';
import { Input } from './Input';
import type { DialogueLine } from '../data/levels';

export type GameState =
  | { name: 'menu' }
  | { name: 'hub' }
  | { name: 'vault' }
  | { name: 'characterSelect'; returnTo: 'hub' }
  | { name: 'dialogue'; lines: DialogueLine[]; onDone: () => void }
  | { name: 'level'; levelId: string };

export interface Screen {
  mount(game: Game): void;
  unmount(): void;
  tick?(dt: number): void;
}

type ScreenFactory = (state: GameState) => Screen;

export class Game {
  save = new SaveManager();
  input: Input;
  uiRoot: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx2d: CanvasRenderingContext2D;
  state: GameState = { name: 'menu' };
  private current: Screen | null = null;
  private factories = new Map<string, ScreenFactory>();
  private lastTime = 0;

  constructor(uiRoot: HTMLElement, canvas: HTMLCanvasElement) {
    this.uiRoot = uiRoot;
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx2d = ctx;
    this.input = new Input(canvas);
    requestAnimationFrame(this.loop);
  }

  register(name: GameState['name'], factory: ScreenFactory): void {
    this.factories.set(name, factory);
  }

  goTo(state: GameState): void {
    this.current?.unmount();
    this.uiRoot.innerHTML = '';
    this.canvas.style.display = state.name === 'level' ? 'block' : 'none';
    this.state = state;
    const factory = this.factories.get(state.name);
    if (!factory) throw new Error(`No screen registered for ${state.name}`);
    this.current = factory(state);
    this.current.mount(this);
  }

  private loop = (t: number): void => {
    const dt = this.lastTime ? Math.min(0.05, (t - this.lastTime) / 1000) : 0;
    this.lastTime = t;
    this.current?.tick?.(dt);
    this.input.endFrame();
    requestAnimationFrame(this.loop);
  };
}
