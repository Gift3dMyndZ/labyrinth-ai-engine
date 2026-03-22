/* =========================================
   LABYRINTH – 3D RAYCASTER + 👾 MONSTER
========================================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });

/* =========================================
   CANVAS (DPR SAFE)
========================================= */

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
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

/* =========================================
   INPUT
========================================= */

const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

/* =========================================
   GAME STATE
========================================= */

let map = [];
let MAP_W, MAP_H;
let player, monster;
let gameRunning = true;

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

  return {
    start:{x:1.5,y:1.5},
    goal:{x:w-2.5,y:h-2.5}
  };
}

function resetGame() {
  const m = generateMaze(31,31);

  player = { x:m.start.x, y:m.start.y, angle:0 };

  monster = {
    x: m.goal.x,
    y: m.goal.y,
    vx:0, vy:0,
    speed:2.5,
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

  const w=canvas.clientWidth;
  const h=canvas.clientHeight;

  const dirX=Math.cos(player.angle),dirY=Math.sin(player.angle);
  const planeX=-dirY*Math.tan(FOV/2);
  const planeY= dirX*Math.tan(FOV/2);

  const relX=x-player.x, relY=y-player.y;
  const inv=1/(planeX*dirY-dirX*planeY);

  const tx=inv*(dirY*relX-dirX*relY);
  const tz=inv*(-planeY*relX+planeX*relY);

  if(tz<=0) return;

  const screenX=(w/2)*(1+tx/tz);
  const size=h/tz;

  const startX=Math.floor(screenX-size/2);
  const endX=Math.floor(screenX+size/2);

  for(let x0=startX;x0<endX;x0++){
    if(x0<0||x0>=w) continue;
    if(tz>depth[x0]) continue;

    const u=((x0-startX)/size*tex.width)|0;

    for(let y0=h/2-size/2;y0<h/2+size/2;y0++){
      if(y0<0||y0>=h) continue;

      const v=((y0-(h/2-size/2))/size*tex.height)|0;
      const i=(v*tex.width+u)*4;

      const data=tex.__data;
      if(data[i+3]>0){
        ctx.fillStyle=`rgb(${data[i]},${data[i+1]},${data[i+2]})`;
        ctx.fillRect(x0,y0,1,1);
      }
    }
  }
}

/* =========================================
   RENDER
========================================= */

function draw3D(){

  const w=canvas.clientWidth;
  const h=canvas.clientHeight;

  ctx.fillStyle="#87ceeb";
  ctx.fillRect(0,0,w,h/2);

  const depth=new Float32Array(w);

  for(let x=0;x<w;x++){
    const angle=player.angle-FOV/2+(x/w)*FOV;

    let d=0;
    while(d<MAX_DEPTH){
      d+=0.05;
      const tx=Math.floor(player.x+Math.cos(angle)*d);
      const ty=Math.floor(player.y+Math.sin(angle)*d);
      if(tx<0||ty<0||tx>=MAP_W||ty>=MAP_H||map[ty][tx]==="1") break;
    }

    const cd=d*Math.cos(angle-player.angle);
    depth[x]=cd;

    const wallH=h/(cd+0.0001);

    ctx.fillStyle="#777";
    ctx.fillRect(x,(h-wallH)/2,1,wallH);
  }

  drawSprite(monster.x,monster.y,alienFrames[alienFrame],depth);
}

/* =========================================
   LOOP
========================================= */

let last=0;

function loop(t){

  const dt=Math.min((t-last)/1000,0.05);
  last=t;

  ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);

  if(gameRunning){

    movePlayer(dt);
    moveMonster(dt);

    alienTimer+=dt;
    if(alienTimer>0.3){
      alienTimer=0;
      alienFrame^=1;
    }

    draw3D();
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);