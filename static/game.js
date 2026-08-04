/* ===========================================================
   LABYRINTH OF TARTARUS — game.js
   Circular maze · Fire theme · AI-learning monster · Raycaster
   Integrates with FastAPI telemetry backend
=========================================================== */

(function () {
  "use strict";

  /* =========================================================
     CONFIGURATION
  ========================================================= */

  const CFG = {
    GRID:           41,
    RING_SPACING:   3,
    FOV:            Math.PI / 3,
    MOVE:           0.045,
    ROT:            0.045,
    MOUSE_SENS:     0.003,
    WALL_HEIGHT:    1.2,
    MONSTER_SPEED:  0.02,
    TELEMETRY_MS:   5000,
    API:            "/api/telemetry/log",
  };

  /* =========================================================
     SPACE INVADER SPRITE
     11 x 8 pixel art
  ========================================================= */

  const SPRITE = [
    [0,0,1,0,0,0,0,0,1,0,0],
    [0,0,0,1,0,0,0,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,1,1,0,1,1,1,0,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,0,1,1,1,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,1,0,1],
    [0,0,0,1,1,0,1,1,0,0,0],
  ];
  const SPR_W = SPRITE[0].length;
  const SPR_H = SPRITE.length;

  /* =========================================================
     DOM REFERENCES
  ========================================================= */

  const bootScreen    = document.getElementById("bootScreen");
  const gameContainer = document.getElementById("gameContainer");
  const canvas        = document.getElementById("game");
  const ctx           = canvas.getContext("2d");
  const audioToggle = document.getElementById("audioToggle");
  const playerNameInput = document.getElementById("playerName");
  const startButton = document.getElementById("startButton");
  /* =========================================================
     GAME STATE
  ========================================================= */

let audioEnabled = true;
let ambientAudio = null;
let bootAudioStarted = false;
  let map       = [];
  let player    = { x: 0, y: 0, angle: 0 };
  let goalX     = 0, goalY = 0;
  let keys      = {};
  let gameState = "boot";
  let startTime = 0;
  let survivalTime  = 0;
  let score         = 0;
  let floorReached  = 1;
  let zBuffer       = [];
  let animFrameId   = null;
  let lastTime      = 0;
  let sessionId     = Date.now().toString(36) + Math.random().toString(36).slice(2);
  let displayName = localStorage.getItem("tartarusDisplayName") || "Unknown Wanderer";
  let oracleMutationCount = 0;

  function detectDeviceType() {
    const coarsePointer =
      window.matchMedia("(pointer: coarse)").matches;

    const shortestSide = Math.min(
      window.innerWidth,
      window.innerHeight
    );

    if (coarsePointer && shortestSide >= 700) {
      return "tablet";
    }

    if (coarsePointer) {
      return "mobile";
    }

    return "desktop";
  }

  function capturePlayerIdentity() {
    const enteredName = playerNameInput
      ? playerNameInput.value.trim()
      : "";

    displayName = (
      enteredName || "Unknown Wanderer"
    ).slice(0, 32);

    localStorage.setItem(
      "tartarusDisplayName",
      displayName
    );
  }

  /* =========================================================
     MONSTER STATE
  ========================================================= */

  let monster = {
    x: 0, y: 0,
    speed:      CFG.MONSTER_SPEED,
    state:      "patrol",
    awareness:  0,
    patrolAngle: 0,
    lastSeenX:  0,
    lastSeenY:  0,
    fearWeight:     0,
    aggroWeight:    0,
    curiosityWeight: 0,
    difficultyMod:  1.0,
  };

  /* =========================================================
     TELEMETRY ACCUMULATORS
  ========================================================= */

  let tele = {
    cellsVisited:  new Set(),
    ranFromMonster: 0,
    movedToward:    0,
    totalFrames:    0,
  };
  let lastTelemetryTime = 0;

  /* =========================================================
     CIRCULAR MAZE GENERATION (TARTARUS RINGS)
  ========================================================= */

  function generateMaze() {
    const S = CFG.GRID;
    const cx = Math.floor(S / 2);
    const cy = Math.floor(S / 2);

    map = Array.from({ length: S }, () => Array(S).fill(1));

    // Center chamber
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (dx * dx + dy * dy <= 6) {
          map[cy + dy][cx + dx] = 0;
        }
      }
    }

    // Concentric rings
    const maxR = Math.floor(S / 2) - 2;
    const rings = [];
    for (let r = CFG.RING_SPACING + 1; r <= maxR; r += CFG.RING_SPACING) {
      rings.push(r);
    }

    rings.forEach((r, ri) => {
      const steps = Math.max(80, Math.floor(2 * Math.PI * r * 6));
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * 2 * Math.PI;
        const x = Math.round(cx + r * Math.cos(angle));
        const y = Math.round(cy + r * Math.sin(angle));
        if (x > 0 && x < S - 1 && y > 0 && y < S - 1) {
          map[y][x] = 0;
        }
      }

      const barrierCount = 3 + ri * 2;
      const barrierArc = Math.max(1, Math.floor(r * 0.35));
      for (let b = 0; b < barrierCount; b++) {
        const baseAngle = (b / barrierCount) * 2 * Math.PI + ri * 0.73;
        for (let l = 0; l < barrierArc; l++) {
          const a = baseAngle + (l / Math.max(1, r)) * 0.9;
          const x = Math.round(cx + r * Math.cos(a));
          const y = Math.round(cy + r * Math.sin(a));
          if (x > 1 && x < S - 2 && y > 1 && y < S - 2) {
            map[y][x] = 1;
          }
        }
      }

      const prevR = ri > 0 ? rings[ri - 1] : 2;
      const passages = 2 + Math.floor(ri * 0.8);
      for (let p = 0; p < passages; p++) {
        const a = (p / passages) * 2 * Math.PI + ri * 1.17;
        for (let rr = prevR; rr <= r; rr += 0.4) {
          const x = Math.round(cx + rr * Math.cos(a));
          const y = Math.round(cy + rr * Math.sin(a));
          if (x > 0 && x < S - 1 && y > 0 && y < S - 1) {
            map[y][x] = 0;
          }
        }
      }
    });

    // Exit corridor
    const lastR = rings[rings.length - 1];
    const exitAngle = Math.random() * 2 * Math.PI;
    goalX = cx;
    goalY = cy;
    for (let rr = lastR; rr < Math.floor(S / 2); rr += 0.4) {
      const x = Math.round(cx + rr * Math.cos(exitAngle));
      const y = Math.round(cy + rr * Math.sin(exitAngle));
      if (x > 0 && x < S - 1 && y > 0 && y < S - 1) {
        map[y][x] = 0;
        goalX = x;
        goalY = y;
      }
    }

    // Connectivity validation
    let attempts = 0;
    while (!isConnected(cx, cy, goalX, goalY) && attempts < 30) {
      const a = Math.random() * 2 * Math.PI;
      const ri = Math.floor(Math.random() * rings.length);
      const prevR = ri > 0 ? rings[ri - 1] : 2;
      const r = rings[ri];
      for (let rr = prevR; rr <= r; rr += 0.4) {
        const x = Math.round(cx + rr * Math.cos(a));
        const y = Math.round(cy + rr * Math.sin(a));
        if (x > 0 && x < S - 1 && y > 0 && y < S - 1) {
          map[y][x] = 0;
        }
      }
      attempts++;
    }

    // Player at center
    player.x = cx + 0.5;
    player.y = cy + 0.5;
    player.angle = exitAngle;

    // Monster on a middle ring opposite side
    const midRing = rings[Math.min(Math.floor(rings.length / 2), rings.length - 1)];
    const mAngle = exitAngle + Math.PI;
    monster.x = cx + midRing * Math.cos(mAngle) + 0.5;
    monster.y = cy + midRing * Math.sin(mAngle) + 0.5;
    snapToOpen(monster);

    return { cx, cy };
  }

  function snapToOpen(entity) {
    const mx = Math.floor(entity.x);
    const my = Math.floor(entity.y);
    if (mx >= 0 && mx < CFG.GRID && my >= 0 && my < CFG.GRID && map[my][mx] === 0) return;
    for (let r = 1; r < 6; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = mx + dx, ny = my + dy;
          if (nx > 0 && nx < CFG.GRID - 1 && ny > 0 && ny < CFG.GRID - 1 && map[ny][nx] === 0) {
            entity.x = nx + 0.5;
            entity.y = ny + 0.5;
            return;
          }
        }
      }
    }
  }

  function isConnected(sx, sy, ex, ey) {
    const visited = new Set();
    const queue = [[sx, sy]];
    const target = ex + "," + ey;

    while (queue.length > 0) {
      const [x, y] = queue.shift();
      const key = x + "," + y;
      if (key === target) return true;
      if (visited.has(key)) continue;
      visited.add(key);

      for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0]]) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < CFG.GRID && ny >= 0 && ny < CFG.GRID && map[ny][nx] === 0) {
          queue.push([nx, ny]);
        }
      }
    }
    return false;
  }

  /* =========================================================
     INPUT
  ========================================================= */


