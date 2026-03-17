const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const tileSize = 20;
const rows = 20;
const cols = 20;

let survivalTime = 0;
let level = 1;
let score = 0;
let gameStarted = false;
let gameOver = false;
let countdown = 10;
let countdownInterval;

const maze = [
"11111111111111111111",
"10000000000000000001",
"10111101111101111101",
"10000100000100000101",
"11110111110111110101",
"10000010000010000001",
"10111110111110111101",
"10000000100000100001",
"11111110101111101111",
"10000000100000000001",
"10111111101111111101",
"10000000000000000001",
"11110111111111110111",
"10000100000000000101",
"10111101111111110101",
"10000001000000000101",
"11111111011111111101",
"10000000000000000001",
"10000000000000000001",
"11111111111111111111"
];

let player;
let monster;
const exitTile = { x: 18, y: 1 };

function loadHighScore() {
    return parseInt(localStorage.getItem("labyrinthHighScore")) || 0;
}

function saveHighScore(newScore) {
    const high = loadHighScore();
    if (newScore > high) {
        localStorage.setItem("labyrinthHighScore", newScore);
        document.getElementById("highScore").innerText = newScore;
    }
}

function updateLeaderboard(finalScore) {
    let scores = JSON.parse(localStorage.getItem("labyrinthLeaderboard")) || [];
    scores.push(finalScore);
    scores.sort((a,b) => b - a);
    scores = scores.slice(0,5);
    localStorage.setItem("labyrinthLeaderboard", JSON.stringify(scores));
    renderLeaderboard();
}

function renderLeaderboard() {
    let scores = JSON.parse(localStorage.getItem("labyrinthLeaderboard")) || [];
    const list = document.getElementById("leaderboardList");
    list.innerHTML = "";
    scores.forEach(score => {
        const li = document.createElement("li");
        li.innerText = score;
        list.appendChild(li);
    });
}

async function sendTelemetry(eventType) {
    try {
        await fetch("http://localhost:8000/game_event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                event: eventType,
                level,
                score,
                survivalTime,
                timestamp: new Date().toISOString()
            })
        });
    } catch (err) {
        console.log("Telemetry failed");
    }
}

function resetGame(fullReset=false) {
    if (fullReset) {
        level = 1;
        score = 0;
    }

    player = { x: 1, y: 1 };
    monster = { x: 18, y: 18, speed: 0.12 + level * 0.02 };
    survivalTime = 0;
    gameOver = false;

    document.getElementById("level").innerText = level;
    document.getElementById("score").innerText = score;
    document.getElementById("time").innerText = survivalTime;
}

function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    for (let y=0;y<rows;y++) {
        for (let x=0;x<cols;x++) {
            if (maze[y][x] === "1") {
                ctx.fillStyle="#003311";
                ctx.fillRect(x*tileSize,y*tileSize,tileSize,tileSize);
            }
        }
    }

    ctx.fillStyle="#00ffff";
    ctx.fillRect(exitTile.x*tileSize,exitTile.y*tileSize,tileSize,tileSize);

    ctx.fillStyle="#ccffcc";
    ctx.fillRect(player.x*tileSize,player.y*tileSize,tileSize,tileSize);

    ctx.fillStyle="#ff0033";
    ctx.fillRect(monster.x*tileSize,monster.y*tileSize,tileSize,tileSize);
}

function moveMonster() {
    if (Math.random() > monster.speed) return;
    let dx = player.x - monster.x;
    let dy = player.y - monster.y;

    let newX = monster.x + Math.sign(dx);
    let newY = monster.y + Math.sign(dy);

    if (maze[newY][newX] === "0") {
        monster.x = newX;
        monster.y = newY;
    }
}

function gameLoop() {
    if (!gameStarted || gameOver) return;

    draw();
    moveMonster();

    if (player.x === exitTile.x && player.y === exitTile.y) {
        gameOver = true;
        score += 100 * level;
        saveHighScore(score);
        updateLeaderboard(score);
        sendTelemetry("win");
        level++;
        startCountdown(false);
        return;
    }

    if (player.x === monster.x && player.y === monster.y) {
        gameOver = true;
        saveHighScore(score);
        updateLeaderboard(score);
        sendTelemetry("loss");
        startCountdown(true);
        return;
    }

    requestAnimationFrame(gameLoop);
}

function startCountdown(fullReset) {
    countdown = 10;
    document.getElementById("resultScreen").classList.remove("hidden");

    countdownInterval = setInterval(() => {
        countdown--;
        document.getElementById("countdown").innerText = countdown;

        if (countdown <= 0) {
            clearInterval(countdownInterval);
            document.getElementById("resultScreen").classList.add("hidden");
            resetGame(fullReset);
            gameLoop();
        }
    },1000);
}

document.addEventListener("keydown", e=>{
    if (e.key === "Enter") {
        if (!gameStarted) {
            document.getElementById("attractScreen").classList.add("hidden");
            gameStarted = true;
            resetGame(true);
            gameLoop();
        } else if (gameOver) {
            clearInterval(countdownInterval);
            document.getElementById("resultScreen").classList.add("hidden");
            resetGame(false);
            gameLoop();
        }
    }

    if (!gameStarted || gameOver) return;

    let newX = player.x;
    let newY = player.y;

    if (e.key==="ArrowUp") newY--;
    if (e.key==="ArrowDown") newY++;
    if (e.key==="ArrowLeft") newX--;
    if (e.key==="ArrowRight") newX++;

    if (maze[newY][newX] === "0") {
        player.x = newX;
        player.y = newY;
    }
});

setInterval(()=>{
    if(gameStarted && !gameOver){
        survivalTime++;
        document.getElementById("time").innerText = survivalTime;
    }
},1000);

document.getElementById("highScore").innerText = loadHighScore();
renderLeaderboard();