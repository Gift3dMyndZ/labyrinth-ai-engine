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
let keyItem;
let hasKey = false;


/* =========================================
RAYCAST SETTINGS
========================================= */

const FOV = Math.PI / 3;
const MAX_DEPTH = 25;


/* =========================================
MAZE GENERATION (Procedural)
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

    const size = 25 + Math.min(level * 2, 20);
    generateMaze(size, size);

    player = { x: 1.5, y: 1.5, angle: 0 };

    exitTile = { x: MAP_W - 2, y: MAP_H - 2 };

    keyItem = {
        x: Math.floor(MAP_W / 2),
        y: Math.floor(MAP_H / 2)
    };

    hasKey = false;

    monster = {
        x: MAP_W - 3,
        y: 1,
        speed: 0.015 + level * 0.003
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
MOVEMENT
========================================= */

let keys = {};

document.addEventListener("keydown", e => {

    keys[e.key.toLowerCase()] = true;

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

    if (keys["w"] || keys["arrowup"]) {
        tryMove(
            player.x + Math.cos(player.angle) * speed,
            player.y + Math.sin(player.angle) * speed
        );
    }

    if (keys["s"] || keys["arrowdown"]) {
        tryMove(
            player.x - Math.cos(player.angle) * speed,
            player.y - Math.sin(player.angle) * speed
        );
    }

    if (keys["a"] || keys["arrowleft"]) player.angle -= 0.05;
    if (keys["d"] || keys["arrowright"]) player.angle += 0.05;
}


/* =========================================
MONSTER AI (Slow Lurking)
========================================= */

function moveMonster() {

    const dx = player.x - monster.x;
    const dy = player.y - monster.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 12) {
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
3D RAYCAST ENGINE (HEDGE STYLE)
========================================= */

function draw3D() {

    // Dark sky
    ctx.fillStyle = "#0a120a";
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

    // Grass floor
    ctx.fillStyle = "#0f1f0f";
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

        const fog = 1 - Math.min(correctedDist / 20, 1);

        // Hedge green walls
        const r = Math.floor(20 * fog);
        const g = Math.floor(120 * fog + 40);
        const b = Math.floor(20 * fog);

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
SPRITES (Key + Exit + Monster)
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
        1 - Math.min(distance / 15, 0.8);

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

    if (!hasKey)
        drawSprite(keyItem, "yellow", 0.6);

    drawSprite(monster, "darkred", 1);

    if (hasKey)
        drawSprite(exitTile, "white", 0.8);
}


/* =========================================
CHECK EVENTS
========================================= */

function checkEvents() {

    // Collect key
    if (!hasKey &&
        Math.floor(player.x) === keyItem.x &&
        Math.floor(player.y) === keyItem.y) {
        hasKey = true;
        score += 50;
    }

    // Win only if key collected
    if (hasKey &&
        Math.floor(player.x) === exitTile.x &&
        Math.floor(player.y) === exitTile.y) {

        score += 150;
        level++;
        resetGame();
    }
}


/* =========================================
INSTRUCTION SCREEN
========================================= */

function drawInstructions() {

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#66ff66";
    ctx.textAlign = "center";

    ctx.font = "48px Arial";
    ctx.fillText("THE MAZE", canvas.width / 2, 150);

    ctx.font = "22px Arial";
    ctx.fillText("Find the key.", canvas.width / 2, 260);
    ctx.fillText("Escape the hedge maze.", canvas.width / 2, 300);
    ctx.fillText("Something is watching...", canvas.width / 2, 340);

    ctx.fillStyle = "white";
    ctx.fillText("Press ENTER to Begin", canvas.width / 2, 500);
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
    checkEvents();
    draw3D();

    requestAnimationFrame(gameLoop);
}


/* =========================================
START
========================================= */

gameLoop();