import './style.css';
import { Game } from './engine/Game';
import { audio } from './engine/Audio';
import { MainMenuScreen } from './ui/MainMenuScreen';
import { HubScreen } from './ui/HubScreen';
import { VaultScreen } from './ui/VaultScreen';
import { CharacterSelectScreen } from './ui/CharacterSelectScreen';
import { DialogueScreen } from './ui/DialogueScreen';
import { LevelScreen } from './ui/LevelScreen';
import { SettingsScreen } from './ui/SettingsScreen';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <div class="game-frame">
    <canvas id="game-canvas" width="960" height="600"></canvas>
    <div id="ui-root"></div>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;
const uiRoot = document.querySelector<HTMLDivElement>('#ui-root')!;

const game = new Game(uiRoot, canvas);
audio.setMusicVolume(game.save.get().musicVolume);
audio.setSfxVolume(game.save.get().sfxVolume);
audio.setMuted(game.save.get().muted);

game.register('menu', () => new MainMenuScreen());
game.register('settings', () => new SettingsScreen());
game.register('hub', () => new HubScreen());
game.register('vault', () => new VaultScreen());
game.register('characterSelect', (state) => {
  if (state.name !== 'characterSelect') throw new Error('invalid state');
  return new CharacterSelectScreen(state.returnTo);
});
game.register('dialogue', (state) => {
  if (state.name !== 'dialogue') throw new Error('invalid state');
  return new DialogueScreen(state.lines, state.onDone);
});
game.register('level', (state) => {
  if (state.name !== 'level') throw new Error('invalid state');
  return new LevelScreen(state.levelId);
});

game.goTo({ name: 'menu' });
