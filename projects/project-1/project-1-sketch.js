let boids;
let debug = false;

let boid_count = 500;
let boid_vision = 25;
let edge_weight = 100;
let cohesion_weight = 5;
let seperation_weight = 2;
let alignment_weight = 1;

let init_bound;
let qt;

let show_frames = false;

// integration starts here
// variables to keep track
let canvasHeight = 400;
let canvasWidth = 400;

// function for resizing
function windowResized() {
    container = document.getElementById('canvas-container');
    canvasWidth = container.getBoundingClientRect().width;
    resizeCanvas(canvasWidth, canvasHeight);
}

function setup() {
    // start up
    container = document.getElementById('canvas-container');
    const canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent(container);
    windowResized();
    // integration ends here

    init_bound = new bound(0, 0, width, height);
    qt = new quadtree(5, init_bound);
    for (let i = 0; i < boid_count; i++) {
        qt.insert(
            new boid(
                createVector(random(width), random(height)),
                p5.Vector.random2D()
            )
        );
    }
    boids = qt.returnobjects();
    textAlign(LEFT, TOP);
}

function draw() {
    blendMode(BLEND);
    frameRate(60);
    if (debug) {
        background(0);
        qt.show();
    } else {
        background(0, 10);
    }

    update_boid_vel();
    update_boid_pos();
    draw_boids();
    drawFrameRateGraph();

    if (frameCount % 30 == 0) {
        // re insert only the boids outside of the leaf
        // let returncount = 0;
        // qt.returnrefactor().forEach((boid) => {
        //   qt.insert(boid);
        //   returncount++;
        // });
        // console.log(returncount)
        // qt.cull();

        // re insert all boids
        qt = new quadtree(10, init_bound);
        boids.forEach((boid) => {
            qt.insert(boid);
        });
    }
}

function keyPressed() {
    if (keyCode == 32) {
        debug = !debug;
    }

    if (keyCode == 70) {
        show_frames = !show_frames;
    }
}

function drawFrameRateGraph() {
    if (!show_frames) return;
    // Local constants and a "static" history array attached to the function itself,
    // so we don't create extra globals.
    const HISTORY_SIZE = 100;
    const GRAPH_WIDTH = width - 20;
    const GRAPH_HEIGHT = 60;

    // If we haven't created frHistory yet, initialize it.
    if (!drawFrameRateGraph.frHistory) {
        drawFrameRateGraph.frHistory = [];
    }

    // Get a reference to our "static" frame-rate history.
    let frHistory = drawFrameRateGraph.frHistory;

    // 1. Update the frame-rate history.
    frHistory.push(frameRate());
    if (frHistory.length > HISTORY_SIZE) {
        frHistory.shift();
    }

    // 2. Decide where to draw the graph (centered at the bottom).
    let xPos = 10;
    let yPos = height - GRAPH_HEIGHT - 10; // 20 px margin

    // 3. Draw a semi-transparent background rectangle for the graph.
    push();
    noStroke();
    fill(0, 150);
    rect(xPos, yPos, GRAPH_WIDTH, GRAPH_HEIGHT);

    // 4. Draw label text.
    fill(255);
    textSize(12);
    textAlign(LEFT, BOTTOM);
    text(
        "FPS: " +
        frameRate().toFixed(5) +
        ", Average: " +
        (frHistory.reduce((sum, val) => sum + val, 0) / frHistory.length).toFixed(
            5
        ),
        xPos + 5,
        yPos + 15
    );

    // 5. Draw the frame-rate line graph.
    //    We'll cap the comparison at 60 so the scale isn't tiny on high-end machines.
    const maxFR = Math.max(60, ...frHistory);

    stroke(255);
    noFill();
    beginShape();
    for (let i = 0; i < frHistory.length; i++) {
        let x = map(i, 0, frHistory.length - 1, xPos, xPos + GRAPH_WIDTH);
        let y = map(frHistory[i], 0, maxFR, yPos + GRAPH_HEIGHT, yPos);
        vertex(x, y);
    }
    endShape();
    pop();
}

class boid {
    constructor(pos, vel) {
        this.pos = pos;
        this.vel = vel;
        this.neighbours = 0;
    }
}

