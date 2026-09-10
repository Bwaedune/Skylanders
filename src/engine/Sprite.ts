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
  | 'kraken-boss'
  | 'king-boss';

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
const STEEL = '#aab0ba';
const STEEL_DARK = '#5b6068';
const LEATHER = '#6b4a30';
const LEATHER_DARK = '#42301f';

function outline(ctx: CanvasRenderingContext2D, width = 1.6): void {
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = width;
  ctx.stroke();
}

/** A small metal rivet/stud, used across several characters' gear. */
function rivet(ctx: CanvasRenderingContext2D, x: number, y: number, r = 1.1, color = STEEL): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
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
    case 'king-boss':
      drawKingBoss(ctx, visual, state);
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
  const tailWag = Math.sin(s.walkPhase * Math.PI * 4) * 6;

  // bushy tail, sweeping up behind the body — the wolf's signature silhouette cue
  ctx.fillStyle = bodyRadial(ctx, -22, -6, 10, v.accent);
  ctx.beginPath();
  ctx.moveTo(-14, 4);
  ctx.quadraticCurveTo(-26, 2 + tailWag, -28, -10 + tailWag);
  ctx.quadraticCurveTo(-24, -14 + tailWag, -18, -6);
  ctx.quadraticCurveTo(-20, -2, -12, 2);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 1.2);
  ctx.strokeStyle = darken(v.accent, 0.25);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.lineTo(-25, -5 + tailWag);
  ctx.stroke();

  // long, low, lupine body
  ctx.fillStyle = bodyRadial(ctx, -1, 1, 16, v.body);
  ctx.beginPath();
  ctx.ellipse(-1, 1, 16, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx);
  // back mane ridge
  ctx.fillStyle = v.accent;
  ctx.beginPath();
  ctx.moveTo(-10, -6);
  ctx.lineTo(-4, -11);
  ctx.lineTo(2, -6);
  ctx.lineTo(-4, -4);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 1);
  // belly fur texture
  ctx.strokeStyle = darken(v.body, 0.25);
  ctx.lineWidth = 1;
  for (let i = -10; i <= 8; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, 5);
    ctx.lineTo(i - 2, 9.5);
    ctx.stroke();
  }

  // war-harness: crossed leather straps with a metal buckle, so this reads
  // as a fighting animal that's been armored up, not a plain wolf
  ctx.strokeStyle = LEATHER_DARK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-10, -4);
  ctx.lineTo(6, 6);
  ctx.moveTo(-10, 6);
  ctx.lineTo(6, -4);
  ctx.stroke();
  ctx.fillStyle = bodyRadial(ctx, -2, 1, 3, STEEL);
  ctx.beginPath();
  ctx.arc(-2, 1, 2.6, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 1);
  // small studded pauldron on the back
  ctx.fillStyle = bodyRadial(ctx, -3, -8, 4.5, LEATHER);
  ctx.beginPath();
  ctx.ellipse(-3, -8, 4.5, 3.2, -0.2, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 1);
  rivet(ctx, -4.5, -8.5);
  rivet(ctx, -1.5, -8);

  // head with a distinctly pointed snout
  ctx.fillStyle = bodyRadial(ctx, 13, -5, 8, v.body);
  ctx.beginPath();
  ctx.ellipse(13, -5, 7.5, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 1.3);
  ctx.fillStyle = bodyRadial(ctx, 21, -2, 5, v.body);
  ctx.beginPath();
  ctx.moveTo(17, -6);
  ctx.lineTo(26, -1.5);
  ctx.lineTo(17, 2);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 1.1);
  ctx.fillStyle = '#2a1a12';
  ctx.beginPath();
  ctx.arc(25, -1.5, 1.3, 0, Math.PI * 2);
  ctx.fill();
  // sharp perked ears
  ctx.fillStyle = v.accent;
  ctx.beginPath();
  ctx.moveTo(9, -9);
  ctx.lineTo(11, -19);
  ctx.lineTo(15, -10);
  ctx.fill();
  outline(ctx, 1.1);
  eyeDot(ctx, 15, -6, v.eye);

  // spiked collar at the neck junction
  ctx.fillStyle = STEEL;
  for (const cx of [5, 8, 11]) {
    ctx.beginPath();
    ctx.moveTo(cx - 1.6, 0);
    ctx.lineTo(cx, -4.5);
    ctx.lineTo(cx + 1.6, 0);
    ctx.closePath();
    ctx.fill();
    outline(ctx, 0.8);
  }

  // legs with metal bracers
  ctx.fillStyle = darken(v.accent, 0.1);
  const legOffset = Math.sin(s.walkPhase * Math.PI * 2) * 4;
  ctx.fillRect(-9 + legOffset, 6, 4, 8);
  ctx.fillRect(5 - legOffset, 6, 4, 8);
  ctx.fillStyle = STEEL_DARK;
  ctx.fillRect(-9 + legOffset, 8, 4, 1.8);
  ctx.fillRect(5 - legOffset, 8, 4, 1.8);
  if (s.attackFlash > 0) {
    ctx.fillStyle = `rgba(255,120,30,${s.attackFlash})`;
    ctx.beginPath();
    ctx.arc(24, -2, 10 * s.attackFlash, 0, Math.PI * 2);
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
  // popped coat collar at the gills
  ctx.fillStyle = bodyRadial(ctx, 0, 6, 6, '#2b2440');
  ctx.beginPath();
  ctx.moveTo(-6, 2);
  ctx.lineTo(-2, 9);
  ctx.lineTo(-8, 8);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 1);
  ctx.beginPath();
  ctx.moveTo(4, 3);
  ctx.lineTo(8, 9);
  ctx.lineTo(2, 8);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 1);
  // barnacle studs on the shoulder
  rivet(ctx, -4, -6, 1, '#dfe8ea');
  rivet(ctx, -1, -8, 0.9, '#dfe8ea');

  // harpoon, carried alongside the body — a captain's boarding weapon
  ctx.save();
  ctx.rotate(-0.5);
  ctx.strokeStyle = LEATHER_DARK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6, 10);
  ctx.lineTo(-6, 34);
  ctx.stroke();
  ctx.fillStyle = bodyRadial(ctx, -6, 8, 4, STEEL);
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(-2, 10);
  ctx.lineTo(-6, 8);
  ctx.lineTo(-10, 10);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 1);
  ctx.restore();
}

