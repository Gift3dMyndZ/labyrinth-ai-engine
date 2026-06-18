/* ===========================================================
   LABYRINTH OF TARTARUS — game.js
=========================================================== */

(function () {
  "use strict";

  /* =========================================================
     CONFIGURATION
  ========================================================= */

  const CFG = {
    MOVE: 0.045,
    ROT: 0.045,
  };

  /* =========================================================
     DOM READY WRAPPER
  ========================================================= */

  window.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       DOM REFERENCES
    ========================================================= */

    const bootScreen    = document.getElementById("bootScreen");
    const gameContainer = document.getElementById("gameContainer");
    const canvas        = document.getElementById("game");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const skyCanvas = document.getElementById("sky-canvas");
    const skyCtx    = skyCanvas ? skyCanvas.getContext("2d") : null;

    /* =========================================================
       INPUT STATE
    ========================================================= */

    const inputState = {
      start: false,
      up: false,
      down: false,
      left: false,
      right: false,
    };

    /* =========================================================
       GAME STATE
    ========================================================= */

    let player = { x: 5, y: 5, angle: 0 };
    let gameState = "boot";
    let animFrameId = null;

<<<<<<< Updated upstream
    /* =========================================================
       CANVAS SETUP
    ========================================================= */
=======
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
    ctx.fillStyle = "#020000";
    ctx.fillRect(ox, oy, size, size);

    for (let y = 0; y < CFG.GRID; y++) {
      for (let x = 0; x < CFG.GRID; x++) {
        if (map[y][x] === 1) {
          ctx.fillStyle = "#ff5a00cc";
          ctx.fillRect(ox + x * cs, oy + y * cs, Math.ceil(cs), Math.ceil(cs));
        }
      }
    }

    ctx.globalAlpha = 0.9;

    ctx.fillStyle = "#00eaff";
    ctx.fillRect(ox + player.x*cs - 2, oy + player.y*cs - 2, 4, 4);

    ctx.strokeStyle = "#00eaff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox + player.x*cs, oy + player.y*cs);
    ctx.lineTo(ox + (player.x + Math.cos(player.angle)*2.5)*cs,
               oy + (player.y + Math.sin(player.angle)*2.5)*cs);
    ctx.stroke();

    const mp = 0.5 + 0.5 * Math.sin(performance.now() / 180);
    ctx.fillStyle = `rgba(255,0,90,${mp})`;
    ctx.fillRect(ox + monster.x*cs - 2, oy + monster.y*cs - 2, 4, 4);

    ctx.fillStyle = "#39ff14";
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
>>>>>>> Stashed changes

    canvas.setAttribute("tabindex", "0");
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    function resizeCanvas() {
      canvas.width  = canvas.clientWidth;
      canvas.height = canvas.clientHeight;

      if (skyCanvas) {
        skyCanvas.width  = skyCanvas.clientWidth;
        skyCanvas.height = skyCanvas.clientHeight;
      }
    }

    /* =========================================================
       KEYBOARD INPUT
    ========================================================= */

    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();

      if (k === "enter" || k === " ") inputState.start = true;
      if (k === "w" || k === "arrowup") inputState.up = true;
      if (k === "s" || k === "arrowdown") inputState.down = true;
      if (k === "a" || k === "arrowleft") inputState.left = true;
      if (k === "d" || k === "arrowright") inputState.right = true;
    });

    window.addEventListener("keyup", (e) => {
      const k = e.key.toLowerCase();

      if (k === "w" || k === "arrowup") inputState.up = false;
      if (k === "s" || k === "arrowdown") inputState.down = false;
      if (k === "a" || k === "arrowleft") inputState.left = false;
      if (k === "d" || k === "arrowright") inputState.right = false;
    });

    /* =========================================================
       START GAME
    ========================================================= */

    function startGame() {
      if (animFrameId) cancelAnimationFrame(animFrameId);

      canvas.focus();
      if (bootScreen) bootScreen.style.display = "none";
      if (gameContainer) gameContainer.style.display = "flex";

      gameState = "playing";
      animFrameId = requestAnimationFrame(loop);
    }

    /* =========================================================
       GAME LOOP
    ========================================================= */

    function loop() {
      animFrameId = requestAnimationFrame(loop);

      if (gameState === "boot" && inputState.start) {
        inputState.start = false;
        startGame();
        return;
      }

      if (gameState !== "playing") return;

      updatePlayer();
      render();
    }

    /* =========================================================
       PLAYER UPDATE
    ========================================================= */

    function updatePlayer() {
      let dx = 0, dy = 0;

      if (inputState.up) {
        dx += Math.cos(player.angle) * CFG.MOVE;
        dy += Math.sin(player.angle) * CFG.MOVE;
      }

      if (inputState.down) {
        dx -= Math.cos(player.angle) * CFG.MOVE;
        dy -= Math.sin(player.angle) * CFG.MOVE;
      }

      if (inputState.left)  player.angle -= CFG.ROT;
      if (inputState.right) player.angle += CFG.ROT;

      player.x += dx;
      player.y += dy;
    }

    /* =========================================================
       RENDER
    ========================================================= */

    function render() {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#ff6600";
      ctx.font = "20px Courier New";
      ctx.textAlign = "center";
      ctx.fillText(
        "TARTARUS DESCENDED",
        canvas.width / 2,
        canvas.height / 2
      );
    }

    /* =========================================================
       INIT
    ========================================================= */

    loop();

  }); // DOMContentLoaded

})();