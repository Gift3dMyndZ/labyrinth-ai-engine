/* =========================================
CANVAS SETUP
========================================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 600;


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


/* =========================================
RAYCAST SETTINGS
========================================= */

const FOV = Math.PI / 3;
const MAX_DEPTH = 20;


/* =========================================
MAZE GENERATION
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

        const dirs = [
            [0, -2], [0, 2],
            [-2, 0], [2, 0]
        ].sort(() => Math.random() - 0.5);

        for (let [dx, dy] of dirs) {

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
}


/* =========================================
RESET GAME
========================================= */

function resetGame() {

    const size = 21 + Math.min(level * 2, 20);
    generateMaze(size, size);

    player = { x: 1.5, y: 1.5, angle: 0 };

    exitTile = { x: MAP_W - 2, y: MAP_H - 2 };

    monster = {
        x: MAP_W - 3,
        y: 1,
        speed: 0.02 + level * 0.004
    };

    survivalTime = 0;
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
MOVEMENT (WASD + ARROWS)
========================================= */

let keys = {};

document.addEventListener("keydown", e => {

    keys[e.key.toLowerCase()] = true;

    // Start game with ENTER
    if (e.key === "Enter" && !gameRunning) {
        gameRunning = true;
        resetGame();

        survivalInterval = setInterval(() => {
            survivalTime++;
            updateHUD();
        }, 1000);
    }
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

    const speed = 0.08;

    // Forward
    if (keys["w"] || keys["arrowup"]) {
        tryMove(
            player.x + Math.cos(player.angle) * speed,
            player.y + Math.sin(player.angle) * speed
        );
    }

    // Backward
    if (keys["s"] || keys["arrowdown"]) {
        tryMove(
            player.x - Math.cos(player.angle) * speed,
            player.y - Math.sin(player.angle) * speed
        );
    }

    // Rotate Left
    if (keys["a"] || keys["arrowleft"]) {
        player.angle -= 0.05;
    }

    // Rotate Right
    if (keys["d"] || keys["arrowright"]) {
        player.angle += 0.05;
    }
}


/* =========================================
MONSTER AI
========================================= */

function moveMonster() {

    const dx = player.x - monster.x;
    const dy = player.y - monster.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 10) {
        monster.x += Math.sign(dx) * monster.speed;
        monster.y += Math.sign(dy) * monster.speed;
    }

    if (dist < 0.5) {
        level = 1;
        score = 0;
        resetGame();
    }
}


/* =========================================
3D RAYCAST ENGINE (Improved Colors)
========================================= */

function draw3D() {

    // Ceiling (dark blue)
    ctx.fillStyle = "#0f2027";
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

    // Floor (dark gray)
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

    for (let x = 0; x < canvas.width; x++) {

        const rayAngle =
            player.angle - FOV / 2 +
            (x / canvas.width) * FOV;

        let distance = 0;
        let hit = false;

        while (!hit && distance < MAX_DEPTH) {

            distance += 0.05;

            const testX = Math.floor(
                player.x + Math.cos(rayAngle) * distance
            );
            const testY = Math.floor(
                player.y + Math.sin(rayAngle) * distance
            );

            if (
                testX < 0 || testY < 0 ||
                testX >= MAP_W || testY >= MAP_H
            ) {
                hit = true;
                distance = MAX_DEPTH;
            }
            else if (map[testY][testX] === "1") {
                hit = true;
            }
        }

        const correctedDist =
            distance * Math.cos(rayAngle - player.angle);

        const wallHeight =
            canvas.height / (correctedDist + 0.0001);

        const brightness =
            1 - Math.min(correctedDist / 18, 1);

        const r = Math.floor(40 * brightness);
        const g = Math.floor(180 * brightness + 40);
        const b = Math.floor(140 * brightness + 40);

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

        ctx.fillRect(
            x,
            (canvas.height - wallHeight) / 2,
            1,
            wallHeight
        );
    }

    drawSprites();
}


/* =========================================
SPRITES
========================================= */

function drawSprite(sprite, color, scale = 1) {

    const dx = sprite.x - player.x;
    const dy = sprite.y - player.y;

    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx) - player.angle;

    if (Math.abs(angle) > FOV / 2) return;

    const screenX =
        (angle + FOV / 2) / FOV * canvas.width;

    const size =
        (canvas.height / distance) * scale;

    ctx.globalAlpha =
        1 - Math.min(distance / 12, 0.8);

    ctx.fillStyle = color;

    ctx.fillRect(
        screenX - size / 2,
        (canvas.height - size) / 2,
        size,
        size
    );

    ctx.globalAlpha = 1;
}

function drawSprites() {
    drawSprite(monster, "red", 1);
    drawSprite(exitTile, "gold", 0.7);
}


/* =========================================
CHECK WIN
========================================= */

function checkWin() {
    if (
        Math.floor(player.x) === exitTile.x &&
        Math.floor(player.y) === exitTile.y
    ) {
        score += 100;
        level++;
        resetGame();
    }
}


/* =========================================
INSTRUCTION SCREEN
========================================= */

function drawInstructions() {

    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    ctx.font = "48px Arial";
    ctx.fillText("LABYRINTH", canvas.width / 2, 150);

    ctx.font = "22px Arial";
    ctx.fillText("W / ↑  - Move Forward", canvas.width / 2, 250);
    ctx.fillText("S / ↓  - Move Backward", canvas.width / 2, 290);
    ctx.fillText("A / ←  - Turn Left", canvas.width / 2, 330);
    ctx.fillText("D / →  - Turn Right", canvas.width / 2, 370);
    ctx.fillText("Reach the GOLD exit.", canvas.width / 2, 430);
    ctx.fillText("Avoid the RED monster.", canvas.width / 2, 470);

    ctx.fillStyle = "#00ffaa";
    ctx.font = "28px Arial";
    ctx.fillText("Press ENTER to Start", canvas.width / 2, 540);
}


/* =========================================
GAME LOOP
========================================= */

function gameLoop() {

    if (!gameRunning) {
        drawInstructions();
        requestAnimationFrame(gameLoop);
        return;
    }

    movePlayer();
    moveMonster();
    checkWin();
    draw3D();

    requestAnimationFrame(gameLoop);
}


/* =========================================
INITIALIZE
========================================= */

gameLoop();