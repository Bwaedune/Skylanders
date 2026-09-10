import type { LevelDef } from '../levels';
import { makeArena, setTile, fillRect, wallRowWithGaps, toRows } from '../../world/MapBuilder';

const WIDTH = 32;
const HEIGHT = 22;

function buildMap(): string[] {
  const grid = makeArena(WIDTH, HEIGHT);

  // Three separate gate segments — one per convergence switch — instead of
  // a single choke point, so the finale is a "clear all three wings" arena
  // rather than another push-block corridor.
  wallRowWithGaps(grid, 16, [
    [10, 10],
    [16, 16],
    [22, 22],
  ]);

  // A high, walled-off ledge over a wide chasm — only a Gale hero can glide
  // up to it. The walls on both sides mean the chasm is the only way in.
  fillRect(grid, 1, 1, 11, 2, '#');
  fillRect(grid, 20, 1, 30, 2, '#');
  fillRect(grid, 12, 3, 19, 6, '^');
  fillRect(grid, 13, 1, 18, 2, '.');

  // Sealed pocket (west) behind a Giant-only rockfall seal.
  fillRect(grid, 1, 9, 4, 13, '#');
  fillRect(grid, 2, 10, 3, 12, '.');
  setTile(grid, 4, 11, '.');

  // Sealed pocket (east) behind an Arcane ward.
  fillRect(grid, 27, 9, 30, 13, '#');
  fillRect(grid, 28, 10, 29, 12, '.');
  setTile(grid, 27, 11, '.');

  return toRows(grid);
}

export const fracturedSpire: LevelDef = {
  id: 'fractured-spire',
  name: 'Stormcrown Bastion',
  subtitle: 'Isle IV — The Reckoning',
  musicKey: 'finale',
  biome: {
    floor: '#241f33',
    floorAlt: '#2a2440',
    wall: '#140f1f',
    wallShade: '#0a070f',
    chasm: '#020103',
    lava: '#c1451f',
    water: '#2c6b8a',
  },
  map: buildMap(),
  playerStart: { gx: 4, gy: 4 },
  switches: [
    { gx: 7, gy: 9, opensGates: [0] },
    { gx: 16, gy: 9, opensGates: [1] },
    { gx: 25, gy: 9, opensGates: [2] },
  ],
  gates: [
    { gx: 10, gy: 16 },
    { gx: 16, gy: 16 },
    { gx: 22, gy: 16 },
  ],
  pushBlocks: [],
  barriers: [
    { gx: 4, gy: 11, element: null, requiresGiant: true },
    { gx: 27, gy: 11, element: 'arcane' },
  ],
  chests: [
    { gx: 3, gy: 11, glimmer: 0, shards: 4 },
    { gx: 28, gy: 11, glimmer: 80, shards: 2 },
    { gx: 16, gy: 1, glimmer: 120 },
    { gx: 16, gy: 11, glimmer: 70 },
  ],
  enemies: [
    { gx: 7, gy: 7, type: 'corrupted-jester' },
    { gx: 16, gy: 7, type: 'shard-sentinel' },
    { gx: 25, gy: 8, type: 'warding-totem' },
    { gx: 12, gy: 13, type: 'corrupted-jester' },
    { gx: 20, gy: 13, type: 'corrupted-jester' },
    { gx: 16, gy: 13, type: 'shard-sentinel' },
  ],
  boss: { gx: 16, gy: 18, type: 'fractured-king', name: 'The Fractured King' },
  exit: { gx: 28, gy: 19 },
  hint: 'Three plates, three wings — clear each to open its gate segment. Old tricks still work: a Giant, an Arcane hero, and a Gale hero all have work to do here.',
  introDialogue: [
    {
      speaker: 'Elder Thistlewick',
      portraitColor: '#4fbf5e',
      text: 'This is it. Stormcrown Bastion — the last whole piece of the Fractured King\'s power, and the last thing holding the isles apart.',
    },
    {
      speaker: 'Boulderguard',
      portraitColor: '#c9a86b',
      text: 'Three wards, three wings, one throne. Nothing we haven\'t broken before — just all at once, and bigger.',
    },
    {
      speaker: 'Prism',
      portraitColor: '#c76bf0',
      text: 'The King wears the isles\' own magic like armor. Shatter the wards, and it\'s just him. Just steel and spite.',
    },
    {
      speaker: 'Elder Thistlewick',
      portraitColor: '#4fbf5e',
      text: 'Whatever hero stands with you in there — I have a feeling the isles will remember them. Go. End this.',
    },
  ],
  victoryDialogue: [
    {
      speaker: 'Elder Thistlewick',
      portraitColor: '#4fbf5e',
      text: 'It\'s done. I felt the fracture close from all the way back at the Bastion — the isles are whole again for the first time in longer than I can remember.',
    },
    {
      speaker: 'Cinderjaw',
      portraitColor: '#ff8c42',
      text: 'Told you the vents would hold. Told you the wolf would hold too, for that matter.',
    },
    {
      speaker: 'Brinehook',
      portraitColor: '#5cd0ff',
      text: 'The cove\'s already calmer. Even the old Warden\'s wreck looks less haunted. Funny what mending a sky does to a sea.',
    },
    {
      speaker: 'Squallwing',
      portraitColor: '#8fe3d0',
      text: 'The winds over the Spire aren\'t fighting anymore. First time in my life I\'ve flown a straight line up there.',
    },
    {
      speaker: 'Elder Thistlewick',
      portraitColor: '#4fbf5e',
      text: 'The Vault will stay open — there are always more heroes worth finding, and I doubt the isles have run out of trouble for good. But for tonight: well fought. Truly.',
    },
  ],
};
