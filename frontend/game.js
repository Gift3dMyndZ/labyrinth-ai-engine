/* =========================================
   LABYRINTH – STABLE VERSION
========================================= */

console.log("GAME JS LOADED");

/* =========================================
   CANVAS SETUP
========================================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* =========================================
   GAME STATE
========================================= */

let level = 1;
let score = 0;
let survivalTime = 0;
let gameRunning = false;
let survivalInterval = null;

let map = [];
let MAP_W;
let MAP_H;

let player;
let monster;

const FOV = Math.PI / 3;
const MAX_DEPTH = 25;

/* =========================================
   INPUT
========================================= */

let keys = {};

document.addEventListener("keydown", (e) => {

    keys[e.key.toLowerCase()] = true;

    if (e.key === "Enter" && !gameRunning) {

        const boot = document.getElementById("bootScreen");
        const gameUI = document.getElementById("gameContainer");

        if (boot) boot.remove();
        if (gameUI) gameUI.style.display = "block";

        startGame();
    }
});

document.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

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
   START / RESET
========================================= */

function resetGame() {

    const size = 25 + Math.min(level * 2, 20);
    generateMaze(size, size);

    player = { x: 1.5, y: 1.5, angle: 0 };

    monster = {
        x: MAP_W - 3,
        y: 1,
        vx: 0,
        vy: 0,
        maxSpeed: 3 + level * 0.5,
        maxAccel: 20,
        drag: 4,
        arrivalRadius: 4,
        attackRadius: 0.6
    };

    survivalTime = 0;
}

function startGame() {

    if (gameRunning) return;

    gameRunning = true;
    level = 1;
    score = 0;

    resetGame();

    if (survivalInterval) clearInterval(survivalInterval);

    survivalInterval = setInterval(() => {
        survivalTime++;
    }, 1000);
}

/* =========================================
   MOVEMENT
========================================= */

function tryMove(nx, ny) {
    if (
        map[Math.floor(ny)] &&
        map[Math.floor(ny)][Math.floor(nx)] === "0"
    ) {
        player.x = nx;
        player.y = ny;
    }
}

function movePlayer(dt) {

    const speed = 3 * dt;

    if (keys["w"]) {
        tryMove(
            player.x + Math.cos(player.angle) * speed,
            player.y + Math.sin(player.angle) * speed
        );
    }

    if (keys["s"]) {
        tryMove(
            player.x - Math.cos(player.angle) * speed,
            player.y - Math.sin(player.angle) * speed
        );
    }

    if (keys["a"]) player.angle -= 2 * dt;
    if (keys["d"]) player.angle += 2 * dt;
}

/* =========================================
   MONSTER STEERING AI
========================================= */

function moveMonster(dt) {

    const dx = player.x - monster.x;
    const dy = player.y - monster.y;
    const dist = Math.hypot(dx, dy) || 0.0001;

    const desiredSpeed = dist < monster.arrivalRadius
        ? monster.maxSpeed * (dist / monster.arrivalRadius)
        : monster.maxSpeed;

    const desiredVX = (dx / dist) * desiredSpeed;
    const desiredVY = (dy / dist) * desiredSpeed;

    const steerX = desiredVX - monster.vx;
    const steerY = desiredVY - monster.vy;

    const steerMag = Math.hypot(steerX, steerY) || 1;

    const ax = (steerX / steerMag) *
        Math.min(steerMag, monster.maxAccel);
    const ay = (steerY / steerMag) *
        Math.min(steerMag, monster.maxAccel);

    monster.vx += ax * dt;
    monster.vy += ay * dt;

    monster.vx *= (1 - monster.drag * dt);
    monster.vy *= (1 - monster.drag * dt);

    const vmag = Math.hypot(monster.vx, monster.vy);

    if (vmag > monster.maxSpeed) {
        monster.vx = (monster.vx / vmag) * monster.maxSpeed;
        monster.vy = (monster.vy / vmag) * monster.maxSpeed;
    }

    const nx = monster.x + monster.vx * dt;
    const ny = monster.y + monster.vy * dt;

    // Maze collision
    if (
        map[Math.floor(ny)] &&
        map[Math.floor(ny)][Math.floor(nx)] === "0"
    ) {
        monster.x = nx;
        monster.y = ny;
    }

    if (dist < monster.attackRadius) {
        gameRunning = false;
    }
}

/* =========================================
   FLOOR
========================================= */

function drawBrickFloor() {

    for (let y = canvas.height / 2; y < canvas.height; y++) {

        const perspective =
            (y - canvas.height / 2) / (canvas.height / 2);

        for (let x = 0; x < canvas.width; x += 4) {

            const shade = Math.max(0.3, 1 - perspective);

            ctx.fillStyle =
                `rgb(${160 * shade}, ${40 * shade}, ${30 * shade})`;

            ctx.fillRect(x, y, 4, 1);
        }
    }
}

/* =========================================
   3D RENDER
========================================= */

function draw3D() {

    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
    sky.addColorStop(0, "#4da6ff");
    sky.addColorStop(1, "#87ceeb");

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

    drawBrickFloor();

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

        const shade =
            1 - Math.min(correctedDist / 18, 1);

        const grey = Math.floor(180 * shade);

        ctx.fillStyle = `rgb(${grey}, ${grey}, ${grey})`;

        ctx.fillRect(
            x,
            (canvas.height - wallHeight) / 2,
            1,
            wallHeight
        );
    }

    drawHUD();
}

/* =========================================
   HUD
========================================= */

function drawHUD() {

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";

    ctx.fillText(`Level: ${level}`, 20, 40);
    ctx.fillText(`Time: ${survivalTime}`, 20, 65);
    ctx.fillText(`Score: ${score}`, 20, 90);
}

/* =========================================
   GAME LOOP (Delta Time)
========================================= */

let lastTime = 0;

function gameLoop(timestamp = 0) {

    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameRunning) {

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#00ff66";
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
            "LABYRINTH",
            canvas.width / 2,
            canvas.height / 2 - 40
        );

        ctx.font = "20px Arial";
        ctx.fillText(
            "Press ENTER to Start",
            canvas.width / 2,
            canvas.height / 2 + 20
        );

        requestAnimationFrame(gameLoop);
        return;
    }

    movePlayer(dt);
    moveMonster(dt);
    draw3D();

    requestAnimationFrame(gameLoop);
}

gameLoop();