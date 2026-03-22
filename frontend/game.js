/* ==========================================
   LABYRINTH – 3D RAYCASTER + 👾 + AUDIO
========================================== */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });

/* =========================================
   CANVAS
========================================= */

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* =========================================
   CONSTANTS
========================================= */

const FOV = Math.PI / 3;
const MAX_DEPTH = 25;

/* =========================================
   INPUT
========================================= */

const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

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
let gameRunning = false;

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
    const dirs = [[0,-2],[0,2],[-2,0],[2,0]].sort(()=>Math.random()-0.5);
    let moved = false;

    for (const [dx,dy] of dirs) {
      const nx=x+dx, ny=y+dy;
      if (nx>0 && ny>0 && nx<w-1 && ny<h-1 && map[ny][nx]==="1") {
        map[ny][nx]="0";
        map[y+dy/2][x+dx/2]="0";
        stack.push([nx,ny]);
        moved=true;
        break;
      }
    }
    if (!moved) stack.pop();
  }

  map[0][1]="0";
  map[h-1][w-2]="0";

  return {
    start:{x:1.5,y:1.5},
    goal:{x:w-2.5,y:h-1.5}
  };
}

function resetGame() {
  const m = generateMaze(31,31);
  player = { x:m.start.x, y:m.start.y, angle:0 };
  goal = m.goal;
  monster = {
    x: goal.x,
    y: goal.y - 2,
    speed:2.4,
    attackRadius:0.6
  };
}
resetGame();

/* =========================================
   MOVEMENT
========================================= */

function cellOpen(x,y){
  return map[Math.floor(y)]?.[Math.floor(x)]==="0";
}

function movePlayer(dt){
  const speed=3*dt;
  const ca=Math.cos(player.angle), sa=Math.sin(player.angle);

  if(keys.w && cellOpen(player.x+ca*speed,player.y+sa*speed)){
    player.x+=ca*speed; player.y+=sa*speed;
  }
  if(keys.s && cellOpen(player.x-ca*speed,player.y-sa*speed)){
    player.x-=ca*speed; player.y-=sa*speed;
  }
  if(keys.a) player.angle-=2*dt;
  if(keys.d) player.angle+=2*dt;
}

let heartbeatTimer = 0;

function moveMonster(dt){
  const dx=player.x-monster.x;
  const dy=player.y-monster.y;
  const d=Math.hypot(dx,dy)||1e-4;

  const vx=(dx/d)*monster.speed;
  const vy=(dy/d)*monster.speed;

  const nx=monster.x+vx*dt;
  const ny=monster.y+vy*dt;

  if(cellOpen(nx,monster.y)) monster.x=nx;
  if(cellOpen(monster.x,ny)) monster.y=ny;

  const danger = Math.max(0, 1 - d / 10);
  heartbeatTimer -= dt;
  if (danger > 0.05 && heartbeatTimer <= 0) {
    playHeartbeat(danger);
    heartbeatTimer = 1.2 - danger;
  }

  if(d<monster.attackRadius) gameRunning=false;
}

/* =========================================
   MONSTER SPRITE (DEPTH-CORRECT)
========================================= */

function drawMonsterSprite(depth) {

  const dx = monster.x - player.x;
  const dy = monster.y - player.y;
  const dist = Math.hypot(dx, dy);

  if (dist < 0.3 || dist > MAX_DEPTH) return;

  let angleToMonster = Math.atan2(dy, dx) - player.angle;

  while (angleToMonster > Math.PI) angleToMonster -= Math.PI * 2;
  while (angleToMonster < -Math.PI) angleToMonster += Math.PI * 2;

  if (Math.abs(angleToMonster) > FOV / 2) return;

  const screenX = (0.5 + angleToMonster / FOV) * canvas.width;
  const size = canvas.height / (dist * 1.5);
  const y = canvas.height / 2 - size / 2;

  const column = Math.floor(screenX);
  if (column < 0 || column >= canvas.width) return;
  if (depth[column] < dist) return;

  ctx.globalAlpha = Math.max(0, 1 - dist / 8);

  ctx.fillStyle = "rgba(20, 10, 5, 0.9)";
  ctx.beginPath();
  ctx.ellipse(screenX, y + size / 2, size * 0.25, size * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(180, 60, 20, 0.7)";
  ctx.beginPath();
  ctx.arc(screenX, y + size / 2, size * 0.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
}

/* =========================================
   RENDER
========================================= */

function draw3D(){

  const w = canvas.width;
  const h = canvas.height;

  const sky = ctx.createLinearGradient(0, 0, 0, h / 2);
  sky.addColorStop(0, "#0b1d3a");
  sky.addColorStop(1, "#5fa3ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h / 2);

  const depth = new Float32Array(w);

  for (let x = 0; x < w; x++) {
    const angle = player.angle - FOV / 2 + (x / w) * FOV;
    let d = 0;

    while (d < MAX_DEPTH) {
      d += 0.05;
      const tx = Math.floor(player.x + Math.cos(angle) * d);
      const ty = Math.floor(player.y + Math.sin(angle) * d);
      if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H || map[ty][tx] === "1") break;
    }

    const cd = d * Math.cos(angle - player.angle);
    depth[x] = cd;

    const wallH = h / (cd + 0.0001);
    const fog = Math.min(cd / 18, 1);
    const base = 200 * (1 - fog);
    const shade = (x % 2 ? 0.9 : 1);

    const g = (base * shade) | 0;
    ctx.fillStyle = `rgb(${g},${g},${g})`;
    ctx.fillRect(x, (h - wallH) / 2, 1, wallH);
  }

  drawMonsterSprite(depth);
}

/* =========================================
   MINIMAP
========================================= */

function drawMiniMap() {

  const scale = 0.2;
  const tileSize = 16;

  const offsetX = 20;
  const offsetY = 20;

  ctx.save();
  ctx.globalAlpha = 0.85;

  ctx.fillStyle = "rgb(0,20,0)";
  ctx.fillRect(offsetX - 4, offsetY - 4, 160, 160);

  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (map[y][x] === "1") {
        ctx.fillStyle = "rgb(0,255,0)";
        ctx.fillRect(
          offsetX + x * tileSize * scale,
          offsetY + y * tileSize * scale,
          tileSize * scale,
          tileSize * scale
        );
      }
    }
  }

  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(offsetX + player.x * scale, offsetY + player.y * scale, 4, 0, Math.PI*2);
  ctx.fill();

  ctx.fillStyle = "lime";
  ctx.beginPath();
  ctx.arc(offsetX + monster.x * scale, offsetY + monster.y * scale, 4, 0, Math.PI*2);
  ctx.fill();

  ctx.restore();
}

/* =========================================
   LOOP
========================================= */

let last = 0;

function loop(t) {
  const dt = Math.min((t - last) / 1000, 0.05);
  last = t;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameRunning) {

    movePlayer(dt);
    moveMonster(dt);

    draw3D();
    drawMiniMap();

    const dx = player.x - monster.x;
    const dy = player.y - monster.y;
    const dist = Math.hypot(dx, dy);
    const danger = Math.max(0, 1 - dist / 8);

    if (danger > 0) {
      ctx.fillStyle = `rgba(255,0,0,${danger * 0.25})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  requestAnimationFrame(loop);
}

/* =========================================
   BOOT
========================================= */

document.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !gameRunning) {

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    resetGame();
    gameRunning = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }
});