/* =========================================
   LABYRINTH – TEXTURED FLOOR + MINIMAP
   (Production-ready, no storybook code)
========================================= */

console.log("GAME JS LOADED");

/* =========================================
   CANVAS SETUP (DPR-aware)
========================================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });

function resizeCanvas() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const cssW = canvas.clientWidth | 0;
  const cssH = canvas.clientHeight | 0;

  canvas.width = Math.max(1, (cssW * dpr) | 0);
  canvas.height = Math.max(1, (cssH * dpr) | 0);

  // Logical coordinates = CSS pixels
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeCanvas, { passive: true });
resizeCanvas();

/* =========================================
   MINIMAP SETTINGS
========================================= */

const MINIMAP_SIZE = 180;
const MINIMAP_MARGIN = 20;
const SHOW_ROTATING_MAP = false;

/* =========================================
   FLOOR – PROCEDURAL BRICK TEXTURE
========================================= */

function clamp255(v) { return Math.max(0, Math.min(255, v | 0)); }
function fractSafe(v) { return ((v % 1) + 1) % 1; }

function createBrickTexture({
  texW = 512,
  texH = 512,
  bricksX = 16,
  bricksY = 12,
  mortarPx = 3,
  baseColor = { r: 165, g: 50, b: 35 },
  mortarColor = { r: 150, g: 150, b: 150 },
} = {}) {
  const off = document.createElement("canvas");
  off.width = texW;
  off.height = texH;
  const octx = off.getContext("2d");

  // Mortar background
  octx.fillStyle = `rgb(${mortarColor.r}, ${mortarColor.g}, ${mortarColor.b})`;
  octx.fillRect(0, 0, texW, texH);

  const bw = Math.floor(texW / bricksX);
  const bh = Math.floor(texH / bricksY);

  for (let y = 0; y < bricksY; y++) {
    const offset = (y % 2) ? Math.floor(bw / 2) : 0;
    for (let x = -1; x <= bricksX; x++) {
      const bx = x * bw + offset;
      const by = y * bh;
      if (bx + bw < 0 || bx > texW) continue;

      const id = (x * 73856093) ^ (y * 19349663);
      let rng = Math.sin(id) * 43758.5453;
      rng = rng - Math.floor(rng); // [0,1)
      const shade = 0.85 + rng * 0.25;

      const r = clamp255(baseColor.r * shade);
      const g = clamp255(baseColor.g * shade);
      const b = clamp255(baseColor.b * shade);

      octx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      octx.fillRect(
        bx + mortarPx,
        by + mortarPx,
        Math.max(1, bw - mortarPx * 2),
        Math.max(1, bh - mortarPx * 2)
      );
    }
  }

  return off;
}

const brickTexture = createBrickTexture();
// Cache texture pixel data once for fast sampling
(function cacheTextureData() {
  const texCtx = brickTexture.getContext("2d");
  brickTexture.__data = texCtx.getImageData(0, 0, brickTexture.width, brickTexture.height).data;
})();

/* =========================================
   GAME STATE
========================================= */

let level = 1;
let score = 0;
let survivalTime = 0;
let gameRunning = false;
let survivalInterval = null;

let map = [];
let MAP_W;
let MAP_H;
let goal;

let player;
let monster;

const FOV = Math.PI / 3;
const MAX_DEPTH = 25;

/* =========================================
   INPUT
========================================= */

const keys = Object.create(null);

/* =========================================
   BOOT SCREEN HANDLING
========================================= */

window.addEventListener("load", () => {
    const boot = document.getElementById("bootScreen");
    const container = document.getElementById("gameContainer");
  
    // Wait for ENTER key
    function handleStart(e) {
      if (e.key === "Enter") {
        document.removeEventListener("keydown", handleStart);
  
        // Fade out boot screen
        boot.style.transition = "opacity 0.6s ease";
        boot.style.opacity = "0";
  
        setTimeout(() => {
          boot.style.display = "none";
          container.style.display = "block";
  
          resizeCanvas(); // Ensure proper canvas size
          startGame();
        }, 600);
      }
    }
  
    document.addEventListener("keydown", handleStart);
  });

// Prevent page scroll with navigation keys
function isNavKey(e) {
  const k = e.key.toLowerCase();
  return ["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d"," "].includes(k);
}
document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (isNavKey(e)) e.preventDefault();
});
document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
  if (isNavKey(e)) e.preventDefault();
});
// Optional: clear keys when window loses focus
window.addEventListener("blur", () => {
  for (const k in keys) keys[k] = false;
});

