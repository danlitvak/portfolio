// shift + alt + f -> format document nicely

// Performance tracking variables
let startTime = Date.now();
let stepsPerFrame = 0;
let totalSteps = 0;

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
    canvasHeight = canvasWidth * (2 / 3); // 2 : 3 aspect ratio
    resizeCanvas(canvasWidth, canvasHeight);
}

function draw_background() {
    // Handle dark mode background transition
    darkMode = document.body.classList.contains("dark-mode");
    if (darkMode) {
        currentBackground = lerp(currentBackground, 0, 0.1);
    } else {
        currentBackground = lerp(currentBackground, 100, 0.1);
    }

    background(currentBackground);
}

let font_size = 14;

function setup() {
    // start up
    container = document.getElementById('canvas-container');
    const canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent(container);
    windowResized();
    // integration ends here
    textFont("Courier New");
    textSize(font_size);

    totalSteps = 0;

    queue = [];
    paths_found = [];
    startTime = Date.now();

    // generate path vectors, only happens once, doesn't need to be the fastest
    generate_path_vectors();
    // possible moves will be path vectors of head position
    add_first_state_to_queue();
}

let solving_speed = 10000; // target solving speed
let time_to_first_solve = -1; // -1 means ready to recieve the time

let dim = { x: 6, y: 6 };
let start_pos = { x: 5, y: 0 };
let walls = [{ x: 0, y: 5 }, { x: 0, y: 3 }, { x: 4, y: 4 }, { x: 5, y: 1 }];
let path_vectors;

let margin = 10;
// deploy

let queue = [];
let paths_found = [];

let machine_state = "solve"; // the user needs to set up the grid
let mouse_pos = { x: -1, y: -1 };

let is_paused = false;

function draw() {
    draw_background();

    switch (machine_state) {
        case "setup_walls":
            draw_grid(0, 0, height, height, margin);
            user_interface(height, 0, width - height, height, margin);

            locate_mouse_pos();
            break;

        case "setup_start":
            draw_grid(0, 0, height, height, margin);
            user_interface(height, 0, width - height, height, margin);

            locate_mouse_pos();
            break;

        case "solve":
            stepsPerFrame = 0;  // Reset steps counter for this frame

            if (!is_paused) {
                for (let i = 0; i < solving_speed; i++) {
                    solve_step();
                }
            }

            draw_grid(0, 0, height, height, margin);
            user_interface(height, 0, width - height, height, margin);
            show_paths_found(paths_found, paths_found.length * (frameCount / 360), 0, 0, height, height, margin);
            break;

        default:
            break;
    }
}

function find_spaces(current_state) {
    if (!queue.length) return true;

    let path = current_state.path;
    let vectors = map_deep_copy(current_state.vectors); // still needed for clean state

    // Remove all path positions from the vector map
    for (let p = 0; p < path.length; p++) {
        let point = path[p];
        let key = pos_to_key(point.x, point.y);
        vectors.delete(key);
    }

    const keys = [...vectors.keys()];
    if (keys.length === 0) return true;

    const startKey = keys[0];
    const queueFlood = [startKey];

    // Reset visited flags (in case vectors are reused)
    for (let key of keys) {
        vectors.get(key).visited = false;
    }

    // Flood fill with in-object `.visited` flag
    while (queueFlood.length > 0) {
        const currentKey = queueFlood.pop();
        const current_vector = vectors.get(currentKey);
        if (current_vector.visited) continue;
        current_vector.visited = true;

        const { x, y } = current_vector.pos;

        if (current_vector.north) {
            const k = pos_to_key(x, y - 1);
            if (vectors.has(k) && !vectors.get(k).visited) queueFlood.push(k);
        }
        if (current_vector.south) {
            const k = pos_to_key(x, y + 1);
            if (vectors.has(k) && !vectors.get(k).visited) queueFlood.push(k);
        }
        if (current_vector.east) {
            const k = pos_to_key(x + 1, y);
            if (vectors.has(k) && !vectors.get(k).visited) queueFlood.push(k);
        }
        if (current_vector.west) {
            const k = pos_to_key(x - 1, y);
            if (vectors.has(k) && !vectors.get(k).visited) queueFlood.push(k);
        }
    }

    // Final check: were all nodes visited?
    for (let key of keys) {
        if (!vectors.get(key).visited) {
            return false; // found a disconnected piece
        }
    }

    return true; // fully connected
}


