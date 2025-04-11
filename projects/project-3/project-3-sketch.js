// game variables
let game;
let len_x = 40;
let len_y = 40;

// mouse control variables
let previous_x;
let previous_y;

// state control variables
let paused = false;
let pauseLength = 10;
let debug = false;

// variables to keep track of history statistics
let cell_count_history = [];
let max_history_length = 50;
let cell_count = 0;
let abs_max = 0;

// integration starts here
// variables to keep track
let canvasHeight = 400;
let canvasWidth = 400;

// function for resizing
function windowResized() {
    container = document.getElementById('canvas-container');
    canvasWidth = container.getBoundingClientRect().width;
    canvasHeight = canvasWidth;

    resizeCanvas(canvasWidth, canvasHeight);
}

// setup function
function setup() {
    // start up
    container = document.getElementById('canvas-container');
    const canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent(container);
    windowResized();
    // integration ends here

    // calculate window size
    mi = min(windowWidth, windowHeight);

    // innitialize game
    game = initGame(len_x, len_y);
}

// main loop function
function draw() {
    // refresh background
    background(0);

    // draw the game
    drawGame(len_x, len_y);

    // step the simulation every pauseLength amount of frames
    if (frameCount % pauseLength == 0 && !paused) {
        stepGame(len_x, len_y);
    }

    // draw informational text
    drawPauseText();
    drawText();

    // draw statistics when debug mode is true
    if (debug) {
        push();
        strokeWeight(4);
        stroke(232, 219, 200);
        fill(0, 220);

        m = 10;
        h = max(height / 5, 50)
        translate(m, 13 + m);
        rect(0, 0, width - 2 * m, h);
        abs_max = max(max(cell_count_history), abs_max);

        for (let n = 0; n < cell_count_history.length - 1; n++) {
            h0 = cell_count_history[n];
            h1 = cell_count_history[n + 1];

            h0 = round(map(h0, 0, abs_max, 0, h));
            h1 = round(map(h1, 0, abs_max, 0, h));

            x0_pos = round(map(n, 0, cell_count_history.length - 1, 0, width - 2 * m));
            x1_pos = round(map(n + 1, 0, cell_count_history.length - 1, 0, width - 2 * m));

            stroke(232, 219, 200);
            line(x0_pos, h - h0, x1_pos, h - h1);

            noStroke();
            fill(232, 219, 200, 200);

            beginShape();

            vertex(x0_pos, h - h0);
            vertex(x1_pos, h - h1);
            vertex(x1_pos, h);
            vertex(x0_pos, h);

            endShape();
        }

        pop();
    }
}

// draw pause text in the middle of the screen
function drawPauseText() {
    push();
    textAlign(CENTER, CENTER);
    textSize(30);
    strokeWeight(3);
    stroke(0);
    fill(232, 219, 200);
    if (paused) {
        text("PAUSED", width / 2, height / 2);
    }
    pop();
}

// draw all functional text
function drawText() {
    push();
    fill(255, 200);
    stroke(0, 200);
    strokeWeight(2);
    textSize(13);
    textAlign(LEFT, TOP);

    text("FPS: " + frameRate(), 0, 0);

    textAlign(RIGHT, TOP);

    textAlign(LEFT, BOTTOM);
    text("SPACE: Pause Simulation", 0, height - 48);
    text("Mouse Click: Add/Remove cell", 0, height - 36);
    text("R: Reset", 0, height - 24);
    text("S: Statistics", 0, height - 12);
    text("Mouse Wheel: Change Step Speed", 0, height - 0);

    textAlign(RIGHT, BOTTOM);
    textSize(10);
    text("version 3.0 @ 12.29.24", width, height);

    pop();
}

// handle mouse press event
function mousePressed() {
    // calculate x,y positions from current mouse position
    x = floor(min(max(0, mouseX), width - 1) * len_x / width);
    y = floor(min(max(0, mouseY), height - 1) * len_y / height);

    // flip the cell value
    if (game[x][y] == 1) {
        game[x][y] = 0;
    } else {
        game[x][y] = 1;
    }
}

// handle mouse drag event
function mouseDragged() {
    // calculate x,y value from mouse position
    x = floor(min(max(0, mouseX), width - 1) * len_x / width);
    y = floor(min(max(0, mouseY), height - 1) * len_y / height);

    // flip the cell if it already has not been dragged over
    if (previous_x != x || previous_y != y) {
        if (game[x][y] == 1) {
            game[x][y] = 0;
        } else {
            game[x][y] = 1;
        }
    }

    // keep track of last flipped cell so it doesn't constantly flip
    previous_x = x;
    previous_y = y;
}