/* =========================================
   MAZE GENERATION
========================================= */

function generateMaze(width, height) {
  if (width % 2 === 0) width++;
  if (height % 2 === 0) height++;

  MAP_W = width;
  MAP_H = height;

  map = Array.from({ length: height }, () => Array(width).fill("1"));

  function carve(x, y) {
    const dirs = [
      [0, -2], [0, 2],
      [-2, 0], [2, 0]
    ].sort(() => Math.random() - 0.5);

    for (let [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;

      if (
        nx > 0 && ny > 0 &&
        nx < width - 1 &&
        ny < height - 1 &&
        map[ny][nx] === "1"
      ) {
        map[ny][nx] = "0";
        map[y + dy / 2][x + dx / 2] = "0";
        carve(nx, ny);
      }
    }
  }

  map[1][1] = "0";
  carve(1, 1);

  // Entrance (top), Exit (bottom)
  let entranceX = 1;
  for (let x = 1; x < width - 1; x += 2) {
    if (map[1][x] === "0") { entranceX = x; break; }
  }
  map[0][entranceX] = "0";

  let exitX = width - 2;
  for (let x = width - 2; x >= 1; x -= 2) {
    if (map[height - 2][x] === "0") { exitX = x; break; }
  }
  map[height - 1][exitX] = "0";

  return {
    start: { x: entranceX + 0.5, y: 1.5 },
    goal:  { x: exitX + 0.5, y: height - 1.5 }
  };
}

/* =========================================
   START / RESET
========================================= */

function resetGame() {
  const size = 25 + Math.min(level * 2, 20);
  const mazeData = generateMaze(size, size);

  player = {
    x: mazeData.start.x,
    y: mazeData.start.y,
    angle: Math.PI / 2,
    vx: 0, vy: 0
  };

  goal = mazeData.goal;

  monster = {
    x: goal.x,
    y: goal.y - 2,
    vx: 0,
    vy: 0,
    maxSpeed: 3 + level * 0.5,
    maxAccel: 20,
    drag: 4,
    arrivalRadius: 4,
    attackRadius: 0.6
  };

  survivalTime = 0;
}

function startGame() {
  if (gameRunning) return;

  gameRunning = true;
  level = 1;
  score = 0;

  resetGame();

  if (survivalInterval) clearInterval(survivalInterval);
  survivalInterval = setInterval(() => {
    survivalTime++;
    score += 1;
  }, 1000);

  requestAnimationFrame(gameLoop);
}

/* =========================================
   MOVEMENT + MONSTER
========================================= */

function cellOpen(x, y) {
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  return map[cy] && map[cy][cx] === "0";
}

// Axis-separated move with radius to avoid corner clipping
function tryMoveWithRadius(nx, ny, radius = 0.2) {
  // X first
  if (
    cellOpen(nx, player.y) &&
    cellOpen(nx, player.y - radius) &&
    cellOpen(nx, player.y + radius)
  ) {
    player.x = nx;
  }
  // Y then
  if (
    cellOpen(player.x, ny) &&
    cellOpen(player.x - radius, ny) &&
    cellOpen(player.x + radius, ny)
  ) {
    player.y = ny;
  }
}

function movePlayer(dt) {
  const baseSpeed = 3;
  const turnSpeed = 2;
  const speed = baseSpeed * dt;

  const cosA = Math.cos(player.angle);
  const sinA = Math.sin(player.angle);

  if (keys["w"]) {
    tryMoveWithRadius(player.x + cosA * speed, player.y + sinA * speed, 0.2);
  }
  if (keys["s"]) {
    tryMoveWithRadius(player.x - cosA * speed, player.y - sinA * speed, 0.2);
  }
  if (keys["a"]) player.angle -= turnSpeed * dt;
  if (keys["d"]) player.angle += turnSpeed * dt;

  // Normalize angle to [-PI, PI]
  if (player.angle > Math.PI) player.angle -= Math.PI * 2;
  if (player.angle < -Math.PI) player.angle += Math.PI * 2;

  // Goal check
  const dx = player.x - goal.x;
  const dy = player.y - goal.y;
  if (Math.hypot(dx, dy) < 0.5) {
    level++;
    score += 100 * level;
    resetGame();
  }
}

function moveMonster(dt) {
  const dx = player.x - monster.x;
  const dy = player.y - monster.y;
  const dist = Math.hypot(dx, dy) || 1e-4;

  const desiredSpeed = dist < monster.arrivalRadius
    ? monster.maxSpeed * (dist / monster.arrivalRadius)
    : monster.maxSpeed;

  const desiredVX = (dx / dist) * desiredSpeed;
  const desiredVY = (dy / dist) * desiredSpeed;

  const steerX = desiredVX - monster.vx;
  const steerY = desiredVY - monster.vy;

  const steerMag = Math.hypot(steerX, steerY) || 1;
  const ax = (steerX / steerMag) * Math.min(steerMag, monster.maxAccel);
  const ay = (steerY / steerMag) * Math.min(steerMag, monster.maxAccel);

  monster.vx += ax * dt;
  monster.vy += ay * dt;

  monster.vx *= (1 - monster.drag * dt);
  monster.vy *= (1 - monster.drag * dt);

  const nx = monster.x + monster.vx * dt;
  const ny = monster.y + monster.vy * dt;

  if (cellOpen(nx, monster.y)) monster.x = nx;
  if (cellOpen(monster.x, ny)) monster.y = ny;

  if (dist < monster.attackRadius) {
    gameRunning = false;
    if (survivalInterval) { clearInterval(survivalInterval); survivalInterval = null; }
  }
}

/* =========================================
   MINIMAP DRAW (supports optional rotation)
========================================= */

function drawMinimap() {
  const scale = MINIMAP_SIZE / MAP_W;
  const startX = canvas.clientWidth - MINIMAP_SIZE - MINIMAP_MARGIN;
  const startY = MINIMAP_MARGIN;

  ctx.save();

  // Panel
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(startX, startY, MINIMAP_SIZE, MINIMAP_SIZE);
  ctx.globalAlpha = 1;

  if (SHOW_ROTATING_MAP) {
    ctx.translate(startX + MINIMAP_SIZE / 2, startY + MINIMAP_SIZE / 2);
    ctx.rotate(-player.angle);
    ctx.translate(-player.x * scale, -player.y * scale);
  } else {
    ctx.translate(startX, startY);
  }

  // Walls
  ctx.fillStyle = "#00ff99";
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (map[y][x] === "1") {
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  // Goal
  ctx.fillStyle = "gold";
  ctx.beginPath();
  ctx.arc(goal.x * scale, goal.y * scale, 4, 0, Math.PI * 2);
  ctx.fill();

  // Monster
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(monster.x * scale, monster.y * scale, 4, 0, Math.PI * 2);
  ctx.fill();

  // Player
  ctx.fillStyle = "#a020f0";
  ctx.beginPath();
  ctx.arc(player.x * scale, player.y * scale, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* =========================================
   3D RENDER – Optimized floor (ImageData in device pixels)
========================================= */

function drawBrickFloorFromTexture() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  const wCSS = canvas.clientWidth | 0;
  const hCSS = canvas.clientHeight | 0;
  const wPX = canvas.width | 0;           // device pixels
  const horizonCSS = hCSS / 2;

  const stepX = 2; // horizontal pixel stepping in CSS px (perf knob)

  // Prepare one device-pixel-wide row buffer reused for each scanline
  if (!drawBrickFloorFromTexture._row || drawBrickFloorFromTexture._row.width !== wPX) {
    drawBrickFloorFromTexture._row = new ImageData(wPX, 1);
  }
  const rowImg = drawBrickFloorFromTexture._row;
  const rowData = rowImg.data;
  const tdata = brickTexture.__data;

  // Save transform and draw rows in device-pixel space
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  const leftBaseAngle = player.angle - FOV / 2;

  for (let yCSS = (hCSS / 2) | 0; yCSS < hCSS; yCSS++) {
    const perspective = (yCSS - horizonCSS) / Math.max(1, horizonCSS);
    const rowDistance = 1 / (perspective + 0.0001);

    const stepWorldX = (rowDistance * Math.cos(leftBaseAngle)) / wCSS;
    const stepWorldY = (rowDistance * Math.sin(leftBaseAngle)) / wCSS;

    let worldX = player.x + rowDistance * Math.cos(leftBaseAngle);
    let worldY = player.y + rowDistance * Math.sin(leftBaseAngle);

    // Distance shading (simple, fast)
    const shade = Math.max(0.25, Math.min(1, 1 / (1 + rowDistance * 0.15)));

    // Fill the entire device-pixel row
    let xPX = 0;
    for (let xCSS = 0; xCSS < wCSS; xCSS += stepX) {
      const tx = (fractSafe(worldX) * brickTexture.width) | 0;
      const ty = (fractSafe(worldY) * brickTexture.height) | 0;

      const tIdx = ((ty * brickTexture.width) + tx) * 4;
      const sr = (tdata[tIdx] * shade) | 0;
      const sg = (tdata[tIdx + 1] * shade) | 0;
      const sb = (tdata[tIdx + 2] * shade) | 0;

      // Write stepX * dpr pixels
      const xPXStart = Math.min(wPX, Math.floor(xCSS * dpr));
      const xPXEnd = Math.min(wPX, Math.floor((xCSS + stepX) * dpr));
      for (let px = xPXStart; px < xPXEnd; px++) {
        const di = px * 4;
        rowData[di] = sr;
        rowData[di + 1] = sg;
        rowData[di + 2] = sb;
        rowData[di + 3] = 255;
      }

      worldX += stepWorldX * stepX;
      worldY += stepWorldY * stepX;
      xPX = xPXEnd;
    }

    // If any tail pixels remain (rare due to rounding), fill them
    for (; xPX < wPX; xPX++) {
      const di = xPX * 4;
      rowData[di + 3] = 255;
    }

    // Blit row at device-pixel Y
    const yPX = Math.floor(yCSS * dpr);
    ctx.putImageData(rowImg, 0, yPX);
  }

  ctx.restore();
}

function draw3D() {
  // Sky (CSS pixel space)
  const skyH = canvas.clientHeight / 2;
  const sky = ctx.createLinearGradient(0, 0, 0, skyH);
  sky.addColorStop(0, "#4da6ff");
  sky.addColorStop(1, "#87ceeb");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.clientWidth, skyH);

  // Floor
  drawBrickFloorFromTexture();

  // Walls (raycast)
  for (let x = 0; x < canvas.clientWidth; x++) {
    const rayAngle = player.angle - FOV / 2 + (x / canvas.clientWidth) * FOV;

    let distance = 0;
    let hit = false;

    while (!hit && distance < MAX_DEPTH) {
      distance += 0.05;
      const testX = Math.floor(player.x + Math.cos(rayAngle) * distance);
      const testY = Math.floor(player.y + Math.sin(rayAngle) * distance);

      if (testX < 0 || testY < 0 || testX >= MAP_W || testY >= MAP_H) {
        hit = true;
        distance = MAX_DEPTH;
      } else if (map[testY][testX] === "1") {
        hit = true;
      }
    }

    const correctedDist = distance * Math.cos(rayAngle - player.angle);
    const wallHeight = canvas.clientHeight / (correctedDist + 0.0001);
    const shade = 1 - Math.min(correctedDist / 18, 1);
    const grey = Math.floor(180 * shade);

    ctx.fillStyle = `rgb(${grey}, ${grey}, ${grey})`;
    ctx.fillRect(x, (canvas.clientHeight - wallHeight) / 2, 1, wallHeight);
  }

  drawHUD();
  drawMinimap();
}

/* =========================================
   HUD
========================================= */

function drawHUD() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Level: ${level}`, 20, 40);
  ctx.fillText(`Time: ${survivalTime}`, 20, 65);
  ctx.fillText(`Score: ${score}`, 20, 90);
}

/* =========================================
   GAME LOOP
========================================= */

let lastTime; // initialized on first call

function gameLoop(timestamp = performance.now()) {
  if (lastTime == null) lastTime = timestamp;
  let dt = (timestamp - lastTime) / 1000;
  dt = Math.min(dt, 0.033); // cap step for stability
  lastTime = timestamp;

  // Clear (CSS pixel space)
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  if (!gameRunning) {
    requestAnimationFrame(gameLoop);
    return;
  }

  movePlayer(dt);
  moveMonster(dt);
  draw3D();

  requestAnimationFrame(gameLoop);
}

// Optional: click to restart after caught
canvas.addEventListener("click", () => {
  if (!gameRunning) {
    if (survivalInterval) { clearInterval(survivalInterval); survivalInterval = null; }
    startGame();
  }
});