// update boids vel
function update_boid_vel() {
    boids.forEach((boid, i) => {
        let pos = boid.pos;
        let vel = boid.vel;
        let count = 0;

        if (debug) {
            push();
            noFill();
            stroke(255, 30);
            circle(pos.x, pos.y, boid_vision);
            pop();
        }

        let com = createVector(0, 0);
        let avv = createVector(0, 0);
        let rep = createVector(0, 0);

        let close = qt.query(
            new bound(
                pos.x - boid_vision,
                pos.y - boid_vision,
                boid_vision * 2,
                boid_vision * 2
            )
        );
        boid.neighbours = close.length;

        close.forEach((other, j) => {
            if (i != j) {
                let o_pos = other.pos;
                let o_vel = other.vel;
                let d = max(pos.dist(o_pos), 1);
                if (d < boid_vision) {
                    com.add(o_pos);
                    avv.add(o_vel);
                    rep.add(pos.copy().sub(o_pos).div(pow(d, 0.3)));
                    count++;
                    if (debug) {
                        push();
                        stroke(0, 255, 0, 20);
                        strokeWeight(1);
                        line(pos.x, pos.y, o_pos.x, o_pos.y);
                        pop();
                    }
                }
            }
        });

        let edg = createVector(-100 *
            exp(-min(pos.x, abs(width - pos.x))) *
            Math.sign(pos.x - width / 2), -100 *
            exp(-min(pos.y, abs(height - pos.y))) *
            Math.sign(pos.y - height / 2)
        );
        let tlt = createVector(0, 0);

        if (count != 0) {
            com.div(count).sub(pos);
            tlt
                .add(com.mult(cohesion_weight))
                .add(avv.mult(alignment_weight))
                .add(rep.mult(seperation_weight))
                .add(edg.mult(edge_weight));
        }

        if (debug) {
            push();
            stroke(0, 0, 255);
            edg.limit(10);
            line(pos.x, pos.y, pos.x + edg.x, pos.y + edg.y);
            pop();
        }

        // rotate boids
        s = Math.sign(tlt.x * vel.y - vel.x * tlt.y);
        vel.rotate(-0.03 * s);

        // mouse logic
        if (mouseIsPressed) {
            mp = createVector(mouseX, mouseY);
            d = p5.Vector.dist(mp, pos);
            if (d < boid_vision * 4 && d > boid_vision * 2) {
                boid.vel = p5.Vector.sub(mp, pos)
                    .setMag(vel.mag())
                    .mult(2)
                    .limit(80)
            }
        }
    });
}

// update boids pos
function update_boid_pos() {
    boids.forEach((boid) => {
        pos = boid.pos;
        vel = boid.vel;
        pos.add(vel);

        if (pos.x < 0) pos.x = 0;
        if (pos.y < 0) pos.y = 0;
        if (pos.x > width) pos.x = width;
        if (pos.y > height) pos.y = height;
        if (vel.mag() > 1) vel.mult(0.8);
        if (vel.mag() < 1) vel.setMag(1);
    });
}

// draw boids
function draw_boids() {
    push();
    fill(255);
    noStroke();

    if (debug) {
        boids.forEach((b) => {
            let pos = b.pos;
            let vel = b.vel;
            circle(pos.x, pos.y, 3);
            stroke(255, 0, 0, 150);
            line(pos.x, pos.y, pos.x + vel.x * 10, pos.y + vel.y * 10);
        });
    } else {
        boids.forEach((b) => {
            let pos = b.pos;
            let vel = b.vel;
            push();
            translate(pos.x, pos.y);
            rotate(vel.heading());

            nrm = vel.copy().setMag(255);
            // glow effect
            fill(
                abs(nrm.x) + b.neighbours * 1,
                (pos.x / width) * 200 + b.neighbours * 1,
                abs(nrm.y) - 20 + b.neighbours * 1,
                0.1
            );
            circle(0, 0, boid_vision);

            fill(abs(nrm.x), (pos.x / width) * 200, abs(nrm.y));

            triangle(5, 0, -5, -5, -5, 5);
            pop();
        });
    }

    pop();
}