// handle mouse wheel scroll event
function mouseWheel(event) {
    // mouse wheel control
    // d = event.delta / 100
    if (!((mouseX < 0 || mouseX > width) || (mouseY < 0 || mouseY > height))) {
        if (event.delta < 0) {
            pauseLength++;
        } else {
            pauseLength--;
        }

        pauseLength = max(1, pauseLength);
        return false;
    }

    return true;
}

// handle key press logic
function keyPressed() {
    if (keyCode == 32) {
        // space
        paused = !paused;
    }

    if (keyCode == 82) {
        // r
        initGame(len_x, len_y);
        abs_max = 0;
    }

    if (keyCode == 83) {
        // s
        debug = !debug;
    }

    return true;
}

// step the game by 1 step (main logic of the game)
function stepGame(len_x, len_y) {
    // reset current cell count
    cell_count = 0;
    // innitialize future state
    futureGame = [];

    // loop through all columns
    for (let x = 0; x < len_x; x++) {
        futureGame[x] = [];
        // innitialize future game to a 2D array
        // loop through all cells
        for (let y = 0; y < len_y; y++) {
            // calculate a cell's neighbour count emmidietly since its always needed
            let count = neighbourCount(x, y, len_x, len_y);

            // check if the current cell is dead or alive
            if (game[x][y] == 1) {
                // if cell is alive check if it has less than 2 or more than 3
                if (count < 2 || count > 3) {
                    // if its the case it will die
                    futureGame[x][y] = 0;
                } else {
                    // otherwise it has 2 or 3 cells and therefor it will live
                    futureGame[x][y] = 1;
                    // increase current cell count by 1
                    cell_count++;
                }
            } else {
                // if the cell is dead check if it can become alive
                if (count == 3) {
                    // if it has exactly 3 neightbours make it alive
                    futureGame[x][y] = 1;
                    // increase current cell count by 1
                    cell_count++;
                } else {
                    // otherwise the cell stays dead
                    futureGame[x][y] = 0;
                }
            }
        }
    }

    // loop thorugh future state and set it to current state
    for (let x = 0; x < len_x; x++) {
        for (let y = 0; y < len_y; y++) {
            game[x][y] = futureGame[x][y];
        }
    }

    // add current cell count to history
    cell_count_history.push(cell_count);
    if (cell_count_history.length > max_history_length) {
        // remove the first entry so the history stays below the max history length
        cell_count_history.shift();
    }
}

// helper function, reterns a cells neightbour count (wrapped)
function neighbourCount(x_pos, y_pos, len_x, len_y) {
    // all possible neighbour offset positions, a total of 8 since diagonals count
    const directions = [
        [-1, 1],
        [0, 1],
        [1, 1],
        [1, 0],
        [1, -1],
        [0, -1],
        [-1, -1],
        [-1, 0]
    ];

    // set innitial count to 0
    count = 0;
    // loop through all possible neightbour directions
    directions.forEach((dir) => {
        // apply the direction offset and add row length to account for negative numbers
        // take the modulus so it wraps around
        new_x = (len_x + x_pos + dir[0]) % len_x;
        new_y = (len_y + y_pos + dir[1]) % len_y;

        // increase the count by the game cell value (+0 => dead, +1 => alive)
        count += game[new_x][new_y];
    });

    // return the final count
    return count;
}

// draw game at current state
function drawGame(len_x, len_y) {
    // loop through all cells in the game and draw them
    push();
    stroke(232, 219, 200);
    strokeWeight(1);

    let dx = width / len_x;
    let dy = height / len_y;

    for (let x = 0; x < len_x; x++) {
        for (let y = 0; y < len_y; y++) {
            if (game[x][y] == 1) {
                fill(232, 219, 200);
            } else {
                fill(0);
            }
            rect(x * dx, y * dy, dx, dy);
        }
    }

    pop();
}

// innitialize game
function initGame(len_x, len_y) {
    // create new game array and innitialize it randomly
    game = [];

    for (let x = 0; x < len_x; x++) {
        game[x] = [];
        for (let y = 0; y < len_y; y++) {
            game[x][y] = random() < 0.2 ? 1 : 0;
        }
    }

    return game;
}