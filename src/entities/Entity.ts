import { Vec2, type Rect } from '../engine/Vec';

let nextId = 1;

export abstract class Entity {
  readonly id = nextId++;
  pos: Vec2;
  vel: Vec2 = new Vec2(0, 0);
  width: number;
  height: number;
  alive = true;

  constructor(x: number, y: number, width: number, height: number) {
    this.pos = new Vec2(x, y);
    this.width = width;
    this.height = height;
  }

  bounds(): Rect {
    return { x: this.pos.x - this.width / 2, y: this.pos.y - this.height / 2, w: this.width, h: this.height };
  }
}
