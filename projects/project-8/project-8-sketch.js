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

    // generate path vectors, only happens once, doesn't need to be the fastest
    generate_path_vectors();
    // possible moves will be path vectors of head position
    add_first_state_to_queue();
}


let dim = { x: 6, y: 6 };
let start_pos = { x: 0, y: 0 };
let walls = [{ x: 3, y: 3 }, { x: 2, y: 3 }];
let path_vectors;

let queue = [];
let paths_found = [];

function draw() {
    draw_background();

    if (queue.length > 0) {
        let current_state = queue.pop();

        // check if we have found a valid path
        if (check_if_path_found(current_state.path)) {
            paths_found.push(current_state.path); // add the path to the found paths
        } else {
            // get useful references from the current state we are working on
            let path = current_state.path; // get the path from the state
            let vectors = current_state.vectors; // get the path vectors from the state
            let head = path[path.length - 1]; // get the head of the path

            let head_vector = get_path_vector(vectors, head.x, head.y); // get the path vector of the head position

            // Check all cardinal directions
            add_new_state_to_queue(path, vectors, head, head_vector.north, head.x, head.y - 1); // North
            add_new_state_to_queue(path, vectors, head, head_vector.south, head.x, head.y + 1); // South
            add_new_state_to_queue(path, vectors, head, head_vector.east, head.x + 1, head.y);  // East
            add_new_state_to_queue(path, vectors, head, head_vector.west, head.x - 1, head.y);  // West
        }
    }

    draw_grid(0, 0, width, height, 10);
    show_paths_found(paths_found, paths_found.length * (frameCount / 60), 0, 0, width, height, 10);
}

function show_paths_found(paths, index, x, y, w, h, margin) {
    if (paths.length === 0) {
        return; // no paths found yet
    }

    index = round(index) % paths.length; // loop back to the first path if index is out of bounds

    push();
    stroke(0, 255, 0);
    fill(0, 255, 0);
    strokeWeight(2);

    // calculate new position and dimension after margin
    x += margin;
    y += margin;
    w -= margin * 2;
    h -= margin * 2;

    // calculate width and height of each grid cell
    let dx = w / dim.x;
    let dy = h / dim.y;

    let path = paths[index]; // get the path from the found paths

    noFill();
    beginShape();
    for (let i = 0; i < path.length; i++) {
        vertex(path[i].x * dx + x + dx / 2, path[i].y * dy + y + dy / 2);
    }
    endShape();
    pop();
}

function check_if_path_found(path) {
    let empty_cells = dim.x * dim.y - walls.length; // number of empty spaces
    if (path.length === empty_cells) {
        return true; // path found
    }
    return false; // path not found
}

// Helper function to add new state for a valid direction
function add_new_state_to_queue(path, vectors, head, isValid, newX, newY) {
    if (isValid) {
        let new_pos = { x: newX, y: newY };
        let new_path = [...path, new_pos];
        let new_vectors = map_deep_copy(vectors);
        remove_vectors_pointing_to_pos(new_vectors, head.x, head.y);
        let new_state = { path: new_path, vectors: new_vectors };
        queue.push(new_state);
        return true;
    } else {
        return false;
    }
}

function map_deep_copy(map) {
    // Create a new Map to store the deep copy
    let new_map = new Map();

    // Iterate through each key-value pair in the original map
    for (let [key, value] of map) {
        // Deep copy the position object
        let pos_copy = value.pos ? { ...value.pos } : null;

        // Create a deep copy of the vector object
        // Including all directional flags and the copied position
        let value_copy = {
            pos: pos_copy,
            north: value.north,
            south: value.south,
            east: value.east,
            west: value.west
        };

        // Set the new key-value pair in our copy
        // Key is already immutable (string) so no need to copy it
        new_map.set(key, value_copy);
    }

    return new_map;
}

function add_first_state_to_queue() {
    let state = { path: [start_pos], vectors: path_vectors };
    queue.push(state); // add the first state to the queue
}

function generate_path_vectors() {
    path_vectors = new Map();

    // Generate path vectors for each position in the grid, considering walls
    for (let x = 0; x < dim.x; x++) {
        for (let y = 0; y < dim.y; y++) {
            if (walls.some(wall => wall.x === x && wall.y === y)) {
                continue; // skip walls
            }

            let key = pos_to_key(x, y); // create a unique key for each position
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

    // dont need to do this since the main function will handle removal of vectors pointing to the head position
    // remove_vectors_pointing_to_pos(path_vectors, start_pos.x, start_pos.y); // remove vectors pointing to the starting position
}

function remove_vectors_pointing_to_pos(vectors, x, y) {
    let northVector = get_path_vector(vectors, x, y + 1);
    if (northVector) northVector.north = false;

    let southVector = get_path_vector(vectors, x, y - 1);
    if (southVector) southVector.south = false;

    let eastVector = get_path_vector(vectors, x + 1, y);
    if (eastVector) eastVector.west = false;

    let westVector = get_path_vector(vectors, x - 1, y);
    if (westVector) westVector.east = false;
}

function get_path_vector(vectors, x, y) {
    // Validate input coordinates
    if (x < 0 || x >= dim.x || y < 0 || y >= dim.y) {
        // console.warn("Path vector coordinates out of bounds:", x, y);
        return null;
    }

    // Round coordinates to integers just in case
    x = floor(x);
    y = floor(y);

    let key = pos_to_key(x, y); // create a unique key for the given position
    let vector = vectors.get(key);

    return vector; // get the path vector for the given position
}

function pos_to_key(x, y) {
    // Validate input coordinates
    if (x < 0 || x >= dim.x || y < 0 || y >= dim.y) {
        console.warn("Path vector coordinates out of bounds:", x, y);
        return null;
    }

    // Round coordinates to integers just in case
    x = floor(x);
    y = floor(y);

    return `${x},${y}`; // create a unique key for each position
}

function draw_path_vectors(vectors, x, y, w, h, margin) {
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

    for (let [key, value] of vectors) {
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
    fill(255, 64);
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

    fill(0, 255, 0, 64);
    rect(i * dx + x, j * dy + y, dx, dy);

    pop();
}
