/* =========================================
   LABYRINTH – COMPLETE PRODUCTION BUILD
========================================= */

/* =========================================
   CANVAS SETUP (DPR AWARE)
========================================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* =========================================
   STATE SYSTEM
========================================= */

let state = "boot"; // boot | playing | dead
let gameRunning = false;
let animationId = null;
let last = 0;

/* =========================================
   CONSTANTS
========================================= */

const FOV = Math.PI / 3;
const MAX_DEPTH = 25;

/* =========================================
   INPUT
========================================= */

const keys = {};

document.addEventListener("keydown", (e) => {
  if (!gameRunning) return;
  keys[e.key.toLowerCase()] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

/* =========================================
   AUDIO – HEARTBEAT
========================================= */

const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();

const heartbeatGain = audioCtx.createGain();
heartbeatGain.gain.value = 0;
heartbeatGain.connect(audioCtx.destination);

function playHeartbeat(strength) {
  const osc = audioCtx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 60;
  osc.connect(heartbeatGain);

  const now = audioCtx.currentTime;
  heartbeatGain.gain.cancelScheduledValues(now);
  heartbeatGain.gain.setValueAtTime(0, now);
  heartbeatGain.gain.linearRampToValueAtTime(0.25 * strength, now + 0.05);
  heartbeatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.start(now);
  osc.stop(now + 0.3);
}

/* =========================================
   GAME STATE
========================================= */

let map = [];
let MAP_W, MAP_H;
let player, monster, goal;
let heartbeatTimer = 0;

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
    const dirs = [[0,-2],[0,2],[-2,0],[2,0]].sort(() => Math.random() - 0.5);
    let moved = false;

    for (const [dx,dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx > 0 && ny > 0 && nx < w-1 && ny < h-1 && map[ny][nx] === "1") {
        map[ny][nx] = "0";
        map[y + dy/2][x + dx/2] = "0";
        stack.push([nx, ny]);
        moved = true;
        break;
      }
    }

    if (!moved) stack.pop();
  }

  map[0][1] = "0";
  map[h-1][w-2] = "0";

  return {
    start: { x: 1.5, y: 1.5 },
    goal: { x: w - 2.5, y: h - 1.5 }
  };
}

/* =========================================
   RESET GAME
========================================= */

function resetGame() {
  const m = generateMaze(31, 31);

  player = { x: m.start.x, y: m.start.y, angle: 0 };
  goal = m.goal;

  monster = {
    x: goal.x,
    y: goal.y - 2,
    vx: 0,
    vy: 0,
    speed: 2.4,
    attackRadius: 0.6
  };

  heartbeatTimer = 0;
}

/* =========================================
   MOVEMENT
========================================= */

function cellOpen(x, y) {
  return map[Math.floor(y)]?.[Math.floor(x)] === "0";
}

function movePlayer(dt) {
  const speed = 3 * dt;
  const ca = Math.cos(player.angle);
  const sa = Math.sin(player.angle);

  if (keys.w && cellOpen(player.x + ca * speed, player.y + sa * speed)) {
    player.x += ca * speed;
    player.y += sa * speed;
  }

  if (keys.s && cellOpen(player.x - ca * speed, player.y - sa * speed)) {
    player.x -= ca * speed;
    player.y -= sa * speed;
  }

  if (keys.a) player.angle -= 2 * dt;
  if (keys.d) player.angle += 2 * dt;
}

function moveMonster(dt) {
  const dx = player.x - monster.x;
  const dy = player.y - monster.y;
  const d = Math.hypot(dx, dy) || 1e-4;

  monster.vx = (dx / d) * monster.speed;
  monster.vy = (dy / d) * monster.speed;

  const nx = monster.x + monster.vx * dt;
  const ny = monster.y + monster.vy * dt;

  if (cellOpen(nx, monster.y)) monster.x = nx;
  if (cellOpen(monster.x, ny)) monster.y = ny;

  const danger = Math.max(0, 1 - d / 10);
  heartbeatTimer -= dt;

  if (danger > 0.05 && heartbeatTimer <= 0) {
    playHeartbeat(danger);
    heartbeatTimer = 1.2 - danger;
  }

  if (d < monster.attackRadius) {
    state = "dead";
    gameRunning = false;

    const boot = document.getElementById("bootScreen");
    boot.innerHTML = `
      <h2 class="glow">YOU DIED</h2>
      <p class="blink">Press ENTER to restart</p>
    `;
    boot.style.display = "flex";
  }
}

/* =========================================
   RENDER
========================================= */

function draw3D() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  const sky = ctx.createLinearGradient(0, 0, 0, h/2);
  sky.addColorStop(0, "#0b1d3a");
  sky.addColorStop(1, "#5fa3ff");

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h/2);

  for (let x = 0; x < w; x++) {
    const angle = player.angle - FOV/2 + (x/w) * FOV;
    let d = 0;

    while (d < MAX_DEPTH) {
      d += 0.05;
      const tx = Math.floor(player.x + Math.cos(angle) * d);
      const ty = Math.floor(player.y + Math.sin(angle) * d);
      if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H || map[ty][tx] === "1") break;
    }

    const corrected = d * Math.cos(angle - player.angle);
    const wallH = h / (corrected + 0.0001);
    const fog = Math.min(corrected / 18, 1);
    const base = 200 * (1 - fog);

    ctx.fillStyle = `rgb(${base},${base},${base})`;
    ctx.fillRect(x, (h - wallH)/2, 1, wallH);
  }
}

/* =========================================
   LOOP
========================================= */

function loop(t) {
  const dt = Math.min((t - last) / 1000, 0.05);
  last = t;

  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  if (gameRunning) {
    movePlayer(dt);
    moveMonster(dt);
    draw3D();
  }

  animationId = requestAnimationFrame(loop);
}

/* =========================================
   BOOT + ENTER HANDLER
========================================= */

window.addEventListener("load", () => {
  const boot = document.getElementById("bootScreen");
  const container = document.getElementById("gameContainer");

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || state === "playing") return;

    if (audioCtx.state === "suspended") audioCtx.resume();

    state = "playing";
    gameRunning = true;

    boot.style.transition = "opacity 0.6s ease";
    boot.style.opacity = "0";

    setTimeout(() => {
      boot.style.display = "none";
      container.style.display = "block";

      resetGame();
      last = performance.now();

      if (animationId) cancelAnimationFrame(animationId);
      animationId = requestAnimationFrame(loop);
    }, 600);
  });
});

/* =========================================
   BRIGHTNESS + GAMMA CONTROLS
========================================= */

const brightnessSlider = document.getElementById("brightnessSlider");
const gammaSlider = document.getElementById("gammaSlider");

brightnessSlider.addEventListener("input", () => {
  document.documentElement.style.setProperty("--brightness", brightnessSlider.value);
});

gammaSlider.addEventListener("input", () => {
  document.documentElement.style.setProperty("--gamma", gammaSlider.value);
});