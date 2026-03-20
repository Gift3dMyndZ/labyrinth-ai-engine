/* =========================================
   LABYRINTH – TEXTURED FLOOR + MINIMAP
========================================= */

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
   MINIMAP SETTINGS
========================================= */

const MINIMAP_SIZE = 180;
const MINIMAP_MARGIN = 20;

/* =========================================
   FLOOR – PROCEDURAL BRICK TEXTURE
========================================= */

function clamp255(v) { return Math.max(0, Math.min(255, v | 0)); }
function fract(v) { return v - Math.floor(v); }

function createBrickTexture({
    texW = 512,
    texH = 512,
    bricksX = 16,
    bricksY = 12,
    mortarPx = 3,
    baseColor = { r: 165, g: 50, b: 35 },
    mortarColor = { r: 150, g: 150, b: 150 },
} = {}) {

    const off = document.createElement("canvas");
    off.width = texW;
    off.height = texH;
    const octx = off.getContext("2d");

    octx.fillStyle = `rgb(${mortarColor.r}, ${mortarColor.g}, ${mortarColor.b})`;
    octx.fillRect(0, 0, texW, texH);

    const bw = Math.floor(texW / bricksX);
    const bh = Math.floor(texH / bricksY);

    for (let y = 0; y < bricksY; y++) {
        const offset = (y % 2) ? Math.floor(bw / 2) : 0;

        for (let x = -1; x <= bricksX; x++) {
            const bx = x * bw + offset;
            const by = y * bh;
            if (bx + bw < 0 || bx > texW) continue;

            const id = (x * 73856093) ^ (y * 19349663);
            const rng = fract(Math.sin(id) * 43758.5453);
            const shade = 0.85 + rng * 0.25;

            const r = clamp255(baseColor.r * shade);
            const g = clamp255(baseColor.g * shade);
            const b = clamp255(baseColor.b * shade);

            octx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            octx.fillRect(
                bx + mortarPx,
                by + mortarPx,
                bw - mortarPx * 2,
                bh - mortarPx * 2
            );
        }
    }

    return off;
}

const brickTexture = createBrickTexture();

/* =========================================
   GAME STATE
========================================= */

let gameRunning = false;

let map = [];
let MAP_W;
let MAP_H;
let goal;

let player;
let monster;

const FOV = Math.PI / 3;
const MAX_DEPTH = 25;

/* =========================================
   INPUT
========================================= */

let keys = {};

window.addEventListener("load", startGame);

document.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
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

    let entranceX = 1;
    for (let x = 1; x < width - 1; x += 2) {
        if (map[1][x] === "0") { entranceX = x; break; }
    }
    map[0][entranceX] = "0";

    let exitX = width - 2;
    for (let x = width - 2; x >= 1; x -= 2) {
        if (map[height - 2][x] === "0") { exitX = x; break; }
    }
    map[height - 1][exitX] = "0";

    return {
        start: { x: entranceX + 0.5, y: 1.5 },
        goal:  { x: exitX + 0.5, y: height - 1.5 }
    };
}

/* =========================================
   START / RESET
========================================= */

function resetGame() {

    const mazeData = generateMaze(35, 35);

    player = {
        x: mazeData.start.x,
        y: mazeData.start.y,
        angle: Math.PI / 2
    };

    goal = mazeData.goal;

    monster = {
        x: goal.x,
        y: goal.y - 2,
        vx: 0,
        vy: 0,
        maxSpeed: 4,
        maxAccel: 20,
        drag: 4,
        arrivalRadius: 4,
        attackRadius: 0.6
    };
}

function startGame() {

    if (gameRunning) return;

    gameRunning = true;
    resetGame();
    requestAnimationFrame(gameLoop);
}

/* =========================================
   MOVEMENT + MONSTER
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

function moveMonster(dt) {

    const dx = player.x - monster.x;
    const dy = player.y - monster.y;
    const dist = Math.hypot(dx, dy) || 0.0001;

    const desiredSpeed =
        dist < monster.arrivalRadius
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

    const nx = monster.x + monster.vx * dt;
    const ny = monster.y + monster.vy * dt;

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
   RENDER
========================================= */

function drawBrickFloorFromTexture() {

    const horizon = canvas.height / 2;

    for (let y = horizon; y < canvas.height; y++) {

        const perspective = (y - horizon) / horizon;
        const rowDistance = 1 / (perspective + 0.0001);

        const floorStepX =
            rowDistance * Math.cos(player.angle - FOV / 2) / canvas.width;

        const floorStepY =
            rowDistance * Math.sin(player.angle - FOV / 2) / canvas.width;

        let floorX =
            player.x + rowDistance *
            Math.cos(player.angle - FOV / 2);

        let floorY =
            player.y + rowDistance *
            Math.sin(player.angle - FOV / 2);

        for (let x = 0; x < canvas.width; x++) {

            const tx =
                Math.floor(fract(floorX) * brickTexture.width);

            const ty =
                Math.floor(fract(floorY) * brickTexture.height);

            ctx.drawImage(
                brickTexture,
                tx, ty, 1, 1,
                x, y, 1, 1
            );

            floorX += floorStepX;
            floorY += floorStepY;
        }
    }
}

function drawMinimap() {

    const scale = MINIMAP_SIZE / MAP_W;
    const startX = canvas.width - MINIMAP_SIZE - MINIMAP_MARGIN;
    const startY = MINIMAP_MARGIN;

    ctx.fillStyle = "black";
    ctx.fillRect(startX, startY, MINIMAP_SIZE, MINIMAP_SIZE);

    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            if (map[y][x] === "1") {
                ctx.fillStyle = "#00ff99";
                ctx.fillRect(
                    startX + x * scale,
                    startY + y * scale,
                    scale,
                    scale
                );
            }
        }
    }

    ctx.fillStyle = "gold";
    ctx.beginPath();
    ctx.arc(startX + goal.x * scale, startY + goal.y * scale, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(startX + monster.x * scale, startY + monster.y * scale, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#00ff99";
    ctx.beginPath();
    ctx.arc(startX + player.x * scale, startY + player.y * scale, 4, 0, Math.PI * 2);
    ctx.fill();
}

function draw3D() {

    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
    sky.addColorStop(0, "#4da6ff");
    sky.addColorStop(1, "#87ceeb");

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

    drawBrickFloorFromTexture();

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

    drawMinimap();
}

/* =========================================
   GAME LOOP
========================================= */

let lastTime = 0;

function gameLoop(timestamp = 0) {

    let dt = (timestamp - lastTime) / 1000;
    dt = Math.min(dt, 0.1);
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameRunning) {
        requestAnimationFrame(gameLoop);
        return;
    }

    movePlayer(dt);
    moveMonster(dt);
    draw3D();

    requestAnimationFrame(gameLoop);
}