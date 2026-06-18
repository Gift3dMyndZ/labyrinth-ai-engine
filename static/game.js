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

    /* =========================================================
       CANVAS SETUP
    ========================================================= */

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