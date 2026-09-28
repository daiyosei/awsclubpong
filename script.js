const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");
const gameOverHtml = document.getElementById("gameOver")
const scoreHtml = document.getElementById("score")
const highScoreHtml = document.getElementById("high")
const retryBtnHtml = document.getElementById("retry")
const grazeHtml = document.getElementById("graze")
const enemyGoalHtml = document.getElementById("enemyGoal")
const playerGoalHtml = document.getElementById("playerGoal")
const easyBtnHtml = document.getElementById("Easy")
const normalBtnHtml = document.getElementById("Normal")
const hardBtnHtml = document.getElementById("Hard")
const lunaticBtnHtml = document.getElementById("Lunatic")
const difficulty = document.getElementById("mode")
const easyModoHtml = document.getElementById("easyModo")

const WIDTH = 320;
const HEIGHT = 200;
const MARGIN = 20;
const WIDTH_PLAYER = 2;
const HEIGHT_PLAYER = 20
const BALL_SIZE = 3;

const SPEED = 0.07;

const GREEN = [0, 255, 0];
const RED = [255, 0, 0];
const WHITE = [255,255,255];

const image = ctx.createImageData(WIDTH, HEIGHT);
const pixels = image.data; // rgba array

let gameOver = false;
let ballSpeed = 2;
let ballVelocity = [2**(1/2), 2**(1/2)];  // direction vector
let ballPosition = [WIDTH/2, HEIGHT/2];
let playerPosition = HEIGHT / 2;
let enemyPosition = HEIGHT / 2;
let time = 0;
let dt = 0;
let keyUpPress = false;
let keyDownPress = false;
let inFocus = false;
let score = 0;
let playerGoal = 0;
let enemyGoal = 0;
let grazeCount = 0;
let highScore = 0;
let timeSinceBallSpeedChange = 0;
let enemySpeedModifier = 0.7;

function clamp(val, minima, maxima) {
    if (val < minima) {
        return minima
    } else if (val > maxima) {
        return maxima
    } else {
        return val
    }
}

function changeMagnitudeVector(Vector2, magnitude) {
    let i_cap = Vector2[0];
    let j_cap = Vector2[1];
    let r = (i_cap ** 2 + j_cap ** 2) ** (1 / 2);
    return [i_cap / r * magnitude, j_cap / r * magnitude];
}

function rotateVector2(Vector2, degreeInRadian) {
    let i_cap = Vector2[0];
    let j_cap = Vector2[1];
    return [i_cap * Math.cos(degreeInRadian) - j_cap * Math.sin(degreeInRadian),
        i_cap * Math.sin(degreeInRadian) + j_cap * Math.cos(degreeInRadian)]
}

function ballCollideY(Vector2, deviation) {
    // deviation: -1 (top edge) .. 0 (center) .. 1 (bottom edge)
    const speed = Math.hypot(Vector2[0], Vector2[1]);
    const angle = deviation * Math.PI / 4;        // max 45 degre wrt horizontal
    const dir = Vector2[0] > 0 ? -1 : 1;          // reverse horizontal direction
    return [dir * speed * Math.cos(angle), speed * Math.sin(angle)];
}

function ballCollideX(Vector2) {
    return [Vector2[0], Vector2[1] * -1];
}

function pixel(x, y, r, g, b) {
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) {
        return;
    }

    const index = (y * WIDTH + x) * 4;

    pixels[index + 0] = r;
    pixels[index + 1] = g;
    pixels[index + 2] = b;
    pixels[index + 3] = 255;
}

function pixelClr(x,y,ColorArr) {
    pixel(x,y,ColorArr[0],ColorArr[1],ColorArr[2]);
}

function drawRectangle(x, y, w, h, ColorArr) {
    for (let i = 0; i < w; i++) {
        for (let j = 0; j < h; j++) {
            pixelClr(x + i, y + j, ColorArr);
        }
    }
}

function clear(r, g, b) {
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
        const index = (y * WIDTH + x) * 4;

        pixels[index + 0] = r;
        pixels[index + 1] = g;
        pixels[index + 2] = b;
        pixels[index + 3] = 255;
        }
    }
}

function resetGameState() {
    gameOver = false;
    ballSpeed = 2;
    ballVelocity = [2**(1/2), 2**(1/2)];  // direction vector
    ballPosition = [WIDTH/2, HEIGHT/2];
    playerPosition = HEIGHT / 2;
    enemyPosition = HEIGHT / 2;
    time = 0;
    dt = 0;
    keyUpPress = false;
    keyDownPress = false;
    score = 0;
    grazeCount = 0;
}

document.addEventListener('keydown', function(event) {
    if (event.key == 'ArrowUp') {
        keyUpPress = true;
    } else if (event.key == 'ArrowDown') {
        keyDownPress = true;
    } else if(event.code == 'ShiftLeft') {
        inFocus = true;
    }
});
document.addEventListener('keyup', function(event) {
    if (event.key == 'ArrowUp') {
        keyUpPress = false;
    } else if (event.key == 'ArrowDown') {
        keyDownPress = false;
    } else if (event.key.toLowerCase() == 'z') {
        resetGameState();
    } else if(event.code == 'ShiftLeft') {
        inFocus = false;
    }
});

