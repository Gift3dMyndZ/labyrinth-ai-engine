/* =========================================
SESSION + TELEMETRY SETUP
========================================= */

const sessionId = crypto.randomUUID();
let sessionStart = Date.now();
let eventLog = [];

const API_BASE =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:8000"
        : "https://labyrinth-ai-engine.onrender.com"; // ✅ your deployed backend


/* =========================================
CANVAS SETUP
========================================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");


/* =========================================
GAME STATE
========================================= */

let level = 1;
let score = 0;
let survivalTime = 0;
let gameRunning = false;
let survivalInterval;

let map = [];
let MAP_W;
let MAP_H;

let player;
let monster;
let exitTile;

let fear_level = 0;
let aggression = 0;
let curiosity = 0;
let difficultyModifier = 1.0;


/* =========================================
MAZE GENERATION (Recursive Backtracking)
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
        sessionStart = Date.now();
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

document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
});

document.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

function tryMove(nx, ny) {
    if (map[Math.floor(ny)][Math.floor(nx)] === "0") {
        player.x = nx;
        player.y = ny;
    }
}

function movePlayer() {

    const speed = 0.06;

    if (keys["w"]) {
        tryMove(
            player.x + Math.cos(player.angle) * speed,
            player.y + Math.sin(player.angle) * speed
        );
        logMove("forward");
    }

    if (keys["s"]) {
        tryMove(
            player.x - Math.cos(player.angle) * speed,
            player.y - Math.sin(player.angle) * speed
        );
        logMove("backward");
    }

    if (keys["a"]) {
        player.angle -= 0.05;
        logMove("left");
    }

    if (keys["d"]) {
        player.angle += 0.05;
        logMove("right");
    }

    curiosity++;
}


/* =========================================
MONSTER AI
========================================= */

function moveMonster() {

    const dx = player.x - monster.x;
    const dy = player.y - monster.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) fear_level++;
    if (dist < 5 && Math.random() < 0.3) aggression++;

    if (dist < 8) {
        monster.x += Math.sign(dx) * monster.speed;
        monster.y += Math.sign(dy) * monster.speed;
    }

    if (dist < 0.5) {
        endGame();
    }
}


/* =========================================
MOVEMENT LOGGING
========================================= */

function logMove(action) {

    const now = Date.now();

    const distanceToAI = Math.hypot(
        player.x - monster.x,
        player.y - monster.y
    );

    eventLog.push({
        session_id: sessionId,
        timestamp: now,
        level: level,
        action: action,
        player_x: player.x,
        player_y: player.y,
        player_angle: player.angle,
        ai_x: monster.x,
        ai_y: monster.y,
        distance_to_ai: distanceToAI,
        time_since_start: now - sessionStart
    });

    if (eventLog.length >= 25) {
        sendBatch();
    }
}

async function sendBatch() {

    if (eventLog.length === 0) return;

    try {
        await fetch(`${API_BASE}/collect`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(eventLog)
        });

        console.log("Batch sent:", eventLog.length);
        eventLog = [];

    } catch (err) {
        console.error("Batch send failed:", err);
    }
}


/* =========================================
ADAPTIVE TELEMETRY
========================================= */

async function sendTelemetry(data) {
    try {
        await fetch(`${API_BASE}/telemetry`, {
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

    difficultyModifier = await getAdaptiveDifficulty(metrics);

    level++;
    resetGame(false);

    gameRunning = true;
    gameLoop();
}


/* =========================================
START GAME
========================================= */

window.startGame = function () {

    gameRunning = true;
    resetGame(true);

    survivalInterval = setInterval(() => {
        survivalTime++;
        updateHUD();
    }, 1000);

    gameLoop();
};