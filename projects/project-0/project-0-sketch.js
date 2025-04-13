let cols, rows;
let s = 0.5;
let w = 50;
let h = 50;

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
    resizeCanvas(canvasWidth, canvasHeight);
}

function setup() {
    // start up
    container = document.getElementById('canvas-container');
    const canvas = createCanvas(canvasWidth, canvasHeight, WEBGL);
    canvas.parent(container);
    windowResized();
    // integration ends here

    orbitControl();
    cols = w / s;
    rows = h / s;
    background(0);

    console.log("dark mode detection test: " + document.body.classList.contains("dark-mode"));
    console.log("hello");
}



function surfaceFunction(x, z) {
    let r = sqrt(x * x + z * z);
    return r == 0 ? -1 : -sin(r) / r;
}

function draw() {
    ambientLight(50);

    darkMode = document.body.classList.contains("dark-mode");
    if (darkMode) {
        currentBackground = lerp(currentBackground, 0, 0.1);
    } else {
        currentBackground = lerp(currentBackground, 200, 0.1);
    }

    background(currentBackground);
    fill(100);
    scale(5)
    orbitControl();
    noStroke()
    directionalLight(255, 255, 255, -1, -1, -1);
    directionalLight(128, 128, 128, 1, 1, 1);

    for (let z = 0; z < rows - 1; z++) {
        beginShape(TRIANGLE_STRIP);
        for (let x = 0; x < cols; x++) {
            let xPos = (x - cols / 2) * s;
            let zPos = (z - rows / 2) * s;

            let y1 = surfaceFunction(xPos, zPos) * 30;
            let y2 = surfaceFunction(xPos, (zPos + s)) * 30;

            let nx = xPos / sqrt(xPos * xPos + zPos * zPos + 1);
            let ny = 1;
            let nz = zPos / sqrt(xPos * xPos + zPos * zPos + 1);

            normal(nx, ny, nz);
            vertex(xPos, y1, zPos);
            normal(nx, ny, nz);
            vertex(xPos, y2, zPos + s);
        }
        endShape();
    }
}