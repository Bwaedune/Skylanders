import { clamp, lerp } from './Vec';

export class Camera {
  x = 0;
  y = 0;

  follow(targetX: number, targetY: number, viewW: number, viewH: number, worldW: number, worldH: number, dt: number): void {
    const desiredX = clamp(targetX - viewW / 2, 0, Math.max(0, worldW - viewW));
    const desiredY = clamp(targetY - viewH / 2, 0, Math.max(0, worldH - viewH));
    const t = Math.min(1, dt * 6);
    this.x = lerp(this.x, desiredX, t);
    this.y = lerp(this.y, desiredY, t);
  }

  apply(ctx: CanvasRenderingContext2D): void {
    ctx.translate(-Math.round(this.x), -Math.round(this.y));
  }
}
