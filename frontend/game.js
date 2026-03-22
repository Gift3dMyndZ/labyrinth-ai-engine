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
  canvas.width = Math.floor(rect.width);
  canvas.height = Math.floor(rect.height);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

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

function beep(freq, duration, type="square", volume=0.2){
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

function playDeathSound(){
  beep(200,0.1);
  setTimeout(()=>beep(120,0.15),100);
  setTimeout(()=>beep(60,0.3),250);
}

function playWinSound(){
  beep(440,0.1);
  setTimeout(()=>beep(660,0.1),100);
  setTimeout(()=>beep(880,0.2),200);
}

/* =========================================
   MAZE GENERATION
========================================= */

function generateMaze(w, h) {
  w |= 1; h |= 1;
  MAP_W = w; MAP_H = h;

  map = Array.from({ length: h }, () => Array(w).fill("1"));

  const stack = [[1,1]];
  map[1][1] = "0";

  while(stack.length){
    const [x,y] = stack[stack.length-1];
    const dirs = [[0,-2],[0,2],[-2,0],[2,0]].sort(()=>Math.random()-0.5);
    let moved = false;

    for(const [dx,dy] of dirs){
      const nx=x+dx, ny=y+dy;
      if(nx>0 && ny>0 && nx<w-1 && ny<h-1 && map[ny][nx]==="1"){
        map[ny][nx]="0";
        map[y+dy/2][x+dx/2]="0";
        stack.push([nx,ny]);
        moved=true;
        break;
      }
    }
    if(!moved) stack.pop();
  }

  return {
    start:{x:1.5,y:1.5},
    goal:{x:w-2.5,y:h-2.5}
  };
}

function resetGame(){
  const m = generateMaze(31,31);

  player = { x:m.start.x, y:m.start.y, angle:0 };
  goal = m.goal;

  monster = {
    x: goal.x,
    y: goal.y - 2,
    baseSpeed:2.2,
    speed:2.2
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

function cellOpen(x,y){
  return map[Math.floor(y)]?.[Math.floor(x)] === "0";
}

function movePlayer(dt){
  const speed=3*dt;
  const ca=Math.cos(player.angle);
  const sa=Math.sin(player.angle);

  if(keys.w && cellOpen(player.x+ca*speed,player.y+sa*speed)){
    player.x+=ca*speed;
    player.y+=sa*speed;
  }
  if(keys.s && cellOpen(player.x-ca*speed,player.y-sa*speed)){
    player.x-=ca*speed;
    player.y-=sa*speed;
  }
  if(keys.a) player.angle-=2*dt;
  if(keys.d) player.angle+=2*dt;
}

function moveMonster(dt){
  const elapsed=(performance.now()-startTime)/1000;
  monster.speed=monster.baseSpeed+elapsed*0.08;

  const dx=player.x-monster.x;
  const dy=player.y-monster.y;
  const d=Math.hypot(dx,dy)||1e-4;

  const vx=(dx/d)*monster.speed;
  const vy=(dy/d)*monster.speed;

  if(cellOpen(monster.x+vx*dt,monster.y)) monster.x+=vx*dt;
  if(cellOpen(monster.x,monster.y+vy*dt)) monster.y+=vy*dt;

  if(d<0.6){
    gameOver=true;
    gameRunning=false;
    playDeathSound();
  }
}

/* =========================================
   MONSTER SPRITE
========================================= */

function makeAlien(pattern,scale=2){
  const c=document.createElement("canvas");
  c.width=pattern[0].length*scale;
  c.height=pattern.length*scale;
  const g=c.getContext("2d");
  g.imageSmoothingEnabled=false;

  pattern.forEach((row,y)=>{
    [...row].forEach((v,x)=>{
      if(v==="1"){
        g.fillStyle="#7aff00";
        g.fillRect(x*scale,y*scale,scale,scale);
      }
    });
  });

  c.__data=g.getImageData(0,0,c.width,c.height).data;
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

function draw3D(){

  const w=canvas.width;
  const h=canvas.height;

  const sky=ctx.createLinearGradient(0,0,0,h/2);
  sky.addColorStop(0,"#001a33");
  sky.addColorStop(1,"#0055aa");
  ctx.fillStyle=sky;
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
    const fog=Math.min(cd/20,1);

    const r=(150*(1-fog))|0;
    const g=(80*(1-fog))|0;
    const b=(220*(1-fog))|0;

    ctx.fillStyle=`rgb(${r},${g},${b})`;
    ctx.fillRect(x,(h-wallH)/2,1,wallH);
  }

  drawMonster(depth);
}

/* =========================================
   MONSTER DEPTH RENDER
========================================= */

function drawMonster(depth){

  const w=canvas.width;
  const h=canvas.height;

  const dx=monster.x-player.x;
  const dy=monster.y-player.y;
  const dist=Math.hypot(dx,dy);
  if(dist<=0) return;

  const angle=Math.atan2(dy,dx)-player.angle;
  if(Math.abs(angle)>FOV/2) return;

  const size=h/dist;
  const sx=w/2+(angle/FOV)*w;

  for(let x0=sx-size/2;x0<sx+size/2;x0++){
    const xi=x0|0;
    if(xi<0||xi>=w||dist>depth[xi]) continue;

    const u=((x0-(sx-size/2))/size*alien.width)|0;

    for(let y0=h/2-size/2;y0<h/2+size/2;y0++){
      const yi=y0|0;
      if(yi<0||yi>=h) continue;

      const v=((y0-(h/2-size/2))/size*alien.height)|0;
      const i=(v*alien.width+u)*4;
      if(alien.__data[i+3]>0){
        ctx.fillStyle="#7aff00";
        ctx.fillRect(xi,yi,1,1);
      }
    }
  }
}

/* =========================================
   MINI MAP (FIXED)
========================================= */

function drawMiniMap(){

  const scale=0.2;
  const tileSize=16;
  const offsetX=20;
  const offsetY=20;

  ctx.save();
  ctx.globalAlpha=0.9;

  ctx.fillStyle="rgb(15,10,25)";
  ctx.fillRect(offsetX-4,offsetY-4,160,160);

  for(let y=0;y<MAP_H;y++){
    for(let x=0;x<MAP_W;x++){
      if(map[y][x]==="1"){
        ctx.fillStyle="rgb(80,255,80)";
        ctx.fillRect(
          offsetX+x*tileSize*scale,
          offsetY+y*tileSize*scale,
          tileSize*scale,
          tileSize*scale
        );
      }
    }
  }

  ctx.fillStyle="rgb(170,0,255)";
  ctx.beginPath();
  ctx.arc(offsetX+player.x*scale,offsetY+player.y*scale,5,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle="rgb(0,255,120)";
  ctx.beginPath();
  ctx.arc(offsetX+monster.x*scale,offsetY+monster.y*scale,4,0,Math.PI*2);
  ctx.fill();

  ctx.restore();
}

/* =========================================
   UI
========================================= */

function drawScore(){
  ctx.fillStyle="#00ffcc";
  ctx.font="20px Courier New";
  ctx.fillText("SCORE: "+score,20,30);
}

/* =========================================
   LOOP
========================================= */

let last=0;

function loop(t){

  const dt=Math.min((t-last)/1000,0.05);
  last=t;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(gameRunning){

    movePlayer(dt);
    moveMonster(dt);

    draw3D();
    drawMiniMap();
    drawScore();

    score+=Math.floor(dt*100);

    const gx=goal.x-player.x;
    const gy=goal.y-player.y;
    if(Math.hypot(gx,gy)<0.8){
      gameWon=true;
      gameRunning=false;
      playWinSound();
    }
  }

  requestAnimationFrame(loop);
}

/* =========================================
   BOOT
========================================= */

document.addEventListener("keydown",function(e){
  if(e.code==="Enter"||e.code==="NumpadEnter"){
    if(audioCtx.state==="suspended") audioCtx.resume();
    resetGame();
    gameRunning=true;
    gameOver=false;
    gameWon=false;
    last=performance.now();
  }
});

requestAnimationFrame(loop);