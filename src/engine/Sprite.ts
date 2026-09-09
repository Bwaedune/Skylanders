// Procedural creature rendering. Every character is drawn from primitive shapes
// so the game needs no external art assets and no character resembles any
// existing published design.

export type CreatureShape =
  | 'wolf'
  | 'anglerfish'
  | 'ram'
  | 'hawk'
  | 'goblin'
  | 'jester'
  | 'plant'
  | 'crystal'
  | 'giant-rock'
  | 'giant-magma'
  | 'slime-boss'
  | 'roc-boss'
  | 'kraken-boss';

export interface CreatureVisual {
  shape: CreatureShape;
  body: string;
  accent: string;
  eye: string;
}

export interface DrawState {
  facing: 1 | -1;
  walkPhase: number; // 0..1 sine phase
  attackFlash: number; // 0..1, 1 = just attacked
  hurtFlash: number; // 0..1
  scale: number;
}

function bob(state: DrawState): number {
  return Math.sin(state.walkPhase * Math.PI * 2) * 3;
}

// --- Shading helpers -------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h.padEnd(6, '0');
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function mix(hex: string, target: [number, number, number], amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const nr = Math.round(r + (target[0] - r) * amount);
  const ng = Math.round(g + (target[1] - g) * amount);
  const nb = Math.round(b + (target[2] - b) * amount);
  return `rgb(${nr},${ng},${nb})`;
}

function lighten(hex: string, amount: number): string {
  return mix(hex, [255, 255, 255], amount);
}

function darken(hex: string, amount: number): string {
  return mix(hex, [0, 0, 0], amount);
}

/** A soft rim-lit radial gradient for volumetric-looking bodies: bright
 * highlight toward the upper-left light source, darker toward the rim. */
function bodyRadial(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string): CanvasGradient {
  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.42, Math.max(1, r * 0.1), cx, cy, r * 1.2);
  g.addColorStop(0, lighten(color, 0.4));
  g.addColorStop(0.55, color);
  g.addColorStop(1, darken(color, 0.32));
  return g;
}

const OUTLINE = 'rgba(15,10,8,0.55)';

function outline(ctx: CanvasRenderingContext2D, width = 1.6): void {
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = width;
  ctx.stroke();
}

export function drawCreature(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  visual: CreatureVisual,
  state: DrawState,
): void {
  ctx.save();
  ctx.translate(x, y + bob(state));

  // Contact shadow anchored to the ground, drawn before the scale/flip
  // transform so it never mirrors or stretches oddly.
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 15 * state.scale, 13 * state.scale, 4.2 * state.scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.scale(state.facing * state.scale, state.scale);

  if (state.hurtFlash > 0) {
    ctx.filter = `brightness(${1 + state.hurtFlash * 1.5}) saturate(0.3)`;
  }

  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 10;

  switch (visual.shape) {
    case 'wolf':
      drawWolf(ctx, visual, state);
      break;
    case 'anglerfish':
      drawAnglerfish(ctx, visual, state);
      break;
    case 'ram':
      drawRam(ctx, visual, state);
      break;
    case 'hawk':
      drawHawk(ctx, visual, state);
      break;
    case 'goblin':
      drawGoblin(ctx, visual, state);
      break;
    case 'jester':
      drawJester(ctx, visual, state);
      break;
    case 'plant':
      drawPlant(ctx, visual, state);
      break;
    case 'crystal':
      drawCrystalMage(ctx, visual, state);
      break;
    case 'giant-rock':
      drawGiantRock(ctx, visual, state);
      break;
    case 'giant-magma':
      drawGiantMagma(ctx, visual, state);
      break;
    case 'slime-boss':
      drawSlimeBoss(ctx, visual, state);
      break;
    case 'roc-boss':
      drawRocBoss(ctx, visual, state);
      break;
    case 'kraken-boss':
      drawKrakenBoss(ctx, visual, state);
      break;
  }

  ctx.restore();
}

function eyeDot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, r = 2.2) {
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(x, y, r + 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.32, 0, Math.PI * 2);
  ctx.fill();
}

