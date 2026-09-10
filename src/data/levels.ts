import type { ElementId } from './elements';
import type { BiomePalette } from '../world/TileMap';

export interface DialogueLine {
  speaker: string;
  portraitColor: string;
  text: string;
}

export interface SwitchDef {
  gx: number;
  gy: number;
  requiresGiant?: boolean;
  opensGates: number[]; // indexes into gates[]
  opensBarriers?: number[]; // indexes into barriers[]
}

export interface BarrierDef {
  gx: number;
  gy: number;
  element: ElementId | null;
  requiresGiant?: boolean;
}

export interface EnemySpawnDef {
  gx: number;
  gy: number;
  type: string;
}

export interface LevelDef {
  id: string;
  name: string;
  subtitle: string;
  musicKey: string;
  biome: BiomePalette;
  map: string[];
  playerStart: { gx: number; gy: number };
  switches: SwitchDef[];
  gates: { gx: number; gy: number }[];
  pushBlocks: { gx: number; gy: number }[];
  barriers: BarrierDef[];
  chests: { gx: number; gy: number; glimmer: number; shards?: number }[];
  enemies: EnemySpawnDef[];
  boss?: { gx: number; gy: number; type: string; name: string };
  exit: { gx: number; gy: number };
  introDialogue: DialogueLine[];
  victoryDialogue: DialogueLine[];
  unlockCharacterId?: string;
  hint: string;
}
