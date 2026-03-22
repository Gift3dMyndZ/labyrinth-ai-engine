/* ==========================================
   LABYRINTH – ARCADE MODE 👾
========================================== */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });

/* =========================================
   CANVAS RESIZE (PRODUCTION SAFE)
========================================= */

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const w = Math.floor(rect.width);
  const h = Math.floor(rect.height);
  if (w > 0 && h > 0) {
    canvas.width = w;
    canvas.height = h;
  }
}
window.addEventListener("resize", resizeCanvas);

/* =========================================
   CONSTANTS
========================================= */

const FOV = Math.PI / 3;
const MAX_DEPTH = 25;

/* =========================================
   GAME STATE
========================================= */

let map = [];
let MAP_W, MAP_H;
let player, monster, goal;

let gameRunning = false;
let gameOver = false;
let gameWon = false;

let score = 0;
let startTime = 0;

/* =========================================
   INPUT
========================================= */

const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

/* =========================================
   AUDIO
========================================= */

const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();

function beep(freq, duration, type = "square", volume = 0.2) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playDeathSound() {
  beep(200, 0.1);
  setTimeout(() => beep(120, 0.15), 100);
  setTimeout(() => beep(60, 0.3), 250);
}

function playWinSound() {
  beep(440, 0.1);
  setTimeout(() => beep(660, 0.1), 100);
  setTimeout(() => beep(880, 0.2), 200);
}

/* =========================================
   MAZE GENERATION
========================================= */

function generateMaze(w, h) {
  w |= 1; h |= 1;
  MAP_W = w; MAP_H = h;

  map = Array.from({ length: h }, () => Array(w).fill("1"));

  const stack = [[1, 1]];
  map[1][1] = "0";

  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]].sort(() => Math.random() - 0.5);
    let moved = false;

    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx > 0 && ny > 0 && nx < w - 1 && ny < h - 1 && map[ny][nx] === "1") {
        map[ny][nx] = "0";
        map[y + dy / 2][x + dx / 2] = "0";
        stack.push([nx, ny]);
        moved = true;
        break;
      }
    }
    if (!moved) stack.pop();
  }

  return {
    start: { x: 1.5, y: 1.5 },
    goal: { x: w - 2.5, y: h - 2.5 }
  };
}

function resetGame() {
  const m = generateMaze(31, 31);

  player = { x: m.start.x, y: m.start.y, angle: 0 };
  goal = m.goal;

  monster = {
    x: goal.x,
    y: goal.y - 2,
    baseSpeed: 2.2,
    speed: 2.2
  };

  score = 0;
  startTime = performance.now();
  gameOver = false;
  gameWon = false;
}
resetGame();

/* =========================================
   MOVEMENT
========================================= */

const WALL_BUFFER = 0.15;

function cellOpen(x, y) {
  return map[Math.floor(y)]?.[Math.floor(x)] === "0";
}

function canMove(x, y) {
  return (
    cellOpen(x - WALL_BUFFER, y - WALL_BUFFER) &&
    cellOpen(x + WALL_BUFFER, y - WALL_BUFFER) &&
    cellOpen(x - WALL_BUFFER, y + WALL_BUFFER) &&
    cellOpen(x + WALL_BUFFER, y + WALL_BUFFER)
  );
}

function movePlayer(dt) {
  const speed = 3 * dt;
  const rotSpeed = 2.5 * dt;
  const ca = Math.cos(player.angle);
  const sa = Math.sin(player.angle);

  let nx, ny;

  if (keys.w) {
    nx = player.x + ca * speed;
    ny = player.y + sa * speed;
    if (canMove(nx, ny)) { player.x = nx; player.y = ny; }
    else if (canMove(nx, player.y)) { player.x = nx; }
    else if (canMove(player.x, ny)) { player.y = ny; }
  }
  if (keys.s) {
    nx = player.x - ca * speed;
    ny = player.y - sa * speed;
    if (canMove(nx, ny)) { player.x = nx; player.y = ny; }
    else if (canMove(nx, player.y)) { player.x = nx; }
    else if (canMove(player.x, ny)) { player.y = ny; }
  }
  if (keys.a) player.angle -= rotSpeed;
  if (keys.d) player.angle += rotSpeed;
}