function drawWolf(ctx: CanvasRenderingContext2D, v: CreatureVisual, s: DrawState) {
  // snout flame mane (drawn first, sits behind the body)
  ctx.fillStyle = bodyRadial(ctx, -14, -2, 12, v.accent);
  ctx.beginPath();
  ctx.moveTo(-14, -2);
  ctx.quadraticCurveTo(-22, -10 - Math.sin(s.walkPhase * 8) * 3, -10, -8);
  ctx.quadraticCurveTo(-20, 2, -6, 6);
  ctx.fill();
  outline(ctx, 1.2);

  ctx.fillStyle = bodyRadial(ctx, 0, 0, 14, v.body);
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx);
  // belly fur texture
  ctx.strokeStyle = darken(v.body, 0.25);
  ctx.lineWidth = 1;
  for (let i = -8; i <= 8; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, 3);
    ctx.lineTo(i - 2, 9);
    ctx.stroke();
  }

  // head
  ctx.fillStyle = bodyRadial(ctx, 14, -4, 9, v.body);
  ctx.beginPath();
  ctx.ellipse(14, -4, 9, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 1.3);
  // ears
  ctx.fillStyle = v.accent;
  ctx.beginPath();
  ctx.moveTo(10, -10);
  ctx.lineTo(13, -18);
  ctx.lineTo(16, -10);
  ctx.fill();
  outline(ctx, 1.1);
  eyeDot(ctx, 18, -5, v.eye);
  // snout shading
  ctx.fillStyle = darken(v.body, 0.2);
  ctx.beginPath();
  ctx.ellipse(21, -1, 3.4, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // legs
  ctx.fillStyle = darken(v.accent, 0.1);
  const legOffset = Math.sin(s.walkPhase * Math.PI * 2) * 4;
  ctx.fillRect(-8 + legOffset, 6, 4, 8);
  ctx.fillRect(4 - legOffset, 6, 4, 8);
  if (s.attackFlash > 0) {
    ctx.fillStyle = `rgba(255,120,30,${s.attackFlash})`;
    ctx.beginPath();
    ctx.arc(22, -4, 10 * s.attackFlash, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawAnglerfish(ctx: CanvasRenderingContext2D, v: CreatureVisual, s: DrawState) {
  // tail fin
  ctx.fillStyle = bodyRadial(ctx, -19, 0, 8, v.accent);
  ctx.beginPath();
  ctx.moveTo(-15, 0);
  ctx.lineTo(-24, -8 + bob(s));
  ctx.lineTo(-24, 8 + bob(s));
  ctx.fill();
  outline(ctx, 1.2);

  ctx.fillStyle = bodyRadial(ctx, 0, 0, 15, v.body);
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx);
  // scale texture
  ctx.strokeStyle = darken(v.body, 0.3);
  ctx.lineWidth = 1;
  for (let row = -1; row <= 1; row++) {
    for (let col = -2; col <= 2; col++) {
      ctx.beginPath();
      ctx.arc(col * 5, row * 5 + 1, 2.6, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
  }
  // lure
  ctx.strokeStyle = v.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(10, -8);
  ctx.quadraticCurveTo(20, -18, 16, -22);
  ctx.stroke();
  ctx.fillStyle = bodyRadial(ctx, 16, -22, 3, '#fff6b0');
  ctx.beginPath();
  ctx.arc(16, -22, 3, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 1);
  eyeDot(ctx, 10, -3, v.eye);
  // hooked hat (pirate flair)
  ctx.fillStyle = bodyRadial(ctx, 8, -12, 6, '#2b2440');
  ctx.beginPath();
  ctx.moveTo(2, -9);
  ctx.lineTo(14, -13);
  ctx.lineTo(4, -14);
  ctx.fill();
  outline(ctx, 1.1);
}

function drawRam(ctx: CanvasRenderingContext2D, v: CreatureVisual, s: DrawState) {
  ctx.fillStyle = bodyRadial(ctx, 0, 2, 15, v.body);
  ctx.beginPath();
  ctx.ellipse(0, 2, 15, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx);
  // wool texture (rows of small arcs)
  ctx.strokeStyle = darken(v.body, 0.22);
  ctx.lineWidth = 1;
  for (let row = -1; row <= 1; row++) {
    for (let col = -2; col <= 1; col++) {
      ctx.beginPath();
      ctx.arc(col * 6 + 2, row * 6 + 2, 3, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.fillStyle = bodyRadial(ctx, 13, -6, 8, v.body);
  ctx.beginPath();
  ctx.ellipse(13, -6, 8, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 1.3);
  // horns
  ctx.strokeStyle = v.accent;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(10, -9, 7, Math.PI * 0.9, Math.PI * 1.9);
  ctx.stroke();
  ctx.strokeStyle = darken(v.accent, 0.3);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(10, -9, 5, Math.PI * 0.9, Math.PI * 1.9);
  ctx.stroke();
  eyeDot(ctx, 18, -7, v.eye);
  const legOffset = Math.sin(s.walkPhase * Math.PI * 2) * 4;
  ctx.fillStyle = darken(v.accent, 0.1);
  ctx.fillRect(-9 + legOffset, 8, 5, 7);
  ctx.fillRect(5 - legOffset, 8, 5, 7);
  if (s.attackFlash > 0) {
    ctx.strokeStyle = `rgba(200,180,150,${s.attackFlash})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, -8);
    ctx.lineTo(20 + 14 * s.attackFlash, -8);
    ctx.stroke();
  }
}

function drawHawk(ctx: CanvasRenderingContext2D, v: CreatureVisual, s: DrawState) {
  const wingFlap = Math.sin(s.walkPhase * Math.PI * 4) * 10;
  ctx.fillStyle = bodyRadial(ctx, -11, -5 - wingFlap / 2, 12, v.accent);
  ctx.beginPath();
  ctx.moveTo(-2, 0);
  ctx.lineTo(-20, -10 - wingFlap);
  ctx.lineTo(-10, 2);
  ctx.fill();
  outline(ctx, 1.2);
  // feather lines
  ctx.strokeStyle = darken(v.accent, 0.3);
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-4 - i * 4, -1 - i * 2);
    ctx.lineTo(-16 - i * 2, -8 - wingFlap * 0.6);
    ctx.stroke();
  }

  ctx.fillStyle = bodyRadial(ctx, 0, 0, 12, v.body);
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx);
  ctx.fillStyle = bodyRadial(ctx, 11, -5, 7, v.body);
  ctx.beginPath();
  ctx.ellipse(11, -5, 7, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 1.2);
  ctx.fillStyle = '#f0c419';
  ctx.beginPath();
  ctx.moveTo(17, -5);
  ctx.lineTo(24, -3);
  ctx.lineTo(17, -1);
  ctx.fill();
  outline(ctx, 1);
  eyeDot(ctx, 14, -7, v.eye);
  if (s.attackFlash > 0) {
    ctx.strokeStyle = `rgba(180,230,255,${s.attackFlash})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(20, -4, 6 + i * 5 * s.attackFlash, -0.4, 0.4);
      ctx.stroke();
    }
  }
}

function drawGoblin(ctx: CanvasRenderingContext2D, v: CreatureVisual, s: DrawState) {
  ctx.fillStyle = bodyRadial(ctx, 0, 2, 11, v.body);
  ctx.beginPath();
  ctx.ellipse(0, 2, 10, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx);
  // patchwork straps
  ctx.strokeStyle = darken(v.body, 0.35);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-7, -3);
  ctx.lineTo(6, 8);
  ctx.stroke();

  ctx.fillStyle = bodyRadial(ctx, 2, -12, 8, v.body);
  ctx.beginPath();
  ctx.ellipse(2, -12, 8, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 1.3);
  ctx.fillStyle = v.accent;
  ctx.beginPath();
  ctx.moveTo(6, -18);
  ctx.lineTo(14, -22);
  ctx.lineTo(8, -13);
  ctx.fill();
  outline(ctx, 1);
  eyeDot(ctx, 6, -13, v.eye);
  // wrench arm
  const swing = Math.sin(s.walkPhase * Math.PI * 2) * 6;
  ctx.strokeStyle = '#6d727c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(9, -2);
  ctx.lineTo(18 + swing * 0.3, 4);
  ctx.stroke();
  ctx.fillStyle = bodyRadial(ctx, 19 + swing * 0.3, 3, 4, '#c7cdd6');
  ctx.fillRect(16 + swing * 0.3, 1, 6, 4);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(16 + swing * 0.3, 1, 6, 4);
  // belt rivets
  ctx.fillStyle = '#8a8f9a';
  for (const rx of [-4, 0, 4]) {
    ctx.beginPath();
    ctx.arc(rx, 6, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  if (s.attackFlash > 0) {
    ctx.strokeStyle = `rgba(120,220,255,${s.attackFlash})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, -2);
    ctx.lineTo(20 + 12 * s.attackFlash, -2 - 6 * s.attackFlash);
    ctx.stroke();
  }
}

function drawJester(ctx: CanvasRenderingContext2D, v: CreatureVisual, s: DrawState) {
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = bodyRadial(ctx, 0, 0, 12, v.body);
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx);
  // harlequin diamond marks
  ctx.fillStyle = lighten(v.accent, 0.15);
  ctx.globalAlpha = 0.5;
  for (const [dx, dy] of [[-5, 4], [5, -2], [0, 8]] as [number, number][]) {
    ctx.beginPath();
    ctx.moveTo(dx, dy - 2.6);
    ctx.lineTo(dx + 2.6, dy);
    ctx.lineTo(dx, dy + 2.6);
    ctx.lineTo(dx - 2.6, dy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 0.88;
  // jester hat, 3 points
  ctx.fillStyle = v.accent;
  for (const dx of [-8, 0, 8]) {
    ctx.beginPath();
    ctx.moveTo(dx - 4, -12);
    ctx.lineTo(dx, -22 - Math.abs(Math.sin(s.walkPhase * 6 + dx)) * 3);
    ctx.lineTo(dx + 4, -12);
    ctx.fill();
    outline(ctx, 1);
  }
  eyeDot(ctx, 4, -13, v.eye);
  eyeDot(ctx, -4, -13, v.eye);
  ctx.globalAlpha = 1;
  if (s.attackFlash > 0) {
    ctx.fillStyle = `rgba(150,60,200,${s.attackFlash})`;
    ctx.beginPath();
    ctx.moveTo(10, -4);
    ctx.lineTo(10 + 16 * s.attackFlash, -8);
    ctx.lineTo(10 + 16 * s.attackFlash, 0);
    ctx.fill();
  }
}

function drawPlant(ctx: CanvasRenderingContext2D, v: CreatureVisual, s: DrawState) {
  ctx.fillStyle = bodyRadial(ctx, 0, 4, 13, v.body);
  ctx.beginPath();
  ctx.ellipse(0, 4, 13, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx);
  ctx.strokeStyle = darken(v.body, 0.3);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.lineTo(0, 12);
  ctx.moveTo(-8, 4);
  ctx.lineTo(8, 4);
  ctx.stroke();

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + s.walkPhase;
    const px = Math.cos(a) * 10;
    const py = -10 + Math.sin(a) * 4;
    ctx.fillStyle = bodyRadial(ctx, px, py, 6, v.accent);
    ctx.beginPath();
    ctx.ellipse(px, py, 5, 8, a, 0, Math.PI * 2);
    ctx.fill();
    outline(ctx, 1);
    ctx.strokeStyle = darken(v.accent, 0.3);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(px - Math.cos(a) * 5, py - Math.sin(a) * 5);
    ctx.lineTo(px + Math.cos(a) * 5, py + Math.sin(a) * 5);
    ctx.stroke();
  }
  eyeDot(ctx, 4, -2, v.eye);
  eyeDot(ctx, -4, -2, v.eye);
  if (s.attackFlash > 0) {
    ctx.strokeStyle = `rgba(100,220,90,${s.attackFlash})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, 2);
    ctx.quadraticCurveTo(20, -4, 14 + 14 * s.attackFlash, 2);
    ctx.stroke();
  }
}

function drawCrystalMage(ctx: CanvasRenderingContext2D, v: CreatureVisual, s: DrawState) {
  ctx.fillStyle = bodyRadial(ctx, 0, -2, 14, v.body);
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(9, -2);
  ctx.lineTo(6, 12);
  ctx.lineTo(-6, 12);
  ctx.lineTo(-9, -2);
  ctx.closePath();
  ctx.fill();
  outline(ctx);
  // facet lines for a cut-gem look
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(0, 12);
  ctx.moveTo(-9, -2);
  ctx.lineTo(9, -2);
  ctx.moveTo(0, -16);
  ctx.lineTo(-6, 12);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(6, 12);
  ctx.stroke();

  ctx.fillStyle = bodyRadial(ctx, 0, -16, 4, v.accent);
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(4, -13);
  ctx.lineTo(-4, -13);
  ctx.fill();
  outline(ctx, 1);
  eyeDot(ctx, 3, -3, v.eye, 2);
  eyeDot(ctx, -3, -3, v.eye, 2);
  if (s.attackFlash > 0) {
    ctx.fillStyle = `rgba(200,120,255,${s.attackFlash})`;
    ctx.beginPath();
    ctx.arc(12, -2, 6 * s.attackFlash, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGiantRock(ctx: CanvasRenderingContext2D, v: CreatureVisual, s: DrawState) {
  ctx.fillStyle = bodyRadial(ctx, 0, 4, 22, v.body);
  ctx.beginPath();
  ctx.ellipse(0, 4, 22, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 2);
  // fissure cracks across the hide
  ctx.strokeStyle = darken(v.body, 0.4);
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-14, -4);
  ctx.lineTo(-4, 6);
  ctx.lineTo(-8, 16);
  ctx.moveTo(6, -8);
  ctx.lineTo(14, 2);
  ctx.lineTo(10, 14);
  ctx.stroke();
  // moss/lichen patches
  ctx.fillStyle = 'rgba(120,170,90,0.35)';
  ctx.beginPath();
  ctx.ellipse(-12, 10, 5, 3, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = bodyRadial(ctx, -6, -14, 5, v.accent);
  ctx.beginPath();
  ctx.ellipse(-6, -14, 5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 1.2);
  ctx.fillStyle = bodyRadial(ctx, 8, -18, 6, v.accent);
  ctx.beginPath();
  ctx.ellipse(8, -18, 6, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 1.2);
  eyeDot(ctx, 12, -2, v.eye, 3.5);
  eyeDot(ctx, -2, -4, v.eye, 3.5);
  const legOffset = Math.sin(s.walkPhase * Math.PI * 2) * 5;
  ctx.fillStyle = darken(v.body, 0.1);
  ctx.fillRect(-16 + legOffset, 16, 9, 10);
  ctx.fillRect(6 - legOffset, 16, 9, 10);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-16 + legOffset, 16, 9, 10);
  ctx.strokeRect(6 - legOffset, 16, 9, 10);
  if (s.attackFlash > 0) {
    ctx.strokeStyle = `rgba(230,220,190,${s.attackFlash})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 20, 20 + 20 * s.attackFlash, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawGiantMagma(ctx: CanvasRenderingContext2D, v: CreatureVisual, s: DrawState) {
  ctx.fillStyle = bodyRadial(ctx, 0, 2, 21, v.body);
  ctx.beginPath();
  ctx.ellipse(0, 2, 21, 19, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 2);
  ctx.fillStyle = v.accent;
  const crackPhase = Math.sin(s.walkPhase * 6) * 0.3 + 0.7;
  ctx.globalAlpha = crackPhase;
  ctx.shadowColor = v.accent;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(-10, -6);
  ctx.lineTo(0, 2);
  ctx.lineTo(-4, 12);
  ctx.lineTo(8, 4);
  ctx.lineTo(2, -10);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  // secondary hairline cracks
  ctx.strokeStyle = `rgba(255,190,90,${crackPhase * 0.7})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-14, 8);
  ctx.lineTo(-6, 14);
  ctx.moveTo(10, -12);
  ctx.lineTo(16, -4);
  ctx.stroke();

  eyeDot(ctx, 10, -6, v.eye, 3.5);
  eyeDot(ctx, -4, -8, v.eye, 3.5);
  const legOffset = Math.sin(s.walkPhase * Math.PI * 2) * 5;
  ctx.fillStyle = darken(v.body, 0.1);
  ctx.fillRect(-15 + legOffset, 14, 9, 10);
  ctx.fillRect(6 - legOffset, 14, 9, 10);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-15 + legOffset, 14, 9, 10);
  ctx.strokeRect(6 - legOffset, 14, 9, 10);
  if (s.attackFlash > 0) {
    ctx.fillStyle = `rgba(255,140,40,${s.attackFlash})`;
    ctx.beginPath();
    ctx.arc(18, 0, 12 * s.attackFlash, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSlimeBoss(ctx: CanvasRenderingContext2D, v: CreatureVisual, s: DrawState) {
  const squish = 1 + Math.sin(s.walkPhase * Math.PI * 2) * 0.08;
  ctx.fillStyle = bodyRadial(ctx, 0, 0, 26, v.body);
  ctx.beginPath();
  ctx.ellipse(0, 0, 26 * squish, 22 / squish, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 2);
  ctx.fillStyle = bodyRadial(ctx, 0, -6, 20, v.accent);
  ctx.beginPath();
  ctx.ellipse(0, -6, 20, 12, 0, 0, Math.PI);
  ctx.fill();
  outline(ctx, 1.4);
  // glossy wet highlight
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.ellipse(-10, -10, 6, 3.5, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // drips
  ctx.fillStyle = darken(v.body, 0.15);
  for (const dx of [-16, -2, 14]) {
    ctx.beginPath();
    ctx.ellipse(dx, 16 + Math.sin(s.walkPhase * 4 + dx) * 2, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  eyeDot(ctx, 8, -4, v.eye, 4);
  eyeDot(ctx, -8, -4, v.eye, 4);
  if (s.attackFlash > 0) {
    ctx.fillStyle = `rgba(255,90,60,${s.attackFlash})`;
    ctx.beginPath();
    ctx.arc(0, 10, 24 * s.attackFlash, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRocBoss(ctx: CanvasRenderingContext2D, v: CreatureVisual, s: DrawState) {
  const wingFlap = Math.sin(s.walkPhase * Math.PI * 4) * 16;
  for (const side of [-1, 1] as const) {
    ctx.fillStyle = bodyRadial(ctx, side * 17, -7, 16, v.accent);
    const tipY = -14 + side * wingFlap;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(side * 34, tipY);
    ctx.lineTo(side * 14, 6);
    ctx.fill();
    outline(ctx, 1.4);
    ctx.strokeStyle = darken(v.accent, 0.3);
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(side * 34 * (i / 3.4), tipY * (i / 3.4));
      ctx.stroke();
    }
  }
  ctx.fillStyle = bodyRadial(ctx, 0, 0, 18, v.body);
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 1.8);
  ctx.fillStyle = bodyRadial(ctx, 0, -16, 10, v.body);
  ctx.beginPath();
  ctx.ellipse(0, -16, 10, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 1.4);
  ctx.fillStyle = '#f0c419';
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(10, -12);
  ctx.lineTo(0, -8);
  ctx.fill();
  outline(ctx, 1);
  eyeDot(ctx, 3, -19, v.eye, 3);
  eyeDot(ctx, -6, -19, v.eye, 3);
}

function quadPoint(p0x: number, p0y: number, p1x: number, p1y: number, p2x: number, p2y: number, t: number): [number, number] {
  const u = 1 - t;
  return [u * u * p0x + 2 * u * t * p1x + t * t * p2x, u * u * p0y + 2 * u * t * p1y + t * t * p2y];
}

function drawKrakenBoss(ctx: CanvasRenderingContext2D, v: CreatureVisual, s: DrawState) {
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const wig = Math.sin(s.walkPhase * 6 + i) * 6;
    const startX = Math.cos(a) * 14;
    const startY = 4 + Math.sin(a) * 6;
    const ctrlX = Math.cos(a) * 30 + wig;
    const ctrlY = 20;
    const endX = Math.cos(a) * 20;
    const endY = 34 + Math.sin(a) * 4;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    ctx.lineWidth = 5;
    ctx.strokeStyle = v.accent;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = darken(v.accent, 0.3);
    ctx.lineWidth = 1;
    ctx.stroke();
    for (let t = 0.2; t < 1; t += 0.25) {
      const [sx, sy] = quadPoint(startX, startY, ctrlX, ctrlY, endX, endY, t);
      ctx.beginPath();
      ctx.arc(sx, sy, 1.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fill();
    }
  }
  ctx.fillStyle = bodyRadial(ctx, 0, -6, 20, v.body);
  ctx.beginPath();
  ctx.ellipse(0, -6, 20, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 2);
  ctx.strokeStyle = darken(v.body, 0.3);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-12, -14);
  ctx.quadraticCurveTo(0, -10, 12, -14);
  ctx.stroke();
  eyeDot(ctx, 7, -10, v.eye, 4);
  eyeDot(ctx, -7, -10, v.eye, 4);
}
