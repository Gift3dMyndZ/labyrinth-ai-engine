/* =========================================
   LABYRINTH – COMPLETE PRODUCTION BUILD
========================================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });

/* =========================================
   CANVAS SETUP
========================================= */

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);

/* =========================================
   STATE
========================================= */

let state = "boot";
let gameRunning = false;
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
document.addEventListener("keydown", e => {
  if (!gameRunning) return;
  keys[e.key.toLowerCase()] = true;
});
document.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

/* =========================================
   AUDIO – HEARTBEAT
========================================= */

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const heartbeatGain = audioCtx.createGain();
heartbeatGain.gain.value = 0;
heartbeatGain.connect(audioCtx.destination);

function playHeartbeat(strength) {
  const osc = audioCtx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 60;
  osc.connect(heartbeatGain);

  const t = audioCtx.currentTime;
  heartbeatGain.gain.setValueAtTime(0, t);
  heartbeatGain.gain.linearRampToValueAtTime(0.25 * strength, t + 0.05);
  heartbeatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

  osc.start(t);
  osc.stop(t + 0.3);
}

/* =========================================
   GAME STATE
========================================= */

let map = [];
let MAP_W, MAP_H;
let player, monster;
let heartbeatTimer = 0;
let firePulse = 0;
let exitTile = null;

/* =========================================
   TILE SEMANTICS
========================================= */

function cellOpen(x, y) {
  const t = map[Math.floor(y)]?.[Math.floor(x)];
  return t === "0" || t === "E";
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
    const [x, y] = stack.at(-1);
    const dirs = [[0,-2],[0,2],[-2,0],[2,0]].sort(() => Math.random() - 0.5);
    let moved = false;

    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
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

  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);
  const radius = Math.min(cx, cy) - 1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (Math.hypot(x - cx, y - cy) > radius) {
        map[y][x] = "1";
      }
    }
  }

  // 🔥 River of Fire ring
  const fireRadius = Math.floor(radius * 0.55);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d > fireRadius - 0.5 && d < fireRadius + 0.5 && map[y][x] === "0") {
        map[y][x] = "2";
      }
    }
  }

  // 🚪 Exit
  exitTile = { x: cx, y: cy - radius + 1 };
  map[exitTile.y][exitTile.x] = "E";

  return {
    start: { x: cx + 0.5, y: cy + 0.5 }
  };
}

/* =========================================
   RESET GAME
========================================= */

function resetGame() {
  const m = generateMaze(31, 31);

  player = { x: m.start.x, y: m.start.y, angle: 0 };

  monster = {
    x: exitTile.x + 0.5,
    y: exitTile.y + 2,
    speed: 2.2,
    attackRadius: 0.6,
    radius: 0.35
  };

  heartbeatTimer = 0;
  firePulse = 0;
}

/* =========================================
   PLAYER MOVEMENT
========================================= */

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

/* =========================================
   🔥 DYNAMIC FIRE UPDATE
========================================= */

function updateFire(dt) {
  firePulse += dt;
  if (firePulse < 1.5) return;
  firePulse = 0;

  for (let i = 0; i < 6; i++) {
    const x = Math.floor(Math.random() * MAP_W);
    const y = Math.floor(Math.random() * MAP_H);
    const t = map[y]?.[x];
    if (!t || t === "1" || t === "E") continue;

    if (t === "2") {
      map[y][x] = "0";
    } else if (t === "0") {
      let open = 0;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        if (map[y + dy]?.[x + dx] === "0") open++;
      }
      if (open >= 3) map[y][x] = "2";
    }
  }
}

/* =========================================
   MONSTER AI (RESPECTS FIRE)
========================================= */

function monsterCanMove(x, y, r) {
  return (
    cellOpen(x - r, y - r) &&
    cellOpen(x + r, y - r) &&
    cellOpen(x - r, y + r) &&
    cellOpen(x + r, y + r)
  );
}

function moveMonster(dt) {
  const dx = player.x - monster.x;
  const dy = player.y - monster.y;
  const d = Math.hypot(dx, dy) || 1e-4;

  const vx = (dx / d) * monster.speed * dt;
  const vy = (dy / d) * monster.speed * dt;

  if (monsterCanMove(monster.x + vx, monster.y, monster.radius)) monster.x += vx;
  if (monsterCanMove(monster.x, monster.y + vy, monster.radius)) monster.y += vy;

  const danger = Math.max(0, 1 - d / 10);
  heartbeatTimer = Math.max(0, heartbeatTimer - dt);

  if (danger > 0.05 && heartbeatTimer <= 0) {
    playHeartbeat(danger);
    heartbeatTimer = 1.2 - danger;
  }

  if (d < monster.attackRadius) {
    state = "dead";
    gameRunning = false;
    const boot = document.getElementById("bootScreen");
    boot.innerHTML = `<h2 class="glow-tartarus">YOU DIED</h2><p class="blink">Press ENTER</p>`;
    boot.style.display = "flex";
    boot.style.opacity = "1";
  }
}

/* =========================================
   RENDER
========================================= */

function draw3D() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  for (let x = 0; x < w; x++) {
    const rayAngle = player.angle - FOV / 2 + (x / w) * FOV;
    let d = 0;
    let tile = "0";

    while (d < MAX_DEPTH) {
      d += 0.05;
      const tx = Math.floor(player.x + Math.cos(rayAngle) * d);
      const ty = Math.floor(player.y + Math.sin(rayAngle) * d);
      tile = map[ty]?.[tx];
      if (!tile || tile !== "0") break;
    }

    const corrected = d * Math.cos(rayAngle - player.angle);
    const wallH = h / (corrected + 0.0001);

    if (tile === "2") ctx.fillStyle = "rgb(180,60,20)";
    else ctx.fillStyle = "rgb(120,100,70)";

    ctx.fillRect(x, (h - wallH) / 2, 1, wallH);
  }
}

/* =========================================
   LOOP
========================================= */

function loop(t) {
  const dt = Math.min((t - last) / 1000, 0.05);
  last = t;

  if (gameRunning) {
    movePlayer(dt);
    updateFire(dt);
    moveMonster(dt);
    draw3D();
  }

  requestAnimationFrame(loop);
}

/* =========================================
   BOOT
========================================= */

window.addEventListener("load", () => {
  const boot = document.getElementById("bootScreen");

  document.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    if (audioCtx.state === "suspended") audioCtx.resume();

    state = "playing";
    gameRunning = true;
    boot.style.display = "none";

    resizeCanvas();
    resetGame();
    last = performance.now();
    requestAnimationFrame(loop);
  });
});