function moveMonster(dt) {
  const elapsed = (performance.now() - startTime) / 1000;
  monster.speed = monster.baseSpeed + elapsed * 0.08;

  const dx = player.x - monster.x;
  const dy = player.y - monster.y;
  const d = Math.hypot(dx, dy) || 1e-4;

  const vx = (dx / d) * monster.speed;
  const vy = (dy / d) * monster.speed;

  if (cellOpen(monster.x + vx * dt, monster.y)) monster.x += vx * dt;
  if (cellOpen(monster.x, monster.y + vy * dt)) monster.y += vy * dt;

  if (d < 0.6) {
    gameOver = true;
    gameRunning = false;
    playDeathSound();
  }
}

/* =========================================
   MONSTER SPRITE
========================================= */

function makeAlien(pattern, scale = 2) {
  const c = document.createElement("canvas");
  c.width = pattern[0].length * scale;
  c.height = pattern.length * scale;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;

  pattern.forEach((row, y) => {
    [...row].forEach((v, x) => {
      if (v === "1") {
        g.fillStyle = "#7aff00";
        g.fillRect(x * scale, y * scale, scale, scale);
      }
    });
  });

  c.__data = g.getImageData(0, 0, c.width, c.height).data;
  return c;
}

const alien = makeAlien([
  "000011111100000",
  "000111111110000",
  "001111111111000",
  "011110110111100",
  "111111111111110",
  "111011111110111",
  "111111111111110",
  "001110011100100",
  "011001100110010",
  "110000000000011"
]);

/* =========================================
   3D RENDER
========================================= */

function draw3D() {
  const w = canvas.width;
  const h = canvas.height;

  /* ---------- sky ---------- */
  const sky = ctx.createLinearGradient(0, 0, 0, h / 2);
  sky.addColorStop(0, "#001a33");
  sky.addColorStop(1, "#0055aa");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h / 2);

  /* ---------- floor ---------- */
  const flr = ctx.createLinearGradient(0, h / 2, 0, h);
  flr.addColorStop(0, "#222222");
  flr.addColorStop(1, "#0a0a0a");
  ctx.fillStyle = flr;
  ctx.fillRect(0, h / 2, w, h / 2);

  /* ---------- walls ---------- */
  const depth = new Float32Array(w);

  for (let x = 0; x < w; x++) {
    const angle = player.angle - FOV / 2 + (x / w) * FOV;
    const cos_a = Math.cos(angle);
    const sin_a = Math.sin(angle);
    let d = 0;

    while (d < MAX_DEPTH) {
      d += 0.02;
      const tx = Math.floor(player.x + cos_a * d);
      const ty = Math.floor(player.y + sin_a * d);
      if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H || map[ty][tx] === "1") break;
    }

    const cd = d * Math.cos(angle - player.angle);
    depth[x] = cd;

    const wallH = h / (cd + 0.0001);
    const fog = Math.min(cd / 20, 1);

    const r = (150 * (1 - fog)) | 0;
    const g = (80 * (1 - fog)) | 0;
    const b = (220 * (1 - fog)) | 0;

    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, (h - wallH) / 2, 1, wallH);
  }

  /* ---------- goal marker ---------- */
  drawGoalMarker(depth);

  /* ---------- monster ---------- */
  drawMonster(depth);
}

/* =========================================
   GOAL MARKER (column of light)
========================================= */

