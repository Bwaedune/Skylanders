import type { LevelDef } from '../levels';
import { makeArena, setTile, fillRect, wallRowWithGaps, toRows } from '../../world/MapBuilder';

const WIDTH = 30;
const HEIGHT = 20;

function buildMap(): string[] {
  const grid = makeArena(WIDTH, HEIGHT);

  // Divider wall between the main foothills and the boss crater, with a
  // two-tile gate gap that the push-block switch unlocks.
  wallRowWithGaps(grid, 14, [[14, 15]]);

  // A couple of rock pillars for cover in the main arena.
  setTile(grid, 10, 5, '#');
  setTile(grid, 10, 6, '#');
  setTile(grid, 20, 8, '#');
  setTile(grid, 20, 9, '#');

  // A shallow lava vent — harmless to Ember heroes, dangerous to anyone else.
  fillRect(grid, 5, 10, 7, 11, 'L');

  // Sealed pocket (east) behind an Ember-only ice-and-vine barrier.
  fillRect(grid, 26, 2, 28, 6, '#');
  fillRect(grid, 27, 3, 28, 5, '.');
  setTile(grid, 26, 4, '.');

  // Sealed pocket (west) behind a Giant-only rockfall seal — come back later.
  fillRect(grid, 1, 9, 4, 13, '#');
  fillRect(grid, 2, 10, 3, 12, '.');
  setTile(grid, 4, 11, '.');

  return toRows(grid);
}

export const emberfallFoothills: LevelDef = {
  id: 'emberfall-foothills',
  name: 'Emberfall Foothills',
  subtitle: 'Isle I — Ember',
  musicKey: 'ember',
  biome: {
    floor: '#332a2c',
    floorAlt: '#3a2f2e',
    wall: '#1c1719',
    wallShade: '#0e0b0c',
    chasm: '#0c0705',
    lava: '#c1451f',
    water: '#2c6b8a',
  },
  map: buildMap(),
  playerStart: { gx: 4, gy: 4 },
  switches: [{ gx: 14, gy: 9, opensGates: [0, 1] }],
  gates: [
    { gx: 14, gy: 14 },
    { gx: 15, gy: 14 },
  ],
  pushBlocks: [{ gx: 14, gy: 5 }],
  barriers: [
    { gx: 26, gy: 4, element: 'ember' },
    { gx: 4, gy: 11, element: null, requiresGiant: true },
  ],
  chests: [
    { gx: 6, gy: 10, glimmer: 60 },
    { gx: 27, gy: 4, glimmer: 40 },
    { gx: 2, gy: 11, glimmer: 0, shards: 3 },
  ],
  enemies: [
    { gx: 10, gy: 4, type: 'ash-imp' },
    { gx: 18, gy: 6, type: 'ash-imp' },
    { gx: 16, gy: 10, type: 'cinder-bat' },
    { gx: 8, gy: 7, type: 'ash-imp' },
  ],
  boss: { gx: 15, gy: 16, type: 'slagmaw', name: 'Slagmaw the Ooze' },
  exit: { gx: 26, gy: 17 },
  unlockCharacterId: 'brinehook',
  hint: 'Push the block south onto the plate to open the crater gate. Ember heroes can shrug off the lava vent.',
  introDialogue: [
    {
      speaker: 'Elder Thistlewick',
      portraitColor: '#4fbf5e',
      text: 'The Fractured King has cracked the Aetherfall Isles apart, hero. Emberfall\'s foothills burn out of control — someone let Slagmaw the Ooze loose from the deep vents.',
    },
    {
      speaker: 'Cinderjaw',
      portraitColor: '#ff8c42',
      text: 'Lava\'s a lullaby to me. Let\'s go put that ooze back in its hole.',
    },
  ],
  victoryDialogue: [
    {
      speaker: 'Elder Thistlewick',
      portraitColor: '#4fbf5e',
      text: 'The vents are calm again. But scouts spotted a shipwrecked angler down in Tidewrack Cove who says she saw the King\'s fleet — she says her name is Brinehook, and she wants payback.',
    },
  ],
};
