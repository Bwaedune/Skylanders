import type { ElementId } from './elements';
import type { CreatureShape } from '../engine/Sprite';

export type UnlockMethod =
  | { kind: 'starter' }
  | { kind: 'story'; levelId: string }
  | { kind: 'shard'; cost: number }
  | { kind: 'glimmer'; cost: number };

export interface CharacterAbility {
  name: string;
  description: string;
}

export interface CharacterDef {
  id: string;
  name: string;
  title: string;
  element: ElementId;
  isGiant: boolean;
  shape: CreatureShape;
  body: string;
  accent: string;
  eye: string;
  health: number;
  speed: number;
  attackDamage: number;
  attackRange: number;
  attackCooldown: number;
  attackType: 'melee' | 'ranged';
  secondary: CharacterAbility;
  passive: CharacterAbility;
  lore: string;
  unlock: UnlockMethod;
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'cinderjaw',
    name: 'Cinderjaw',
    title: 'the Ashfang',
    element: 'ember',
    isGiant: false,
    shape: 'wolf',
    body: '#7a2e14',
    accent: '#ff8c42',
    eye: '#ffe27a',
    health: 100,
    speed: 190,
    attackDamage: 12,
    attackRange: 44,
    attackCooldown: 0.42,
    attackType: 'melee',
    secondary: {
      name: 'Cinder Howl',
      description: 'Unleash a cone of fire that burns enemies over time.',
    },
    passive: {
      name: 'Warm Blood',
      description: 'Immune to fire hazards and burning floor tiles.',
    },
    lore: 'A wolf-warrior born from a volcanic den, Cinderjaw guards the Emberfall foothills with tooth, claw, and flame.',
    unlock: { kind: 'starter' },
  },
  {
    id: 'squallwing',
    name: 'Squallwing',
    title: 'the Windrider',
    element: 'gale',
    isGiant: false,
    shape: 'hawk',
    body: '#3f5c66',
    accent: '#bfe8de',
    eye: '#eafff8',
    health: 80,
    speed: 210,
    attackDamage: 8,
    attackRange: 260,
    attackCooldown: 0.5,
    attackType: 'ranged',
    secondary: {
      name: 'Updraft Dash',
      description: 'Dash forward on a gust, gliding over pits and gaps.',
    },
    passive: {
      name: 'Sky Sight',
      description: 'Reveals hidden switches and secret passages nearby.',
    },
    lore: 'Scout of the high spires, Squallwing carries messages and arrows equally fast across the Aetherfall Isles.',
    unlock: { kind: 'starter' },
  },
  {
    id: 'brinehook',
    name: 'Brinehook',
    title: 'the Tideraider',
    element: 'tide',
    isGiant: false,
    shape: 'anglerfish',
    body: '#1f5f7a',
    accent: '#5cd0ff',
    eye: '#eafcff',
    health: 110,
    speed: 165,
    attackDamage: 11,
    attackRange: 220,
    attackCooldown: 0.55,
    attackType: 'ranged',
    secondary: {
      name: 'Tidal Burst',
      description: 'Erupt a wave that douses fire hazards and knocks enemies back.',
    },
    passive: {
      name: 'Deep Lungs',
      description: 'Swims through deep water without slowing.',
    },
    lore: 'Once a shipwrecked deep-sea angler, Brinehook now captains the sunken ruins of Tidewrack Cove.',
    unlock: { kind: 'story', levelId: 'emberfall-foothills' },
  },
  {
    id: 'rubblehorn',
    name: 'Rubblehorn',
    title: 'the Stonebreaker',
    element: 'terra',
    isGiant: false,
    shape: 'ram',
    body: '#8a6a45',
    accent: '#d8b876',
    eye: '#3a2a15',
    health: 130,
    speed: 150,
    attackDamage: 16,
    attackRange: 50,
    attackCooldown: 0.6,
    attackType: 'melee',
    secondary: {
      name: 'Boulder Charge',
      description: 'Charge forward, smashing through cracked walls and enemies.',
    },
    passive: {
      name: 'Thick Hide',
      description: 'Takes reduced knockback and falling damage.',
    },
    lore: 'A mountain ram whose horns have cracked open a thousand rockslides in search of buried relics.',
    unlock: { kind: 'glimmer', cost: 400 },
  },
  {
    id: 'sparkwrench',
    name: 'Sparkwrench',
    title: 'the Tinkerer',
    element: 'circuit',
    isGiant: false,
    shape: 'goblin',
    body: '#5a6b3f',
    accent: '#f6d132',
    eye: '#111',
    health: 85,
    speed: 175,
    attackDamage: 9,
    attackRange: 40,
    attackCooldown: 0.35,
    attackType: 'melee',
    secondary: {
      name: 'Deploy Turret',
      description: 'Places a small spark turret that zaps nearby enemies for a time.',
    },
    passive: {
      name: 'Overclock',
      description: 'Powers dormant machinery and circuit gates on contact.',
    },
    lore: 'A goblin engineer exiled from the underforge for "over-enthusiastic" experiments with lightning.',
    unlock: { kind: 'glimmer', cost: 400 },
  },
  {
    id: 'hollowmask',
    name: 'Hollowmask',
    title: 'the Nightjester',
    element: 'wraith',
    isGiant: false,
    shape: 'jester',
    body: '#3a2d55',
    accent: '#9b6bd6',
    eye: '#e0c8ff',
    health: 90,
    speed: 200,
    attackDamage: 10,
    attackRange: 200,
    attackCooldown: 0.4,
    attackType: 'ranged',
    secondary: {
      name: 'Fright Pulse',
      description: 'Terrifies nearby enemies, causing them to flee briefly.',
    },
    passive: {
      name: 'Veilstep',
      description: 'Can walk unseen through wraith-mist barriers.',
    },
    lore: 'No one remembers Hollowmask’s true face — only the echo of laughter before the lights go out.',
    unlock: { kind: 'shard', cost: 6 },
  },
  {
    id: 'thornbud',
    name: 'Thornbud',
    title: 'the Grovewarden',
    element: 'bloom',
    isGiant: false,
    shape: 'plant',
    body: '#2f6b34',
    accent: '#8de07a',
    eye: '#123',
    health: 105,
    speed: 160,
    attackDamage: 10,
    attackRange: 90,
    attackCooldown: 0.5,
    attackType: 'melee',
    secondary: {
      name: 'Spore Bloom',
      description: 'Releases healing spores that restore health over time to allies.',
    },
    passive: {
      name: 'Deep Roots',
      description: 'Can sprout bridges from seed pods across chasms.',
    },
    lore: 'Grown from the last seed of the old grove, Thornbud tends the wild places between the isles.',
    unlock: { kind: 'shard', cost: 6 },
  },
  {
    id: 'prism',
    name: 'Prism',
    title: 'the Runeblade',
    element: 'arcane',
    isGiant: false,
    shape: 'crystal',
    body: '#5a3fa0',
    accent: '#c76bf0',
    eye: '#fff',
    health: 85,
    speed: 185,
    attackDamage: 13,
    attackRange: 210,
    attackCooldown: 0.45,
    attackType: 'ranged',
    secondary: {
      name: 'Blink Step',
      description: 'Teleports a short distance, ignoring obstacles.',
    },
    passive: {
      name: 'Runesight',
      description: 'Reveals and unlocks warded arcane runes.',
    },
    lore: 'A living shard of the shattered Prism Spire, drifting the isles in search of its missing facets.',
    unlock: { kind: 'shard', cost: 8 },
  },
  {
    id: 'boulderguard',
    name: 'Boulderguard',
    title: 'the Isle Titan',
    element: 'terra',
    isGiant: true,
    shape: 'giant-rock',
    body: '#6b5a48',
    accent: '#c9a86b',
    eye: '#ffdf7a',
    health: 260,
    speed: 110,
    attackDamage: 26,
    attackRange: 60,
    attackCooldown: 0.75,
    attackType: 'melee',
    secondary: {
      name: 'Ground Pound',
      description: 'Slams the ground, shattering giant-only boulders and stunning enemies.',
    },
    passive: {
      name: 'Titan Weight',
      description: 'Only Giants can trigger heavy pressure plates and break giant seals.',
    },
    lore: 'Carved from the mountain’s own heart, Boulderguard has stood sentinel since before the isles had names.',
    unlock: { kind: 'story', levelId: 'tidewrack-cove' },
  },
  {
    id: 'magmatitan',
    name: 'Magmatitan',
    title: 'the Forgeborn',
    element: 'ember',
    isGiant: true,
    shape: 'giant-magma',
    body: '#4a2018',
    accent: '#ff7a30',
    eye: '#ffe27a',
    health: 240,
    speed: 115,
    attackDamage: 28,
    attackRange: 65,
    attackCooldown: 0.8,
    attackType: 'melee',
    secondary: {
      name: 'Magma Slam',
      description: 'Erupts molten fists, melting ice barriers and giant seals alike.',
    },
    passive: {
      name: 'Titan Weight',
      description: 'Only Giants can trigger heavy pressure plates and break giant seals.',
    },
    lore: 'Forged in the collapse of a dying volcano isle, Magmatitan walks where the ground itself used to be liquid.',
    unlock: { kind: 'shard', cost: 12 },
  },
];

export function getCharacter(id: string): CharacterDef {
  const c = CHARACTERS.find((c) => c.id === id);
  if (!c) throw new Error(`Unknown character: ${id}`);
  return c;
}
