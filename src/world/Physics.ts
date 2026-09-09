import { TILE_SIZE, type TileMap } from './TileMap';
import type { Rect } from '../engine/Vec';

export interface Solid {
  bounds(): Rect;
}

/** Moves an AABB by (dx, dy), resolving collisions against tilemap solids and
 * extra solid objects (gates, pushblocks, barriers) one axis at a time. */
export function moveWithCollision(
  rect: Rect,
  dx: number,
  dy: number,
  map: TileMap,
  extraSolids: Solid[],
  passable?: (tile: string) => boolean,
): { x: number; y: number } {
  let x = rect.x;
  let y = rect.y;

  x += dx;
  if (collides({ x, y, w: rect.w, h: rect.h }, map, extraSolids, passable)) {
    x = resolveAxis(x, rect.y, rect.w, rect.h, dx, true, map, extraSolids, passable);
  }

  y += dy;
  if (collides({ x, y, w: rect.w, h: rect.h }, map, extraSolids, passable)) {
    y = resolveAxis(x, y, rect.w, rect.h, dy, false, map, extraSolids, passable);
  }

  return { x, y };
}

function resolveAxis(
  x: number,
  y: number,
  w: number,
  h: number,
  delta: number,
  horizontal: boolean,
  map: TileMap,
  extraSolids: Solid[],
  passable?: (tile: string) => boolean,
): number {
  // Step back until no collision (simple, robust for small delta per frame).
  let val = horizontal ? x : y;
  const step = Math.sign(delta) || 1;
  let guard = 0;
  while (
    collides(
      horizontal ? { x: val, y, w, h } : { x, y: val, w, h },
      map,
      extraSolids,
      passable,
    ) &&
    guard < 64
  ) {
    val -= step;
    guard++;
  }
  return val;
}

export function collides(
  rect: Rect,
  map: TileMap,
  extraSolids: Solid[],
  passable?: (tile: string) => boolean,
): boolean {
  const minGX = Math.floor(rect.x / TILE_SIZE);
  const maxGX = Math.floor((rect.x + rect.w) / TILE_SIZE);
  const minGY = Math.floor(rect.y / TILE_SIZE);
  const maxGY = Math.floor((rect.y + rect.h) / TILE_SIZE);

  for (let gy = minGY; gy <= maxGY; gy++) {
    for (let gx = minGX; gx <= maxGX; gx++) {
      const tile = map.tileAt(gx, gy);
      const isSolid = map.isSolidTile(tile) && !(passable && passable(tile));
      if (isSolid) return true;
    }
  }

  for (const solid of extraSolids) {
    const b = solid.bounds();
    if (rect.x < b.x + b.w && rect.x + rect.w > b.x && rect.y < b.y + b.h && rect.y + rect.h > b.y) {
      return true;
    }
  }

  return false;
}
