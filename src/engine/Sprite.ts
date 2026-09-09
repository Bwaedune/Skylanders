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

export function drawCreature(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  visual: CreatureVisual,
  state: DrawState,
): void {
  ctx.save();
  ctx.translate(x, y + bob(state));
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
}

function drawWolf(ctx: CanvasRenderingContext2D, v: CreatureVisual, s: DrawState) {
  ctx.fillStyle = v.body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  // head
  ctx.beginPath();
  ctx.ellipse(14, -4, 9, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // ears
  ctx.fillStyle = v.accent;
  ctx.beginPath();
  ctx.moveTo(10, -10);
  ctx.lineTo(13, -18);
  ctx.lineTo(16, -10);
  ctx.fill();
  // snout flame mane
  ctx.beginPath();
  ctx.moveTo(-14, -2);
  ctx.quadraticCurveTo(-22, -10 - Math.sin(s.walkPhase * 8) * 3, -10, -8);
  ctx.quadraticCurveTo(-20, 2, -6, 6);
  ctx.fill();
  eyeDot(ctx, 18, -5, v.eye);
  // legs
  ctx.fillStyle = v.accent;
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
  ctx.fillStyle = v.body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // tail fin
  ctx.fillStyle = v.accent;
  ctx.beginPath();
  ctx.moveTo(-15, 0);
  ctx.lineTo(-24, -8 + bob(s));
  ctx.lineTo(-24, 8 + bob(s));
  ctx.fill();
  // lure
  ctx.strokeStyle = v.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(10, -8);
  ctx.quadraticCurveTo(20, -18, 16, -22);
  ctx.stroke();
  ctx.fillStyle = '#fff6b0';
  ctx.beginPath();
  ctx.arc(16, -22, 3, 0, Math.PI * 2);
  ctx.fill();
  eyeDot(ctx, 10, -3, v.eye);
  // hooked hat (pirate flair)
  ctx.fillStyle = '#2b2440';
  ctx.beginPath();
  ctx.moveTo(2, -9);
  ctx.lineTo(14, -13);
  ctx.lineTo(4, -14);
  ctx.fill();
}

function drawRam(ctx: CanvasRenderingContext2D, v: CreatureVisual, s: DrawState) {
  ctx.fillStyle = v.body;
  ctx.beginPath();
  ctx.ellipse(0, 2, 15, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(13, -6, 8, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // horns
  ctx.strokeStyle = v.accent;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(10, -9, 7, Math.PI * 0.9, Math.PI * 1.9);
  ctx.stroke();
  eyeDot(ctx, 18, -7, v.eye);
  const legOffset = Math.sin(s.walkPhase * Math.PI * 2) * 4;
  ctx.fillStyle = v.accent;
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
  ctx.fillStyle = v.accent;
  ctx.beginPath();
  ctx.moveTo(-2, 0);
  ctx.lineTo(-20, -10 - wingFlap);
  ctx.lineTo(-10, 2);
  ctx.fill();
  ctx.fillStyle = v.body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(11, -5, 7, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f0c419';
  ctx.beginPath();
  ctx.moveTo(17, -5);
  ctx.lineTo(24, -3);
  ctx.lineTo(17, -1);
  ctx.fill();
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
  ctx.fillStyle = v.body;
  ctx.beginPath();
  ctx.ellipse(0, 2, 10, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(2, -12, 8, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = v.accent;
  ctx.beginPath();
  ctx.moveTo(6, -18);
  ctx.lineTo(14, -22);
  ctx.lineTo(8, -13);
  ctx.fill();
  eyeDot(ctx, 6, -13, v.eye);
  // wrench arm
  const swing = Math.sin(s.walkPhase * Math.PI * 2) * 6;
  ctx.strokeStyle = '#8a8f9a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(9, -2);
  ctx.lineTo(18 + swing * 0.3, 4);
  ctx.stroke();
  ctx.fillStyle = '#c7cdd6';
  ctx.fillRect(16 + swing * 0.3, 1, 6, 4);
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
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = v.body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  // jester hat, 3 points
  ctx.fillStyle = v.accent;
  for (const dx of [-8, 0, 8]) {
    ctx.beginPath();
    ctx.moveTo(dx - 4, -12);
    ctx.lineTo(dx, -22 - Math.abs(Math.sin(s.walkPhase * 6 + dx)) * 3);
    ctx.lineTo(dx + 4, -12);
    ctx.fill();
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
  ctx.fillStyle = v.body;
  ctx.beginPath();
  ctx.ellipse(0, 4, 13, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = v.accent;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + s.walkPhase;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * 10, -10 + Math.sin(a) * 4, 5, 8, a, 0, Math.PI * 2);
    ctx.fill();
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
  ctx.fillStyle = v.body;
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(9, -2);
  ctx.lineTo(6, 12);
  ctx.lineTo(-6, 12);
  ctx.lineTo(-9, -2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = v.accent;
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(4, -13);
  ctx.lineTo(-4, -13);
  ctx.fill();
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
  ctx.fillStyle = v.body;
  ctx.beginPath();
  ctx.ellipse(0, 4, 22, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = v.accent;
  ctx.beginPath();
  ctx.ellipse(-6, -14, 5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(8, -18, 6, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  eyeDot(ctx, 12, -2, v.eye, 3.5);
  eyeDot(ctx, -2, -4, v.eye, 3.5);
  const legOffset = Math.sin(s.walkPhase * Math.PI * 2) * 5;
  ctx.fillStyle = v.body;
  ctx.fillRect(-16 + legOffset, 16, 9, 10);
  ctx.fillRect(6 - legOffset, 16, 9, 10);
  if (s.attackFlash > 0) {
    ctx.strokeStyle = `rgba(230,220,190,${s.attackFlash})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 20, 20 + 20 * s.attackFlash, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawGiantMagma(ctx: CanvasRenderingContext2D, v: CreatureVisual, s: DrawState) {
  ctx.fillStyle = v.body;
  ctx.beginPath();
  ctx.ellipse(0, 2, 21, 19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = v.accent;
  const crackPhase = Math.sin(s.walkPhase * 6) * 0.3 + 0.7;
  ctx.globalAlpha = crackPhase;
  ctx.beginPath();
  ctx.moveTo(-10, -6);
  ctx.lineTo(0, 2);
  ctx.lineTo(-4, 12);
  ctx.lineTo(8, 4);
  ctx.lineTo(2, -10);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  eyeDot(ctx, 10, -6, v.eye, 3.5);
  eyeDot(ctx, -4, -8, v.eye, 3.5);
  const legOffset = Math.sin(s.walkPhase * Math.PI * 2) * 5;
  ctx.fillStyle = v.body;
  ctx.fillRect(-15 + legOffset, 14, 9, 10);
  ctx.fillRect(6 - legOffset, 14, 9, 10);
  if (s.attackFlash > 0) {
    ctx.fillStyle = `rgba(255,140,40,${s.attackFlash})`;
    ctx.beginPath();
    ctx.arc(18, 0, 12 * s.attackFlash, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSlimeBoss(ctx: CanvasRenderingContext2D, v: CreatureVisual, s: DrawState) {
  const squish = 1 + Math.sin(s.walkPhase * Math.PI * 2) * 0.08;
  ctx.fillStyle = v.body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 26 * squish, 22 / squish, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = v.accent;
  ctx.beginPath();
  ctx.ellipse(0, -6, 20, 12, 0, 0, Math.PI);
  ctx.fill();
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
  ctx.fillStyle = v.accent;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-34, -14 - wingFlap);
  ctx.lineTo(-14, 6);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(34, -14 + wingFlap);
  ctx.lineTo(14, 6);
  ctx.fill();
  ctx.fillStyle = v.body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -16, 10, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f0c419';
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(10, -12);
  ctx.lineTo(0, -8);
  ctx.fill();
  eyeDot(ctx, 3, -19, v.eye, 3);
  eyeDot(ctx, -6, -19, v.eye, 3);
}

function drawKrakenBoss(ctx: CanvasRenderingContext2D, v: CreatureVisual, s: DrawState) {
  ctx.fillStyle = v.body;
  ctx.beginPath();
  ctx.ellipse(0, -6, 20, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = v.accent;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const wig = Math.sin(s.walkPhase * 6 + i) * 6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 14, 4 + Math.sin(a) * 6);
    ctx.quadraticCurveTo(
      Math.cos(a) * 30 + wig,
      20,
      Math.cos(a) * 20,
      34 + Math.sin(a) * 4,
    );
    ctx.lineWidth = 5;
    ctx.strokeStyle = v.accent;
    ctx.stroke();
  }
  eyeDot(ctx, 7, -10, v.eye, 4);
  eyeDot(ctx, -7, -10, v.eye, 4);
}
