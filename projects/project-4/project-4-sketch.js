let qt;
let maxdots = 50;
let b;
let queryradius = 100;
let searchb;
let allpoints = [];
let found;

let circlemode = false;
let searchmode = true;

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

function setup() {
    // start up
    container = document.getElementById('canvas-container');
    const canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent(container);
    windowResized();
    // integration ends here

    let w = windowWidth;
    let h = windowHeight;
    let a = min(w, h);

    b = new bound(0, 0, width, height);
    searchb = new bound(0, 0, queryradius, queryradius);

    qt = new quadtree(maxdots, b);
}

function draw() {
    background(0);

    if (searchmode) {
        qt.show();
    } else {
        push();
        noStroke();
        fill(255, 0, 0);
        allpoints.forEach((dot) => {
            circle(dot[0], dot[1], 2);
        });
        pop();
    }

    push();
    noFill();
    stroke(0, 255, 0);
    strokeWeight(1);
    if (circlemode) {
        circle(mouseX, mouseY, queryradius);
    } else {
        rect(searchb.x, searchb.y, searchb.w, searchb.h);
    }
    pop();

    // update search bound position
    searchb.x = mouseX - queryradius / 2;
    searchb.y = mouseY - queryradius / 2;
    searchb.w = queryradius;
    searchb.h = queryradius;


    push();
    noStroke();
    fill(0, 255, 0);
    if (searchmode) {
        found = qt.query(searchb);
        if (found) {
            for (let i = 0; i < found.length; i++) {
                if (
                    dist(found[i][0], found[i][1], mouseX, mouseY) < queryradius / 2 ||
                    !circlemode
                ) {
                    circle(found[i][0], found[i][1], 4);
                }
            }
        }
    } else {
        if (circlemode) {
            allpoints.forEach((dot) => {
                if (dist(dot[0], dot[1], mouseX, mouseY) < queryradius / 2) {
                    circle(dot[0], dot[1], 4);
                }
            });
        } else {
            allpoints.forEach((dot) => {
                if (searchb.containsdot(dot)) {
                    circle(dot[0], dot[1], 4);
                }
            });
        }
    }
    pop();

    if (mouseIsPressed) {
        let x = min(max(mouseX, 0), width);
        let y = min(max(mouseY, 0), height);

        if (x == mouseX && y == mouseY) {
            for (let i = 0; i < 10; i++) {
                let x = min(max(mouseX + randomGaussian(0, queryradius / 3), 0), width);
                let y = min(max(mouseY + randomGaussian(0, queryradius / 3), 0), height);

                qt.insert([x, y]);
                allpoints.push([x, y]);
            }
        }
    }

    drawtext();
}

function drawtext() {
    push();
    fill(255, 200);
    stroke(0, 200);
    strokeWeight(2);
    textSize(13);
    textAlign(LEFT, TOP);

    text("FPS: " + frameRate(), 0, 0);
    text("Tree Depth: " + qt.finddepth(), 0, 12);
    text("Total Points: " + qt.countdots(), 0, 24);
    if (searchmode) {
        text("Returned Points: " + found.length, 0, 36);
    }
    let r = qt.countdots() / qt.finddepth();
    text("Tree Ratio: " + nf(r, max(ceil(log(r) / log(10)), 0), 2), 0, 48);

    textAlign(RIGHT, TOP);
    text("Max Points: " + maxdots, width, 0);
    if (searchmode) {
        text("Query Mode: Quad Tree", width, 12);
    } else {
        text("Query Mode: Check All Points", width, 12);
    }
    if (circlemode) {
        text("Return Mode: Circle", width - 1, 24);
    } else {
        text("Return Mode: Rect", width - 1, 24);
    }

    textAlign(LEFT, BOTTOM);
    text("SPACE: Change Query Range", 0, height);
    text("Q: Change Query Mode", 0, height - 12);
    text("Mouse Click: Insert Points", 0, height - 24);
    text("Mouse Scroll: Change Query Range Size", 0, height - 36);
    text("R: Reset", 0, height - 48);

    textAlign(RIGHT, BOTTOM);
    textSize(10);
    text("version 2.3 @ 07.22.24", width, height);

    pop();
}

// handle mouse wheel scroll event
function mouseWheel(event) {
    // mouse wheel control
    // d = event.delta / 100

    // do nothing if the mouse is not over the canvas
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
        return;
    }

    if (event.delta < 0) {
        queryradius -= 5;
        searchb.w -= 5;
    } else {
        queryradius += 5;
        searchb.h += 5;
    }

    queryradius = constrain(queryradius, 5, 1000);
    searchb.w = constrain(searchb.w, 5, 1000);

    pauseLength = max(1, pauseLength);

    return false; // prevent default scrolling behavior
}

function keyPressed() {
    if (keyCode == 32) {
        circlemode = !circlemode;
    }

    if (keyCode == 81) {
        searchmode = !searchmode;
    }

    if (keyCode == 82) {
        b = new bound(0, 0, width, height);
        searchb = new bound(0, 0, queryradius, queryradius);
        qt = new quadtree(maxdots, b);
    }

    return false;
}