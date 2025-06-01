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
    canvasHeight = canvasWidth * 0.9; // square canvas
    resizeCanvas(canvasWidth, canvasHeight);
}

function setup() {
    // start up
    container = document.getElementById('canvas-container');
    const canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent(container);
    windowResized();
    // integration ends here
    textFont("Courier New");


    // Create a grid of points centered at (0,0)
    let start = -floor(numPoints / 2);
    let end = floor(numPoints / 2);

    for (let y = start; y <= end; y++) {
        for (let x = start; x <= end; x++) {
            points.push(createVector(x * spacing, y * spacing));
        }
    }

    // Make transformedPoints same size as points
    for (let i = 0; i < points.length; i++) {
        transformedPoints.push(createVector(0, 0));
    }

    // Initialize the 3x3 affine matrix once
    randomizeAffineMatrix();
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

let points = [];
let transformedPoints = [];
let numPoints = 20;     // Number of points per row/column
let spacing = 10;       // Distance between each grid point

// We'll store our 3x3 affine matrix in a nested array, e.g.:
// [ [a, b, tx],
//   [c, d, ty],
//   [0, 0,  1] ]
let affineMatrix;

let t = 0;               // Interpolation parameter (0 -> 1)
let speed = 0.01;        // Speed of interpolation
let cycleCount = 0;      // Tracks how many full cos cycles have passed

// Panning and zooming
let canvas_pos_x = 0;
let canvas_pos_y = 0;
let canvas_zoom = 1;

function draw() {
    draw_background();
    drawFrameRateGraph();

    push();
    fill(255);
    noStroke();
    textSize(16);
    let a = affineMatrix[0][0];
    let b = affineMatrix[0][1];
    let tx = affineMatrix[0][2];
    let c = affineMatrix[1][0];
    let d = affineMatrix[1][1];
    let ty = affineMatrix[1][2];

    text(
        `Matrix:\n` +
        `[${a.toFixed(2)},  ${b.toFixed(2)},  ${tx.toFixed(2)}]\n` +
        `[${c.toFixed(2)},  ${d.toFixed(2)},  ${ty.toFixed(2)}]\n` +
        `[0.00, 0.00, 1.00]`,
        10, 20
    );

    const { eigenvalues, eigenvectors } = findEigenvaluesAndVectors(a, b, c, d);
    text(`\nλ1: ${eigenvalues[0].toFixed(2)}, V1: [${eigenvectors[0][0].toFixed(2)}, ${eigenvectors[0][1].toFixed(2)}]`, 10, 90);
    text(`\nλ2: ${eigenvalues[1].toFixed(2)}, V2: [${eigenvectors[1][0].toFixed(2)}, ${eigenvectors[1][1].toFixed(2)}]`, 10, 120);
    pop();

    if (mouseIsPressed) {
        canvas_pos_x -= (pmouseX - mouseX);
        canvas_pos_y -= (pmouseY - mouseY);
    }

    translate(canvas_pos_x, canvas_pos_y);
    t = (1 - cos(frameCount * speed)) / 2;

    let currentCycle = floor((frameCount * speed) / TWO_PI);
    if (currentCycle !== cycleCount) {
        cycleCount = currentCycle;
        randomizeAffineMatrix();
    }

    translate(width / 2, height / 2);
    scale(canvas_zoom);

    // Draw horizontal and vertical grid lines (original and transformed)
    stroke(100);
    strokeWeight(1);
    let cols = Math.sqrt(points.length);
    for (let row = 0; row < cols; row++) {
        beginShape();
        for (let col = 0; col < cols; col++) {
            let i = row * cols + col;
            vertex(points[i].x, points[i].y);
        }
        endShape();
    }
    for (let col = 0; col < cols; col++) {
        beginShape();
        for (let row = 0; row < cols; row++) {
            let i = row * cols + col;
            vertex(points[i].x, points[i].y);
        }
        endShape();
    }

    stroke(255, 0, 0);
    for (let row = 0; row < cols; row++) {
        beginShape();
        for (let col = 0; col < cols; col++) {
            let i = row * cols + col;
            let x = lerp(points[i].x, transformedPoints[i].x, t);
            let y = lerp(points[i].y, transformedPoints[i].y, t);
            vertex(x, y);
        }
        endShape();
    }
    for (let col = 0; col < cols; col++) {
        beginShape();
        for (let row = 0; row < cols; row++) {
            let i = row * cols + col;
            let x = lerp(points[i].x, transformedPoints[i].x, t);
            let y = lerp(points[i].y, transformedPoints[i].y, t);
            vertex(x, y);
        }
        endShape();
    }

    noStroke();
    fill(255);
    for (let p of points) {
        ellipse(p.x, p.y, 5, 5);
    }

    for (let i = 0; i < points.length; i++) {
        let x = points[i].x;
        let y = points[i].y;
        let xPrime = transformedPoints[i].x;
        let yPrime = transformedPoints[i].y;
        let xInterp = lerp(x, xPrime, t);
        let yInterp = lerp(y, yPrime, t);
        fill(255, 0, 0);
        ellipse(xInterp, yInterp, 5, 5);
    }

    const scaleLength = 100;
    const ev1 = eigenvectors[0];
    const ev2 = eigenvectors[1];

    const base = createVector(tx, ty);
    const dir1 = applyAffine(ev1[0] * scaleLength, ev1[1] * scaleLength);
    const dir2 = applyAffine(ev2[0] * scaleLength, ev2[1] * scaleLength);

    stroke(0, 255, 0);
    strokeWeight(2);
    line(base.x, base.y, dir1.x, dir1.y);

    stroke(0, 0, 255);
    line(base.x, base.y, dir2.x, dir2.y);
}

function applyAffine(x, y) {
    const a = affineMatrix[0][0];
    const b = affineMatrix[0][1];
    const tx = affineMatrix[0][2];
    const c = affineMatrix[1][0];
    const d = affineMatrix[1][1];
    const ty = affineMatrix[1][2];
    return createVector(a * x + b * y + tx, c * x + d * y + ty);
}

function mouseWheel(event) {
    if (mouseX < width && mouseY < height && mouseX > 0 && mouseY > 0) {
        if (event.delta < 0) {
            canvas_zoom *= 1.1;
        } else {
            canvas_zoom /= 1.1;
        }
        canvas_zoom = min(max(canvas_zoom, 0.1), 100);

        return false;
    } else {
        return true;
    }
}

function randomizeAffineMatrix() {
    let a = random(-1, 1);
    let b = random(-1, 1);
    let c = random(-1, 1);
    let d = random(-1, 1);
    let tx = random(-100, 100);
    let ty = random(-100, 100);

    affineMatrix = [
        [a, b, tx],
        [c, d, ty],
        [0, 0, 1]
    ];

    for (let i = 0; i < points.length; i++) {
        let p = points[i];
        let x = p.x;
        let y = p.y;
        let xPrime = a * x + b * y + tx;
        let yPrime = c * x + d * y + ty;
        transformedPoints[i].set(xPrime, yPrime);
    }
}

function findEigenvaluesAndVectors(a, b, c, d) {
    const trace = a + d;
    const determinant = a * d - b * c;
    const discriminant = trace * trace - 4 * determinant;

    if (discriminant < 0) {
        // console.warn("Complex eigenvalues — eigenvectors are not handled in this version.");
        return {
            eigenvalues: [NaN, NaN],
            eigenvectors: [[0, 0], [0, 0]]
        };
    }

    const sqrtDiscriminant = Math.sqrt(discriminant);
    const lambda1 = (trace + sqrtDiscriminant) / 2;
    const lambda2 = (trace - sqrtDiscriminant) / 2;

    function solveEigenvector(lambda) {
        if (b !== 0 || a !== lambda) {
            const x = -b;
            const y = a - lambda;
            return normalize([x, y]);
        }
        const x = d - lambda;
        const y = -c;
        return normalize([x, y]);
    }

    function normalize(vec) {
        const mag = Math.hypot(vec[0], vec[1]);
        return mag === 0 ? [0, 0] : vec.map(v => v / mag);
    }

    const v1 = solveEigenvector(lambda1);
    const v2 = solveEigenvector(lambda2);

    return {
        eigenvalues: [lambda1, lambda2],
        eigenvectors: [v1, v2]
    };
}

function drawFrameRateGraph() {
    const HISTORY_SIZE = 100;
    const GRAPH_WIDTH = width - 20;
    const GRAPH_HEIGHT = 60;

    if (!drawFrameRateGraph.frHistory) {
        drawFrameRateGraph.frHistory = [];
    }
    let frHistory = drawFrameRateGraph.frHistory;

    frHistory.push(frameRate());
    if (frHistory.length > HISTORY_SIZE) {
        frHistory.shift();
    }

    let xPos = 10;
    let yPos = height - GRAPH_HEIGHT - 10;

    push();
    noStroke();
    fill(0, 150);
    rect(xPos, yPos, GRAPH_WIDTH, GRAPH_HEIGHT);

    fill(255);
    textSize(12);
    textAlign(LEFT, BOTTOM);
    let avgFR = frHistory.reduce((acc, val) => acc + val, 0) / frHistory.length;
    text(
        "FPS: " + frameRate().toFixed(5) +
        ", Average: " + avgFR.toFixed(5),
        xPos + 5,
        yPos + 15
    );

    stroke(255);
    noFill();
    beginShape();
    let maxFR = Math.max(60, ...frHistory);
    for (let i = 0; i < frHistory.length; i++) {
        let x = map(i, 0, frHistory.length - 1, xPos, xPos + GRAPH_WIDTH);
        let y = map(frHistory[i], 0, maxFR, yPos + GRAPH_HEIGHT, yPos);
        vertex(x, y);
    }
    endShape();
    pop();
}