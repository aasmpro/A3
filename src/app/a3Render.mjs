import { RAY_LENGTH, RAY_STEP, SHIP_HEIGHT } from "./a3Game.mjs";

const CHARS = "0123456789ABCDEFXZ<>/*+-=$#%&@_[]{}|^~?";
const POWER_GLYPHS = { triple: "3", blast: "*", rapid: "+" };
const PLANE_HALF_WIDTH = SHIP_HEIGHT / Math.sqrt(3);

function hash(value) {
  let n = Math.imul(value | 0, 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function drawTriangle(ctx, game, color) {
  if (game.gameOver) return;
  const x = game.shipX;
  const y = game.shipY;
  const height = SHIP_HEIGHT;
  ctx.save();
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(x, y - height * 0.55);
    ctx.lineTo(x - PLANE_HALF_WIDTH, y + height * 0.45);
    ctx.lineTo(x + PLANE_HALF_WIDTH, y + height * 0.45);
    ctx.closePath();
  };
  ctx.fillStyle = color.peak;
  path();
  ctx.fill();
  ctx.restore();
}

function drawAmbient(ctx, game, color, reducedMotion) {
  const columns = Math.ceil(game.width / color.cell);
  const travel = reducedMotion ? 0 : game.time * color.ambientSpeed;
  ctx.font = `${color.fontAmbient}px ${color.font}`;
  ctx.textBaseline = "top";
  ctx.fillStyle = color.mid;
  for (let col = 0; col < columns; col++) {
    const head = ((hash(col * 17 + 9) * (game.height + 180) + travel) % (game.height + 180)) - 90;
    for (let row = 0; row < 7; row++) {
      const y = head - row * color.cell;
      if (y < -20 || y > game.height) continue;
      const index = Math.floor(hash(col * 937 + row * 101 + (reducedMotion ? 0 : Math.floor(game.time * color.ambientFrequency))) * CHARS.length);
      ctx.globalAlpha = (1 - row / 7) * color.opacityAmbient;
      ctx.fillText(CHARS[index], col * color.cell, y);
    }
  }
  ctx.globalAlpha = 1;
}

function drawRays(ctx, game, color, reducedMotion) {
  ctx.textBaseline = "top";
  for (const ray of game.rays) {
    for (let row = 0; row < RAY_LENGTH; row++) {
      const y = ray.y - row * RAY_STEP;
      if (y < -20 || y > game.height) continue;
      const index = Math.floor(hash(ray.seed + row * 113 + (reducedMotion ? 0 : Math.floor(game.time * color.rayFrequency))) * CHARS.length);
      ctx.globalAlpha = 1 - row / (RAY_LENGTH + 1);
      ctx.font = `${row === 0 ? `${color.fontRayHeadWeight} ` : ""}${color.fontRay}px ${color.font}`;
      ctx.fillStyle = row === 0 ? color.peak : color.bright;
      ctx.fillText(CHARS[index], ray.x - 8, y);
    }
  }
  ctx.globalAlpha = 1;
}

function drawShots(ctx, game, color) {
  ctx.save();
  ctx.strokeStyle = color.peak;
  ctx.lineCap = "round";
  for (const shot of game.shots) {
    ctx.lineWidth = shot.blast ? color.strokeBlast : color.strokeShot;
    const speed = Math.hypot(shot.vx, shot.vy) || 1;
    ctx.beginPath();
    ctx.moveTo(shot.x, shot.y);
    ctx.lineTo(shot.x - shot.vx / speed * 16, shot.y - shot.vy / speed * 16);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDrops(ctx, game, color) {
  ctx.font = `${color.fontAmbient}px ${color.font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = color.peak;
  ctx.fillStyle = color.peak;
  ctx.lineWidth = color.strokeDrop;
  for (const drop of game.drops) {
    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y - 14);
    ctx.lineTo(drop.x + 14, drop.y);
    ctx.lineTo(drop.x, drop.y + 14);
    ctx.lineTo(drop.x - 14, drop.y);
    ctx.closePath();
    ctx.stroke();
    ctx.fillText(POWER_GLYPHS[drop.type], drop.x, drop.y);
  }
  ctx.textAlign = "start";
}

function drawExplosions(ctx, game, color, reducedMotion) {
  ctx.save();
  ctx.font = `${color.fontBody}px ${color.font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color.peak;
  for (const explosion of game.explosions) {
    const progress = explosion.age / explosion.duration;
    ctx.globalAlpha = 1 - progress;
    if (reducedMotion) {
      ctx.fillText("X", explosion.x, explosion.y);
      continue;
    }
    const count = explosion.large ? 12 : 7;
    const radius = (explosion.large ? 60 : 23) * progress;
    for (let index = 0; index < count; index++) {
      const angle = index * Math.PI * 2 / count;
      ctx.fillText("X+*#%"[index % 5], explosion.x + Math.cos(angle) * radius, explosion.y + Math.sin(angle) * radius);
    }
  }
  ctx.restore();
}

export function paint(ctx, game, theme, reducedMotion, palette) {
  const color = palette;
  ctx.fillStyle = color.background;
  ctx.fillRect(0, 0, game.width, game.height);
  drawAmbient(ctx, game, color, reducedMotion);
  drawRays(ctx, game, color, reducedMotion);
  drawDrops(ctx, game, color);
  drawShots(ctx, game, color);
  drawTriangle(ctx, game, color);
  drawExplosions(ctx, game, color, reducedMotion);
  ctx.globalAlpha = 1;
}

