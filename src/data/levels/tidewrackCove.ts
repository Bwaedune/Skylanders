import type { LevelDef } from '../levels';
import { makeArena, setTile, fillRect, wallRowWithGaps, toRows } from '../../world/MapBuilder';

const WIDTH = 30;
const HEIGHT = 20;

function buildMap(): string[] {
  const grid = makeArena(WIDTH, HEIGHT);

  wallRowWithGaps(grid, 14, [[14, 15]]);

  // Flooded ruin band cutting across the cove — safe for Tide heroes,
  // a slow burn for everyone else.
  fillRect(grid, 10, 7, 20, 8, 'W');

  // Sealed pocket (east) behind a Tide-only fire-ward.
  fillRect(grid, 26, 2, 28, 6, '#');
  fillRect(grid, 27, 3, 28, 5, '.');
  setTile(grid, 26, 4, '.');

  // Sealed pocket (west) behind a Giant-only rockfall seal.
  fillRect(grid, 1, 9, 4, 13, '#');
  fillRect(grid, 2, 10, 3, 12, '.');
  setTile(grid, 4, 11, '.');

  return toRows(grid);
}

export const tidewrackCove: LevelDef = {
  id: 'tidewrack-cove',
  name: 'Tidewrack Cove',
  subtitle: 'Isle II — Tide',
  musicKey: 'tide',
  biome: {
    floor: '#1c3a44',
    floorAlt: '#20404b',
    wall: '#0e2027',
    wallShade: '#081217',
    chasm: '#04090b',
    lava: '#c1451f',
    water: '#1c6e94',
  },
  map: buildMap(),
  playerStart: { gx: 4, gy: 4 },
  switches: [
    { gx: 8, gy: 10, opensGates: [0] },
    { gx: 20, gy: 10, opensGates: [1] },
  ],
  gates: [
    { gx: 14, gy: 14 },
    { gx: 15, gy: 14 },
  ],
  pushBlocks: [
    { gx: 8, gy: 5 },
    { gx: 20, gy: 5 },
  ],
  barriers: [
    { gx: 26, gy: 4, element: 'tide' },
    { gx: 4, gy: 11, element: null, requiresGiant: true },
  ],
  chests: [
    { gx: 6, gy: 4, glimmer: 60 },
    { gx: 27, gy: 4, glimmer: 50 },
    { gx: 2, gy: 11, glimmer: 0, shards: 3 },
  ],
  enemies: [
    { gx: 12, gy: 4, type: 'brine-crab' },
    { gx: 17, gy: 4, type: 'tide-wisp' },
    { gx: 12, gy: 12, type: 'brine-crab' },
    { gx: 17, gy: 12, type: 'tide-wisp' },
  ],
  boss: { gx: 15, gy: 16, type: 'kraken-warden', name: 'The Kraken Warden' },
  exit: { gx: 26, gy: 17 },
  unlockCharacterId: 'boulderguard',
  hint: 'Two plates, two blocks — push both south to open the sea-gate. Tide heroes shrug off the flooded ruins.',
  introDialogue: [
    {
      speaker: 'Brinehook',
      portraitColor: '#5cd0ff',
      text: 'The Kraken Warden used to guard these ruins for us. Now it just guards them from us. Typical.',
    },
    {
      speaker: 'Elder Thistlewick',
      portraitColor: '#4fbf5e',
      text: 'Free the cove, and I\'ll see what I can do about that rockfall seal your friend Rubblehorn keeps talking about back home.',
    },
  ],
  victoryDialogue: [
    {
      speaker: 'Brinehook',
      portraitColor: '#5cd0ff',
      text: 'Ha! Knew that old warden had a soft shell. The vault beneath the cove just cracked open — something big is sleeping down there.',
    },
    {
      speaker: 'Boulderguard',
      portraitColor: '#c9a86b',
      text: 'That would be me, small ones. Been asleep since the isles were whole. Point me at the Fractured King.',
    },
  ],
};