function mousePressed() {
    switch (machine_state) {
        case "setup_start":
            locate_mouse_pos();
            if (mouse_pos.x !== -1 && mouse_pos.y !== -1) {
                start_pos.x = mouse_pos.x;
                start_pos.y = mouse_pos.y;
                // console.log("Place start at: (" + mouse_pos.x + ", " + mouse_pos.y + ")");
            }
            break;

        case "setup_walls":
            locate_mouse_pos();
            if (mouse_pos.x !== -1 && mouse_pos.y !== -1) {
                // console.log("Toggle wall at: (" + mouse_pos.x + ", " + mouse_pos.y + ")");
                // Wall toggling logic would go here

                let index_found = -1;

                for (let pos = 0; pos < walls.length; pos++) {
                    let wall = walls[pos];

                    if (wall.x == mouse_pos.x && wall.y == mouse_pos.y) {
                        index_found = pos;
                    }
                }

                if (index_found >= 0) {
                    // wall exists therefor must be toggled off
                    walls.splice(index_found, 1);
                } else {
                    // wall doesn't exist meaning it must be pushed as a new wall
                    walls.push({ x: mouse_pos.x, y: mouse_pos.y });
                }
            }
            break;

        default:
            break;
    }
}

function locate_mouse_pos() {
    mouse_pos.x = floor((mouseX - margin) / ((height - margin * 2) / dim.x));
    mouse_pos.y = floor((mouseY - margin) / ((height - margin * 2) / dim.y));

    if (mouse_pos.x < 0 || mouse_pos.x > dim.x - 1 || mouse_pos.y < 0 || mouse_pos.y > dim.y - 1) {
        mouse_pos.x = -1;
        mouse_pos.y = -1;
    }
}

function solve_step() {
    if (queue.length > 0) {
        if (find_spaces(queue.at(-1))) {
            // if true, then its fully connected
            let current_state = queue.pop();

            // check if we have found a valid path
            if (check_if_path_found(current_state.path)) {
                paths_found.push(current_state.path); // add the path to the found paths

                if (time_to_first_solve == -1) {
                    time_to_first_solve = (Date.now() - startTime);
                }
            } else {
                // get useful references from the current state we are working on
                let path = current_state.path; // get the path from the state
                let vectors = current_state.vectors; // get the path vectors from the state
                let head = path[path.length - 1]; // get the head of the path

                let head_vector = get_path_vector(vectors, head.x, head.y); // get the path vector of the head position

                // Check all cardinal directions
                add_new_state_to_queue(path, vectors, head, head_vector.south, head.x, head.y + 1); // South
                add_new_state_to_queue(path, vectors, head, head_vector.east, head.x + 1, head.y);  // East
                add_new_state_to_queue(path, vectors, head, head_vector.west, head.x - 1, head.y);  // West
                add_new_state_to_queue(path, vectors, head, head_vector.north, head.x, head.y - 1); // North

                stepsPerFrame++;  // Increment steps for this frame
                totalSteps++;     // Increment total steps
            }
        } else {
            // the latest state is not connected, pop it
            queue.pop();
        }
    }
}

// Helper function to add new state for a valid direction
function add_new_state_to_queue(path, vectors, head, isValid, newX, newY) {
    if (isValid) {
        let new_pos = { x: newX, y: newY };
        let new_path = [...path, new_pos];
        let new_vectors = map_deep_copy(vectors);
        remove_vectors_pointing_to_pos(new_vectors, head.x, head.y, newX, newY, new_path)

        let new_state = { path: new_path, vectors: new_vectors };
        queue.push(new_state);
    }
}

// !!!!!!!!!!
// No optimization  : 302108  | time: 3.83 sec  | 1x
// Yes optimization : 37469   | time: 0.51 sec  | 10x
// Best optimization: 1990    | time: 0.04 sec  | 100x


function path_contains_pos(path, pos) {
    return path.some(p => p.x === pos.x && p.y === pos.y);
}