if (playerNameInput) {
  playerNameInput.value =
    displayName === "Unknown Wanderer"
      ? ""
      : displayName;
}

if (startButton) {
  startButton.addEventListener("click", () => {
    if (gameState === "boot") {
      capturePlayerIdentity();
      playBootAudio();
      startGame();
    }
  });
}

document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;

    if (gameState === "boot") {
      playBootAudio();
    }

    if (e.key === "Enter") {
      if (gameState === "boot") {
        capturePlayerIdentity();
        startGame();
      } else if (
        gameState === "dead" ||
        gameState === "escaped"
      ) {
        startGame();
      }
    }
});

document.addEventListener("click", () => {
    if (gameState === "boot") {
      playBootAudio();
    }
});

  document.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
  });

  let mouseLocked = false;

  canvas.addEventListener("click", () => {
    if (gameState === "playing") canvas.requestPointerLock();
  });

  document.addEventListener("pointerlockchange", () => {
    mouseLocked = document.pointerLockElement === canvas;
  });

  document.addEventListener("mousemove", e => {
    if (mouseLocked && gameState === "playing") {
      player.angle += e.movementX * CFG.MOUSE_SENS;
    }
  });

  /* =========================================================
     COLLISION
  ========================================================= */

  function canMove(x, y) {
    const m = 0.2;
    const corners = [[x-m,y-m],[x+m,y-m],[x-m,y+m],[x+m,y+m]];
    for (const [cx, cy] of corners) {
      const ix = Math.floor(cx), iy = Math.floor(cy);
      if (ix < 0 || ix >= CFG.GRID || iy < 0 || iy >= CFG.GRID) return false;
      if (map[iy][ix] === 1) return false;
    }
    return true;
  }

  /* =========================================================
     PLAYER UPDATE
  ========================================================= */

  function updatePlayer() {
    let dx = 0, dy = 0;

    if (keys["w"] || keys["arrowup"]) {
      dx += Math.cos(player.angle) * CFG.MOVE;
      dy += Math.sin(player.angle) * CFG.MOVE;
    }
    if (keys["s"] || keys["arrowdown"]) {
      dx -= Math.cos(player.angle) * CFG.MOVE;
      dy -= Math.sin(player.angle) * CFG.MOVE;
    }
    if (keys["a"] || keys["arrowleft"])  player.angle -= CFG.ROT;
    if (keys["d"] || keys["arrowright"]) player.angle += CFG.ROT;

    if (keys["q"]) {
      dx += Math.cos(player.angle - Math.PI / 2) * CFG.MOVE;
      dy += Math.sin(player.angle - Math.PI / 2) * CFG.MOVE;
    }
    if (keys["e"]) {
      dx += Math.cos(player.angle + Math.PI / 2) * CFG.MOVE;
      dy += Math.sin(player.angle + Math.PI / 2) * CFG.MOVE;
    }

    if (canMove(player.x + dx, player.y + dy)) {
      player.x += dx; player.y += dy;
    } else if (canMove(player.x + dx, player.y)) {
      player.x += dx;
    } else if (canMove(player.x, player.y + dy)) {
      player.y += dy;
    }

    tele.cellsVisited.add(Math.floor(player.x) + "," + Math.floor(player.y));
  }

  /* =========================================================
     MONSTER AI — learns from player behavior
  ========================================================= */

  function updateMonster() {
    const dx = player.x - monster.x;
    const dy = player.y - monster.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const sees = hasLineOfSight(monster.x, monster.y, player.x, player.y);
    if (sees) {
      monster.awareness = Math.min(1, monster.awareness + 0.025);
      monster.lastSeenX = player.x;
      monster.lastSeenY = player.y;
    } else {
      monster.awareness = Math.max(0, monster.awareness - 0.008);
    }

    if (monster.awareness > 0.6) {
      if (monster.fearWeight > 0.5) {
        monster.state = "flank";
      } else if (monster.aggroWeight > 0.5) {
        monster.state = "ambush";
      } else {
        monster.state = "chase";
      }
    } else if (monster.awareness > 0.25) {
      monster.state = "investigate";
    } else {
      monster.state = "patrol";
    }

    const eff = monster.speed * monster.difficultyMod;
    let mx = 0, my = 0;

    switch (monster.state) {
      case "chase":
        if (dist > 0.4) { mx = (dx/dist)*eff; my = (dy/dist)*eff; }
        break;

      case "flank": {
        const perpA = Math.atan2(dy, dx) + Math.PI * 0.4;
        mx = (Math.cos(Math.atan2(dy,dx))*0.5 + Math.cos(perpA)*0.5) * eff;
        my = (Math.sin(Math.atan2(dy,dx))*0.5 + Math.sin(perpA)*0.5) * eff;
        break;
      }

      case "ambush":
        if (dist < 5) { mx = -(dx/dist)*eff*0.4; my = -(dy/dist)*eff*0.4; }
        else monster.state = "patrol";
        break;

      case "investigate": {
        const ldx = monster.lastSeenX - monster.x;
        const ldy = monster.lastSeenY - monster.y;
        const ld = Math.sqrt(ldx*ldx + ldy*ldy);
        if (ld > 0.5) { mx = (ldx/ld)*eff*0.6; my = (ldy/ld)*eff*0.6; }
        else monster.state = "patrol";
        break;
      }

      case "patrol":
      default:
        monster.patrolAngle += 0.015;
        mx = Math.cos(monster.patrolAngle) * eff * 0.35;
        my = Math.sin(monster.patrolAngle) * eff * 0.35;
        break;
    }

    if (canMove(monster.x + mx, monster.y + my)) {
      monster.x += mx; monster.y += my;
    } else if (canMove(monster.x + mx, monster.y)) {
      monster.x += mx;
    } else if (canMove(monster.x, monster.y + my)) {
      monster.y += my;
    } else {
      monster.patrolAngle += Math.PI / 3;
    }

    if (dist < 0.5) {
      gameState = "dead";
      sendFinalTelemetry("killed");
    }
  }

  function hasLineOfSight(x1, y1, x2, y2) {
    const dx = x2-x1, dy = y2-y1;
    const steps = Math.ceil(Math.sqrt(dx*dx + dy*dy) * 5);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const ix = Math.floor(x1 + dx*t);
      const iy = Math.floor(y1 + dy*t);
      if (ix < 0 || ix >= CFG.GRID || iy < 0 || iy >= CFG.GRID) return false;
      if (map[iy][ix] === 1) return false;
    }
    return true;
  }

  /* =========================================================
     TELEMETRY + AI LEARNING
  ========================================================= */

  function updateBehaviorMetrics() {
    tele.totalFrames++;
    const dx = monster.x - player.x;
    const dy = monster.y - player.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const dot = dx * Math.cos(player.angle) + dy * Math.sin(player.angle);

    if (dist < 6 && dot < 0) tele.ranFromMonster++;
    if (dist < 8 && dot > 0) tele.movedToward++;
  }

  function computeTelemetry() {
    const t = Math.max(1, tele.totalFrames);
    return {
      fear_level:  Math.min(1, tele.ranFromMonster / t * 25),
      aggression:  Math.min(1, tele.movedToward / t * 25),
      curiosity:   Math.min(1, tele.cellsVisited.size / (CFG.GRID * 2)),
    };
  }

  let lastTelemetrySentAt = 0;
  const TELEMETRY_MIN_INTERVAL_MS = 5000;

  async function sendTelemetry() {
    const now = performance.now();

    if (
      now - lastTelemetrySentAt <
      TELEMETRY_MIN_INTERVAL_MS
    ) {
      return;
    }

    lastTelemetrySentAt = now;

    const v = computeTelemetry();
    localAdapt(v);
    try {
      const res = await fetch(CFG.API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fear_level:          v.fear_level,
          aggression:          v.aggression,
          curiosity:           v.curiosity,
          survival_time:       survivalTime,
          difficulty_modifier: monster.difficultyMod,
          outcome:             gameState === "playing" ? "ongoing" : gameState,
          session_id:          sessionId,
          display_name:        displayName,
          device_type:         detectDeviceType(),
          floor_reached:       floorReached,
          maze_size:           CFG.GRID,
          oracle_mutations:    oracleMutationCount,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.difficulty_modifier) monster.difficultyMod = data.difficulty_modifier;
      }
    } catch (e) {
      // Offline — local adaptation only
    }
  }

  async function sendFinalTelemetry(outcome) {
    const v = computeTelemetry();
    try {
      await fetch(CFG.API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fear_level: v.fear_level, aggression: v.aggression, curiosity: v.curiosity,
          survival_time: survivalTime, difficulty_modifier: monster.difficultyMod,
          outcome,
          session_id: sessionId,
          display_name: displayName,
          device_type: detectDeviceType(),
          floor_reached: floorReached,
          maze_size: CFG.GRID,
          oracle_mutations: oracleMutationCount,
        }),
      });
    } catch (e) { /* silent */ }
  }

  function localAdapt(v) {
    const lr = 0.12;
    monster.fearWeight      = monster.fearWeight * (1-lr)      + v.fear_level * lr;
    monster.aggroWeight     = monster.aggroWeight * (1-lr)     + v.aggression * lr;
    monster.curiosityWeight = monster.curiosityWeight * (1-lr) + v.curiosity * lr;
    monster.difficultyMod   = Math.min(2.5, 1.0 + survivalTime / 90 + (floorReached - 1) * 0.25);
  }

  /* =========================================================
     RENDER — RAYCASTING ENGINE
  ========================================================= */

  function render() {
    const W = canvas.width;
    const H = canvas.height;
    if (W === 0 || H === 0) return;

    ctx.fillStyle = "#02020a";
    ctx.fillRect(0, 0, W, H);

    zBuffer = new Array(W);

    // Ceiling
    const ceilG = ctx.createLinearGradient(0, 0, 0, H / 2);
    ceilG.addColorStop(0, "#030014");
    ceilG.addColorStop(0.6, "#09001f");
    ceilG.addColorStop(1, "#16002e");
    ctx.fillStyle = ceilG;
    ctx.fillRect(0, 0, W, H / 2);

    // Floor
    const flrG = ctx.createLinearGradient(0, H / 2, 0, H);
    flrG.addColorStop(0, "#18002f");
    flrG.addColorStop(0.4, "#0b001a");
    flrG.addColorStop(1, "#020008");
    ctx.fillStyle = flrG;
    ctx.fillRect(0, H / 2, W, H / 2);

    // Camera
    const dirX  = Math.cos(player.angle);
    const dirY  = Math.sin(player.angle);
    const pMag  = Math.tan(CFG.FOV / 2);
    const plnX  = -dirY * pMag;
    const plnY  =  dirX * pMag;

    // Raycast
    for (let x = 0; x < W; x++) {
      const camX  = 2 * x / W - 1;
      const rdX   = dirX + plnX * camX;
      const rdY   = dirY + plnY * camX;

      let mapX = Math.floor(player.x);
      let mapY = Math.floor(player.y);

      const ddX = Math.abs(1 / (rdX || 1e-10));
      const ddY = Math.abs(1 / (rdY || 1e-10));

      let stepX, stepY, sdX, sdY;

      if (rdX < 0) { stepX = -1; sdX = (player.x - mapX) * ddX; }
      else         { stepX =  1; sdX = (mapX + 1 - player.x) * ddX; }

      if (rdY < 0) { stepY = -1; sdY = (player.y - mapY) * ddY; }
      else         { stepY =  1; sdY = (mapY + 1 - player.y) * ddY; }

      let side = 0, hit = false;

      for (let i = 0; i < 120 && !hit; i++) {
        if (sdX < sdY) { sdX += ddX; mapX += stepX; side = 0; }
        else           { sdY += ddY; mapY += stepY; side = 1; }

        if (mapX < 0 || mapX >= CFG.GRID || mapY < 0 || mapY >= CFG.GRID) { hit = true; }
        else if (map[mapY][mapX] === 1) { hit = true; }
      }

      let perpD;
      if (side === 0) perpD = (mapX - player.x + (1 - stepX) / 2) / (rdX || 1e-10);
      else            perpD = (mapY - player.y + (1 - stepY) / 2) / (rdY || 1e-10);

      perpD = Math.max(0.01, Math.abs(perpD));
      zBuffer[x] = perpD;

      const lh = (CFG.WALL_HEIGHT / perpD) * H;
      const ds = Math.max(0, Math.floor((H - lh) / 2));
      const de = Math.min(H, Math.floor((H + lh) / 2));

      let wallX;
      if (side === 0) wallX = player.y + perpD * rdY;
      else            wallX = player.x + perpD * rdX;
      wallX -= Math.floor(wallX);

      const sh = Math.min(1, 2.2 / (perpD + 0.3));
      let r, g, b;

      if (side === 0) {
        r = Math.floor(170 * sh);
        g = Math.floor(45 * sh);
        b = Math.floor(255 * sh);
      } else {
        r = Math.floor(95 * sh);
        g = Math.floor(20 * sh);
        b = Math.floor(190 * sh);
      }

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, ds, 1, de - ds);

      if (wallX < 0.03 || wallX > 0.97) {
        ctx.fillStyle = `rgba(0,255,255,${0.35 * sh})`;
        ctx.fillRect(x, ds, 1, de - ds);
      }
    }

    // Sprites
    renderGoalBeacon(W, H, dirX, dirY, plnX, plnY);
    renderMonsterSprite(W, H, dirX, dirY, plnX, plnY);

    // Torch flicker
    const flicker = 0.02 + Math.random() * 0.03;
    ctx.fillStyle = `rgba(180,0,255,${flicker})`;
    ctx.fillRect(0, 0, W, H);

    // Vignette
    const vig = ctx.createRadialGradient(W/2, H/2, H*0.25, W/2, H/2, H*0.85);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.65)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);


    // First-person candle / torch overlay
    renderCandleHand(W, H);

    // HUD
    renderHUD(W, H);

    // Overlays
    if (gameState === "dead")    renderDeathScreen(W, H);
    if (gameState === "escaped") renderEscapeScreen(W, H);
  }

  /* =========================================================
     GOAL BEACON
  ========================================================= */

  function renderGoalBeacon(W, H, dirX, dirY, plnX, plnY) {
    const sx = goalX + 0.5 - player.x;
    const sy = goalY + 0.5 - player.y;
    const inv = 1 / (plnX * dirY - dirX * plnY);
    const tx = inv * (dirY * sx - dirX * sy);
    const ty = inv * (-plnY * sx + plnX * sy);

    if (ty <= 0.2) return;

    const scrX = Math.floor((W / 2) * (1 + tx / ty));
    const col = Math.floor(scrX);
    if (col >= 0 && col < W && zBuffer[col] < ty) return;

    const h = Math.abs(Math.floor(H / ty));
    const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 250);
    const bw = Math.max(6, 50 / ty);

    const grad = ctx.createLinearGradient(scrX, H/2 - h/2, scrX, H/2 + h/2);
    grad.addColorStop(0, `rgba(220,255,120,${0.9 * pulse})`);
    grad.addColorStop(0.5, `rgba(57,255,20,${0.7 * pulse})`);
    grad.addColorStop(1, `rgba(0,180,120,${0.4 * pulse})`)
    ctx.fillStyle = grad;
    ctx.fillRect(scrX - bw/2, H/2 - h/2, bw, h);

    const gr = bw * 4;
    const gg = ctx.createRadialGradient(scrX, H/2, 0, scrX, H/2, gr);
    gg.addColorStop(0, `rgba(57,255,20,${0.15 * pulse})`);
    gg.addColorStop(1, "rgba(0,255,180,0)");
    ctx.fillStyle = gg;
    ctx.fillRect(scrX - gr, H/2 - gr, gr*2, gr*2);
  }

  /* =========================================================
     MONSTER SPRITE
  ========================================================= */

  function renderMonsterSprite(W, H, dirX, dirY, plnX, plnY) {
    const sx = monster.x - player.x;
    const sy = monster.y - player.y;
    const inv = 1 / (plnX * dirY - dirX * plnY);
    const tx = inv * (dirY * sx - dirX * sy);
    const ty = inv * (-plnY * sx + plnX * sy);

    if (ty <= 0.15) return;

    const scrX = Math.floor((W / 2) * (1 + tx / ty));
    const scale = Math.abs(Math.floor(H / ty));
    const pxSz = Math.max(1, Math.floor(scale / SPR_H));
    const totW = SPR_W * pxSz;
    const totH = SPR_H * pxSz;
    const stX  = Math.floor(scrX - totW / 2);
    const stY  = Math.floor(H / 2 - totH / 2);

    const pulse = 0.7 + 0.3 * Math.sin(performance.now() / 180);

    for (let row = 0; row < SPR_H; row++) {
      for (let col = 0; col < SPR_W; col++) {
        if (!SPRITE[row][col]) continue;

        const px = stX + col * pxSz;
        const py = stY + row * pxSz;
        const cc = Math.floor(px + pxSz / 2);

        if (cc < 0 || cc >= W) continue;
        if (zBuffer[cc] < ty) continue;

        const bri = Math.min(255, Math.floor((320 / (ty + 0.8)) * pulse));
        const r = Math.min(255, bri + 120);
        const g = Math.min(255, Math.floor(bri * 0.08) + 10);
        const b = Math.min(255, Math.floor(bri * 0.55) + 90);

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(px, py, pxSz, pxSz);
      }
    }

    const glR = totW * 0.9;
    const gg = ctx.createRadialGradient(scrX, stY + totH/2, 0, scrX, stY + totH/2, glR);
    gg.addColorStop(0, `rgba(255,0,140,${0.28 * pulse})`);
    gg.addColorStop(1, "rgba(120,0,255,0)");
    ctx.fillStyle = gg;
    ctx.fillRect(scrX - glR, stY + totH/2 - glR, glR*2, glR*2);
  }

  

  /* =========================================================
     FIRST PERSON POV
  ========================================================= */

  function renderCandleHand(W, H) {
    ctx.save();

    const t = performance.now() / 1000;

    const moving =
      keys["w"] || keys["s"] ||
      keys["arrowup"] || keys["arrowdown"] ||
      keys["q"] || keys["e"];

    const bob = moving ? Math.sin(t * 8) * 7 : Math.sin(t * 3) * 3;
    const sway = moving ? Math.sin(t * 4) * 5 : Math.sin(t * 2) * 2;
    const flicker = 0.78 + Math.random() * 0.22;

    const cx = W * 0.50 + sway;
    const cy = H * 0.78 + bob;

    /* Candle glow */
    const glow = ctx.createRadialGradient(
      cx,
      cy - H * 0.30,
      0,
      cx,
      cy - H * 0.30,
      H * 0.48
    );
    glow.addColorStop(0, `rgba(255,190,80,${0.30 * flicker})`);
    glow.addColorStop(0.28, `rgba(255,95,20,${0.16 * flicker})`);
    glow.addColorStop(0.62, `rgba(150,40,255,${0.08 * flicker})`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    /* Left sleeve */
    ctx.fillStyle = "#151936";
    ctx.beginPath();
    ctx.moveTo(cx - W * 0.23, H);
    ctx.lineTo(cx - W * 0.10, cy + H * 0.06);
    ctx.lineTo(cx - W * 0.03, cy + H * 0.16);
    ctx.lineTo(cx - W * 0.11, H);
    ctx.closePath();
    ctx.fill();

    /* Right sleeve */
    ctx.fillStyle = "#10152f";
    ctx.beginPath();
    ctx.moveTo(cx + W * 0.22, H);
    ctx.lineTo(cx + W * 0.10, cy + H * 0.05);
    ctx.lineTo(cx + W * 0.03, cy + H * 0.16);
    ctx.lineTo(cx + W * 0.11, H);
    ctx.closePath();
    ctx.fill();

    /* Left hand shape */
    ctx.fillStyle = "#b85f3a";
    ctx.beginPath();
    ctx.ellipse(cx - W * 0.055, cy + H * 0.02, W * 0.045, H * 0.035, -0.55, 0, Math.PI * 2);
    ctx.fill();

    /* Right hand shape */
    ctx.fillStyle = "#c96d43";
    ctx.beginPath();
    ctx.ellipse(cx + W * 0.055, cy + H * 0.02, W * 0.045, H * 0.035, 0.55, 0, Math.PI * 2);
    ctx.fill();

    /* Left fingers around candle */
    ctx.fillStyle = "#e28a58";
    ctx.beginPath();
    ctx.ellipse(cx - W * 0.030, cy - H * 0.005, W * 0.014, H * 0.040, -0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(cx - W * 0.006, cy + H * 0.002, W * 0.012, H * 0.036, -0.10, 0, Math.PI * 2);
    ctx.fill();

    /* Right fingers around candle */
    ctx.fillStyle = "#f09a62";
    ctx.beginPath();
    ctx.ellipse(cx + W * 0.026, cy - H * 0.002, W * 0.014, H * 0.040, 0.24, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(cx + W * 0.002, cy + H * 0.005, W * 0.012, H * 0.036, 0.08, 0, Math.PI * 2);
    ctx.fill();

    /* Raised finger silhouette */
    ctx.fillStyle = "#e98955";
    ctx.beginPath();
    ctx.ellipse(cx - W * 0.080, cy - H * 0.105, W * 0.012, H * 0.070, -0.18, 0, Math.PI * 2);
    ctx.fill();

    /* Candle body */
    const candleW = W * 0.035;
    const candleH = H * 0.22;
    const candleX = cx - candleW / 2;
    const candleY = cy - H * 0.18;

    ctx.fillStyle = "#fff2d0";
    ctx.fillRect(candleX, candleY, candleW, candleH);

    /* Candle side shadow */
    ctx.fillStyle = "#e0b77d";
    ctx.fillRect(candleX + candleW * 0.68, candleY, candleW * 0.32, candleH);

    /* Melted wax detail */
    ctx.fillStyle = "#ffdca3";
    ctx.beginPath();
    ctx.moveTo(candleX, candleY + H * 0.035);
    ctx.quadraticCurveTo(candleX + candleW * 0.28, candleY + H * 0.065, candleX + candleW * 0.48, candleY + H * 0.028);
    ctx.quadraticCurveTo(candleX + candleW * 0.68, candleY + H * 0.000, candleX + candleW, candleY + H * 0.030);
    ctx.lineTo(candleX + candleW, candleY);
    ctx.lineTo(candleX, candleY);
    ctx.closePath();
    ctx.fill();

    /* Wick */
    ctx.strokeStyle = "#1a0b05";
    ctx.lineWidth = Math.max(1, W * 0.003);
    ctx.beginPath();
    ctx.moveTo(cx, candleY);
    ctx.lineTo(cx + W * 0.005, candleY - H * 0.030);
    ctx.stroke();

    /* Flame outer */
    const flameX = cx + W * 0.006;
    const flameY = candleY - H * 0.050;

    ctx.fillStyle = `rgba(255,82,18,${0.96 * flicker})`;
    ctx.beginPath();
    ctx.moveTo(flameX, flameY - H * 0.075);
    ctx.bezierCurveTo(
      flameX - W * 0.040, flameY - H * 0.020,
      flameX - W * 0.025, flameY + H * 0.035,
      flameX,
      flameY + H * 0.030
    );
    ctx.bezierCurveTo(
      flameX + W * 0.040, flameY + H * 0.010,
      flameX + W * 0.030, flameY - H * 0.045,
      flameX,
      flameY - H * 0.075
    );
    ctx.fill();

    /* Flame inner */
    ctx.fillStyle = `rgba(255,220,80,${0.95 * flicker})`;
    ctx.beginPath();
    ctx.moveTo(flameX + W * 0.002, flameY - H * 0.045);
    ctx.bezierCurveTo(
      flameX - W * 0.018, flameY - H * 0.005,
      flameX - W * 0.010, flameY + H * 0.025,
      flameX + W * 0.004,
      flameY + H * 0.018
    );
    ctx.bezierCurveTo(
      flameX + W * 0.022, flameY + H * 0.000,
      flameX + W * 0.018, flameY - H * 0.030,
      flameX + W * 0.002,
      flameY - H * 0.045
    );
    ctx.fill();

    /* Flame core */
    ctx.fillStyle = `rgba(255,255,220,${0.75 * flicker})`;
    ctx.beginPath();
    ctx.ellipse(flameX + W * 0.002, flameY + H * 0.003, W * 0.006, H * 0.020, 0, 0, Math.PI * 2);
    ctx.fill();

    /* Small sparks */
    ctx.fillStyle = `rgba(255,210,90,${0.55 * flicker})`;
    ctx.fillRect(flameX - W * 0.050, flameY - H * 0.075, 2, 2);
    ctx.fillRect(flameX + W * 0.045, flameY - H * 0.050, 2, 2);
    ctx.fillRect(flameX + W * 0.020, flameY - H * 0.095, 2, 2);

    ctx.restore();
  }

  /* =========================================================
     HUD
  ========================================================= */

  function renderHUD(W, H) {
    ctx.save();
    const fs = Math.max(12, Math.floor(H * 0.032));
    ctx.font = `${fs}px "Courier New", monospace`;
    ctx.textBaseline = "top";
    ctx.shadowColor = "#00eaff";
    ctx.shadowBlur = 6;

    const p = 10;

    ctx.fillStyle = "#00eaff";
    ctx.textAlign = "left";
    ctx.fillText(`XPONOE: ${survivalTime.toFixed(1)}`, p, p);
    ctx.fillText(`SCORE: ${score}`, p, p + fs * 1.4);

    const gDist = Math.sqrt((goalX+0.5-player.x)**2 + (goalY+0.5-player.y)**2).toFixed(1);
    ctx.fillText(`EXIT: ${gDist}m`, p, p + fs * 2.8);

    ctx.textAlign = "right";
    ctx.fillStyle = "#b26cff";
    ctx.fillText(`RING ${floorReached} | x${monster.difficultyMod.toFixed(1)}`, W - p, p);

    const stateNames = {
      patrol: "PATROLLING", chase: "HUNTING", flank: "FLANKING",
      ambush: "AMBUSH", investigate: "INVESTIGATING"
    };
    ctx.fillStyle = "#7a3cff";
    ctx.fillText(stateNames[monster.state] || monster.state, W - p, p + fs * 1.4);

    const mDist = Math.sqrt((monster.x-player.x)**2 + (monster.y-player.y)**2);
    if (mDist < 6) {
      const wp = 0.5 + 0.5 * Math.sin(performance.now() / 120);
      ctx.textAlign = "center";
      if (mDist < 3) {
        ctx.fillStyle = `rgba(255,0,120,${wp})`;
        ctx.font = `bold ${fs * 1.3}px "Courier New", monospace`;
        ctx.fillText("!! DEATH !!", W / 2, p);
      } else {
        ctx.fillStyle = `rgba(0,234,255,${wp * 0.6})`;
        ctx.fillText("~ Presence felt...", W / 2, p);
      }
    }

    renderMinimap(W, H);
    ctx.restore();
  }

  /* =========================================================
     MINIMAP
  ========================================================= */

function renderMinimap(W, H) {
  const coarsePointer =
    window.matchMedia("(pointer: coarse)").matches;

  const panelSize = Math.floor(
    Math.min(W, H) *
    (coarsePointer ? 0.28 : 0.24)
  );

  const margin = coarsePointer ? 14 : 18;
  const panelX = W - panelSize - margin;
  const panelY = H - panelSize - margin;

  const radius = coarsePointer ? 4 : 6;

  const tileWidth =
    panelSize / (radius * 2 + 3);

  const tileHeight = tileWidth * 0.5;
  const wallHeight = tileHeight * 1.45;

  const playerCellX = Math.floor(player.x);
  const playerCellY = Math.floor(player.y);

  const centerX =
    panelX + panelSize * 0.5;

  const centerY =
    panelY + panelSize * 0.56;

  function project(
    gridX,
    gridY,
    elevation = 0
  ) {
    const relativeX =
      gridX - playerCellX;

    const relativeY =
      gridY - playerCellY;

    return {
      x:
        centerX +
        (relativeX - relativeY) *
          tileWidth *
          0.5,

      y:
        centerY +
        (relativeX + relativeY) *
          tileHeight *
          0.5 -
        elevation,
    };
  }

  function drawDiamond(
    center,
    fillStyle,
    strokeStyle
  ) {
    ctx.beginPath();

    ctx.moveTo(
      center.x,
      center.y - tileHeight * 0.5
    );

    ctx.lineTo(
      center.x + tileWidth * 0.5,
      center.y
    );

    ctx.lineTo(
      center.x,
      center.y + tileHeight * 0.5
    );

    ctx.lineTo(
      center.x - tileWidth * 0.5,
      center.y
    );

    ctx.closePath();

    ctx.fillStyle = fillStyle;
    ctx.fill();

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawWall(gridX, gridY) {
    const base = project(gridX, gridY);

    const top = project(
      gridX,
      gridY,
      wallHeight
    );

    ctx.beginPath();

    ctx.moveTo(
      top.x - tileWidth * 0.5,
      top.y
    );

    ctx.lineTo(
      top.x,
      top.y + tileHeight * 0.5
    );

    ctx.lineTo(
      base.x,
      base.y + tileHeight * 0.5
    );

    ctx.lineTo(
      base.x - tileWidth * 0.5,
      base.y
    );

    ctx.closePath();

    ctx.fillStyle =
      "rgba(0, 96, 118, 0.84)";

    ctx.fill();

    ctx.beginPath();

    ctx.moveTo(
      top.x,
      top.y + tileHeight * 0.5
    );

    ctx.lineTo(
      top.x + tileWidth * 0.5,
      top.y
    );

    ctx.lineTo(
      base.x + tileWidth * 0.5,
      base.y
    );

    ctx.lineTo(
      base.x,
      base.y + tileHeight * 0.5
    );

    ctx.closePath();

    ctx.fillStyle =
      "rgba(0, 52, 74, 0.90)";

    ctx.fill();

    drawDiamond(
      top,
      "rgba(0, 220, 255, 0.92)",
      "rgba(160, 250, 255, 0.96)"
    );
  }

  ctx.save();

  ctx.fillStyle =
    "rgba(2, 8, 18, 0.86)";

  ctx.strokeStyle =
    "rgba(0, 234, 255, 0.78)";

  ctx.lineWidth = 1.5;

  ctx.fillRect(
    panelX,
    panelY,
    panelSize,
    panelSize
  );

  ctx.strokeRect(
    panelX,
    panelY,
    panelSize,
    panelSize
  );

  ctx.save();
  ctx.beginPath();

  ctx.rect(
    panelX + 2,
    panelY + 2,
    panelSize - 4,
    panelSize - 4
  );

  ctx.clip();

  for (
    let diagonal = -radius * 2;
    diagonal <= radius * 2;
    diagonal += 1
  ) {
    for (
      let relativeY = -radius;
      relativeY <= radius;
      relativeY += 1
    ) {
      const relativeX =
        diagonal - relativeY;

      if (
        Math.abs(relativeX) > radius ||
        Math.abs(relativeY) > radius
      ) {
        continue;
      }

      const mapX =
        playerCellX + relativeX;

      const mapY =
        playerCellY + relativeY;

      const insideMap =
        mapX >= 0 &&
        mapX < CFG.GRID &&
        mapY >= 0 &&
        mapY < CFG.GRID;

      if (!insideMap) {
        continue;
      }

      if (map[mapY][mapX] === 1) {
        drawWall(mapX, mapY);
      } else {
        drawDiamond(
          project(mapX, mapY),
          "rgba(8, 40, 52, 0.74)",
          "rgba(0, 124, 154, 0.50)"
        );
      }
    }
  }

  const playerCenter = project(
    playerCellX,
    playerCellY,
    wallHeight * 0.35
  );

  const markerSize = Math.max(
    5,
    tileWidth * 0.26
  );

  ctx.save();

  ctx.translate(
    playerCenter.x,
    playerCenter.y
  );

  ctx.rotate(
    player.angle + Math.PI / 4
  );

ctx.fillStyle = "#ffe066";
ctx.strokeStyle = "#ffffff";
ctx.lineWidth = 2;
ctx.shadowColor = "#00eaff";
ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.moveTo(markerSize, 0);

  ctx.lineTo(
    -markerSize * 0.7,
    markerSize * 0.55
  );

  ctx.lineTo(
    -markerSize * 0.35,
    0
  );

  ctx.lineTo(
    -markerSize * 0.7,
    -markerSize * 0.55
  );

ctx.closePath();
ctx.fill();
ctx.stroke();

ctx.restore();

ctx.save();

ctx.fillStyle = "#ffe066";
ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
ctx.lineWidth = 3;

ctx.font =
  `bold ${Math.max(
    9,
    Math.floor(panelSize * 0.05)
  )}px "Courier New", monospace`;

ctx.textAlign = "center";
ctx.textBaseline = "bottom";

const playerLabelY =
  playerCenter.y -
  markerSize -
  6;

ctx.strokeText(
  "YOU",
  playerCenter.x,
  playerLabelY
);

ctx.fillText(
  "YOU",
  playerCenter.x,
  playerLabelY
);

ctx.restore();
ctx.restore();

  ctx.fillStyle = "#00eaff";

  ctx.font =
    `${Math.max(
      9,
      Math.floor(panelSize * 0.055)
    )}px "Courier New", monospace`;

  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  ctx.fillText(
    "ORACLE NAV",
    panelX + 8,
    panelY + 7
  );

  ctx.restore();
}

  /* =========================================================
     OVERLAY SCREENS
  ========================================================= */

  function renderDeathScreen(W, H) {
    ctx.fillStyle = "rgba(30,0,50,0.78)";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#ff008c";
    ctx.shadowBlur = 25;

    ctx.font = `bold ${Math.floor(H*0.09)}px "Courier New", monospace`;
    ctx.fillStyle = "#ff008c";
    ctx.fillText("DEATH", W/2, H*0.33);

    ctx.shadowBlur = 8;
    ctx.font = `${Math.floor(H*0.035)}px "Courier New", monospace`;
    ctx.fillStyle = "#b26cff";
    ctx.fillText("The labyrinth claims another soul", W/2, H*0.48);
    ctx.fillText(`Survived: ${survivalTime.toFixed(1)}s  |  Score: ${score}`, W/2, H*0.55);

    const bk = 0.5 + 0.5 * Math.sin(performance.now() / 400);
    ctx.fillStyle = `rgba(0,234,255,${bk})`;
    ctx.fillText("Press ENTER to descend again", W/2, H*0.68);
    ctx.restore();
  }

  function renderEscapeScreen(W, H) {
    ctx.fillStyle = "rgba(0,35,28,0.78)";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#39ff14";
    ctx.shadowBlur = 25;

    ctx.font = `bold ${Math.floor(H*0.09)}px "Courier New", monospace`;
    ctx.fillStyle = "#39ff14";
    ctx.fillText("FREEDOM", W/2, H*0.33);

    ctx.shadowBlur = 8;
    ctx.font = `${Math.floor(H*0.035)}px "Courier New", monospace`;
    ctx.fillStyle = "#00eaff";
    ctx.fillText("You have escaped Tartarus", W/2, H*0.48);
    ctx.fillText(`Time: ${survivalTime.toFixed(1)}s  |  Score: ${score}`, W/2, H*0.55);

    const bk = 0.5 + 0.5 * Math.sin(performance.now() / 400);
    ctx.fillStyle = `rgba(255,200,50,${bk})`;
    ctx.fillText("Press ENTER to descend deeper", W/2, H*0.68);
    ctx.restore();
  }

  /* =========================================================
     CANVAS RESIZE
  ========================================================= */

  function resizeCanvas() {
    const wrapper = canvas.parentElement;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(w * 3 / 4);
    if (w > 0 && h > 0) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  /* =========================================================
     GAME LOOP
  ========================================================= */

  function loop(timestamp) {
    animFrameId = requestAnimationFrame(loop);

    if (gameState !== "playing") {
      render();
      return;
    }

    lastTime = timestamp;
    survivalTime = (performance.now() - startTime) / 1000;
    score = Math.floor(survivalTime * 10 * monster.difficultyMod);

    updatePlayer();
    updateBehaviorMetrics();
    updateMonster();

    const gd = Math.sqrt((goalX+0.5-player.x)**2 + (goalY+0.5-player.y)**2);
    if (gd < 1.0) {
      gameState = "escaped";
      sendFinalTelemetry("escaped");
    }

    if (performance.now() - lastTelemetryTime > CFG.TELEMETRY_MS) {
      lastTelemetryTime = performance.now();
      sendTelemetry();
    }

    render();
  }

  /* =========================================================
     START / RESTART
  ========================================================= */

  function startGame() {
    if (animFrameId) cancelAnimationFrame(animFrameId);

    const continuingRun = gameState === "escaped";

    if (continuingRun) {
      floorReached++;
    } else {
      sessionId =
        Date.now().toString(36) +
        Math.random().toString(36).slice(2);

      oracleMutationCount = 0;
      floorReached = 1;
      monster.difficultyMod = 1.0;
      monster.fearWeight = 0;
      monster.aggroWeight = 0;
      monster.curiosityWeight = 0;
    }

    bootScreen.classList.add("hidden");
    gameContainer.style.display = "flex";
    gameContainer.style.flexDirection = "column";
    gameContainer.style.alignItems = "center";

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    generateMaze();

    tele.cellsVisited = new Set();
    tele.ranFromMonster = 0;
    tele.movedToward = 0;
    tele.totalFrames = 0;

    monster.awareness = 0;
    monster.state = "patrol";
    monster.patrolAngle = Math.random() * Math.PI * 2;
    monster.speed = CFG.MONSTER_SPEED;



gameState = "playing";
startTime = performance.now();
lastTime = performance.now();
lastTelemetryTime = performance.now();
survivalTime = 0;
score = 0;

if (ambientAudio) {
  ambientAudio.volume = 0.35;
}

playAudio();

animFrameId = requestAnimationFrame(loop);

  }

/* =========================================================
   AUDIO
========================================================= */

function initAudio() {
    if (ambientAudio) return;

    ambientAudio = new Audio("/static/assets/audio/ambient.mp3");
    ambientAudio.loop = true;
    ambientAudio.volume = 0.35;
}

function playAudio() {
    if (!audioEnabled) return;

    initAudio();

    if (ambientAudio) {
      ambientAudio.play().catch(() => {
        // Browser may block autoplay until player interaction.
      });
    }
}

function playBootAudio() {
    if (!audioEnabled || bootAudioStarted) return;

    initAudio();

    if (ambientAudio) {
      ambientAudio.volume = 0.22;
      ambientAudio.play().then(() => {
        bootAudioStarted = true;
      }).catch(() => {
        // Browser may block audio until first user interaction.
      });
    }
}

function stopAudio() {
    if (ambientAudio) {
      ambientAudio.pause();
    }
}
  /* =========================================================
     SLIDER BINDINGS
  ========================================================= */

  const bs = document.getElementById("brightnessSlider");
  const gs = document.getElementById("gammaSlider");
  if (bs) bs.addEventListener("input", function () {
    document.documentElement.style.setProperty("--brightness", this.value);
  });
  if (gs) gs.addEventListener("input", function () {
    document.documentElement.style.setProperty("--gamma", this.value);
  });


/* =========================================================
   AUDIO TOGGLE BINDING
========================================================= */

if (audioToggle) {
  audioToggle.addEventListener("click", function () {
    audioEnabled = !audioEnabled;
    audioToggle.textContent = audioEnabled ? "ON" : "OFF";

    if (audioEnabled) {
      playAudio();
    } else {
      stopAudio();
    }
  });
}

})();

