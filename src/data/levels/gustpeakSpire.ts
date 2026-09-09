import type { LevelDef } from '../levels';
import { makeArena, setTile, fillRect, wallRowWithGaps, toRows } from '../../world/MapBuilder';

const WIDTH = 30;
const HEIGHT = 20;

function buildMap(): string[] {
  const grid = makeArena(WIDTH, HEIGHT);

  wallRowWithGaps(grid, 14, [[14, 15]]);

  // A wide chasm splits off a high ledge — only Gale heroes can glide
  // across it to reach the ledge and its cache.
  fillRect(grid, 9, 3, 20, 6, '^');
  fillRect(grid, 10, 1, 19, 2, '.');

  // Sealed pocket (west) behind a Giant-only rockfall seal — solvable now
  // that a Giant has joined the roster.
  fillRect(grid, 1, 9, 4, 13, '#');
  fillRect(grid, 2, 10, 3, 12, '.');
  setTile(grid, 4, 11, '.');

  return toRows(grid);
}

export const gustpeakSpire: LevelDef = {
  id: 'gustpeak-spire',
  name: 'Gustpeak Spire',
  subtitle: 'Isle III — Gale',
  biome: {
    floor: '#26323a',
    floorAlt: '#2c3a43',
    wall: '#151d22',
    wallShade: '#0a0e11',
    chasm: '#05090c',
    lava: '#c1451f',
    water: '#2c6b8a',
  },
  map: buildMap(),
  playerStart: { gx: 4, gy: 4 },
  switches: [{ gx: 14, gy: 10, opensGates: [0, 1] }],
  gates: [
    { gx: 14, gy: 14 },
    { gx: 15, gy: 14 },
  ],
  pushBlocks: [{ gx: 14, gy: 8 }],
  barriers: [{ gx: 4, gy: 11, element: null, requiresGiant: true }],
  chests: [
    { gx: 6, gy: 10, glimmer: 60 },
    { gx: 14, gy: 1, glimmer: 90 },
    { gx: 2, gy: 11, glimmer: 0, shards: 4 },
  ],
  enemies: [
    { gx: 8, gy: 8, type: 'gale-sprite' },
    { gx: 22, gy: 5, type: 'gale-sprite' },
    { gx: 22, gy: 10, type: 'gale-sprite' },
    { gx: 24, gy: 8, type: 'stone-sentinel' },
  ],
  boss: { gx: 15, gy: 16, type: 'stormcaller-roc', name: 'Stormcaller Roc' },
  exit: { gx: 26, gy: 17 },
  hint: 'Gale heroes can glide clean across the chasm to the high cache. Everyone else: mind the drop.',
  introDialogue: [
    {
      speaker: 'Squallwing',
      portraitColor: '#8fe3d0',
      text: 'The Spire\'s where the Fractured King keeps his Roc. Break its grip on the winds and the whole isle chain steadies.',
    },
    {
      speaker: 'Boulderguard',
      portraitColor: '#c9a86b',
      text: 'Then let\'s knock it out of the sky. Slowly. On purpose. Loudly.',
    },
  ],
  victoryDialogue: [
    {
      speaker: 'Elder Thistlewick',
      portraitColor: '#4fbf5e',
      text: 'Three isles steadied, hero. The Fractured King\'s grip is slipping — but there are more isles adrift out there, waiting for whoever\'s brave enough to reach them. The Vault will be ready when you are.',
    },
  ],
};
