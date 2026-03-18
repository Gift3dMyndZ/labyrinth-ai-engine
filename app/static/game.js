/* =========================================
   API BASE DETECTION (DEV vs PROD)
========================================= */

const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://your-backend-url.onrender.com"; // ✅ Replace after deploy


/* =========================================
   LABYRINTH — PROCEDURAL CORRUPTION EDITION
   + TELEMETRY + ADAPTIVE AI INTEGRATION
========================================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ===============================
   RENDER SETTINGS
================================ */

const FOV = Math.PI / 3;
const RAYS = Math.floor(canvas.width / 2);
const MAX_DEPTH = 30;

/* ===============================
   FOG SETTINGS
================================ */

const FOG_DISTANCE = 18;
const FOG_COLOR = { r: 0, g: 0, b: 25 };

/* ===============================
   CORRUPTION SETTINGS
================================ */

let corruptionInterval;
let corruptionRate = 4000;
let corruptionFlash = 0;

/* ===============================
   GAME STATE
================================ */

let level = 1;
let score = 0;
let survivalTime = 0;

let demoMode = false;
let gameRunning = false;
let survivalInterval;

let map = [];
let MAP_W;
let MAP_H;

let player;
let monster;
let exitTile;

/* ===============================
   BEHAVIOR TRACKING
================================ */

let fear_level = 0;
let aggression = 0;
let curiosity = 0;

let difficultyModifier = 1.0;

/* =========================================
   🧠 MAZE GENERATION
========================================= */

function generateMaze(width, height) {

    if (width % 2 === 0) width++;
    if (height % 2 === 0) height++;

    MAP_W = width;
    MAP_H = height;

    map = Array.from({ length: height }, () =>
        Array(width).fill("1")
    );

    function carve(x, y) {

        const directions = [
            [0, -2],
            [0, 2],
            [-2, 0],
            [2, 0]
        ].sort(() => Math.random() - 0.5);

        for (let [dx, dy] of directions) {

            const nx = x + dx;
            const ny = y + dy;

            if (
                nx > 0 && ny > 0 &&
                nx < width - 1 &&
                ny < height - 1 &&
                map[ny][nx] === "1"
            ) {
                map[ny][nx] = "0";
                map[y + dy / 2][x + dx / 2] = "0";
                carve(nx, ny);
            }
        }
    }

    map[1][1] = "0";
    carve(1, 1);
    map = map.map(row => row.join(""));
}

/* =========================================
   RESET GAME
========================================= */

function resetGame(fullReset = false) {

    if (fullReset) {
        level = 1;
        score = 0;
    }

    const size = 21 + Math.min(level * 2, 20);
    generateMaze(size, size);

    player = { x: 1.5, y: 1.5, angle: 0 };

    exitTile = { x: MAP_W - 2, y: MAP_H - 2 };

    monster = {
        x: MAP_W - 3,
        y: 1,
        speed: (0.02 + level * 0.004) * difficultyModifier
    };

    survivalTime = 0;

    fear_level = 0;
    aggression = 0;
    curiosity = 0;

    updateHUD();
}

/* =========================================
   HUD
========================================= */

function updateHUD() {
    document.getElementById("level").innerText = level;
    document.getElementById("score").innerText = score;
    document.getElementById("time").innerText = survivalTime;
}

/* =========================================
   MOVEMENT
========================================= */

let keys = {};

document.addEventListener("keydown", e=>{
    keys[e.key.toLowerCase()] = true;
});
document.addEventListener("keyup", e=>{
    keys[e.key.toLowerCase()] = false;
});

function movePlayer() {

    const speed = 0.06;

    if (keys["w"]) tryMove(
        player.x + Math.cos(player.angle)*speed,
        player.y + Math.sin(player.angle)*speed
    );

    if (keys["s"]) tryMove(
        player.x - Math.cos(player.angle)*speed,
        player.y - Math.sin(player.angle)*speed
    );

    if (keys["a"]) player.angle -= 0.05;
    if (keys["d"]) player.angle += 0.05;

    curiosity++;
}

function moveMonster() {

    const dx = player.x - monster.x;
    const dy = player.y - monster.y;
    const dist = Math.sqrt(dx*dx+dy*dy);

    if (dist < 5) fear_level++;
    if (dist < 5 && Math.random() < 0.3) aggression++;

    if (dist < 8) {
        monster.x += Math.sign(dx)*monster.speed;
        monster.y += Math.sign(dy)*monster.speed;
    }
}

/* =========================================
   TELEMETRY
========================================= */

async function sendTelemetry(data) {
    try {
        await fetch(`${API_BASE}/telemetry/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
    } catch (err) {
        console.error("Telemetry error:", err);
    }
}

async function getAdaptiveDifficulty(data) {
    try {
        const response = await fetch(`${API_BASE}/recommend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        return result.difficulty_modifier || 1.0;

    } catch (err) {
        console.error("Recommendation error:", err);
        return 1.0;
    }
}

async function evaluatePlayerBehavior(data) {
    try {
        const response = await fetch(`${API_BASE}/cluster-player`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        updatePlayerTypeUI(result.player_type);
        adjustDifficultyByCluster(result.cluster_id);

    } catch (err) {
        console.error("Cluster error:", err);
    }
}

/* =========================================
   ADAPTIVE DIFFICULTY
========================================= */

function adjustDifficultyByCluster(clusterId) {

    if (clusterId === 0) difficultyModifier = 0.9;
    else if (clusterId === 1) difficultyModifier = 1.3;
    else difficultyModifier = 1.0;

    monster.speed = (0.02 + level * 0.004) * difficultyModifier;
}

function updatePlayerTypeUI(type) {
    const el = document.getElementById("player-type");
    if (el) el.innerText = "Player Type: " + type;
}

/* =========================================
   GAME LOOP
========================================= */

function gameLoop() {

    if (!gameRunning) return;

    movePlayer();
    moveMonster();

    requestAnimationFrame(gameLoop);
}

/* =========================================
   GAME END
========================================= */

async function endGame() {

    gameRunning = false;
    clearInterval(survivalInterval);

    const metrics = {
        fear_level,
        aggression,
        curiosity,
        survival_time: survivalTime
    };

    await sendTelemetry(metrics);
    await evaluatePlayerBehavior(metrics);

    const modifier = await getAdaptiveDifficulty(metrics);
    difficultyModifier = modifier;

    resetGame(false);
}

/* =========================================
   START
========================================= */

window.startGame = function(){

    gameRunning = true;
    resetGame(true);

    survivalInterval = setInterval(()=>{
        survivalTime++;
        updateHUD();
    },1000);

    gameLoop();
};