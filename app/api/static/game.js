/* =========================================
   LABYRINTH – 3D RAYCASTER + 👾 + AUDIO
========================================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });

/* =========================================
   CANVAS
========================================= */

function resizeCanvas() {
  const dpr = 1; // LOCK it (instead of window.devicePixelRatio)

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* =========================================
   CONSTANTS
========================================= */

const FOV = Math.PI / 3;
const MAX_DEPTH = 25;
const MINIMAP_SIZE = 180;
const MINIMAP_MARGIN = 20;

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
   MAZE
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

/* =========================================
   RESET
========================================= */

function resetGame() {
  const m = generateMaze(31,31);
  player = { x:m.start.x, y:m.start.y, angle:0 };
  goal = m.goal;
  monster = {
    x: goal.x,
    y: goal.y - 2,
    vx:0, vy:0,
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

  monster.vx=(dx/d)*monster.speed;
  monster.vy=(dy/d)*monster.speed;

  const nx=monster.x+monster.vx*dt;
  const ny=monster.y+monster.vy*dt;

  if(cellOpen(nx,monster.y)) monster.x=nx;
  if(cellOpen(monster.x,ny)) monster.y=ny;

  // 🔊 Heartbeat logic
  const danger = Math.max(0, 1 - d / 10);
  heartbeatTimer -= dt;
  if (danger > 0.05 && heartbeatTimer <= 0) {
    playHeartbeat(danger);
    heartbeatTimer = 1.2 - danger;
  }

  if(d<monster.attackRadius) gameRunning=false;
}

/* =========================================
   👾 MONSTER SPRITE
========================================= */

function makeAlien(pattern,scale=3){
  const c=document.createElement("canvas");
  c.width=pattern[0].length*scale;
  c.height=pattern.length*scale;
  const g=c.getContext("2d");
  g.imageSmoothingEnabled=false;
  pattern.forEach((row,y)=>{
    [...row].forEach((v,x)=>{
      if(v!=="0"){
        g.fillStyle=v==="1"?"#7aff00":"#30c000";
        g.fillRect(x*scale,y*scale,scale,scale);
      }
    });
  });
  c.__data=g.getImageData(0,0,c.width,c.height).data;
  return c;
}

const alienFrames=[
  makeAlien([
    "00111100",
    "01111110",
    "11111111",
    "11011011",
    "11111111",
    "01100110",
    "00100100"
  ]),
  makeAlien([
    "00111100",
    "01111110",
    "11111111",
    "11011011",
    "11111111",
    "00100100",
    "01000010"
  ])
];
let alienFrame=0, alienTimer=0;

/* =========================================
   SPRITE RENDER
========================================= */

function drawSprite(x,y,tex,depth){
  const w = canvas.width;
  const h = canvas.height;
  const dirX=Math.cos(player.angle),dirY=Math.sin(player.angle);
  const planeX=-dirY*Math.tan(FOV/2);
  const planeY= dirX*Math.tan(FOV/2);

  const relX=x-player.x, relY=y-player.y;
  const inv=1/(planeX*dirY-dirX*planeY);
  const tx=inv*(dirY*relX-dirX*relY);
  const tz=inv*(-planeY*relX+planeX*relY);
  if(tz<=0) return;

  const sx=(w/2)*(1+tx/tz);
  const size=h/tz;
  const data=tex.__data;

  for(let x0=sx-size/2;x0<sx+size/2;x0++){
    const xi=x0|0;
    if(xi<0||xi>=w||tz>depth[xi]) continue;
    const u=((x0-(sx-size/2))/size*tex.width)|0;

    for(let y0=h/2-size/2;y0<h/2+size/2;y0++){
      const yi=y0|0;
      if(yi<0||yi>=h) continue;
      const v=((y0-(h/2-size/2))/size*tex.height)|0;
      const i=(v*tex.width+u)*4;
      if(data[i+3]>0){
        ctx.fillStyle=`rgb(${data[i]},${data[i+1]},${data[i+2]})`;
        ctx.fillRect(xi,yi,1,1);
      }
    }
  }
}

/* =========================================
   RENDER
========================================= */

function draw3D(){
  const w = canvas.width;
  const h = canvas.height;

  // 🌌 Better sky
  const sky = ctx.createLinearGradient(0, 0, 0, h / 2);
  sky.addColorStop(0, "#0b1d3a");
  sky.addColorStop(1, "#5fa3ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h / 2);

  const depth = new Float32Array(w);

  // 🧱 Walls with fog + edge shading
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

  // 👾 Monster
  drawSprite(monster.x, monster.y, alienFrames[alienFrame], depth);
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

    alienTimer += dt;
    if (alienTimer > 0.3) {
      alienTimer = 0;
      alienFrame ^= 1;
    }

    draw3D();
    drawMiniMap();

    // 🔴 Danger screen tint
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
   BOOT CONTROL
========================================= */

const bootScreen = document.getElementById("bootScreen");
const gameContainer = document.getElementById("gameContainer");

bootScreen.style.display = "flex";
gameContainer.style.display = "none";

document.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !gameRunning) {

    // Unlock audio (required by browser)
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    bootScreen.style.display = "none";
    gameContainer.style.display = "block";

    resizeCanvas();
    resetGame();

    gameRunning = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }
});
function drawMiniMap() {

  const scale = 0.2; // mini map scale
  const tileSize = 16;

  const mapWidth = map[0].length;
  const mapHeight = map.length;

  const miniWidth = mapWidth * tileSize * scale;
  const miniHeight = mapHeight * tileSize * scale;

  const offsetX = canvas.width / 20;
  const offsetY = canvas.height / 20;

  ctx.save();
  ctx.shadowColor = "rgba(0,255,0,0.6)";
  ctx.shadowBlur = 8;
  ctx.globalAlpha = 0.85;

  // Background
  ctx.fillStyle = "rgb(0,20,0)";
  ctx.fillRect(offsetX - 4, offsetY - 4, miniWidth + 8, miniHeight + 8);

  // Draw walls
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
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

  // Player
  ctx.fillStyle = "rgb(255,0,0)";
  ctx.beginPath();
  ctx.arc(
    offsetX + player.x * scale,
    offsetY + player.y * scale,
    4,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Player direction
  ctx.strokeStyle = "rgba(255,0,0,0.3)";
  ctx.beginPath();
  ctx.moveTo(
    offsetX + player.x * scale,
    offsetY + player.y * scale
  );
  ctx.lineTo(
    offsetX + (player.x + Math.cos(player.angle - FOV/2) * 20) * scale,
    offsetY + (player.y + Math.sin(player.angle - FOV/2) * 20) * scale
  );
  ctx.lineTo(
    offsetX + (player.x + Math.cos(player.angle + FOV/2) * 20) * scale,
    offsetY + (player.y + Math.sin(player.angle + FOV/2) * 20) * scale
  );
  ctx.closePath();
  ctx.stroke();

  // Monster
  ctx.fillStyle = "rgb(0,255,120)";
  ctx.beginPath();
  ctx.arc(
    offsetX + monster.x * scale,
    offsetY + monster.y * scale,
    4,
    0,
    Math.PI * 2
  );
  ctx.fill();
}