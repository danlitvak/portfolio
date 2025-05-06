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
    noStroke();
}

let maxRadius = 40;
let dr = 0.75;
let dTheta = 0.2;
let currentFuncIndex = 0;

let radialFunctions = [
    // 1. Sinc ripple
    (r, t) => (r === 0 ? -1 : -sin(r - t) / r),

    // 2. Bessel-like ripple
    (r, t) => cos(r - t) * exp(-0.1 * r),

    // 3. Gaussian pulse
    (r, t) => exp(-0.1 * sq(r - 5 - sin(t))),

    // 4. Radial wave ring
    (r, t) => sin(r * r - t),

    // 5. Pulsing plateau
    (r, t) => (1 / (1 + r * r)) * sin(t + r),

    // 6. Inverted sinc burst
    (r, t) => (r === 0 ? -1 : -sin(5 * r - t) / r),

    // 7. Breathing Gaussian shell
    (r, t) => exp(-sq(r - 5 - sin(t)) / (1 + 0.5 * cos(t))),

    // 8. Saw wave ring
    (r, t) => ((r % 2) - 1) * sin(t - r),

    // 9. Oscillating paraboloid
    (r, t) => -r * r * cos(t),

    // 10. Sinusoidal decay flower
    (r, t) => sin(4 * r - t) * exp(-0.2 * r)
];


function surfaceFunction(x, z, t) {
    let r = sqrt(x * x + z * z);
    return radialFunctions[currentFuncIndex](r, t);
}

function computeNormal(x, z, t) {
    let eps = 0.01;
    let dx = (surfaceFunction(x + eps, z, t) - surfaceFunction(x - eps, z, t)) / (2 * eps);
    let dz = (surfaceFunction(x, z + eps, t) - surfaceFunction(x, z - eps, t)) / (2 * eps);
    let n = createVector(-dx, 1, -dz);
    n.normalize();
    return n;
}

function draw() {
    darkMode = document.body.classList.contains("dark-mode");

    if (darkMode) {
        currentBackground = lerp(currentBackground, 0, 0.1);
    } else {
        currentBackground = lerp(currentBackground, 200, 0.1);
    }

    background(currentBackground);

    orbitControl();
    scale(4);

    directionalLight(255, 255, 255, -1, -1, -1);
    directionalLight(128, 128, 128, 1, 1, 1);
    ambientLight(50);
    specularMaterial(200);
    shininess(20);

    let t = millis() / 500.0;

    for (let r = 0; r < maxRadius - dr; r += dr) {
        beginShape(TRIANGLE_STRIP);
        for (let theta = 0; theta <= TWO_PI + dTheta; theta += dTheta) {
            let x1 = r * cos(theta);
            let z1 = r * sin(theta);
            let y1 = surfaceFunction(x1, z1, t) * 30;

            let x2 = (r + dr) * cos(theta);
            let z2 = (r + dr) * sin(theta);
            let y2 = surfaceFunction(x2, z2, t) * 30;

            let n1 = computeNormal(x1, z1, t);
            let n2 = computeNormal(x2, z2, t);

            let c1 = map(y1, -10, 10, 0, 255);
            let c2 = map(y2, -10, 10, 0, 255);

            fill(c1, 0, 300 - c1);
            normal(n1.x, n1.y, n1.z);
            vertex(x1, y1, z1);

            fill(c2, 0, 300 - c2);
            normal(n2.x, n2.y, n2.z);
            vertex(x2, y2, z2);
        }
        endShape();
    }
}

function keyPressed() {
    if (key === ' ') {
        currentFuncIndex = (currentFuncIndex + 1) % radialFunctions.length;
    }
}