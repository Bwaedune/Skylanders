import { CHARACTERS } from '../data/characters';

export interface LevelProgress {
  completed: boolean;
  collectibles: number;
  totalCollectibles: number;
}

export interface SaveData {
  version: number;
  glimmer: number;
  shards: number;
  unlocked: string[];
  selectedCharacter: string;
  levels: Record<string, LevelProgress>;
  storyFlags: Record<string, boolean>;
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
  };
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

  resetAll(): void {
    this.data = defaultSave();
    this.persist();
  }
}