function drawGoalMarker(depth) {
  const w = canvas.width;
  const h = canvas.height;

  const dx = goal.x - player.x;
  const dy = goal.y - player.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.1 || dist > MAX_DEPTH) return;

  let angle = Math.atan2(dy, dx) - player.angle;
  // normalise to [-PI, PI]
  while (angle < -Math.PI) angle += Math.PI * 2;
  while (angle > Math.PI) angle -= Math.PI * 2;

  if (Math.abs(angle) > FOV / 2) return;

  const sx = (w / 2) + (angle / FOV) * w;
  const size = h / dist;
  const halfW = Math.max(size * 0.2, 2);

  const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 200);

  for (let x0 = sx - halfW; x0 < sx + halfW; x0++) {
    const xi = x0 | 0;
    if (xi < 0 || xi >= w || dist > depth[xi]) continue;
    ctx.fillStyle = `rgba(0,255,180,${0.25 * pulse})`;
    ctx.fillRect(xi, (h - size) / 2, 1, size);
  }
}

/* =========================================
   MONSTER DEPTH RENDER
========================================= */

function drawMonster(depth) {
  const w = canvas.width;
  const h = canvas.height;

  const dx = monster.x - player.x;
  const dy = monster.y - player.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= 0.1) return;

  let angle = Math.atan2(dy, dx) - player.angle;
  while (angle < -Math.PI) angle += Math.PI * 2;
  while (angle > Math.PI) angle -= Math.PI * 2;

  if (Math.abs(angle) > FOV / 2) return;

  const size = h / dist;
  const sx = (w / 2) + (angle / FOV) * w;

  const spriteW = alien.width;
  const spriteH = alien.height;

  for (let x0 = sx - size / 2; x0 < sx + size / 2; x0++) {
    const xi = x0 | 0;
    if (xi < 0 || xi >= w || dist > depth[xi]) continue;

    const u = ((x0 - (sx - size / 2)) / size * spriteW) | 0;

    for (let y0 = h / 2 - size / 2; y0 < h / 2 + size / 2; y0++) {
      const yi = y0 | 0;
      if (yi < 0 || yi >= h) continue;

      const v = ((y0 - (h / 2 - size / 2)) / size * spriteH) | 0;
      const i = (v * spriteW + u) * 4;
      if (alien.__data[i + 3] > 0) {
        const fog = Math.min(dist / 15, 1);
        const br = ((1 - fog) * 255) | 0;
        ctx.fillStyle = `rgb(${(br * 0.48) | 0},${br},0)`;
        ctx.fillRect(xi, yi, 1, 1);
      }
    }
  }
}

/* =========================================
   MINI MAP (FIXED SCALING)
========================================= */

function drawMiniMap() {
  const tileSize = 5;
  const offsetX = 20;
  const offsetY = 20;
  const mapPxW = MAP_W * tileSize;
  const mapPxH = MAP_H * tileSize;

  ctx.save();
  ctx.globalAlpha = 0.85;

  /* background */
  ctx.fillStyle = "rgba(10,5,20,0.9)";
  ctx.fillRect(offsetX - 4, offsetY - 4, mapPxW + 8, mapPxH + 8);

  /* walls */
  ctx.fillStyle = "rgb(0,180,80)";
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (map[y][x] === "1") {
        ctx.fillRect(
          offsetX + x * tileSize,
          offsetY + y * tileSize,
          tileSize,
          tileSize
        );
      }
    }
  }

  /* goal */
  ctx.fillStyle = "rgb(0,255,220)";
  ctx.beginPath();
  ctx.arc(
    offsetX + goal.x * tileSize,
    offsetY + goal.y * tileSize,
    4, 0, Math.PI * 2
  );
  ctx.fill();

  /* monster */
  ctx.fillStyle = "rgb(120,255,0)";
  ctx.beginPath();
  ctx.arc(
    offsetX + monster.x * tileSize,
    offsetY + monster.y * tileSize,
    3, 0, Math.PI * 2
  );
  ctx.fill();

  /* player */
  ctx.fillStyle = "rgb(200,0,255)";
  ctx.beginPath();
  ctx.arc(
    offsetX + player.x * tileSize,
    offsetY + player.y * tileSize,
    4, 0, Math.PI * 2
  );
  ctx.fill();

  /* player direction line */
  ctx.strokeStyle = "rgb(200,0,255)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(
    offsetX + player.x * tileSize,
    offsetY + player.y * tileSize
  );
  ctx.lineTo(
    offsetX + (player.x + Math.cos(player.angle) * 1.5) * tileSize,
    offsetY + (player.y + Math.sin(player.angle) * 1.5) * tileSize
  );
  ctx.stroke();

  ctx.restore();
}

