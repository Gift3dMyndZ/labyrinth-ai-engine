<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LABYRINTH</title>

<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    background: #000;
    color: #00ff66;
    font-family: "Courier New", monospace;
    text-align: center;
    overflow: hidden;
}

.title {
    margin-top: 15px;
    font-size: 2rem;
}

.glow {
    text-shadow:
        0 0 5px #00ff66,
        0 0 15px #00ff66,
        0 0 25px #00ff66;
}

.hud {
    margin-top: 10px;
    font-size: 0.9rem;
}

.hidden {
    display: none;
}

.screen {
    position: absolute;
    inset: 0;
    background: black;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 20;
}

.blink {
    animation: blink 1s infinite;
}

@keyframes blink {
    50% { opacity: 0; }
}

/* CRT */
.crt-wrapper {
    position: relative;
    width: 420px;
    height: 420px;
    margin: 30px auto;
    border: 4px solid #00ff66;
    box-shadow:
        0 0 20px #00ff66,
        inset 0 0 20px #003300;
    overflow: hidden;
}

canvas {
    display: block;
    background: black;
}

.scanlines {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
        to bottom,
        rgba(0,255,0,0.05) 0px,
        rgba(0,255,0,0.05) 2px,
        transparent 2px,
        transparent 4px
    );
    pointer-events: none;
}

/* Demo overlay text */
#demoLabel {
    position: absolute;
    top: 10px;
    left: 10px;
    font-size: 0.8rem;
    opacity: 0.6;
    display: none;
}

</style>
</head>

<body>

<!-- ATTRACT SCREEN -->
<div id="attractScreen" class="screen">
    <h1 class="title glow">LABYRINTH</h1>
    <h2 class="blink">INSERT COIN</h2>
    <p>PRESS ENTER</p>
</div>

<h1 class="title glow">LABYRINTH</h1>

<div class="hud hidden" id="hud">
    Level: <span id="level">1</span> |
    Time: <span id="time">0</span>s |
    Score: <span id="score">0</span> |
    High: <span id="highScore">0</span>
</div>

<div class="crt-wrapper">
    <canvas id="game" width="420" height="420"></canvas>
    <div class="scanlines"></div>
    <div id="demoLabel">DEMO MODE</div>
</div>

<script>
/* ===============================
   MODE CONTROL
================================ */

let demoMode = true;
let demoTimer;

/* Elements */
const attractScreen = document.getElementById("attractScreen");
const hud = document.getElementById("hud");
const demoLabel = document.getElementById("demoLabel");

/* ===============================
   START DEMO AFTER DELAY
================================ */

function startDemo() {

    demoMode = true;
    attractScreen.classList.add("hidden");
    hud.classList.add("hidden");
    demoLabel.style.display = "block";

    if (window.startGame) {
        window.startGame({ demo: true });
    }
}

/* ===============================
   START REAL GAME
================================ */

function startRealGame() {

    demoMode = false;
    attractScreen.classList.add("hidden");
    hud.classList.remove("hidden");
    demoLabel.style.display = "none";

    if (window.startGame) {
        window.startGame({ demo: false });
    }
}

/* ===============================
   ENTER KEY HANDLER
================================ */

document.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {

        startRealGame();
    }
});

/* ===============================
   AUTO DEMO LOOP
================================ */

function scheduleDemo() {

    clearTimeout(demoTimer);

    demoTimer = setTimeout(() => {
        if (demoMode) return;
        startDemo();
    }, 4000);
}

/* ===============================
   INITIAL LOAD
================================ */

window.onload = () => {

    // Show attract screen first
    demoMode = false;
    scheduleDemo();
};

/* ===============================
   RETURN TO ATTRACT (CALL FROM GAME)
================================ */

window.returnToAttract = function() {

    demoMode = false;

    attractScreen.classList.remove("hidden");
    hud.classList.add("hidden");
    demoLabel.style.display = "none";

    scheduleDemo();
};

</script>

<script src="game.js"></script>

</body>
</html>