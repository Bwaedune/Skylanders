import type { LevelDef } from '../levels';
import { emberfallFoothills } from './emberfallFoothills';
import { tidewrackCove } from './tidewrackCove';
import { gustpeakSpire } from './gustpeakSpire';
import { fracturedSpire } from './fracturedSpire';

export const LEVELS: LevelDef[] = [emberfallFoothills, tidewrackCove, gustpeakSpire, fracturedSpire];
export const FINALE_LEVEL_ID = fracturedSpire.id;

export function getLevel(id: string): LevelDef {
  const lvl = LEVELS.find((l) => l.id === id);
  if (!lvl) throw new Error(`Unknown level: ${id}`);
  return lvl;
}
