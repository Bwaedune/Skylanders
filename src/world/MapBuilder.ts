export type Grid = string[][];

export function makeArena(width: number, height: number, fill: string = '.'): Grid {
  const grid: Grid = [];
  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) {
      const border = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      row.push(border ? '#' : fill);
    }
    grid.push(row);
  }
  return grid;
}

export function setTile(grid: Grid, x: number, y: number, tile: string): void {
  if (grid[y] && grid[y][x] !== undefined) grid[y][x] = tile;
}

export function fillRect(grid: Grid, x0: number, y0: number, x1: number, y1: number, tile: string): void {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      setTile(grid, x, y, tile);
    }
  }
}

/** Draws a full wall row with one or more gaps (used to separate an arena
 * from a boss room, with Gate entities placed in the gaps). */
export function wallRowWithGaps(grid: Grid, y: number, gaps: [number, number][]): void {
  const width = grid[0].length;
  for (let x = 0; x < width; x++) {
    setTile(grid, x, y, '#');
  }
  for (const [gx0, gx1] of gaps) {
    for (let x = gx0; x <= gx1; x++) setTile(grid, x, y, '.');
  }
}

export function toRows(grid: Grid): string[] {
  return grid.map((row) => row.join(''));
}