retryBtnHtml.addEventListener('click', function (event) {
    resetGameState();
})
easyBtnHtml.addEventListener('click', function(event) {
    enemySpeedModifier = 0.3;
    easyModoHtml.style.display = "initial";
    difficulty.innerText = "Easy";
})
normalBtnHtml.addEventListener('click', function(event) {
    enemySpeedModifier = 0.6;
    easyModoHtml.style.display = "none";
    difficulty.innerText = "Normal";
})
hardBtnHtml.addEventListener('click', function(event) {
    enemySpeedModifier = 1.0;
    easyModoHtml.style.display = "none";
    difficulty.innerText = "Hard";
})
lunaticBtnHtml.addEventListener('click', function(event) {
    enemySpeedModifier = 1.2;
    easyModoHtml.style.display = "none";
    difficulty.innerText = "Lunatic";
})
function update() {
    // console.log(dt);
    // console.log(ballPosition, ballVelocity);
    // ballSpeed = 2 * time ** (1 / 2);
    scoreHtml.innerText = score;
    highScoreHtml.innerText = highScore;
    grazeHtml.innerText = grazeCount;
    if (score > highScore) { highScore = score; }
    if (gameOver) {
        gameOverHtml.innerText = "Game Over! Press Retry or Press 'Z'";
        return -1;
    } else {
        gameOverHtml.innerText = "";
    }
    let curSpeed = SPEED
    if (inFocus) { curSpeed = SPEED * 0.3; }
    if (keyUpPress) {
        playerPosition -= curSpeed * dt;
    } else if (keyDownPress) {
        playerPosition += curSpeed * dt;
    }
    playerPosition = clamp(playerPosition, WIDTH_PLAYER / 2, HEIGHT - MARGIN - WIDTH_PLAYER / 2);

    if ((enemyPosition + HEIGHT_PLAYER/2) - ballPosition[1] < 0) {
        enemyPosition += SPEED*dt*enemySpeedModifier;
    } else if ((enemyPosition + HEIGHT_PLAYER/2) - ballPosition[1] > 0) {
        enemyPosition -= SPEED*dt*enemySpeedModifier;
    }
    enemyPosition = clamp(enemyPosition, WIDTH_PLAYER / 2, HEIGHT - MARGIN - WIDTH_PLAYER / 2);

    let dirVector = changeMagnitudeVector(ballVelocity, 1);
    ballPosition = [ballPosition[0] + ballSpeed * dirVector[0], ballPosition[1] + ballSpeed * dirVector[1]];
    if (ballVelocity[0] > 0
        && ballPosition[0] >= WIDTH - MARGIN - WIDTH_PLAYER
        && ballPosition[0] <= WIDTH - MARGIN
        && ballPosition[1] >= playerPosition - BALL_SIZE
        && ballPosition[1] <= playerPosition + HEIGHT_PLAYER + BALL_SIZE) {
        ballPosition[0] = WIDTH - MARGIN - WIDTH_PLAYER;
        let deviation = (ballPosition[1] - (HEIGHT_PLAYER / 2 + playerPosition)) / (HEIGHT_PLAYER / 2);
        ballVelocity = ballCollideY(ballVelocity, deviation);
        if (Math.abs(deviation) > 0.75) {
            score = score + 2;
            grazeCount++;
        }
        score++;
    }
    else if (ballVelocity[0] < 0
        && ballPosition[0] <= MARGIN + WIDTH_PLAYER
        && ballPosition[0] >= MARGIN
        && ballPosition[1] >= enemyPosition - BALL_SIZE
        && ballPosition[1] <= enemyPosition + HEIGHT_PLAYER + BALL_SIZE) {
        ballPosition[0] = MARGIN + WIDTH_PLAYER;
        const deviation = (ballPosition[1] - (enemyPosition + HEIGHT_PLAYER / 2)) / (HEIGHT_PLAYER / 2);
        ballVelocity = ballCollideY(ballVelocity, deviation);
    }
    if (ballPosition[0] > WIDTH - MARGIN - 2*WIDTH_PLAYER || ballPosition[0] < MARGIN + WIDTH_PLAYER) {
        // console.log("here2");
    }
    else if (ballPosition[1] < 0 || ballPosition[1] > HEIGHT) {
        ballVelocity = ballCollideX(ballVelocity);
    }

    ballPosition = [
        ballPosition[0],
        clamp(ballPosition[1], 0, HEIGHT)
    ];

    if (ballPosition[0] < 0 || ballPosition[0] > WIDTH) {
        if (ballPosition[0] < 0) {
            playerGoal++;
            playerGoalHtml.innerText = playerGoal;
        } else {
            enemyGoal++;
            enemyGoalHtml.innerText = enemyGoal;
        }
        console.log("Game over");
        gameOver = true;
    }
    // Round cordinates otherwise framebuffer has memory issue
    playerPosition = Math.round(playerPosition);
    enemyPosition = Math.round(enemyPosition);
    // enemyPosition = enemyPosition >> 0;
    ballPosition = [Math.round(ballPosition[0]), Math.round(ballPosition[1])];
    time++;
    return 0;
}


function render() {
    clear(0,0,0);

    drawRectangle(WIDTH-MARGIN, playerPosition, WIDTH_PLAYER, HEIGHT_PLAYER, RED);
    drawRectangle(MARGIN, enemyPosition, WIDTH_PLAYER, HEIGHT_PLAYER, GREEN);
    drawRectangle(ballPosition[0], ballPosition[1], BALL_SIZE, BALL_SIZE, WHITE);
    ctx.putImageData(image, 0, 0);
}

let last = performance.now()
function frame(now) {
    dt = now - last; // in ms -> will return 16 for standard 60 fps
    update();
    render();
    last = now
    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
