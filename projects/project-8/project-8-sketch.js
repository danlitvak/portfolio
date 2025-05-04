// shift + alt + f -> format document nicely

// integration starts here
// variables to keep track
let canvasHeight = 400;
let canvasWidth = 400;
let darkMode = document.body.classList.contains("dark-mode");
let currentBackground = 0;

// function for resizing
function windowResized() {
    container = document.getElementById('canvas-container');
    canvasWidth = container.getBoundingClientRect().width;
    canvasHeight = canvasWidth; // square canvas
    resizeCanvas(canvasWidth, canvasHeight);
}

function draw_background() {
    // Handle dark mode background transition
    darkMode = document.body.classList.contains("dark-mode");
    if (darkMode) {
        currentBackground = lerp(currentBackground, 0, 0.1);
    } else {
        currentBackground = lerp(currentBackground, 200, 0.1);
    }

    background(currentBackground);
}

function setup() {
    // start up
    container = document.getElementById('canvas-container');
    const canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent(container);
    windowResized();
    // integration ends here

    generate_path_vectors(); // generate path vectors
}


let dim = { x: 5, y: 5 };
let start_pos = { x: 0, y: 0 };
let walls = [{ x: 3, y: 3 }, { x: 2, y: 3 }, { x: 1, y: 3 }, { x: 3, y: 1 }, { x: 2, y: 1 }];
let path_vectors;

function draw() {
    draw_background();

    draw_grid(0, 0, width, height, 10);
    draw_path_vectors(0, 0, width, height, 10);
}

function generate_path_vectors() {
    path_vectors = new Map();

    for (let x = 0; x < dim.x; x++) {
        for (let y = 0; y < dim.y; y++) {
            if (walls.some(wall => wall.x === x && wall.y === y)) {
                continue; // skip walls
            }

            let key = `${x},${y}`; // create a unique key for each position
            let pos = { x: x, y: y }; // create a position object for each position

            let north = (y > 0 && !walls.some(wall => wall.x === x && wall.y === y - 1));
            let south = (y < dim.y - 1 && !walls.some(wall => wall.x === x && wall.y === y + 1));
            let east = (x < dim.x - 1 && !walls.some(wall => wall.x === x + 1 && wall.y === y));
            let west = (x > 0 && !walls.some(wall => wall.x === x - 1 && wall.y === y));

            path_vectors.set(key, {
                pos: pos,
                north: north,
                south: south,
                east: east,
                west: west,
            });
        }
    }
}

function draw_path_vectors(x, y, w, h, margin) {
    push();
    stroke(255, 0, 0);
    fill(255, 0, 0);
    strokeWeight(2);

    // calculate new position and dimension after margin
    x += margin;
    y += margin;
    w -= margin * 2;
    h -= margin * 2;

    // calculate width and height of each grid cell
    let dx = w / dim.x;
    let dy = h / dim.y;

    // calculate length of each vector
    let len = min(dx, dy) / 6;

    for (let [key, value] of path_vectors) {
        let pos = value.pos;

        let i = pos.x * dx + x + dx / 2;
        let j = pos.y * dy + y + dy / 2;

        circle(i, j, len / 4); // draw circle at position

        if (value.north) {
            line(i, j, i, j - len);
        }
        if (value.south) {
            line(i, j, i, j + len);
        }
        if (value.east) {
            line(i, j, i + len, j);
        }
        if (value.west) {
            line(i, j, i - len, j);
        }
    }

    pop();
}

function draw_grid(x, y, w, h, margin) {
    push();

    // calculate new position and dimension after margin
    x += margin;
    y += margin;
    w -= margin * 2;
    h -= margin * 2;

    // calculate width and height of each grid cell
    let dx = w / dim.x;
    let dy = h / dim.y;

    // draw grid
    stroke(255);
    noFill();
    for (let i = 0; i < dim.x; i++) {
        for (let j = 0; j < dim.y; j++) {
            rect(i * dx + x, j * dy + y, dx, dy);
        }
    }


    // draw walls
    fill(255);
    for (let wall = 0; wall < walls.length; wall++) {
        let i = walls[wall].x;
        let j = walls[wall].y;

        if (i < 0 || i > dim.x - 1 || j < 0 || j > dim.y) {
            console.warn("Wall index out of range");
        }

        rect(i * dx + x, j * dy + y, dx, dy);
    }

    // draw starting position
    let i = start_pos.x;
    let j = start_pos.y;

    if (i < 0 || i > dim.x - 1 || j < 0 || j > dim.y) {
        console.warn("Start index out of range");
    }

    fill(0, 255, 0);
    rect(i * dx + x, j * dy + y, dx, dy);

    pop();
}
