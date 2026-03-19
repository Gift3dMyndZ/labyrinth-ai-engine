/* =========================================
   CANVAS FULLSCREEN SETUP
========================================= */
console.log("GAME JS LOADED");

document.addEventListener("keydown", (e) => {
    console.log("Key pressed:", e.key);
});
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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

/* =========================================
   RAYCAST SETTINGS
========================================= */

const FOV = Math.PI / 3;
const MAX_DEPTH = 25;

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

    const size = 25 + Math.min(level * 2, 20);
    generateMaze(size, size);

    player = { x: 1.5, y: 1.5, angle: 0 };

    monster = {
        x: MAP_W - 3,
        y: 1,
        speed: 0.015 + level * 0.003
    };

    survivalTime = 0;
}

/* =========================================
   INPUT
========================================= */

let keys = {};

document.addEventListener("keydown", e => {

    keys[e.key.toLowerCase()] = true;

    // ENTER starts the game
    if (e.key === "Enter" && !gameRunning) {
        startGame();
    }
});

document.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

/* =========================================
   START GAME FUNCTION
========================================= */

function startGame() {

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
    if (map[Math.floor(ny)] &&
        map[Math.floor(ny)][Math.floor(nx)] === "0") {
        player.x = nx;
        player.y = ny;
    }
}

function movePlayer() {

    const speed = 0.08;

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

    if (keys["a"]) player.angle -= 0.05;
    if (keys["d"]) player.angle += 0.05;
}

/* =========================================
   MONSTER AI
========================================= */

function moveMonster() {

    const dx = player.x - monster.x;
    const dy = player.y - monster.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 12) {
        monster.x += Math.sign(dx) * monster.speed;
        monster.y += Math.sign(dy) * monster.speed;
    }

    if (dist < 0.6) {
        gameRunning = false;
    }
}

/* =========================================
   FLOOR
========================================= */

function drawBrickFloor() {

    for (let y = canvas.height / 2; y < canvas.height; y++) {

        const perspective = (y - canvas.height / 2) / (canvas.height / 2);

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

    ctx.fillText("LABYRINTH", 20, 30);
    ctx.fillText(`Level: ${level}`, 20, 60);
    ctx.fillText(`Time: ${survivalTime}`, 20, 85);
    ctx.fillText(`Score: ${score}`, 20, 110);
}

/* =========================================
   GAME LOOP
========================================= */

function gameLoop() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameRunning) {

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#00ff66";
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.fillText("LABYRINTH",
            canvas.width / 2,
            canvas.height / 2 - 40);

        ctx.font = "20px Arial";
        ctx.fillText("Press ENTER to Start",
            canvas.width / 2,
            canvas.height / 2 + 20);

        requestAnimationFrame(gameLoop);
        return;
    }

    movePlayer();
    moveMonster();
    draw3D();

    requestAnimationFrame(gameLoop);
}

gameLoop();