function drawRam(ctx: CanvasRenderingContext2D, v: CreatureVisual, s: DrawState) {
  // warhammer strapped across the back, resting above the body
  ctx.save();
  ctx.rotate(-0.35);
  ctx.strokeStyle = LEATHER_DARK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, -16);
  ctx.lineTo(-2, 4);
  ctx.stroke();
  ctx.fillStyle = bodyRadial(ctx, -16, -20, 6, STEEL);
  ctx.fillRect(-22, -25, 14, 9);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-22, -25, 14, 9);
  ctx.fillStyle = STEEL_DARK;
  ctx.fillRect(-22, -25, 14, 2.5);
  ctx.restore();

  // low, stout, barrel-shaped body — short and wide, the opposite of the wolf
  ctx.fillStyle = bodyRadial(ctx, 0, 3, 14, v.body);
  ctx.beginPath();
  ctx.ellipse(0, 3, 13, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx);
  // wool texture (rows of small arcs)
  ctx.strokeStyle = darken(v.body, 0.22);
  ctx.lineWidth = 1;
  for (let row = -1; row <= 1; row++) {
    for (let col = -2; col <= 1; col++) {
      ctx.beginPath();
      ctx.arc(col * 5.5 + 2, row * 6 + 3, 3, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
  }
  // riveted chest plate, strapped on over the wool
  ctx.fillStyle = bodyRadial(ctx, -1, 4, 8, STEEL);
  ctx.beginPath();
  ctx.ellipse(-1, 4, 7.5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 1.2);
  rivet(ctx, -5, 2);
  rivet(ctx, 3, 2);
  rivet(ctx, -1, 8);

  ctx.fillStyle = bodyRadial(ctx, 12, -4, 7, v.body);
  ctx.beginPath();
  ctx.ellipse(12, -4, 7, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 1.3);

  // big double-curled horns — the ram's unmistakable silhouette feature
  for (const dir of [-1, 1] as const) {
    const hy = -4 + dir * 5;
    ctx.strokeStyle = v.accent;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(6, hy, 9, Math.PI * 0.05, Math.PI * 1.6, dir < 0);
    ctx.stroke();
    ctx.strokeStyle = darken(v.accent, 0.35);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(6, hy, 9, Math.PI * 0.05, Math.PI * 1.6, dir < 0);
    ctx.stroke();
    // ridge grooves along the horn for texture
    ctx.strokeStyle = darken(v.accent, 0.2);
    ctx.lineWidth = 1;
    for (let g = 0; g < 3; g++) {
      const ga = Math.PI * (0.15 + g * 0.35);
      ctx.beginPath();
      ctx.moveTo(6 + Math.cos(ga) * 6, hy + Math.sin(ga) * dir * -6);
      ctx.lineTo(6 + Math.cos(ga) * 11, hy + Math.sin(ga) * dir * -11);
      ctx.stroke();
    }
  }
  eyeDot(ctx, 16, -4, v.eye);
  const legOffset = Math.sin(s.walkPhase * Math.PI * 2) * 3;
  ctx.fillStyle = darken(v.accent, 0.1);
  ctx.fillRect(-9 + legOffset, 10, 5, 6);
  ctx.fillRect(5 - legOffset, 10, 5, 6);
  ctx.fillStyle = STEEL_DARK;
  ctx.fillRect(-9 + legOffset, 14, 5, 2);
  ctx.fillRect(5 - legOffset, 14, 5, 2);
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

  // quiver of arrows slung on the back
  ctx.save();
  ctx.rotate(0.3);
  ctx.fillStyle = bodyRadial(ctx, -12, 2, 4, LEATHER);
  ctx.fillRect(-15, -8, 6, 14);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(-15, -8, 6, 14);
  for (const fx of [-14, -12, -10]) {
    ctx.strokeStyle = v.accent;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(fx, -8);
    ctx.lineTo(fx, -14);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = bodyRadial(ctx, 0, 0, 12, v.body);
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx);
  // chest strap
  ctx.strokeStyle = LEATHER_DARK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-8, -5);
  ctx.lineTo(4, 6);
  ctx.stroke();

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
  // flight goggles pushed up on the forehead
  ctx.strokeStyle = LEATHER_DARK;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(9, -11);
  ctx.lineTo(13, -12.5);
  ctx.stroke();
  ctx.fillStyle = bodyRadial(ctx, 9, -11, 2, STEEL);
  ctx.beginPath();
  ctx.arc(9, -11, 1.8, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 0.8);
  ctx.fillStyle = bodyRadial(ctx, 13, -12.5, 2, STEEL);
  ctx.beginPath();
  ctx.arc(13, -12.5, 1.8, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 0.8);
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
  // gear-rig backpack, peeking out behind the body
  ctx.fillStyle = bodyRadial(ctx, -8, -2, 5, STEEL_DARK);
  ctx.beginPath();
  ctx.ellipse(-8, -2, 4, 6, 0.1, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 1);
  ctx.save();
  ctx.translate(-8, -2);
  ctx.rotate(s.walkPhase * Math.PI * 2);
  ctx.strokeStyle = STEEL;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 1.5, Math.sin(a) * 1.5);
    ctx.lineTo(Math.cos(a) * 3.2, Math.sin(a) * 3.2);
    ctx.stroke();
  }
  ctx.restore();
  rivet(ctx, -8, -2, 1.4);

  ctx.fillStyle = bodyRadial(ctx, 0, 2, 11, v.body);
  ctx.beginPath();
  ctx.ellipse(0, 2, 10, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx);
  // leather apron with a tool pouch
  ctx.fillStyle = bodyRadial(ctx, 0, 5, 8, LEATHER);
  ctx.beginPath();
  ctx.moveTo(-6, -4);
  ctx.lineTo(6, -4);
  ctx.lineTo(5, 10);
  ctx.lineTo(-5, 10);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 1.2);
  ctx.fillStyle = LEATHER_DARK;
  ctx.fillRect(-4, 3, 5, 4);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-4, 3, 5, 4);
  ctx.strokeStyle = darken(LEATHER, 0.3);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-6, -4);
  ctx.lineTo(6, -4);
  ctx.stroke();

  // big bat-like ear jutting out to the side — the goblin's signature feature
  ctx.fillStyle = bodyRadial(ctx, -6, -14, 8, v.accent);
  ctx.beginPath();
  ctx.moveTo(-1, -14);
  ctx.quadraticCurveTo(-14, -20, -13, -8);
  ctx.quadraticCurveTo(-9, -10, -2, -8);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 1.1);
  ctx.strokeStyle = darken(v.accent, 0.3);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-2, -12);
  ctx.lineTo(-9, -12);
  ctx.stroke();

  ctx.fillStyle = bodyRadial(ctx, 2, -12, 8, v.body);
  ctx.beginPath();
  ctx.ellipse(2, -12, 8, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 1.3);
  // small horn nub instead of a top ear, so the silhouette reads goblin, not wolf
  ctx.fillStyle = v.accent;
  ctx.beginPath();
  ctx.moveTo(4, -19);
  ctx.lineTo(8, -24);
  ctx.lineTo(9, -18);
  ctx.fill();
  outline(ctx, 1);
  eyeDot(ctx, 6, -13, v.eye);
  // tinkerer's goggles, pushed up on the forehead
  ctx.strokeStyle = LEATHER_DARK;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-3, -17);
  ctx.lineTo(6, -18.5);
  ctx.stroke();
  for (const gx of [-3, 6]) {
    ctx.fillStyle = bodyRadial(ctx, gx, gx === -3 ? -17 : -18.5, 2.2, STEEL);
    ctx.beginPath();
    ctx.arc(gx, gx === -3 ? -17 : -18.5, 2, 0, Math.PI * 2);
    ctx.fill();
    outline(ctx, 0.8);
  }
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
  const sway = Math.sin(s.walkPhase * Math.PI * 2) * 4;
  // tattered cape trailing behind
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = darken(v.accent, 0.35);
  ctx.beginPath();
  ctx.moveTo(-6, -8);
  ctx.lineTo(-16 + sway * 0.3, -4);
  ctx.lineTo(-13 + sway * 0.5, 2);
  ctx.lineTo(-18 + sway * 0.3, 6);
  ctx.lineTo(-12, 10);
  ctx.lineTo(-6, 6);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 1);
  ctx.globalAlpha = 1;

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
  ctx.globalAlpha = 1;
  // ruffled collar
  ctx.fillStyle = '#f2f2f2';
  for (const dx of [-6, -2, 2, 6]) {
    ctx.beginPath();
    ctx.arc(dx, -9, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 0.8;
  for (const dx of [-6, -2, 2, 6]) {
    ctx.beginPath();
    ctx.arc(dx, -9, 2.2, 0, Math.PI * 2);
    ctx.stroke();
  }
  // dagger at the hip
  ctx.save();
  ctx.rotate(0.5);
  ctx.fillStyle = bodyRadial(ctx, 8, 6, 3, STEEL);
  ctx.beginPath();
  ctx.moveTo(6, 2);
  ctx.lineTo(8, 12);
  ctx.lineTo(10, 2);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 1);
  ctx.fillStyle = LEATHER_DARK;
  ctx.fillRect(6.5, -1, 3, 3.5);
  ctx.restore();

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

  // woven vine belt with a seed-pod pouch
  ctx.strokeStyle = darken(v.accent, 0.15);
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-9, 5);
  ctx.quadraticCurveTo(0, 8, 9, 5);
  ctx.stroke();
  ctx.fillStyle = bodyRadial(ctx, 0, 9, 4, darken(v.accent, 0.1));
  ctx.beginPath();
  ctx.ellipse(0, 9, 3.6, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 1);

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

  // gnarled wooden staff, held to the side
  ctx.strokeStyle = LEATHER_DARK;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(15, 12);
  ctx.lineTo(18, -14);
  ctx.stroke();
  ctx.fillStyle = bodyRadial(ctx, 18, -16, 5, v.accent);
  ctx.beginPath();
  ctx.ellipse(18, -16, 4.5, 5, 0.2, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 1);
  ctx.fillStyle = lighten(v.accent, 0.2);
  ctx.beginPath();
  ctx.ellipse(16, -19, 2, 3, 0.5, 0, Math.PI * 2);
  ctx.fill();

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
  // draping cloak flaps behind the crystal core
  const drift = Math.sin(s.walkPhase * Math.PI * 2) * 1.5;
  ctx.fillStyle = darken(v.accent, 0.4);
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(-6, -4);
  ctx.lineTo(-13 + drift, 6);
  ctx.lineTo(-9, 13);
  ctx.lineTo(-3, 4);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 1);
  ctx.beginPath();
  ctx.moveTo(6, -4);
  ctx.lineTo(13 - drift, 6);
  ctx.lineTo(9, 13);
  ctx.lineTo(3, 4);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 1);
  ctx.globalAlpha = 1;
  // faint glowing rune marks on the cloak
  ctx.fillStyle = v.eye;
  ctx.shadowColor = v.eye;
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(-9 + drift * 0.5, 5, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(9 - drift * 0.5, 5, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

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

  // floating crystal blade, held ready at the side
  ctx.save();
  ctx.translate(14, -1);
  ctx.rotate(-0.3);
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = bodyRadial(ctx, 0, 0, 5, lighten(v.accent, 0.2));
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.lineTo(3, 0);
  ctx.lineTo(0, 13);
  ctx.lineTo(-3, 0);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 1);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.lineTo(0, 13);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  if (s.attackFlash > 0) {
    ctx.fillStyle = `rgba(200,120,255,${s.attackFlash})`;
    ctx.beginPath();
    ctx.arc(12, -2, 6 * s.attackFlash, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGiantRock(ctx: CanvasRenderingContext2D, v: CreatureVisual, s: DrawState) {
  // a massive banded stone warhammer, resting beside the titan
  ctx.save();
  ctx.rotate(-0.2);
  ctx.strokeStyle = LEATHER_DARK;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(20, 20);
  ctx.lineTo(26, -10);
  ctx.stroke();
  ctx.fillStyle = bodyRadial(ctx, 26, -20, 11, darken(v.body, 0.1));
  ctx.beginPath();
  ctx.ellipse(26, -20, 11, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 2);
  ctx.strokeStyle = STEEL_DARK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(17, -20);
  ctx.lineTo(35, -20);
  ctx.stroke();
  ctx.restore();

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
  ctx.strokeStyle = STEEL_DARK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(-6, -14, 5, 0.3, Math.PI - 0.3);
  ctx.stroke();
  ctx.fillStyle = bodyRadial(ctx, 8, -18, 6, v.accent);
  ctx.beginPath();
  ctx.ellipse(8, -18, 6, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 1.2);
  ctx.strokeStyle = STEEL_DARK;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(8, -18, 6, 0.3, Math.PI - 0.3);
  ctx.stroke();
  rivet(ctx, 8, -22, 1.2);

  // glowing rune emblem set into the chest
  ctx.strokeStyle = v.eye;
  ctx.shadowColor = v.eye;
  ctx.shadowBlur = 5;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(2, 5, 4.5, 0, Math.PI * 2);
  ctx.moveTo(2, 0.5);
  ctx.lineTo(2, 9.5);
  ctx.moveTo(-2.5, 5);
  ctx.lineTo(6.5, 5);
  ctx.stroke();
  ctx.shadowBlur = 0;

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
  // forge-hammer, its obsidian head lit from within by the forge crack
  ctx.save();
  ctx.rotate(-0.25);
  ctx.strokeStyle = '#2a1410';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(19, 20);
  ctx.lineTo(25, -9);
  ctx.stroke();
  ctx.fillStyle = bodyRadial(ctx, 25, -19, 10, '#241210');
  ctx.beginPath();
  ctx.ellipse(25, -19, 10, 7.5, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 2);
  ctx.strokeStyle = v.accent;
  ctx.shadowColor = v.accent;
  ctx.shadowBlur = 6;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(17, -19);
  ctx.lineTo(33, -19);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

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

  // obsidian shoulder plate, chained on over the molten hide
  ctx.fillStyle = '#241210';
  ctx.beginPath();
  ctx.moveTo(-14, -14);
  ctx.lineTo(-2, -18);
  ctx.lineTo(2, -10);
  ctx.lineTo(-10, -6);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 1.3);
  ctx.strokeStyle = `rgba(255,150,60,${crackPhase * 0.6})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-11, -13);
  ctx.lineTo(-3, -14);
  ctx.stroke();
  ctx.strokeStyle = STEEL_DARK;
  ctx.lineWidth = 1.2;
  for (const cx of [-13, -9, -5]) {
    ctx.beginPath();
    ctx.arc(cx, -16, 1.4, 0, Math.PI * 2);
    ctx.stroke();
  }

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

function drawKingBoss(ctx: CanvasRenderingContext2D, v: CreatureVisual, s: DrawState) {
  const sway = Math.sin(s.walkPhase * Math.PI * 2) * 3;

  // a tattered royal cape, split behind the throne-breaker's shoulders
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = darken(v.body, 0.15);
  ctx.beginPath();
  ctx.moveTo(-9, -15);
  ctx.lineTo(-25 + sway, 4);
  ctx.lineTo(-19, 27);
  ctx.lineTo(-6, 31);
  ctx.lineTo(1, 10);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 1.6);
  ctx.beginPath();
  ctx.moveTo(9, -15);
  ctx.lineTo(25 - sway, 4);
  ctx.lineTo(19, 27);
  ctx.lineTo(6, 31);
  ctx.lineTo(-1, 10);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 1.6);
  ctx.globalAlpha = 1;

  // twin blades flanking the body in a ready stance
  for (const side of [-1, 1] as const) {
    ctx.save();
    ctx.translate(side * 21, -2 + sway * side * 0.3);
    ctx.rotate(side * 0.16);
    ctx.fillStyle = bodyRadial(ctx, 0, 0, 5, lighten(v.accent, 0.25));
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(4, 0);
    ctx.lineTo(0, 27);
    ctx.lineTo(-4, 0);
    ctx.closePath();
    ctx.fill();
    outline(ctx, 1.4);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(0, 26);
    ctx.stroke();
    ctx.fillStyle = STEEL_DARK;
    ctx.fillRect(-3, 0, 6, 7);
    outline(ctx, 1);
    ctx.restore();
  }

  // armored torso with a glowing fracture down the chest
  ctx.fillStyle = bodyRadial(ctx, 0, 2, 18, v.body);
  ctx.beginPath();
  ctx.moveTo(-13, -17);
  ctx.lineTo(13, -17);
  ctx.lineTo(16, 14);
  ctx.lineTo(0, 21);
  ctx.lineTo(-16, 14);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 2);
  ctx.strokeStyle = v.accent;
  ctx.shadowColor = v.accent;
  ctx.shadowBlur = 9;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.lineTo(-3, -1);
  ctx.lineTo(2, 8);
  ctx.lineTo(0, 17);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // banded shoulder pauldrons
  for (const side of [-1, 1] as const) {
    ctx.fillStyle = bodyRadial(ctx, side * 14, -15, 6, darken(v.body, 0.05));
    ctx.beginPath();
    ctx.ellipse(side * 14, -15, 6, 5, side * 0.3, 0, Math.PI * 2);
    ctx.fill();
    outline(ctx, 1.3);
    ctx.strokeStyle = STEEL_DARK;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(side * 14, -15, 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // head beneath a jagged crystalline crown
  ctx.fillStyle = bodyRadial(ctx, 0, -23, 8, v.body);
  ctx.beginPath();
  ctx.ellipse(0, -23, 8, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 1.5);
  ctx.fillStyle = v.accent;
  for (const cx of [-6, -2, 2, 6]) {
    ctx.beginPath();
    ctx.moveTo(cx - 2, -28);
    ctx.lineTo(cx, -28 - 6 - Math.abs(cx) * 0.5);
    ctx.lineTo(cx + 2, -28);
    ctx.closePath();
    ctx.fill();
    outline(ctx, 1);
  }
  eyeDot(ctx, 4, -23, v.eye, 2.4);
  eyeDot(ctx, -4, -23, v.eye, 2.4);

  if (s.attackFlash > 0) {
    ctx.strokeStyle = `rgba(200,120,255,${s.attackFlash})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 20 + 18 * s.attackFlash, 0, Math.PI * 2);
    ctx.stroke();
  }
}