/* =========================================
   HUD
========================================= */

function drawHUD() {
  const w = canvas.width;

  ctx.fillStyle = "#00ffcc";
  ctx.font = "bold 20px 'Courier New', monospace";
  ctx.textAlign = "left";
  ctx.fillText("SCORE: " + score, w - 200, 40);

  const elapsed = ((performance.now() - startTime) / 1000) | 0;
  ctx.fillText("TIME: " + elapsed + "s", w - 200, 65);

  /* distance to goal */
  const dg = Math.hypot(goal.x - player.x, goal.y - player.y);
  ctx.fillStyle = dg < 5 ? "#00ff88" : "#888888";
  ctx.fillText("GOAL: " + dg.toFixed(1), w - 200, 90);
}

/* =========================================
   OVERLAY SCREENS
========================================= */

function drawOverlay(title, sub, color) {
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillRect(0, 0, w, h);

  ctx.textAlign = "center";

  ctx.fillStyle = color;
  ctx.font = "bold 60px 'Courier New', monospace";
  ctx.fillText(title, w / 2, h / 2 - 20);

  ctx.fillStyle = "#aaaaaa";
  ctx.font = "22px 'Courier New', monospace";
  ctx.fillText(sub, w / 2, h / 2 + 30);

  ctx.fillStyle = "#666666";
  ctx.font = "16px 'Courier New', monospace";
  ctx.fillText("SCORE: " + score, w / 2, h / 2 + 70);

  ctx.textAlign = "left";
}

/* =========================================
   MAIN LOOP
========================================= */

let last = 0;

function loop(t) {
  requestAnimationFrame(loop);

  if (!canvas.width || !canvas.height) return;

  const dt = Math.min((t - last) / 1000, 0.05);
  last = t;

  ctx.fillStyle = "#000000";
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameRunning) {
    movePlayer(dt);
    moveMonster(dt);

    draw3D();
    drawMiniMap();
    drawHUD();

    score += Math.floor(dt * 100);

    const gx = goal.x - player.x;
    const gy = goal.y - player.y;
    if (Math.hypot(gx, gy) < 0.8) {
      gameWon = true;
      gameRunning = false;
      playWinSound();
    }

  } else if (gameOver) {
    draw3D();
    drawOverlay("YOU DIED", "Press ENTER to retry", "#ff0044");

  } else if (gameWon) {
    draw3D();
    drawOverlay("ESCAPED!", "Press ENTER to play again", "#00ff99");
  }
}

/* =========================================
   BOOT
========================================= */

const bootScreen = document.getElementById("bootScreen");
const gameContainer = document.getElementById("gameContainer");

document.addEventListener("keydown", function (e) {
  if (e.code === "Enter" || e.code === "NumpadEnter") {

    if (audioCtx.state === "suspended") audioCtx.resume();

    if (!gameRunning && (gameOver || gameWon || gameContainer.style.display === "none")) {
      bootScreen.style.display = "none";
      gameContainer.style.display = "block";

      // Wait one frame so the browser lays out the container before measuring
      requestAnimationFrame(() => {
        resizeCanvas();
        resetGame();
        gameRunning = true;
        last = performance.now();
      });
    }
  }
});

/* Start render loop immediately (it no-ops until gameRunning is true) */
requestAnimationFrame(loop);

/* =========================================
   SLIDER BINDINGS
========================================= */

const brightnessSlider = document.getElementById("brightnessSlider");
const gammaSlider = document.getElementById("gammaSlider");

if (brightnessSlider) {
  brightnessSlider.addEventListener("input", function () {
    document.documentElement.style.setProperty("--brightness", this.value);
  });
}

if (gammaSlider) {
  gammaSlider.addEventListener("input", function () {
    document.documentElement.style.setProperty("--gamma", this.value);
  });
}