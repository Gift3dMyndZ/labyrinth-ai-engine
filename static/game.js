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
    API:            "/api/telemetry",
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
  const skyCanvas     = document.getElementById("sky-canvas");
  const skyCtx        = skyCanvas.getContext("2d");
  const touchOverlay  = document.getElementById("touch-overlay");
  const moveStick     = document.getElementById("move-stick");
  const lookStick     = document.getElementById("look-stick");
  const attackBtn     = document.getElementById("attack-btn");
  const interactBtn   = document.getElementById("interact-btn");

  /* =========================================================
     TOUCH DEVICE DETECTION
  ========================================================= */

  isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouchDevice) {
    touchOverlay.style.display = 'block';
    initTouchControls();
  }

  /* =========================================================
     AUDIO INITIALIZATION
  ========================================================= */

  function initAudio() {
    // Placeholder for background music
    // bgMusic = new Audio("/assets/audio/infernal_ambient.mp3");
    // bgMusic.loop = true;
    // bgMusic.volume = 0.4;

    // For now, we'll skip actual audio to avoid copyright issues
    // User interaction will be required to play audio on mobile
  }

  /* =========================================================
     SKY SHADOWS INITIALIZATION
  ========================================================= */

  function initSkyShadows() {
    skyShadows = [];
    // Create some initial shadows
    for (let i = 0; i < 5; i++) {
      skyShadows.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.3, // Top third of screen
        size: 20 + Math.random() * 40,
        speed: 0.5 + Math.random() * 1.5,
        alpha: 0.1 + Math.random() * 0.2
      });
    }
  }

  initAudio();
  initSkyShadows();

  /* =========================================================
     CANVAS FOCUS & GLOBAL INPUT HANDLERS
  ========================================================= */

  // Make canvas focusable and focused for keyboard events
  canvas.focus();

  // Global keyboard listener (bypasses focus issues)
  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    
    if (e.key === "Enter" || e.key === " ") {
      console.log("[INPUT] ENTER/SPACE detected, gameState:", gameState);
      inputState.start = true;
    }
    if (key === "arrowup" || key === "w") inputState.up = true;
    if (key === "arrowdown" || key === "s") inputState.down = true;
    if (key === "arrowleft" || key === "a") inputState.left = true;
    if (key === "arrowright" || key === "d") inputState.right = true;
  });

  window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    
    if (key === "arrowup" || key === "w") inputState.up = false;
    if (key === "arrowdown" || key === "s") inputState.down = false;
    if (key === "arrowleft" || key === "a") inputState.left = false;
    if (key === "arrowright" || key === "d") inputState.right = false;
  });

  /* =========================================================
     GAME STATE
  ========================================================= */

  let map       = [];
  let player    = { x: 0, y: 0, angle: 0 };
  let goalX     = 0, goalY = 0;
  let keys      = {};
  let touchInput = { moveX: 0, moveY: 0, lookX: 0, lookY: 0, attack: false, interact: false };
  let isTouchDevice = false;
  let gameState = "boot";
  let startTime = 0;
  let survivalTime  = 0;
  let score         = 0;
  let floorReached  = 1;
  let zBuffer       = [];
  let animFrameId   = null;
  let lastTime      = 0;
  let sessionId     = Date.now().toString(36) + Math.random().toString(36).slice(2);

  /* =========================================================
     INPUT STATE (GLOBAL - checked by game loop)
  ========================================================= */

  const inputState = {
    start: false,    // ENTER or click to start
    up: false,
    down: false,
    left: false,
    right: false,
  };

  /* =========================================================
     AUDIO & SKY STATE
  ========================================================= */

  let bgMusic = null;
  let skyShadows = [];
  let lastSkyUpdate = 0;

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

  const startButton = document.getElementById("startButton");

  // Boot screen input handler - consumes inputState
  if (startButton) {
    startButton.addEventListener("click", e => {
      e.stopPropagation();
      console.log("[UI] Start button clicked");
      if (gameState === "boot" || gameState === "dead" || gameState === "escaped") {
        startGame();
      }
    });
  }

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
     TOUCH CONTROLS
  ========================================================= */

  function initTouchControls() {
    // Virtual joysticks
    setupVirtualJoystick(moveStick, (dx, dy) => {
      touchInput.moveX = dx * CFG.MOVE;
      touchInput.moveY = dy * CFG.MOVE;
    });

    setupVirtualJoystick(lookStick, (dx, dy) => {
      touchInput.lookX = dx;
      touchInput.lookY = dy;
    });

    // Action buttons
    attackBtn.addEventListener("touchstart", () => {
      touchInput.attack = true;
    });
    attackBtn.addEventListener("touchend", () => {
      touchInput.attack = false;
    });

    interactBtn.addEventListener("touchstart", () => {
      touchInput.interact = true;
    });
    interactBtn.addEventListener("touchend", () => {
      touchInput.interact = false;
    });
  }

  function setupVirtualJoystick(joystick, onMove) {
    const stick = joystick.querySelector('.stick');
    let isDragging = false;
    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;

    function handleStart(e) {
      e.preventDefault();
      isDragging = true;
      const rect = joystick.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
      stick.classList.add('active');
    }

    function handleMove(e) {
      if (!isDragging) return;
      e.preventDefault();

      const touch = e.touches[0];
      currentX = touch.clientX;
      currentY = touch.clientY;

      const deltaX = (currentX - startX) / (joystick.offsetWidth / 2);
      const deltaY = (currentY - startY) / (joystick.offsetHeight / 2);

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const clampedDistance = Math.min(distance, 1);

      const normalizedX = distance > 0 ? (deltaX / distance) * clampedDistance : 0;
      const normalizedY = distance > 0 ? (deltaY / distance) * clampedDistance : 0;

      // Update stick position
      const stickX = normalizedX * 30;
      const stickY = normalizedY * 30;
      stick.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;

      onMove(normalizedX, normalizedY);
    }

    function handleEnd(e) {
      if (!isDragging) return;
      e.preventDefault();
      isDragging = false;
      stick.classList.remove('active');
      stick.style.transform = 'translate(-50%, -50%)';
      onMove(0, 0);
    }

    joystick.addEventListener('touchstart', handleStart);
    joystick.addEventListener('touchmove', handleMove);
    joystick.addEventListener('touchend', handleEnd);
    joystick.addEventListener('touchcancel', handleEnd);
  }

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

    // Touch input (normalized to same scale as keyboard)
    dx += touchInput.moveX;
    dy += touchInput.moveY;
    player.angle += touchInput.lookX * CFG.MOUSE_SENS * 2; // Scale for sensitivity

    // Keyboard input
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

    // Touch action buttons (map to keyboard equivalents for now)
    if (touchInput.attack) {
      // Placeholder for attack action
      keys[" "] = true; // Space for attack
    } else {
      keys[" "] = false;
    }

    if (touchInput.interact) {
      // Placeholder for interact action
      keys["f"] = true; // F for interact
    } else {
      keys["f"] = false;
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

      // Notify Oracle of player death
      if (window.oracleClient) {
        window.oracleClient.sendGameState("dead", floorReached, survivalTime);
      }
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

  async function sendTelemetry() {
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
          floor_reached:       floorReached,
          maze_size:           CFG.GRID,
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
          outcome, session_id: sessionId, floor_reached: floorReached, maze_size: CFG.GRID,
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

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    zBuffer = new Array(W);

    // Ceiling
    const ceilG = ctx.createLinearGradient(0, 0, 0, H / 2);
    ceilG.addColorStop(0, "#050000");
    ceilG.addColorStop(0.6, "#120300");
    ceilG.addColorStop(1, "#1f0700");
    ctx.fillStyle = ceilG;
    ctx.fillRect(0, 0, W, H / 2);

    // Floor
    const flrG = ctx.createLinearGradient(0, H / 2, 0, H);
    flrG.addColorStop(0, "#1f0700");
    flrG.addColorStop(0.4, "#150400");
    flrG.addColorStop(1, "#080100");
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
        r = Math.floor(190 * sh);
        g = Math.floor(75 * sh);
        b = Math.floor(18 * sh);
      } else {
        r = Math.floor(140 * sh);
        g = Math.floor(50 * sh);
        b = Math.floor(12 * sh);
      }

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, ds, 1, de - ds);

      if (wallX < 0.03 || wallX > 0.97) {
        ctx.fillStyle = `rgba(60,20,5,${0.6 * sh})`;
        ctx.fillRect(x, ds, 1, de - ds);
      }
    }

    // Sprites
    renderGoalBeacon(W, H, dirX, dirY, plnX, plnY);
    renderMonsterSprite(W, H, dirX, dirY, plnX, plnY);

    // Torch flicker
    const flicker = 0.02 + Math.random() * 0.03;
    ctx.fillStyle = `rgba(255,80,0,${flicker})`;
    ctx.fillRect(0, 0, W, H);

    // Vignette
    const vig = ctx.createRadialGradient(W/2, H/2, H*0.25, W/2, H/2, H*0.85);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.65)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // HUD
    renderHUD(W, H);

    // Overlays
    if (gameState === "dead")    renderDeathScreen(W, H);
    if (gameState === "escaped") renderEscapeScreen(W, H);
  }

  /* =========================================================
     SKY RENDERING (INFERNAL VISUALS)
  ========================================================= */

  function updateSkyShadows() {
    const now = performance.now();
    if (now - lastSkyUpdate < 100) return; // Update at ~10fps for performance
    lastSkyUpdate = now;

    skyShadows.forEach(shadow => {
      shadow.x += shadow.speed;
      if (shadow.x > canvas.width + shadow.size) {
        shadow.x = -shadow.size;
        shadow.y = Math.random() * canvas.height * 0.3;
      }
    });
  }

  function renderSky() {
    updateSkyShadows();

    skyCtx.clearRect(0, 0, skyCanvas.width, skyCanvas.height);

    skyShadows.forEach(shadow => {
      skyCtx.save();
      skyCtx.globalAlpha = shadow.alpha;
      skyCtx.fillStyle = "#000";
      skyCtx.beginPath();
      skyCtx.arc(shadow.x, shadow.y, shadow.size, 0, Math.PI * 2);
      skyCtx.fill();
      skyCtx.restore();
    });
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
    grad.addColorStop(0, `rgba(255,220,80,${0.9 * pulse})`);
    grad.addColorStop(0.5, `rgba(255,150,0,${0.7 * pulse})`);
    grad.addColorStop(1, `rgba(200,60,0,${0.4 * pulse})`);
    ctx.fillStyle = grad;
    ctx.fillRect(scrX - bw/2, H/2 - h/2, bw, h);

    const gr = bw * 4;
    const gg = ctx.createRadialGradient(scrX, H/2, 0, scrX, H/2, gr);
    gg.addColorStop(0, `rgba(255,180,50,${0.15 * pulse})`);
    gg.addColorStop(1, "rgba(255,100,0,0)");
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
        const r = Math.min(255, bri + 80);
        const g = Math.min(255, Math.floor(bri * 0.45) + 20);
        const b = Math.floor(bri * 0.08);

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(px, py, pxSz, pxSz);
      }
    }

    const glR = totW * 0.9;
    const gg = ctx.createRadialGradient(scrX, stY + totH/2, 0, scrX, stY + totH/2, glR);
    gg.addColorStop(0, `rgba(255,60,0,${0.22 * pulse})`);
    gg.addColorStop(1, "rgba(255,30,0,0)");
    ctx.fillStyle = gg;
    ctx.fillRect(scrX - glR, stY + totH/2 - glR, glR*2, glR*2);
  }

  /* =========================================================
     HUD
  ========================================================= */

  function renderHUD(W, H) {
    ctx.save();
    const fs = Math.max(12, Math.floor(H * 0.032));
    ctx.font = `${fs}px "Courier New", monospace`;
    ctx.textBaseline = "top";
    ctx.shadowColor = "#ff4400";
    ctx.shadowBlur = 6;

    const p = 10;

    ctx.fillStyle = "#ff9944";
    ctx.textAlign = "left";
    ctx.fillText(`XPONOE: ${survivalTime.toFixed(1)}`, p, p);
    ctx.fillText(`SCORE: ${score}`, p, p + fs * 1.4);

    const gDist = Math.sqrt((goalX+0.5-player.x)**2 + (goalY+0.5-player.y)**2).toFixed(1);
    ctx.fillText(`EXIT: ${gDist}m`, p, p + fs * 2.8);

    ctx.textAlign = "right";
    ctx.fillStyle = "#884422";
    ctx.fillText(`RING ${floorReached} | x${monster.difficultyMod.toFixed(1)}`, W - p, p);

    const stateNames = {
      patrol: "PATROLLING", chase: "HUNTING", flank: "FLANKING",
      ambush: "AMBUSH", investigate: "INVESTIGATING"
    };
    ctx.fillStyle = "#663311";
    ctx.fillText(stateNames[monster.state] || monster.state, W - p, p + fs * 1.4);

    const mDist = Math.sqrt((monster.x-player.x)**2 + (monster.y-player.y)**2);
    if (mDist < 6) {
      const wp = 0.5 + 0.5 * Math.sin(performance.now() / 120);
      ctx.textAlign = "center";
      if (mDist < 3) {
        ctx.fillStyle = `rgba(255,30,0,${wp})`;
        ctx.font = `bold ${fs * 1.3}px "Courier New", monospace`;
        ctx.fillText("!! DEATH !!", W / 2, p);
      } else {
        ctx.fillStyle = `rgba(255,100,0,${wp * 0.6})`;
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
    const size = Math.floor(Math.min(W, H) * 0.17);
    const ox = W - size - 10;
    const oy = H - size - 10;
    const cs = size / CFG.GRID;

    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "#100300";
    ctx.fillRect(ox, oy, size, size);

    for (let y = 0; y < CFG.GRID; y++) {
      for (let x = 0; x < CFG.GRID; x++) {
        if (map[y][x] === 1) {
          ctx.fillStyle = "#3a1000";
          ctx.fillRect(ox + x * cs, oy + y * cs, Math.ceil(cs), Math.ceil(cs));
        }
      }
    }

    ctx.globalAlpha = 0.9;

    ctx.fillStyle = "#ffaa00";
    ctx.fillRect(ox + player.x*cs - 2, oy + player.y*cs - 2, 4, 4);

    ctx.strokeStyle = "#ffaa00";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox + player.x*cs, oy + player.y*cs);
    ctx.lineTo(ox + (player.x + Math.cos(player.angle)*2.5)*cs,
               oy + (player.y + Math.sin(player.angle)*2.5)*cs);
    ctx.stroke();

    const mp = 0.5 + 0.5 * Math.sin(performance.now() / 180);
    ctx.fillStyle = `rgba(255,40,0,${mp})`;
    ctx.fillRect(ox + monster.x*cs - 2, oy + monster.y*cs - 2, 4, 4);

    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(ox + goalX*cs - 2, oy + goalY*cs - 2, 4, 4);

    ctx.globalAlpha = 1;
  }

  /* =========================================================
     OVERLAY SCREENS
  ========================================================= */

  function renderDeathScreen(W, H) {
    ctx.fillStyle = "rgba(80,0,0,0.75)";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 25;

    ctx.font = `bold ${Math.floor(H*0.09)}px "Courier New", monospace`;
    ctx.fillStyle = "#ff2200";
    ctx.fillText("DEATH", W/2, H*0.33);

    ctx.shadowBlur = 8;
    ctx.font = `${Math.floor(H*0.035)}px "Courier New", monospace`;
    ctx.fillStyle = "#cc6600";
    ctx.fillText("The labyrinth claims another soul", W/2, H*0.48);
    ctx.fillText(`Survived: ${survivalTime.toFixed(1)}s  |  Score: ${score}`, W/2, H*0.55);

    const bk = 0.5 + 0.5 * Math.sin(performance.now() / 400);
    ctx.fillStyle = `rgba(255,120,0,${bk})`;
    ctx.fillText("Press ENTER to descend again", W/2, H*0.68);
    ctx.restore();
  }

  function renderEscapeScreen(W, H) {
    ctx.fillStyle = "rgba(40,25,0,0.75)";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#ffaa00";
    ctx.shadowBlur = 25;

    ctx.font = `bold ${Math.floor(H*0.09)}px "Courier New", monospace`;
    ctx.fillStyle = "#ffcc00";
    ctx.fillText("FREEDOM", W/2, H*0.33);

    ctx.shadowBlur = 8;
    ctx.font = `${Math.floor(H*0.035)}px "Courier New", monospace`;
    ctx.fillStyle = "#ffaa44";
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
      skyCanvas.width = w;
      skyCanvas.height = h;
    }
  }

  /* =========================================================
     GAME LOOP
  ========================================================= */

  function loop(timestamp) {
    animFrameId = requestAnimationFrame(loop);

    // Boot screen input: consumes inputState.start
    if ((gameState === "boot" || gameState === "dead" || gameState === "escaped") && inputState.start) {
      console.log("[LOOP] State:", gameState, "inputState.start=true, starting game");
      startGame();
      inputState.start = false;
      return;
    }

    if (gameState !== "playing") {
      render();
      renderSky();
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

      // Notify Oracle of successful escape
      if (window.oracleClient) {
        window.oracleClient.sendGameState("escaped", floorReached, survivalTime);
      }
    }

    if (performance.now() - lastTelemetryTime > CFG.TELEMETRY_MS) {
      lastTelemetryTime = performance.now();
      sendTelemetry();
    }

    render();
    renderSky();
  }

  /* =========================================================
     START / RESTART
  ========================================================= */

  function startGame() {
    if (animFrameId) cancelAnimationFrame(animFrameId);

    if (gameState === "escaped") {
      floorReached++;
    } else {
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

    // Notify Oracle of game start
    if (window.oracleClient) {
      window.oracleClient.sendGameState("playing", floorReached, 0);
    }

    animFrameId = requestAnimationFrame(loop);
  }

  /* =========================================================
     SLIDER BINDINGS
  ========================================================= */

  const bs = document.getElementById("brightnessSlider");
  const gs = document.getElementById("gammaSlider");
  const hs = document.getElementById("hueSlider");
  let currentHue = 0;

  if (bs) bs.addEventListener("input", function () {
    document.documentElement.style.setProperty("--brightness", this.value);
  });
  if (gs) gs.addEventListener("input", function () {
    document.documentElement.style.setProperty("--gamma", this.value);
  });
  if (hs) hs.addEventListener("input", function () {
    currentHue = parseInt(this.value);
    document.documentElement.style.setProperty("--hue", currentHue + "deg");
    // Send color preference to Oracle
    if (window.oracleClient) {
      window.oracleClient.sendVisualPreference(currentHue);
    }
  });

})();