function user_interface(x, y, w, h, margin) {
    // margin on the left already exists from draw grid
    y += margin;
    w -= margin;
    h -= margin * 2;

    push();
    // draw bounding box
    noFill();
    stroke(255);
    strokeWeight(1);
    rect(x, y, w, h);

    fill(255);
    stroke(128);

    // information about the pathfinding
    let text_margin = 5; // margin around the text
    let ride = font_size / 2; // keep track of how far the top


    // static status information (dont change much / at all)
    if (machine_state == "solving") {
        text("Solver Status: Solving", x + text_margin, y + ride, w, font_size);
    } else {
        text("Solver Status: Waiting", x + text_margin, y + ride, w, font_size);
    }
    ride += font_size;

    text("Target Steps/Frame: " + solving_speed, x + text_margin, y + ride, w, font_size);
    ride += font_size;


    text("Dimensions: (" + dim.x + ", " + dim.y + ")", x + text_margin, y + ride, w, font_size);
    ride += font_size;

    text("Solution Length: " + (paths_found.length > 0 ? paths_found[paths_found.length - 1].length : 0), x + text_margin, y + ride, w, font_size);
    ride += font_size;

    text("Start Position: " + start_pos.x + ", " + start_pos.y, x + text_margin, y + ride, w, font_size);
    ride += font_size;

    text("Walls: " + walls.length, x + text_margin, y + ride, w, font_size);
    ride += font_size;

    // Performance Metrics (things that chanage / update)
    push();
    stroke(255);
    line(x, y + ride + font_size / 2, x + w, y + ride + font_size / 2);
    pop();
    ride += font_size;

    text("FPS: " + frameRate().toFixed(3), x + text_margin, y + ride, w, font_size);
    ride += font_size;

    text("Runtime: --- " + ((Date.now() - startTime) / 1000).toFixed(2) + "s", x + text_margin, y + ride, w, font_size);
    ride += font_size;

    text("First solve:  " + (time_to_first_solve / 1000).toFixed(2) + "s", x + text_margin, y + ride, w, font_size);
    ride += font_size;

    text("Steps/Frame: " + stepsPerFrame, x + text_margin, y + ride, w, font_size);
    ride += font_size;

    text("Total Steps: " + totalSteps, x + text_margin, y + ride, w, font_size);
    ride += font_size;

    text("Paths Found: " + paths_found.length, x + text_margin, y + ride, w, font_size);
    ride += font_size;

    text("Queue Size:  " + queue.length, x + text_margin, y + ride, w, font_size);
    ride += font_size;

    // user interface, buttons and stuff
    push();
    stroke(255);
    line(x, y + ride + font_size / 2, x + w, y + ride + font_size / 2);
    pop();
    ride += font_size;

    text("State: " + machine_state, x + text_margin, y + ride, w, font_size);
    ride += font_size;

    switch (machine_state) {
        case "setup_start":
            text("SPACE: setup walls", x + text_margin, y + ride, w, font_size);
            ride += font_size;
            break;

        case "setup_walls":
            text("SPACE: start solving", x + text_margin, y + ride, w, font_size);
            ride += font_size;
            break;

        case "solve":
            text("SPACE: setup start", x + text_margin, y + ride, w, font_size);
            ride += font_size;
            break;

        default:
            break;
    }

    // Add arrow key controls information
    push();
    stroke(255);
    line(x, y + ride + font_size / 2, x + w, y + ride + font_size / 2);
    pop();
    ride += font_size;

    text("Grid Controls:", x + text_margin, y + ride, w, font_size);
    ride += font_size;
    text("↑/↓: Change Height", x + text_margin, y + ride, w, font_size);
    ride += font_size;
    text("←/→: Change Width", x + text_margin, y + ride, w, font_size);
    ride += font_size;
    text("R: Redo Current", x + text_margin, y + ride, w, font_size);
    ride += font_size;
    if (is_paused) {
        text("P: Resume", x + text_margin, y + ride, w, font_size);
        ride += font_size;
    } else {
        text("P: Pause", x + text_margin, y + ride, w, font_size);
        ride += font_size;
    }
    text("S: Step Once", x + text_margin, y + ride, w, font_size);
    ride += font_size;

    pop();
}

