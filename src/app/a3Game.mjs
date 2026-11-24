export const BEST_SCORE_KEY = "amiri-home-game-best";
export const POWER_DURATION = 5;
export const POWER_TYPES = ["triple", "blast", "rapid"];
export const SHIP_HEIGHT = 40;
export const SHIP_BOTTOM = 64;
export const RAY_STEP = 18;
export const RAY_LENGTH = 6;

const SHIP_SPEED = 330;
const DROP_SPEED = 140;
const SHOT_INTERVAL = 0.5;
const EXPLOSION_DURATION = 0.4;
const POWER_DROP_CHANCE = 0.15;
const ANGLE = Math.PI / 9;
const LANE_WIDTH = 20;
const LANE_MOVE_SPEED = 120;

let memoryBestScore = 0;

export function readBestScore(storage) {
  try {
    const stored = Number(storage?.getItem(BEST_SCORE_KEY));
    if (Number.isSafeInteger(stored) && stored >= 0) {
      memoryBestScore = Math.max(memoryBestScore, stored);
    }
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
  return memoryBestScore;
}

export function saveBestScore(storage, score) {
  memoryBestScore = Math.max(memoryBestScore, score);
  try {
    storage?.setItem(BEST_SCORE_KEY, String(memoryBestScore));
  } catch {
    // The in-memory best remains available for this page session.
  }
  return memoryBestScore;
}

export function createGame(width, height, bestScore = 0) {
  return {
    width,
    height,
    time: 0,
    shipX: width / 2,
    shipY: height - SHIP_BOTTOM,
    score: 0,
    bestScore,
    gameOver: false,
    rays: [],
    shots: [],
    drops: [],
    explosions: [],
    powers: { triple: 0, blast: 0, rapid: 0 },
    spawnClock: 0,
    shotClock: 0,
    nextId: 1,
  };
}

export function resizeGame(game, width, height) {
  const xRatio = width / game.width;
  const yRatio = height / game.height;
  game.shipX = clamp(game.shipX * xRatio, 24, width - 24);
  game.shipY = height - SHIP_BOTTOM;
  for (const list of [game.rays, game.shots, game.drops, game.explosions]) {
    for (const item of list) {
      item.x *= xRatio;
      item.y *= yRatio;
      if (item.targetX !== undefined) item.targetX *= xRatio;
    }
  }
  game.width = width;
  game.height = height;
}

export function remainingPower(game, type) {
  return Math.max(0, game.powers[type] - game.time);
}

export function gameHud(game) {
  return {
    score: game.score,
    bestScore: game.bestScore,
    gameOver: game.gameOver,
    powers: Object.fromEntries(POWER_TYPES.map((type) => [type, Math.ceil(remainingPower(game, type))])),
  };
}

export function powerSidesRemaining(seconds) {
  return clamp(seconds - 1, 0, 4);
}

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

export function moveShip(game, distance) {
  game.shipX = clamp(game.shipX + distance, 24, game.width - 24);
}

function spawnInterval(time) {
  return 1.2 - 0.7 * Math.min(time / 90, 1);
}

function raySpeed(time) {
  return 100 + 80 * Math.min(time / 90, 1);
}

function laneCount(width) {
  const count = Math.max(1, Math.floor((width - 48) / LANE_WIDTH) + 1);
  return count % 2 ? count : Math.max(1, count - 1);
}

function laneX(width, lane) {
  return width / 2 + (lane - Math.floor(laneCount(width) / 2)) * LANE_WIDTH;
}

function closestLane(width, x) {
  return clamp(Math.round((x - width / 2) / LANE_WIDTH) + Math.floor(laneCount(width) / 2), 0, laneCount(width) - 1);
}

function spawnRay(game, random) {
  const lane = Math.min(laneCount(game.width) - 1, Math.floor(random() * laneCount(game.width)));
  const x = laneX(game.width, lane);
  game.rays.push({
    id: game.nextId++,
    x,
    targetX: x,
    laneClock: 0.75 + random() * 1.25,
    y: -12,
    seed: Math.floor(random() * 10000),
  });
}

function fire(game) {
  const speed = raySpeed(game.time);
  const angles = remainingPower(game, "triple") > 0 ? [0, -ANGLE, ANGLE] : [0];
  for (const angle of angles) {
    game.shots.push({
      x: game.shipX,
      y: game.shipY - SHIP_HEIGHT * 0.55,
      vx: Math.sin(angle) * speed,
      vy: -Math.cos(angle) * speed,
      blast: remainingPower(game, "blast") > 0,
    });
  }
}

function explode(game, x, y, large = false) {
  game.explosions.push({ x, y, age: 0, duration: EXPLOSION_DURATION, large });
}

function destroyRay(game, ray, random, events, points = 10) {
  const index = game.rays.indexOf(ray);
  if (index < 0) return;
  game.rays.splice(index, 1);
  events.raysDestroyed += 1;
  game.score += points;
  if (game.score > game.bestScore) {
    game.bestScore = game.score;
    events.bestChanged = true;
  }
  explode(game, ray.x, ray.y);
  if (random() < POWER_DROP_CHANCE) {
    game.drops.push({
      x: ray.x,
      y: ray.y,
      type: POWER_TYPES[Math.floor(random() * POWER_TYPES.length)],
    });
  }
}

function hitShip(game, ray) {
  game.rays.splice(game.rays.indexOf(ray), 1);
  explode(game, game.shipX, game.shipY, true);
  game.gameOver = true;
}

export function stepGame(game, dt, input = {}, random = Math.random) {
  const events = {
    bestChanged: false,
    powerCollected: null,
    gameOver: false,
    shotsFired: 0,
    raysDestroyed: 0,
    blastHit: false,
  };
  if (game.gameOver) return events;
  game.time += dt;

  const direction = Number(Boolean(input.right)) - Number(Boolean(input.left));
  if (direction) {
    moveShip(game, direction * SHIP_SPEED * dt);
  } else if (typeof input.dragX === "number") {
    game.shipX = clamp(input.dragX, 24, game.width - 24);
  }

  game.spawnClock += dt;
  while (game.spawnClock >= spawnInterval(game.time)) {
    game.spawnClock -= spawnInterval(game.time);
    spawnRay(game, random);
  }

  game.shotClock += dt;
  const shotInterval = remainingPower(game, "rapid") > 0 ? SHOT_INTERVAL / 2 : SHOT_INTERVAL;
  while (game.shotClock >= shotInterval) {
    game.shotClock -= shotInterval;
    fire(game);
    events.shotsFired += 1;
  }

  for (const ray of game.rays) {
    ray.y += (ray.speed ?? raySpeed(game.time)) * dt;
    if (ray.laneClock === undefined) continue;
    ray.laneClock -= dt;
    if (ray.laneClock <= 0) {
      ray.laneClock = 0.75 + random() * 1.25;
      if (random() < 0.5) {
        const direction = random() < 0.5 ? -1 : 1;
        const nextLane = clamp(closestLane(game.width, ray.targetX) + direction, 0, laneCount(game.width) - 1);
        ray.targetX = laneX(game.width, nextLane);
      }
    }
    ray.x += clamp(ray.targetX - ray.x, -LANE_MOVE_SPEED * dt, LANE_MOVE_SPEED * dt);
  }
  for (const shot of game.shots) {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
  }
  for (const drop of game.drops) drop.y += DROP_SPEED * dt;
  for (const explosion of game.explosions) explosion.age += dt;

  for (let shotIndex = game.shots.length - 1; shotIndex >= 0; shotIndex--) {
    const shot = game.shots[shotIndex];
    const ray = game.rays.find((target) =>
      Math.abs(target.x - shot.x) < 13
      && Math.abs(shot.y - (target.y + 8)) < 12,
    );
    if (!ray) continue;
    game.shots.splice(shotIndex, 1);
    const hitX = ray.x;
    const hitY = shot.y;
    destroyRay(game, ray, random, events, shot.blast ? 20 : 10);
    if (shot.blast) {
      events.blastHit = true;
      explode(game, hitX, hitY, true);
    }
  }

  for (let index = game.drops.length - 1; index >= 0; index--) {
    const drop = game.drops[index];
    if (Math.abs(drop.x - game.shipX) < 23
      && Math.abs(drop.y - game.shipY) < 25) {
      game.powers[drop.type] = game.time + POWER_DURATION;
      game.drops.splice(index, 1);
      events.powerCollected = drop.type;
    }
  }

  const hit = game.rays.find((ray) =>
    Math.abs(ray.x - game.shipX) < 22
    && ray.y >= game.shipY - SHIP_HEIGHT * 0.55
    && ray.y - (RAY_LENGTH - 1) * RAY_STEP <= game.shipY + SHIP_HEIGHT * 0.45,
  );
  if (hit) {
    hitShip(game, hit);
    events.gameOver = true;
  }

  game.rays = game.rays.filter((ray) => ray.y - (RAY_LENGTH - 1) * RAY_STEP < game.height + 20);
  game.shots = game.shots.filter((shot) => shot.y > -20 && shot.x > -20 && shot.x < game.width + 20);
  game.drops = game.drops.filter((drop) => drop.y < game.height + 20);
  game.explosions = game.explosions.filter((explosion) => explosion.age < explosion.duration);
  return events;
}
