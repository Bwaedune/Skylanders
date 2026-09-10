import { CHARACTERS } from '../data/characters';

export interface LevelProgress {
  completed: boolean;
  collectibles: number;
  totalCollectibles: number;
}

export interface HeroProgress {
  level: number;
  xp: number;
}

export interface SaveData {
  version: number;
  glimmer: number;
  shards: number;
  unlocked: string[];
  selectedCharacter: string;
  levels: Record<string, LevelProgress>;
  storyFlags: Record<string, boolean>;
  heroProgress: Record<string, HeroProgress>;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
}

const KEY = 'aetherfall-save-v1';

function starterUnlocks(): string[] {
  return CHARACTERS.filter((c) => c.unlock.kind === 'starter').map((c) => c.id);
}

function defaultSave(): SaveData {
  return {
    version: 1,
    glimmer: 0,
    shards: 0,
    unlocked: starterUnlocks(),
    selectedCharacter: starterUnlocks()[0],
    levels: {},
    storyFlags: {},
    heroProgress: {},
    musicVolume: 0.45,
    sfxVolume: 0.8,
    muted: false,
  };
}

const MAX_HERO_LEVEL = 5;
const XP_PER_LEVEL = 120;

export function xpToNextLevel(level: number): number {
  return XP_PER_LEVEL * level;
}

export class SaveManager {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw) as SaveData;
      const base = defaultSave();
      return { ...base, ...parsed, levels: { ...parsed.levels } };
    } catch {
      return defaultSave();
    }
  }

  persist(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      // storage unavailable; progress stays in-memory for this session
    }
  }

  get(): SaveData {
    return this.data;
  }

  isUnlocked(id: string): boolean {
    return this.data.unlocked.includes(id);
  }

  unlock(id: string): void {
    if (!this.data.unlocked.includes(id)) {
      this.data.unlocked.push(id);
      this.persist();
    }
  }

  addCurrency(glimmer: number, shards = 0): void {
    this.data.glimmer += glimmer;
    this.data.shards += shards;
    this.persist();
  }

  spendGlimmer(amount: number): boolean {
    if (this.data.glimmer < amount) return false;
    this.data.glimmer -= amount;
    this.persist();
    return true;
  }

  spendShards(amount: number): boolean {
    if (this.data.shards < amount) return false;
    this.data.shards -= amount;
    this.persist();
    return true;
  }

  selectCharacter(id: string): void {
    this.data.selectedCharacter = id;
    this.persist();
  }

  recordLevelProgress(levelId: string, progress: Partial<LevelProgress>): void {
    const existing = this.data.levels[levelId] ?? {
      completed: false,
      collectibles: 0,
      totalCollectibles: 0,
    };
    this.data.levels[levelId] = { ...existing, ...progress };
    this.persist();
  }

  setStoryFlag(flag: string): void {
    this.data.storyFlags[flag] = true;
    this.persist();
  }

  hasStoryFlag(flag: string): boolean {
    return !!this.data.storyFlags[flag];
  }

  getHeroProgress(id: string): HeroProgress {
    return this.data.heroProgress[id] ?? { level: 1, xp: 0 };
  }

  /** Adds XP to a hero, applying as many level-ups as it covers (capped).
   * Returns the number of levels gained (0 if none, or already max level). */
  addHeroXp(id: string, amount: number): number {
    const progress = { ...this.getHeroProgress(id) };
    let levelsGained = 0;
    progress.xp += amount;
    while (progress.level < MAX_HERO_LEVEL && progress.xp >= xpToNextLevel(progress.level)) {
      progress.xp -= xpToNextLevel(progress.level);
      progress.level += 1;
      levelsGained += 1;
    }
    if (progress.level >= MAX_HERO_LEVEL) progress.xp = 0;
    this.data.heroProgress[id] = progress;
    this.persist();
    return levelsGained;
  }

  setMusicVolume(v: number): void {
    this.data.musicVolume = v;
    this.persist();
  }

  setSfxVolume(v: number): void {
    this.data.sfxVolume = v;
    this.persist();
  }

  setMuted(m: boolean): void {
    this.data.muted = m;
    this.persist();
  }

  resetAll(): void {
    this.data = defaultSave();
    this.persist();
  }
}

export { MAX_HERO_LEVEL };