function keyPressed() {
    if (keyCode == 32) {
        if (machine_state == "setup_walls") {
            machine_state = "setup_start";
        } else if (machine_state == "setup_start") {
            machine_state = "solve";
            totalSteps = 0;

            queue = [];
            paths_found = [];
            startTime = Date.now();

            // generate path vectors, only happens once, doesn't need to be the fastest
            generate_path_vectors();
            // possible moves will be path vectors of head position
            add_first_state_to_queue();

        } else if (machine_state == "solve") {
            machine_state = "setup_walls"
            time_to_first_solve = -1;
        }
    }

    if (machine_state != "solve") {
        // Arrow keys to modify grid dimensions
        if (keyCode === UP_ARROW) {
            dim.y = constrain(dim.y + 1, 3, 20); // Increase y dimension
            resetGrid();
        } else if (keyCode === DOWN_ARROW) {
            dim.y = constrain(dim.y - 1, 3, 20); // Decrease y dimension
            resetGrid();
        } else if (keyCode === RIGHT_ARROW) {
            dim.x = constrain(dim.x + 1, 3, 20); // Increase x dimension
            resetGrid();
        } else if (keyCode === LEFT_ARROW) {
            dim.x = constrain(dim.x - 1, 3, 20); // Decrease x dimension
            resetGrid();
        }
    }

    if (keyCode == 82) {
        resolve_current(solving_speed);
    }

    if (keyCode == 80) { // "p" key
        is_paused = !is_paused;
    }

    if (keyCode == 83) { // "s" key
        if (machine_state === "solve") {
            solve_step();
        }
    }

    return false;
}

// Helper function to reset the grid when dimensions change
function resetGrid() {
    walls = [];
    queue = [];
    paths_found = [];
    start_pos = { x: floor(dim.x / 2), y: floor(dim.y / 2) };
    generate_path_vectors();
}

function show_paths_found(paths, index, x, y, w, h, margin) {
    let path;
    let vectors;
    // decide where to get the path from
    if (paths.length) {
        // if paths are found show them
        index = round(index) % paths.length; // loop back to the first path if index is out of bounds
        path = paths[index];
    } else {
        if (queue.length) {
            // if still working on paths show progress
            path = queue.at(-1).path;
            vectors = queue.at(-1).vectors;
        } else {
            // no paths and queue is not populated
            return;
        }
    }

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

    noFill();
    beginShape();
    for (let i = 0; i < path.length; i++) {
        vertex(path[i].x * dx + x + dx / 2, path[i].y * dy + y + dy / 2);
    }
    endShape();
    pop();

    x -= margin;
    y -= margin;
    w += margin * 2;
    h += margin * 2;

    draw_path_vectors(vectors, x, y, w, h, margin);
}

function check_if_path_found(path) {
    let empty_cells = dim.x * dim.y - walls.length; // number of empty spaces
    if (path.length === empty_cells) {
        return true; // path found
    }
    return false; // path not found
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

function remove_vectors_pointing_to_pos(vectors, x, y, nextX, nextY, path) {
    let headVector = get_path_vector(vectors, x, y);
    headVector.north = false;
    headVector.east = false;
    headVector.south = false;
    headVector.west = false;

    // NORTH
    let northVector = get_path_vector(vectors, x, y + 1);
    if (northVector) northVector.north = false;

    // SOUTH
    let southVector = get_path_vector(vectors, x, y - 1);
    if (southVector) southVector.south = false;

    // EAST
    let eastVector = get_path_vector(vectors, x + 1, y);
    if (eastVector) eastVector.west = false;

    // WEST
    let westVector = get_path_vector(vectors, x - 1, y);
    if (westVector) westVector.east = false;
}

function check_if_vector_empty(vector) {
    return !(vector.north || vector.east || vector.south || vector.west);
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
    if (!(vectors && vectors.size > 0)) return;

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

    // draw mouse hover

    switch (machine_state) {
        case "setup_start":
            fill(0, 255, 0, 64);
            break;

        case "setup_walls":
            fill(255, 64);
            break;

        default:
            noFill();
            break;
    }


    if (mouse_pos.x >= 0 && mouse_pos.y >= 0) {
        rect(mouse_pos.x * dx + x, mouse_pos.y * dy + y, dx, dy);
    }

    pop();
}

function resolve_current(speed) {
    if (!speed) speed = 1;
    solving_speed = speed;
    totalSteps = 0;
    startTime = Date.now();
    paths_found = [];
    queue = [];
    time_to_first_solve = -1;
    add_first_state_to_queue();
}