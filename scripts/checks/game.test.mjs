import assert from "node:assert/strict";
import test from "node:test";
import { createGame, stepGame } from "../../src/app/a3Game.mjs";

test("game bounds, scoring, and collision-driven game over", () => {
  const game = createGame(390, 844);
  const noDrop = () => 1;
  stepGame(game, 0.5, { right: true }, noDrop);
  assert.equal(game.shipX, 360);
  stepGame(game, 1, { left: true }, noDrop);
  assert.equal(game.shipX, 30);

  game.rays = [{ id: 1, x: 100, y: 300, speed: 0, seed: 1 }];
  game.shots = [{ x: 100, y: 308, vx: 0, vy: 0, blast: false }];
  const hit = stepGame(game, 0.01, {}, noDrop);
  assert.equal(hit.raysDestroyed, 1);
  assert.equal(game.score, 10);
  assert.equal(game.rays.length, 0);

  game.rays.push({ id: 2, x: game.shipX, y: game.shipY, speed: 0, seed: 1 });
  assert.equal(stepGame(game, 0.01, {}, noDrop).gameOver, true);
  assert.equal(game.gameOver, true);
  const frozenTime = game.time;
  stepGame(game, 10, {}, noDrop);
  assert.equal(game.time, frozenTime);
});
