export const TILE_SIZE = 40;

export type TileCode = '.' | '#' | '^' | 'L' | 'W' | ' ';

export interface TileMapDef {
  rows: string[];
}

export class TileMap {
  readonly width: number;
  readonly height: number;
  readonly tiles: TileCode[][];

  constructor(def: TileMapDef) {
    this.tiles = def.rows.map((row) => row.split('') as TileCode[]);
    this.height = this.tiles.length;
    this.width = Math.max(...this.tiles.map((r) => r.length));
  }

  tileAt(gx: number, gy: number): TileCode {
    if (gy < 0 || gy >= this.height || gx < 0 || gx >= this.width) return '#';
    return this.tiles[gy][gx] ?? '#';
  }

  setTile(gx: number, gy: number, tile: TileCode): void {
    if (gy < 0 || gy >= this.height || gx < 0 || gx >= this.width) return;
    this.tiles[gy][gx] = tile;
  }

  worldWidth(): number {
    return this.width * TILE_SIZE;
  }

  worldHeight(): number {
    return this.height * TILE_SIZE;
  }

  isSolidTile(tile: TileCode): boolean {
    return tile === '#' || tile === '^';
  }

  render(ctx: CanvasRenderingContext2D, biome: BiomePalette): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const t = this.tileAt(x, y);
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        ctx.fillStyle = t === '.' && (x + y) % 2 === 0 ? biome.floorAlt : colorFor(t, biome);
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        if (t === '#') {
          ctx.fillStyle = biome.wallShade;
          ctx.fillRect(px, py, TILE_SIZE, 4);
        }
      }
    }
  }
}

export interface BiomePalette {
  floor: string;
  floorAlt: string;
  wall: string;
  wallShade: string;
  chasm: string;
  lava: string;
  water: string;
}

function colorFor(t: TileCode, biome: BiomePalette): string {
  switch (t) {
    case '.':
      return biome.floor;
    case '#':
      return biome.wall;
    case '^':
      return biome.chasm;
    case 'L':
      return biome.lava;
    case 'W':
      return biome.water;
    default:
      return '#000';
  }
}
